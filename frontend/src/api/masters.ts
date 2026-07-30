import { useCallback, useEffect, useState } from 'react'
import { http, listMaster, type PageResponse } from '@/api/client'

type Status = 'Active' | 'Inactive'

export type ApiMasterRow = {
  id: string
  status: Status
  code?: string
  name?: string
  description?: string
  [key: string]: unknown
}

type Mapper<TApi extends Record<string, unknown>> = (row: TApi) => ApiMasterRow

/** Loads a paginated master list from the API and maps it to UI table rows. */
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

export function isActiveFromForm(status: unknown): boolean {
  return status !== false
}

export function numOrUndef(v: unknown): number | undefined {
  if (v === '' || v == null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export async function fetchPage<T>(path: string) {
  return http.get<PageResponse<T>>(path)
}

/* ---- Setup ---- */

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

export type SubcategoryApi = {
  subcategoryId: number
  subcategoryCode: string
  subcategoryName: string
  categoryId?: number
  categoryName?: string
  desc?: string
  isActive?: boolean
}

export const mapSubcategory = (s: SubcategoryApi): ApiMasterRow => ({
  id: String(s.subcategoryId),
  code: s.subcategoryCode,
  name: s.subcategoryName,
  parentCode: s.categoryId != null ? String(s.categoryId) : '',
  parentName: s.categoryName ?? '',
  description: s.desc ?? '',
  status: activeStatus(s.isActive),
})

export type GentypeApi = {
  gentypeId: number
  typeCode: string
  typeName: string
  desc?: string
  isActive?: boolean
}

export const mapGentype = (g: GentypeApi): ApiMasterRow => ({
  id: String(g.gentypeId),
  code: g.typeCode,
  name: g.typeName,
  description: g.desc ?? '',
  status: activeStatus(g.isActive),
})

export type GenmasterApi = {
  genmasterId: number
  valueCode: string
  valueName: string
  gentypeId?: number
  sortOrder?: number
  desc?: string
  isActive?: boolean
}

export const mapGenmaster = (g: GenmasterApi): ApiMasterRow => ({
  id: String(g.genmasterId),
  code: g.valueCode,
  name: g.valueName,
  typeCode: g.gentypeId != null ? String(g.gentypeId) : '',
  typeName: '',
  sortOrder: g.sortOrder ?? 0,
  description: g.desc ?? '',
  status: activeStatus(g.isActive),
})

/* ---- Items / vendors ---- */

export type ItemApi = {
  itemId: number
  itemCode: string
  itemName: string
  itemType?: string
  categoryId?: number
  subcategoryId?: number
  uomId?: number
  standardCost?: number
  isActive?: boolean
}

export const mapItem = (i: ItemApi): ApiMasterRow => ({
  id: String(i.itemId),
  code: i.itemCode,
  name: i.itemName,
  itemType: (i.itemType === 'consumable' ? 'consumable' : 'asset') as 'asset' | 'consumable',
  category: i.categoryId != null ? String(i.categoryId) : '',
  subCategory: i.subcategoryId != null ? String(i.subcategoryId) : '',
  uom: i.uomId != null ? String(i.uomId) : '',
  standardCost: Number(i.standardCost ?? 0),
  status: activeStatus(i.isActive),
})

export type VendorApi = {
  vendorId: number
  vendorCode: string
  vendorName: string
  partyType?: string
  city?: string
  phone?: string
  gstin?: string
  isActive?: boolean
}

export const mapVendor = (v: VendorApi): ApiMasterRow => ({
  id: String(v.vendorId),
  code: v.vendorCode,
  name: v.vendorName,
  partyType: v.partyType ?? '',
  city: v.city ?? '',
  phone: v.phone ?? '',
  gstin: v.gstin ?? '',
  status: activeStatus(v.isActive),
})

/* ---- Org ---- */

export type EntityApi = {
  entityId: number
  entityCode: string
  entityName: string
  shortName?: string
  city?: string
  gstin?: string
  isActive?: boolean
}

export const mapEntity = (e: EntityApi): ApiMasterRow => ({
  id: String(e.entityId),
  code: e.entityCode,
  name: e.entityName,
  shortName: e.shortName ?? '',
  city: e.city ?? '',
  gstin: e.gstin ?? '',
  status: activeStatus(e.isActive),
})

export type BusinessUnitApi = {
  buId: number
  buCode: string
  buName: string
  entityId?: number
  buType?: string
  city?: string
  isActive?: boolean
}

export const mapBusinessUnit = (b: BusinessUnitApi): ApiMasterRow => ({
  id: String(b.buId),
  code: b.buCode,
  name: b.buName,
  orgCode: b.entityId != null ? String(b.entityId) : '',
  orgName: '',
  ouType: b.buType ?? '',
  city: b.city ?? '',
  status: activeStatus(b.isActive),
})

export type LocationApi = {
  locationId: number
  locationCode: string
  locationName: string
  locationType?: string
  entityId?: number
  buId?: number
  city?: string
  isActive?: boolean
}

export const mapLocation = (l: LocationApi): ApiMasterRow => ({
  id: String(l.locationId),
  code: l.locationCode,
  name: l.locationName,
  storeType: l.locationType ?? '',
  orgCode: l.entityId != null ? String(l.entityId) : '',
  ouCode: l.buId != null ? String(l.buId) : '',
  city: l.city ?? '',
  status: activeStatus(l.isActive),
})

/* ---- Security ---- */

export type RoleApi = {
  roleId: number
  roleCode: string
  roleName: string
  roleLevel?: number
  desc?: string
  isSystemRole?: boolean
  isActive?: boolean
}

export const mapRole = (r: RoleApi): ApiMasterRow => ({
  id: String(r.roleId),
  code: r.roleCode,
  name: r.roleName,
  level: String(r.roleLevel ?? 1),
  description: r.desc ?? '',
  systemRole: Boolean(r.isSystemRole),
  status: activeStatus(r.isActive),
})

export type EmployeeApi = {
  employeeId: number
  employeeCode: string
  firstName: string
  lastName?: string
  gender?: string
  dob?: string
  joiningDate?: string
  employmentType?: string
  email?: string
  phone?: string
  altPhone?: string
  designation?: string
  department?: string
  roleId?: number
  baseLocationId?: number
  reportingToEmpId?: number
  isActive?: boolean
  hasLogin?: boolean
}

export const mapEmployee = (e: EmployeeApi): ApiMasterRow => ({
  id: String(e.employeeId),
  code: e.employeeCode,
  firstName: e.firstName,
  lastName: e.lastName ?? '',
  gender: e.gender ?? '',
  dob: e.dob ?? '',
  joiningDate: e.joiningDate ?? '',
  employmentType: e.employmentType ?? '',
  email: e.email ?? '',
  phone: e.phone ?? '',
  altPhone: e.altPhone ?? '',
  designation: e.designation ?? '',
  department: e.department ?? '',
  role: e.roleId != null ? String(e.roleId) : '',
  baseStore: e.baseLocationId != null ? String(e.baseLocationId) : '',
  reportingTo: e.reportingToEmpId != null ? String(e.reportingToEmpId) : '',
  hasLogin: Boolean(e.hasLogin),
  status: activeStatus(e.isActive),
})

export type UserApi = {
  userId: number
  employeeId?: number
  loginId: string
  roleId?: number
  accountStatus?: string
  entityId?: number
  buAccessScope?: string
  isActive?: boolean
}

export const mapUser = (u: UserApi): ApiMasterRow => ({
  id: String(u.userId),
  loginId: u.loginId,
  employeeCode: u.employeeId != null ? String(u.employeeId) : '',
  employeeName: '',
  role: u.roleId != null ? String(u.roleId) : '',
  orgCode: u.entityId != null ? String(u.entityId) : '',
  ouScope: u.buAccessScope ?? 'ALL',
  accountStatus: (u.accountStatus as 'Active' | 'Locked' | 'Disabled') || 'Active',
  status: activeStatus(u.isActive),
})

export type AccessExceptionApi = {
  exceptionId: number
  employeeId?: number
  exceptionType?: string
  menuCode?: string
  reason?: string
  validFrom?: string
  validUntil?: string
  isActive?: boolean
}

export const mapAccessException = (e: AccessExceptionApi): ApiMasterRow => ({
  id: String(e.exceptionId),
  employeeCode: e.employeeId != null ? String(e.employeeId) : '',
  employeeName: '',
  exceptionType: (e.exceptionType === 'Revoke' ? 'Revoke' : 'Grant') as 'Grant' | 'Revoke',
  menuItem: e.menuCode ?? '',
  reason: e.reason ?? '',
  validFrom: e.validFrom ?? '',
  validUntil: e.validUntil ?? '',
  status: activeStatus(e.isActive),
})

export type MenuApi = {
  menuId: number
  menuCode: string
  menuLabel: string
  menuGroup?: string
  sortOrder?: number
  docType?: string
  supportsView?: boolean
  supportsCreate?: boolean
  supportsEdit?: boolean
  supportsDelete?: boolean
  supportsApprove?: boolean
  supportsReject?: boolean
  supportsPrint?: boolean
  supportsExport?: boolean
}

export type RolePermissionApi = {
  module: string
  canView?: boolean
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canApprove?: boolean
  canReject?: boolean
  canPrint?: boolean
  canExport?: boolean
}

/** GET /menus returns a raw array (not PageResponse). */
export async function listMenus() {
  return http.get<MenuApi[]>('/menus')
}

export async function getRolePermissions(roleId: string | number) {
  return http.get<RolePermissionApi[]>(`/roles/${roleId}/permissions`)
}

export async function putRolePermissions(roleId: string | number, permissions: RolePermissionApi[]) {
  return http.put<{ message: string }>(`/roles/${roleId}/permissions`, permissions)
}
