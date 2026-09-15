import { beginLoading, endLoading } from '@/loading/loadingStore'

/** Shared API client for CAITS backend (`/api/v1`). */
import { invalidateCache } from '@/api/requestCache'

/**
 * Same-origin by default so HttpOnly session cookies work via the Vite proxy.
 * Override with VITE_API_BASE_URL only when you intentionally call another host.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const EXPIRES_AT_KEY = 'caits.tokenExpiresAt'
const ACTIVITY_KEY = 'caits.lastActivityAt'
const CSRF_COOKIE = 'XSRF-TOKEN'

/** Refresh when less than this many ms remain on the JWT. */
const REFRESH_WHEN_REMAINING_MS = 15 * 60 * 1000
/** Only slide the session if the user was active within this window. */
const ACTIVITY_WINDOW_MS = 10 * 60 * 1000

export type PageResponse<T> = {
  page: number
  pageSize: number
  totalRecords: number
  data: T[]
}

/** @deprecated Token is HttpOnly — always null for JS. Kept for WS migration shims. */
export function getToken(): string | null {
  return null
}

export function getTokenExpiresAt(): number | null {
  const raw = sessionStorage.getItem(EXPIRES_AT_KEY)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/**
 * Local hint that a cookie session may still exist.
 * Never trust this alone — confirm with {@code /auth/me}.
 */
export function hasSessionHint(): boolean {
  return getTokenExpiresAt() != null
}

/** Tracks session expiry locally; JWT itself lives only in the HttpOnly cookie. */
export function setToken(_token: string | null, expiresInSeconds?: number) {
  // Clear any legacy JWT that may still sit in sessionStorage from older builds.
  sessionStorage.removeItem('caits.token')
  if (_token === null && (expiresInSeconds === undefined || expiresInSeconds === 0)) {
    sessionStorage.removeItem(EXPIRES_AT_KEY)
    return
  }
  const seconds = expiresInSeconds && expiresInSeconds > 0 ? expiresInSeconds : 3600
  sessionStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + seconds * 1000))
}

export function markSession(expiresInSeconds?: number) {
  const seconds = expiresInSeconds && expiresInSeconds > 0 ? expiresInSeconds : 3600
  sessionStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + seconds * 1000))
  sessionStorage.removeItem('caits.token')
}

export function clearSession() {
  sessionStorage.removeItem('caits.token')
  sessionStorage.removeItem(EXPIRES_AT_KEY)
}

export function markUserActivity() {
  sessionStorage.setItem(ACTIVITY_KEY, String(Date.now()))
}

export function getLastActivityAt(): number {
  const raw = sessionStorage.getItem(ACTIVITY_KEY)
  const n = raw ? Number(raw) : 0
  return Number.isFinite(n) ? n : 0
}

function readCookie(name: string): string | null {
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

async function ensureCsrf(): Promise<void> {
  if (readCookie(CSRF_COOKIE)) return
  try {
    await fetch(`${API_BASE}/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    })
  } catch {
    /* ignore — mutating call may still fail with 403 if CSRF missing */
  }
}

type SessionExpiredHandler = () => void
let onSessionExpired: SessionExpiredHandler | null = null
let sessionExpiredFired = false
let refreshInFlight: Promise<boolean> | null = null

/** AuthProvider registers this to clear state and send the user to /login. */
export function setSessionExpiredHandler(handler: SessionExpiredHandler | null) {
  onSessionExpired = handler
  sessionExpiredFired = false
}

function fireSessionExpired() {
  if (sessionExpiredFired) return
  sessionExpiredFired = true
  clearSession()
  onSessionExpired?.()
}

function isSessionExpiredError(status: number, message: string) {
  if (status === 401) return true
  if (status !== 403) return false
  const m = message.trim().toLowerCase()
  // Do NOT treat generic Forbidden / CSRF / menu AuthZ as "session expired".
  return (
    m === 'session expired' ||
    m.includes('full authentication is required') ||
    m.includes('authentication required')
  )
}

/**
 * Lightweight reachability check — does not use the shared `api()` helper
 * (avoids global loader). Any HTTP response means the backend is up.
 */
export async function pingBackend(timeoutMs = 4000): Promise<boolean> {
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      method: 'GET',
      credentials: 'include',
      signal: ctrl.signal,
      cache: 'no-store',
    })
    return res.status > 0
  } catch {
    return false
  } finally {
    window.clearTimeout(timer)
  }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/**
 * Extends the JWT cookie when the user is still active and the session is near expiry.
 * Never logs the user out solely because the local expiry hint is stale — try refresh first;
 * only {@link fireSessionExpired} when the server says the cookie session is gone.
 */
export async function maybeRefreshSession(): Promise<boolean> {
  const expiresAt = getTokenExpiresAt()
  // No local hint (e.g. after hard refresh) — let /auth/me decide; don't force refresh.
  if (!expiresAt) return false

  const remaining = expiresAt - Date.now()
  if (remaining > REFRESH_WHEN_REMAINING_MS) return false

  const idleFor = Date.now() - getLastActivityAt()
  // Still try refresh when the hint already expired (remaining <= 0) even if idle clock is cold.
  if (remaining > 0 && idleFor > ACTIVITY_WINDOW_MS) return false

  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    try {
      await ensureCsrf()
      const headers = new Headers({ 'Content-Type': 'application/json' })
      const xsrf = readCookie(CSRF_COOKIE)
      if (xsrf) headers.set('X-XSRF-TOKEN', xsrf)
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers,
        credentials: 'include',
        cache: 'no-store',
      })
      const text = await res.text()
      let body: { expiresIn?: number; message?: string } | null = null
      try {
        body = text ? (JSON.parse(text) as { expiresIn?: number; message?: string }) : null
      } catch {
        body = null
      }
      if (!res.ok) {
        // Only clear session when the cookie JWT is actually rejected.
        if (res.status === 401) {
          fireSessionExpired()
        }
        return false
      }
      markSession(body?.expiresIn)
      sessionExpiredFired = false
      return true
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

export type ApiRequestOptions = RequestInit & {
  /** When true, skip GlobalLoader begin/end — for background catalog fetches. */
  silent?: boolean
  /** When true, do not attempt sliding JWT refresh (session bootstrap /auth/me). */
  skipRefresh?: boolean
}

export async function api<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { silent = false, skipRefresh = false, ...fetchOptions } = options
  if (!silent) beginLoading()
  try {
    const method = (fetchOptions.method ?? 'GET').toUpperCase()
    const mutating = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS'

    const skipRefreshPath =
      path.startsWith('/auth/login') ||
      path.startsWith('/auth/refresh') ||
      path.startsWith('/auth/csrf') ||
      path.startsWith('/auth/public-key') ||
      path.startsWith('/auth/me')

    if (!skipRefresh && !skipRefreshPath) {
      markUserActivity()
      await maybeRefreshSession()
    } else if (!skipRefreshPath) {
      markUserActivity()
    }
    if (mutating && !path.startsWith('/auth/login') && !path.startsWith('/auth/forgot-password')) {
      await ensureCsrf()
    }

    const headers = new Headers(fetchOptions.headers)
    const isFormData = fetchOptions.body instanceof FormData
    if (!headers.has('Content-Type') && fetchOptions.body && !isFormData) {
      headers.set('Content-Type', 'application/json')
    }
    if (mutating) {
      const xsrf = readCookie(CSRF_COOKIE)
      if (xsrf) headers.set('X-XSRF-TOKEN', xsrf)
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    })
    const text = await res.text()
    const body = text ? (JSON.parse(text) as unknown) : null

    if (!res.ok) {
      const msg =
        body && typeof body === 'object' && 'message' in body
          ? String((body as { message: string }).message)
          : res.statusText || 'Request failed'
      if (isSessionExpiredError(res.status, msg) && !path.startsWith('/auth/login')) {
        fireSessionExpired()
      }
      throw new ApiError(res.status, msg)
    }
    return body as T
  } finally {
    if (!silent) endLoading()
  }
}

export const http = {
  get: <T>(path: string, opts?: { silent?: boolean; skipRefresh?: boolean }) =>
    api<T>(path, { silent: opts?.silent, skipRefresh: opts?.skipRefresh }),
  post: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'POST', body: body == null ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'PUT', body: body == null ? undefined : JSON.stringify(body) }),
  del: <T>(path: string) => api<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, form: FormData) => api<T>(path, { method: 'POST', body: form }),
}

/**
 * Turns a stored `/api/v1/...` reference into a browser-openable absolute URL.
 * Already-absolute URLs are returned unchanged.
 */
export function resolveApiUrl(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('/api/')) return path
  if (API_BASE.startsWith('/')) {
    const base = API_BASE.replace(/\/$/, '')
    return `${base}${path.startsWith('/') ? path : `/${path}`}`
  }
  const origin = API_BASE.replace(/\/api\/v1\/?$/, '')
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`
}

/** Stored attachment URLs are `/api/v1/files/...`; the shared client prefixes `API_BASE`. */
export function toApiRelativePath(storedUrl: string): string {
  const raw = storedUrl.split('#')[0].trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) {
    const idx = raw.indexOf('/api/v1/')
    return idx >= 0 ? raw.slice(idx + '/api/v1'.length) : raw
  }
  if (raw.startsWith('/api/v1/')) return raw.slice('/api/v1'.length)
  return raw.startsWith('/') ? raw : `/${raw}`
}

/**
 * Downloads a protected file with the session cookie.
 */
export async function fetchAuthenticatedBlob(storedUrl: string): Promise<Blob> {
  beginLoading()
  try {
    markUserActivity()
    await maybeRefreshSession()
    await ensureCsrf()
    const path = toApiRelativePath(storedUrl)
    const headers = new Headers()
    const xsrf = readCookie(CSRF_COOKIE)
    if (xsrf) headers.set('X-XSRF-TOKEN', xsrf)
    const res = await fetch(`${API_BASE}${path}`, {
      headers,
      credentials: 'include',
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text()
      let msg = res.statusText || 'Could not open file'
      try {
        const body = text ? (JSON.parse(text) as { message?: string }) : null
        if (body?.message) msg = body.message
      } catch {
        if (text) msg = text
      }
      if (isSessionExpiredError(res.status, msg)) fireSessionExpired()
      throw new ApiError(res.status, msg)
    }
    return res.blob()
  } finally {
    endLoading()
  }
}

/** Opens an authenticated attachment in a new tab (images, PDFs) or downloads it. */
export async function openAuthenticatedFile(storedUrl: string, fileName?: string) {
  const preview = window.open('about:blank', '_blank')
  try {
    const blob = await fetchAuthenticatedBlob(storedUrl)
    const objectUrl = URL.createObjectURL(blob)
    if (preview && !preview.closed) {
      preview.location.href = objectUrl
    } else {
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = fileName?.trim() || 'attachment'
      a.rel = 'noreferrer'
      a.click()
    }
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  } catch (err) {
    preview?.close()
    throw err
  }
}

export type LoginResponse = {
  token?: string | null
  expiresIn: number
  mustChangePassword?: boolean
  user: {
    userId: number
    employeeName: string
    roleCode: string
    entityId: number
    buAccessScope: string
    locationAccessScope?: string
    defaultLocationId?: number
  }
}

/** Scope values stored on the user login record. */
export type AccessScope = 'ALL' | 'SELECTED'

export type MeResponse = {
  userId: number
  loginId?: string
  employeeId?: number
  employeeName: string
  role: string
  entityId?: number
  buAccessScope: AccessScope
  allowedBuIds: number[]
  locationAccessScope: AccessScope
  allowedLocationIds: number[]
  defaultLocationId?: number
  menuPermissions: MenuPermission[]
  favouriteMenuCodes?: string[]
}

export type ProfileResponse = {
  userId: number
  loginId: string
  role: string
  lastLoginOn?: string
  employeeId: number
  employeeCode: string
  firstName: string
  lastName?: string
  gender?: string
  dob?: string
  joiningDate?: string
  employmentType?: string
  designation?: string
  department?: string
  email?: string
  phone?: string
  altPhone?: string
  baseLocationId?: number
  baseLocationName?: string
  reportingToEmpId?: number
  reportingToName?: string
  isActive?: boolean
}

export async function loginApi(loginId: string, password: string) {
  await ensureCsrf()
  const { encryptAuthPayload } = await import('@/lib/payloadCrypto')
  const encrypted = await encryptAuthPayload({ loginId, password })
  const res = await http.post<LoginResponse>('/auth/login', encrypted)
  markSession(res.expiresIn)
  return res
}

export async function logoutApi() {
  try {
    await http.post<{ message: string }>('/auth/logout')
  } catch {
    // ignore network logout failures
  } finally {
    clearSession()
    invalidateCache()
  }
}

export async function meApi(opts?: { silent?: boolean }) {
  // Always hit the network on bootstrap — never reuse a pre-login cache entry.
  invalidateCache('auth:me')
  return http.get<MeResponse>('/auth/me', { silent: opts?.silent, skipRefresh: true })
}

export async function profileApi() {
  return http.get<ProfileResponse>('/auth/profile')
}

export async function changePasswordApi(body: {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}) {
  const { encryptAuthPayload } = await import('@/lib/payloadCrypto')
  const encrypted = await encryptAuthPayload({
    oldPassword: body.oldPassword,
    newPassword: body.newPassword,
    confirmPassword: body.confirmPassword,
  })
  return http.post<{ message: string }>('/auth/change-password', encrypted)
}

export async function forgotPasswordApi(loginId: string) {
  const { encryptAuthPayload } = await import('@/lib/payloadCrypto')
  const encrypted = await encryptAuthPayload({ loginId })
  return http.post<{ message: string }>('/auth/forgot-password', encrypted)
}

export async function getFavouritesApi() {
  return http.get<{ menuCodes: string[] }>('/auth/favourites')
}

export async function saveFavouritesApi(menuCodes: string[]) {
  return http.put<{ menuCodes: string[] }>('/auth/favourites', { menuCodes })
}

export type MenuPermission = {
  menuCode: string
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
  approve: boolean
  reject: boolean
  print: boolean
  export: boolean
  /** Display order from sysm_menutree_mst.mtree_sort_order. */
  sortOrder?: number
  menuGroup?: string
  /** Section order from mtree_group_sort_order. */
  groupSortOrder?: number
}

/** Map backend master DTO (unitId/isActive) → UI row (id/status). */
export function mapMasterRow<T extends Record<string, unknown>>(
  row: T,
  idKey: string,
  extras: (row: T) => Record<string, unknown> = () => ({}),
) {
  const id = String(row[idKey] ?? '')
  const isActive = row.isActive !== false
  return {
    id,
    status: (isActive ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
    ...extras(row),
    _raw: row,
  }
}

export async function listMaster<T>(
  resource: string,
  params: Record<string, string | number | boolean | undefined> = {},
  opts?: { silent?: boolean },
) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  if (!qs.has('page')) qs.set('page', '1')
  if (!qs.has('pageSize')) qs.set('pageSize', '200')
  const q = qs.toString()
  return http.get<PageResponse<T>>(`/${resource}${q ? `?${q}` : ''}`, { silent: opts?.silent })
}
