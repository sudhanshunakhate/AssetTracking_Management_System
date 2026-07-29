import { useCallback, useEffect, useState } from 'react'
import { http, listMaster, type PageResponse } from '@/api/client'

type Status = 'Active' | 'Inactive'

export type ApiMasterRow = {
  id: string
  code: string
  name: string
  description?: string
  status: Status
  [key: string]: unknown
}

type Mapper<TApi extends Record<string, unknown>> = (row: TApi) => ApiMasterRow

/**
 * Loads a paginated master list from the API and maps it to UI table rows.
 */
export function useMasterList<TApi extends Record<string, unknown>>(
  resource: string,
  mapRow: Mapper<TApi>,
  enabled = true,
) {
  const [rows, setRows] = useState<ApiMasterRow[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const page = await listMaster<TApi>(resource, { page: 1, pageSize: 200 })
      setRows((page.data ?? []).map(mapRow))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [enabled, mapRow, resource])

  useEffect(() => {
    void reload()
  }, [reload])

  return { rows, loading, error, reload }
}

export async function createMaster<TReq extends object, TRes>(resource: string, body: TReq) {
  return http.post<TRes>(`/${resource}`, body)
}

export async function updateMaster<TReq extends object, TRes>(resource: string, id: string, body: TReq) {
  return http.put<TRes>(`/${resource}/${id}`, body)
}

export async function deleteMaster(resource: string, id: string) {
  return http.del<{ message: string }>(`/${resource}/${id}`)
}

export function activeStatus(isActive: boolean | undefined): Status {
  return isActive === false ? 'Inactive' : 'Active'
}

export type UnitApi = {
  unitId: number
  unitCode: string
  unitName: string
  desc?: string
  isActive?: boolean
}

export const mapUnit = (u: UnitApi): ApiMasterRow => ({
  id: String(u.unitId),
  code: u.unitCode,
  name: u.unitName,
  description: u.desc ?? '',
  status: activeStatus(u.isActive),
})

export type CategoryApi = {
  categoryId: number
  categoryCode: string
  categoryName: string
  desc?: string
  isActive?: boolean
}

export const mapCategory = (c: CategoryApi): ApiMasterRow => ({
  id: String(c.categoryId),
  code: c.categoryCode,
  name: c.categoryName,
  description: c.desc ?? '',
  status: activeStatus(c.isActive),
})

export async function fetchPage<T>(path: string) {
  return http.get<PageResponse<T>>(path)
}
