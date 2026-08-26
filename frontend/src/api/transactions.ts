import { useCallback, useEffect, useState } from 'react'
import { http, listMaster, type PageResponse } from '@/api/client'
import { cachedFetch, invalidateCache } from '@/api/requestCache'
import { sortTxnListRows } from '@/lib/listOrder'

export type TxnListItem = {
  docId: number
  docNo: string
  docType: string
  docDate?: string
  postingDate?: string
  requiredByDate?: string
  entityId?: number
  locationId?: number
  fromLocationId?: number
  toLocationId?: number
  partyId?: number
  departmentId?: number
  initiatedByEmpId?: number
  refTxnHeaderId?: number
  referenceNo?: string
  invoiceNo?: string
  totalItems?: number
  totalAmount?: number
  status?: string
  docSubtype?: string
  returnFlag?: string
  attachmentUrl?: string
  attachmentName?: string
  createdOn?: string
  modifiedOn?: string
}

export type TxnRow = {
  id: string
  docNo: string
  docDate: string
  status: string
  locationId: string
  fromLocationId: string
  toLocationId: string
  partyId: string
  initiatedByEmpId: string
  refTxnHeaderId: string
  totalAmount: number
  totalItems: number
  docSubtype: string
  returnFlag: string
  createdOn?: string
  modifiedOn?: string
  [key: string]: unknown
}

export type LineRequest = {
  srNo?: number
  itemId: number
  uomId?: number
  qty?: number
  orderedQty?: number
  receivedQty?: number
  acceptedQty?: number
  rejectedQty?: number
  requestedQty?: number
  availableStock?: number
  rate?: number
  mrp?: number
  amount?: number
  batchLotNo?: string
  mfgDate?: string
  expiryDate?: string
  locationId?: number
  locationBin?: string
  itemCondition?: string
  serialNo?: string
  ipAddress?: string
  macAddress?: string
  hostname?: string
  issuedToEmpId?: number
  remark?: string
}

export type DocumentRequest = {
  docDate?: string
  postingDate?: string
  requiredByDate?: string
  entityId?: number
  locationId?: number
  fromLocationId?: number
  toLocationId?: number
  partyId?: number
  departmentId?: number
  initiatedByEmpId?: number
  employeeRefCode?: string
  designation?: string
  docSubtype?: string
  returnFlag?: string
  refTxnHeaderId?: number
  referenceNo?: string
  invoiceNo?: string
  invoiceDate?: string
  poNo?: string
  poDate?: string
  purpose?: string
  attachmentUrl?: string
  attachmentName?: string
  inspectedByEmpId?: number
  inspectionDate?: string
  receivedByEmpId?: number
  receivedDate?: string
  conditionOnReturn?: string
  preparedByEmpId?: number
  preparedDate?: string
  approvedByEmpId?: number
  approvedDate?: string
  footerRemark?: string
  remarks?: string
  totalOrderedQty?: number
  totalReceivedQty?: number
  totalAcceptedQty?: number
  totalRejectedQty?: number
  totalAmount?: number
  docSubmitAction?: 'SAVE_DRAFT' | 'SUBMIT' | 'REJECT'
  lines: LineRequest[]
}

export function mapTxnListItem(item: TxnListItem): TxnRow {
  const locationId = item.locationId != null ? String(item.locationId) : ''
  const entityId = item.entityId != null ? String(item.entityId) : ''
  return {
    id: String(item.docId),
    docNo: item.docNo ?? '',
    docDate: item.docDate ?? '',
    status: item.status ?? '',
    locationId,
    fromLocationId: item.fromLocationId != null ? String(item.fromLocationId) : '',
    toLocationId: item.toLocationId != null ? String(item.toLocationId) : '',
    partyId: item.partyId != null ? String(item.partyId) : '',
    initiatedByEmpId: item.initiatedByEmpId != null ? String(item.initiatedByEmpId) : '',
    refTxnHeaderId: item.refTxnHeaderId != null ? String(item.refTxnHeaderId) : '',
    referenceNo: item.referenceNo ?? '',
    departmentId: item.departmentId != null ? String(item.departmentId) : '',
    requiredByDate: item.requiredByDate ?? '',
    invoiceNo: item.invoiceNo ?? '',
    totalAmount: Number(item.totalAmount ?? 0),
    totalItems: Number(item.totalItems ?? 0),
    docSubtype: item.docSubtype ?? '',
    returnFlag: item.returnFlag ?? '',
    attachmentUrl: item.attachmentUrl ?? '',
    attachmentName: item.attachmentName ?? '',
    createdOn: item.createdOn ?? '',
    modifiedOn: item.modifiedOn ?? '',
    // aliases used by existing column / form keys
    entryNo: item.docNo ?? '',
    reqNo: item.docNo ?? '',
    requiredDate: item.requiredByDate ?? '',
    grnNo: item.docNo ?? '',
    grnDate: item.docDate ?? '',
    issueNo: item.docNo ?? '',
    transferNo: item.docNo ?? '',
    returnNo: item.docNo ?? '',
    date: item.docDate ?? '',
    openingDate: item.docDate ?? '',
    store: locationId,
    org: entityId,
    entityId,
  }
}

export type TxnLine = {
  detailId?: number
  srNo?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  itemType?: string
  uomId?: number
  uomCode?: string
  qty?: number
  orderedQty?: number
  receivedQty?: number
  acceptedQty?: number
  rejectedQty?: number
  requestedQty?: number
  availableStock?: number
  rate?: number
  mrp?: number
  amount?: number
  batchLotNo?: string
  mfgDate?: string
  expiryDate?: string
  locationId?: number
  locationBin?: string
  itemCondition?: string
  serialNo?: string
  ipAddress?: string
  macAddress?: string
  hostname?: string
  issuedToEmpId?: number
  remark?: string
  blsId?: number
}

export type TxnDocument = {
  docId: number
  docNo: string
  docType?: string
  docDate?: string
  postingDate?: string
  requiredByDate?: string
  entityId?: number
  locationId?: number
  fromLocationId?: number
  toLocationId?: number
  partyId?: number
  departmentId?: number
  initiatedByEmpId?: number
  employeeRefCode?: string
  designation?: string
  docSubtype?: string
  refTxnHeaderId?: number
  referenceNo?: string
  invoiceNo?: string
  invoiceDate?: string
  poNo?: string
  poDate?: string
  purpose?: string
  attachmentUrl?: string
  attachmentName?: string
  inspectedByEmpId?: number
  inspectionDate?: string
  preparedByEmpId?: number
  preparedDate?: string
  approvedByEmpId?: number
  approvedDate?: string
  footerRemark?: string
  remarks?: string
  status?: string
  totalOrderedQty?: number
  totalReceivedQty?: number
  totalAcceptedQty?: number
  totalRejectedQty?: number
  totalAmount?: number
  createdBy?: string
  createdOn?: string
  lines?: TxnLine[]
}

/** Map a full document (header + first line) into Opening Stock form values. */
export function mapOpeningStockForm(doc: TxnDocument): Record<string, unknown> {
  const line = doc.lines?.[0]
  return {
    id: String(doc.docId),
    entryNo: doc.docNo ?? '',
    openingDate: doc.docDate ?? '',
    org: doc.entityId != null ? String(doc.entityId) : '',
    store: doc.locationId != null ? String(doc.locationId) : '',
    locationId: doc.locationId != null ? String(doc.locationId) : '',
    supplier: doc.partyId != null ? String(doc.partyId) : '',
    item: line?.itemId != null ? String(line.itemId) : '',
    batch: line?.batchLotNo ?? '',
    qty: line?.qty ?? 0,
    uom: line?.uomId != null ? String(line.uomId) : '',
    rate: line?.rate ?? 0,
    mrp: line?.mrp ?? 0,
    mfgDate: line?.mfgDate ?? '',
    expiryDate: line?.expiryDate ?? '',
    remarks: doc.remarks ?? line?.remark ?? '',
    status: doc.status ?? '',
    totalAmount: Number(doc.totalAmount ?? 0),
  }
}

export function useTxnList(
  resource: string,
  options?: { enabled?: boolean; status?: string; initiatedByEmpId?: number; syncGrn?: boolean },
) {
  const enabled = options?.enabled ?? true
  const status = options?.status
  const initiatedByEmpId = options?.initiatedByEmpId
  const syncGrn = options?.syncGrn
  const [rows, setRows] = useState<TxnRow[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = `txnlist:${resource}?status=${status ?? ''}&emp=${initiatedByEmpId ?? ''}&sync=${syncGrn ? '1' : '0'}`

  const reload = useCallback(async (opts?: { force?: boolean }) => {
    if (!enabled) return
    if (opts?.force) invalidateTxnList(resource)
    setLoading(true)
    setError(null)
    try {
      const page = await cachedFetch(cacheKey, () =>
        listMaster<TxnListItem>(resource, {
          page: 1,
          pageSize: 50,
          status: status || undefined,
          initiatedByEmpId: initiatedByEmpId ?? undefined,
          syncGrn: syncGrn ? true : undefined,
        }),
      )
      setRows(sortTxnListRows((page.data ?? []).map(mapTxnListItem)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [enabled, cacheKey, resource, status, initiatedByEmpId, syncGrn])

  useEffect(() => {
    void reload()
  }, [reload])

  return { rows, loading, error, reload: () => reload({ force: true }) }
}

export function invalidateTxnList(resource?: string) {
  invalidateCache(resource ? `txnlist:${resource}` : 'txnlist:')
}

export async function createTxn(resource: string, body: DocumentRequest) {
  invalidateTxnList(resource)
  invalidateDashboardSummary()
  invalidateReportCache()
  const res = await http.post<TxnDocument>(`/${resource}`, body)
  invalidateDashboardSummary()
  return res
}

export async function updateTxn(resource: string, id: string, body: DocumentRequest) {
  const res = await http.put(`/${resource}/${id}`, body)
  invalidateDashboardSummary()
  return res
}

export async function fetchTxn(resource: string, id: string) {
  return http.get<TxnDocument>(`/${resource}/${id}`)
}

export type AllottedUnit = {
  itemId: number
  serialNo?: string
  ipAddress?: string
  macAddress?: string
  hostname?: string
  batchLotNo?: string
}

export type AllottedItems = {
  itemIds: string[]
  units: AllottedUnit[]
}

/** Item IDs still allotted to this employee (Issue / Opening Stock minus Return). */
export async function fetchAllottedItemIds(employeeId: string | number): Promise<string[]> {
  const data = await fetchAllottedItems(employeeId)
  return data.itemIds
}

export async function fetchAllottedItems(employeeId: string | number): Promise<AllottedItems> {
  const id = Number(employeeId)
  if (!Number.isFinite(id) || id <= 0) return { itemIds: [], units: [] }
  const res = await http.get<{ itemIds?: number[]; units?: AllottedUnit[] }>(
    `/returns/allotted-items?employeeId=${id}`,
  )
  return {
    itemIds: (res.itemIds ?? []).map(String),
    units: res.units ?? [],
  }
}

export async function syncInspectionApprovalsFromGrn() {
  const res = await http.post<{ message: string }>('/inspection-approvals/sync-from-grn', {})
  invalidateDashboardSummary()
  return res
}

export async function fetchTxnPrint(resource: string, id: string) {
  return http.get<TxnDocument>(`/${resource}/${id}/print`)
}

export async function deleteTxn(resource: string, id: string) {
  const res = await http.del<{ message: string }>(`/${resource}/${id}`)
  invalidateDashboardSummary()
  return res
}

/** Moves a Pending Approval document to Approved. */
export async function approveTxn(resource: string, id: string, approvedByEmpId?: number, remarks?: string) {
  const res = await http.post<TxnDocument>(`/${resource}/${id}/approve`, { approvedByEmpId, remarks })
  invalidateDashboardSummary()
  return res
}

/** Moves a Pending Approval document to Rejected; the reason is mandatory. */
export async function rejectTxn(resource: string, id: string, reason: string) {
  return http.post<{ message: string }>(`/${resource}/${id}/reject`, { reason })
}

export type StockRow = {
  stockId: number
  itemId: number
  locationId: number
  currentQty?: number
  reservedQty?: number
  availableQty?: number
  batchLotNo?: string
}

/**
 * Available quantity for an item, optionally narrowed to one location.
 * Sums every batch row and returns 0 when the item has never been stocked.
 */
export async function fetchAvailableStock(
  itemId: number,
  locationId?: number,
  batchLotNo?: string,
): Promise<number> {
  const qs = new URLSearchParams({ itemId: String(itemId), page: '1', pageSize: '200' })
  if (locationId != null) qs.set('locationId', String(locationId))
  const page = await http.get<PageResponse<StockRow>>(`/stock?${qs}`)
  const batch = batchLotNo?.trim()
  const rows = (page.data ?? []).filter((r) =>
    !batch ? true : String(r.batchLotNo ?? '') === batch,
  )
  return rows.reduce((sum, r) => sum + Number(r.availableQty ?? r.currentQty ?? 0), 0)
}

/** All available qty by itemId for one store (sums batches). */
export async function fetchStockMapForLocation(locationId: number): Promise<Record<string, number>> {
  const qs = new URLSearchParams({
    locationId: String(locationId),
    page: '1',
    pageSize: '500',
  })
  const page = await http.get<PageResponse<StockRow>>(`/stock?${qs}`)
  const map: Record<string, number> = {}
  for (const r of page.data ?? []) {
    const id = String(r.itemId)
    map[id] = (map[id] ?? 0) + Number(r.availableQty ?? r.currentQty ?? 0)
  }
  return map
}

export type UploadedFile = {
  url: string
  fileName: string
  originalName: string
  size: number
}

/** Stores an attachment and returns the URL to persist on the document header. */
export async function uploadAttachment(file: File) {
  const form = new FormData()
  form.append('file', file)
  return http.upload<UploadedFile>('/files', form)
}

export function numOrUndef(v: unknown): number | undefined {
  if (v === '' || v == null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export type ReportPage<T> = PageResponse<T>

export async function fetchStockRegister(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  if (!qs.has('page')) qs.set('page', '1')
  if (!qs.has('pageSize')) qs.set('pageSize', '50')
  const query = qs.toString()
  return cachedFetch(`reports:stock-register?${query}`, () =>
    http.get<PageResponse<Record<string, unknown>>>(`/reports/stock-register?${query}`),
  )
}

export async function fetchFullReport(params: Record<string, string | number | boolean | undefined> = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  if (!qs.has('page')) qs.set('page', '1')
  if (!qs.has('pageSize')) qs.set('pageSize', '50')
  const query = qs.toString()
  return cachedFetch(`reports:full-report?${query}`, () =>
    http.get<PageResponse<Record<string, unknown>>>(`/reports/full-report?${query}`),
  )
}

export async function fetchStockOwner(params: Record<string, string | number | boolean | undefined> = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  if (!qs.has('page')) qs.set('page', '1')
  if (!qs.has('pageSize')) qs.set('pageSize', '200')
  return http.get<PageResponse<Record<string, unknown>>>(`/reports/stock-owner?${qs}`)
}

export async function fetchStockMovement(params: Record<string, string | number | boolean | undefined> = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  if (!qs.has('page')) qs.set('page', '1')
  if (!qs.has('pageSize')) qs.set('pageSize', '200')
  return http.get<PageResponse<Record<string, unknown>>>(`/reports/stock-movement?${qs}`)
}

export async function fetchItemRegister(params: Record<string, string | number | boolean | undefined> = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  if (!qs.has('page')) qs.set('page', '1')
  if (!qs.has('pageSize')) qs.set('pageSize', '200')
  return http.get<PageResponse<Record<string, unknown>>>(`/reports/item-register?${qs}`)
}

export async function fetchItemLedger(params: Record<string, string | number | boolean | undefined> = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  if (!qs.has('page')) qs.set('page', '1')
  if (!qs.has('pageSize')) qs.set('pageSize', '200')
  return http.get<PageResponse<Record<string, unknown>>>(`/reports/item-ledger?${qs}`)
}

export type DashboardSummary = {
  totalItems: number
  totalVendors: number
  totalTransactions: number
  lowStockCount: number
  stockRows: number
}

export type DashboardWidget = {
  code: string
  type: string
  title: string
  subtitle?: string
  icon?: string
  tone?: string
  linkPath?: string
  colSpan: number
  sortOrder: number
  data: Record<string, unknown>
}

export type DashboardHome = {
  roleCode: string
  roleName: string
  title: string
  description: string
  widgets: DashboardWidget[]
}

export async function fetchDashboardSummary() {
  return cachedFetch('dashboard:summary', () => http.get<DashboardSummary>('/dashboard/summary'), 60_000)
}

export async function fetchDashboardHome() {
  return cachedFetch('dashboard:home', () => http.get<DashboardHome>('/dashboard/home'), 45_000)
}

/** Drop dashboard KPIs after stock-moving transactions. */
export function invalidateDashboardSummary() {
  invalidateCache('dashboard:summary')
  invalidateCache('dashboard:home')
}

/** Drop cached report pages (dashboard charts, report screens). */
export function invalidateReportCache() {
  invalidateCache('reports:')
}
