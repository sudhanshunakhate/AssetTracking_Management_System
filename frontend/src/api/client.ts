import { beginLoading, endLoading } from '@/loading/loadingStore'

/** Shared API client for CAITS backend (`/api/v1`). */
import { cachedFetch, invalidateCache } from '@/api/requestCache'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085/api/v1'
const TOKEN_KEY = 'caits.token'
const EXPIRES_AT_KEY = 'caits.tokenExpiresAt'
const ACTIVITY_KEY = 'caits.lastActivityAt'

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

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getTokenExpiresAt(): number | null {
  const raw = sessionStorage.getItem(EXPIRES_AT_KEY)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function setToken(token: string | null, expiresInSeconds?: number) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token)
    const seconds = expiresInSeconds && expiresInSeconds > 0 ? expiresInSeconds : 3600
    sessionStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + seconds * 1000))
  } else {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(EXPIRES_AT_KEY)
  }
}

export function markUserActivity() {
  sessionStorage.setItem(ACTIVITY_KEY, String(Date.now()))
}

export function getLastActivityAt(): number {
  const raw = sessionStorage.getItem(ACTIVITY_KEY)
  const n = raw ? Number(raw) : 0
  return Number.isFinite(n) ? n : 0
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
  setToken(null)
  onSessionExpired?.()
}

function isSessionExpiredError(status: number, message: string) {
  if (status === 401) return true
  if (status !== 403) return false
  const m = message.trim().toLowerCase()
  return (
    !m ||
    m === 'access denied' ||
    m === 'forbidden' ||
    m === 'session expired' ||
    m.includes('full authentication is required')
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
    const headers = new Headers()
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      method: 'GET',
      headers,
      signal: ctrl.signal,
      cache: 'no-store',
    })
    // Any response (incl. 401/403/500) proves the process is listening.
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
 * Extends the JWT when the user is still active and the token is near expiry.
 * Returns true when a new token was stored.
 */
export async function maybeRefreshSession(): Promise<boolean> {
  const token = getToken()
  if (!token) return false

  let expiresAt = getTokenExpiresAt()
  // Older sessions (before sliding auth) have a token but no expiry stamp — refresh once.
  if (!expiresAt) {
    expiresAt = Date.now() + REFRESH_WHEN_REMAINING_MS - 1
  }

  const remaining = expiresAt - Date.now()
  if (remaining > REFRESH_WHEN_REMAINING_MS) return false

  const idleFor = Date.now() - getLastActivityAt()
  if (idleFor > ACTIVITY_WINDOW_MS) return false

  if (remaining <= 0) {
    fireSessionExpired()
    return false
  }

  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    try {
      const headers = new Headers({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      })
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers,
        cache: 'no-store',
      })
      const text = await res.text()
      const body = text ? (JSON.parse(text) as { token?: string; expiresIn?: number; message?: string }) : null
      if (!res.ok) {
        if (isSessionExpiredError(res.status, String(body?.message ?? res.statusText ?? ''))) {
          fireSessionExpired()
        }
        return false
      }
      if (body?.token) {
        setToken(body.token, body.expiresIn)
        sessionExpiredFired = false
        return true
      }
      return false
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
}

export async function api<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { silent = false, ...fetchOptions } = options
  if (!silent) beginLoading()
  try {
    // Proactively slide the session on real API traffic while the user is working.
    if (!path.startsWith('/auth/login') && !path.startsWith('/auth/refresh')) {
      markUserActivity()
      await maybeRefreshSession()
    }

    const headers = new Headers(fetchOptions.headers)
    // FormData must keep the browser-generated multipart boundary.
    const isFormData = fetchOptions.body instanceof FormData
    if (!headers.has('Content-Type') && fetchOptions.body && !isFormData) {
      headers.set('Content-Type', 'application/json')
    }
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers })
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
  get: <T>(path: string, opts?: { silent?: boolean }) => api<T>(path, { silent: opts?.silent }),
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
 * Downloads a protected file with the session JWT. A plain `<a href>` cannot send
 * Authorization, so the API returns "Session expired" in a new tab.
 */
export async function fetchAuthenticatedBlob(storedUrl: string): Promise<Blob> {
  beginLoading()
  try {
    markUserActivity()
    await maybeRefreshSession()
    const path = toApiRelativePath(storedUrl)
    const headers = new Headers()
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const res = await fetch(`${API_BASE}${path}`, { headers, cache: 'no-store' })
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
  token: string
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
  return http.post<LoginResponse>('/auth/login', { loginId, password })
}

export async function logoutApi() {
  try {
    await http.post<{ message: string }>('/auth/logout')
  } catch {
    // ignore network logout failures
  } finally {
    setToken(null)
    invalidateCache()
  }
}

export async function meApi() {
  return cachedFetch('auth:me', () => http.get<MeResponse>('/auth/me'), 30_000)
}

export async function profileApi() {
  return http.get<ProfileResponse>('/auth/profile')
}

export async function changePasswordApi(body: {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}) {
  return http.post<{ message: string }>('/auth/change-password', body)
}

export async function forgotPasswordApi(loginId: string) {
  return http.post<{ message: string }>('/auth/forgot-password', { loginId })
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
