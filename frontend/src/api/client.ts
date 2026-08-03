/** Shared API client for CAITS backend (`/api/v1`). */
import { cachedFetch, invalidateCache } from '@/api/requestCache'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085/api/v1'
const TOKEN_KEY = 'caits.token'

export type PageResponse<T> = {
  page: number
  pageSize: number
  totalRecords: number
  data: T[]
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token)
  else sessionStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  // FormData must keep the browser-generated multipart boundary.
  const isFormData = options.body instanceof FormData
  if (!headers.has('Content-Type') && options.body && !isFormData) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const text = await res.text()
  const body = text ? (JSON.parse(text) as unknown) : null

  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message: string }).message)
        : res.statusText || 'Request failed'
    throw new ApiError(res.status, msg)
  }
  return body as T
}

export const http = {
  get: <T>(path: string) => api<T>(path),
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
  employeeName: string
  role: string
  entityId?: number
  buAccessScope: AccessScope
  allowedBuIds: number[]
  locationAccessScope: AccessScope
  allowedLocationIds: number[]
  defaultLocationId?: number
  menuPermissions: MenuPermission[]
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

export async function listMaster<T>(resource: string, params: Record<string, string | number | boolean | undefined> = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  if (!qs.has('page')) qs.set('page', '1')
  if (!qs.has('pageSize')) qs.set('pageSize', '200')
  const q = qs.toString()
  return http.get<PageResponse<T>>(`/${resource}${q ? `?${q}` : ''}`)
}
