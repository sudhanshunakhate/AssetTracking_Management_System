import { useCallback, useEffect, useState } from 'react'
import { http, listMaster, type PageResponse } from '@/api/client'
import { cachedFetch, invalidateCache } from '@/api/requestCache'
import { sortMasterListRows } from '@/lib/listOrder'

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

const LIST_PAGE_SIZE = 500
/** Guard against an unbounded fetch loop if the API ever reports a bad total. */
const MAX_LIST_PAGES = 40

/**
 * Fetches every page of a master list. The forms validate uniqueness against
 * this array, so a partial list would silently let duplicates through.
 */
async function listMasterAll<TApi extends Record<string, unknown>>(resource: string): Promise<TApi[]> {
  return cachedFetch(`master:${resource}`, async () => {
    const first = await listMaster<TApi>(resource, { page: 1, pageSize: LIST_PAGE_SIZE })
    const rows = first.data ?? []
    const total = first.totalRecords ?? rows.length
    if (rows.length >= total || rows.length === 0) return rows

    // The API may cap page size below what we asked for, so page off what it actually returned.
    const served = rows.length
    const pageCount = Math.min(Math.ceil(total / served), MAX_LIST_PAGES)
    const rest = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, i) =>
        listMaster<TApi>(resource, { page: i + 2, pageSize: served }),
      ),
    )
    return rest.reduce<TApi[]>((all, page) => all.concat(page.data ?? []), rows)
  })
}

/** Call after mutating a master so lists refetch on next use. */
export function invalidateMasterList(resource?: string) {
  if (resource) invalidateCache(`master:${resource}`)
  else invalidateCache('master:')
}

/** Loads a master list from the API and maps it to UI table rows. */
export function useMasterList<TApi extends Record<string, unknown>>(
  resource: string,
  mapRow: Mapper<TApi>,
  enabled = true,
) {
  const [rows, setRows] = useState<ApiMasterRow[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async (opts?: { force?: boolean }) => {
    if (!enabled) return
    if (opts?.force) invalidateMasterList(resource)
    setLoading(true)
    setError(null)
    try {
      const data = await listMasterAll<TApi>(resource)
      setRows(sortMasterListRows(data.map(mapRow), resource))
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

  return { rows, loading, error, reload: () => reload({ force: true }) }
}

export async function createMaster<TReq extends object, TRes>(resource: string, body: TReq) {
  const res = await http.post<TRes>(`/${resource}`, body)
  invalidateMasterList(resource)
  if (resource === 'general-masters' || resource === 'general-types') {
    invalidateCache('genvalues:')
  }
  return res
}

export async function updateMaster<TReq extends object, TRes>(resource: string, id: string, body: TReq) {
  const res = await http.put<TRes>(`/${resource}/${id}`, body)
  invalidateMasterList(resource)
  if (resource === 'general-masters' || resource === 'general-types') {
    invalidateCache('genvalues:')
  }
  return res
}

export async function deleteMaster(resource: string, id: string) {
  const res = await http.del<{ message: string }>(`/${resource}/${id}`)
  invalidateMasterList(resource)
  if (resource === 'general-masters' || resource === 'general-types') {
    invalidateCache('genvalues:')
  }
  return res
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

/** General Type codes used as lookup keys (GET /general-types/{typeCode}/values). */
export const GEN_TYPE = {
  ITEM_PARAM: 'GTY-ITMPAR',
  ASSET_TYPE: 'GTY-ASSETTYP',
  CONSUMABLE_TYPE: 'GTY-CONSTYP',
  DEPRECIATION: 'GTY-DEPR',
  PARTY_TYPE: 'GTY-PARTY',
  RATING: 'GTY-RATING',
  OU_TYPE: 'GTY-OUTYPE',
  STORE_TYPE: 'GTY-STRTYPE',
  GENDER: 'GTY-GENDER',
  EMPLOYMENT_TYPE: 'GTY-EMPTYP',
  ACCOUNT_STATUS: 'GTY-ACCTSTAT',
  OU_SCOPE: 'GTY-OUSCOPE',
  EXCEPTION_TYPE: 'GTY-EXCTYPE',
  ROLE_LEVEL: 'GTY-ROLELVL',
  DOC_TYPE: 'GTY-DOCTYPE',
  DOC_STATUS: 'GTY-DOCSTAT',
  STOCK_STATUS: 'GTY-STKSTAT',
  GATEPASS_INWARD: 'GTY-GPIN',
  RETURNABLE_FLAG: 'GTY-RETFLAG',
  RECEIPT_PURPOSE: 'GTY-RCPT',
  ISSUE_PURPOSE: 'GTY-ISSUE',
  IMR_REASON: 'GTY-IMR',
  STORE_LOCATION: 'GTY-STRLOC',
  ASSET_CONDITION: 'GTY-ASSETCOND',
  IP_MODE: 'GTY-IPMODE',
  DEPARTMENT: 'GTY-DEPT',
  DESIGNATION: 'GTY-DESIG',
} as const

export type GenValueOption = {
  value: string
  label: string
  code: string
  name: string
  id: number
}

export type GenValueApi = {
  genmasterId: number
  valueCode: string
  valueName: string
  sortOrder?: number
}

/** Loads active general-master values for a type code (payload key: typeCode in path). */
export async function listGenValues(typeCode: string): Promise<GenValueApi[]> {
  return cachedFetch(`genvalues:${typeCode}`, () =>
    http.get<GenValueApi[]>(`/general-types/${encodeURIComponent(typeCode)}/values`),
  )
}

/**
 * Dropdown options from General Master by type code.
 * @param valueAs `'name'` stores valueName (free-text columns); `'code'` stores valueCode (coded fields).
 */
export function useGenValues(typeCode: string, valueAs: 'name' | 'code' = 'name') {
  const [options, setOptions] = useState<GenValueOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await listGenValues(typeCode)
      setOptions(
        (rows ?? []).map((r) => ({
          id: r.genmasterId,
          code: r.valueCode,
          name: r.valueName,
          value: valueAs === 'code' ? r.valueCode : r.valueName,
          label: r.valueName,
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lookup')
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [typeCode, valueAs])

  useEffect(() => {
    void reload()
  }, [reload])

  return { options, loading, error, reload }
}

/** Map Item Parameter genmaster row to form itemType asset|consumable. */
export function itemTypeFromGenCode(valueCode: string, valueName?: string): 'asset' | 'consumable' {
  const c = valueCode.toUpperCase()
  const n = (valueName ?? '').toLowerCase()
  if (c.includes('CONS') || n.includes('consum')) return 'consumable'
  return 'asset'
}

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
  imageUrl?: string
  desc?: string
  remarks?: string
  assetType?: string
  makeBrand?: string
  model?: string
  usefulLifeYears?: number
  depreciationMethod?: string
  depreciationRate?: number
  currentLocationId?: number
  isSerialized?: boolean
  isReturnable?: boolean
  isUnderAmc?: boolean
  isInsuranceRequired?: boolean
  inspectionNeeded?: boolean
  consumableType?: string
  trackBatchLot?: boolean
  trackExpiry?: boolean
  isConsumable?: boolean
  allowNegativeStock?: boolean
  ram?: string
  storage?: string
  processor?: string
  productNo?: string
  parentItemId?: number
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
  store: i.currentLocationId != null ? String(i.currentLocationId) : '',
  status: activeStatus(i.isActive),
})

/** Items whose Item Master home location matches the selected store. Empty until a location is chosen. */
export function itemsForLocation(
  items: ApiMasterRow[],
  locationId: string | null | undefined,
): ApiMasterRow[] {
  if (!locationId) return []
  const loc = String(locationId)
  return items.filter((i) => String(i.store ?? '') === loc)
}

export type VendorApi = {
  vendorId: number
  vendorCode: string
  vendorName: string
  partyType?: string
  gstin?: string
  panNo?: string
  rating?: number
  add1?: string
  add2?: string
  city?: string
  state?: string
  pin?: string
  country?: string
  contactPerson?: string
  phone?: string
  altPhone?: string
  email?: string
  website?: string
  notes?: string
  isActive?: boolean
}

export const mapVendor = (v: VendorApi): ApiMasterRow => ({
  id: String(v.vendorId),
  code: v.vendorCode,
  name: v.vendorName,
  partyType: v.partyType ?? '',
  gstin: v.gstin ?? '',
  rating: v.rating ?? '',
  city: v.city ?? '',
  phone: v.phone ?? '',
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
  locationId?: number
  buIds?: number[]
  locationAccessScope?: string
  locationIds?: number[]
  forcePasswordReset?: boolean
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
  locationId: u.locationId != null ? String(u.locationId) : '',
  ouIds: (u.buIds ?? []).map(String),
  locationScope: u.locationAccessScope ?? 'ALL',
  locationIds: (u.locationIds ?? []).map(String),
  accountStatus: (u.accountStatus as 'Active' | 'Locked' | 'Disabled') || 'Active',
  status: activeStatus(u.isActive),
})

export type OuAccessApi = {
  userId: number
  buAccessScope?: string
  buIds?: number[]
  locationAccessScope?: string
  locationIds?: number[]
}

export async function getUserOuAccess(userId: string | number) {
  return http.get<OuAccessApi>(`/users/${userId}/ou-access`)
}

export async function putUserOuAccess(
  userId: string | number,
  body: {
    buAccessScope?: string
    buIds?: number[]
    locationAccessScope?: string
    locationIds?: number[]
  },
) {
  return http.put<OuAccessApi>(`/users/${userId}/ou-access`, body)
}

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
  groupSortOrder?: number
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
  menuId?: number
  module: string
  canView?: boolean
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canApprove?: boolean
  canReject?: boolean
  canPrint?: boolean
  canExport?: boolean
  /** Writes through to sysm_menutree_mst.mtree_sort_order (global menu sequence). */
  sortOrder?: number
  /** Writes through to mtree_group_sort_order for the menu's section (global). */
  groupSortOrder?: number
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
