import { useCallback, useEffect, useState } from 'react'
import { http, listMaster, type PageResponse } from '@/api/client'

export type TxnListItem = {
  docId: number
  docNo: string
  docType: string
  docDate?: string
  postingDate?: string
  entityId?: number
  locationId?: number
  fromLocationId?: number
  toLocationId?: number
  partyId?: number
  departmentId?: number
  initiatedByEmpId?: number
  refTxnHeaderId?: number
  totalAmount?: number
  status?: string
  docSubtype?: string
  returnFlag?: string
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
  requestedQty?: number
  rate?: number
  mrp?: number
  amount?: number
  batchLotNo?: string
  mfgDate?: string
  expiryDate?: string
  locationId?: number
  locationBin?: string
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
  initiatedByEmpId?: number
  designation?: string
  docSubtype?: string
  returnFlag?: string
  refTxnHeaderId?: number
  referenceNo?: string
  invoiceNo?: string
  invoiceDate?: string
  inspectedByEmpId?: number
  inspectionDate?: string
  receivedByEmpId?: number
  receivedDate?: string
  conditionOnReturn?: string
  remarks?: string
  totalAmount?: number
  docSubmitAction?: 'SAVE_DRAFT' | 'SUBMIT'
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
    totalAmount: Number(item.totalAmount ?? 0),
    totalItems: 0,
    docSubtype: item.docSubtype ?? '',
    returnFlag: item.returnFlag ?? '',
    // aliases used by existing column / form keys
    entryNo: item.docNo ?? '',
    reqNo: item.docNo ?? '',
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

export type TxnDocument = {
  docId: number
  docNo: string
  docType?: string
  docDate?: string
  postingDate?: string
  entityId?: number
  locationId?: number
  fromLocationId?: number
  toLocationId?: number
  partyId?: number
  initiatedByEmpId?: number
  refTxnHeaderId?: number
  remarks?: string
  status?: string
  totalAmount?: number
  lines?: Array<{
    srNo?: number
    itemId?: number
    uomId?: number
    qty?: number
    rate?: number
    mrp?: number
    amount?: number
    batchLotNo?: string
    mfgDate?: string
    expiryDate?: string
    locationId?: number
    locationBin?: string
    remark?: string
  }>
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
    bin: line?.locationBin ?? '',
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

export function useTxnList(resource: string, enabled = true) {
  const [rows, setRows] = useState<TxnRow[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const page = await listMaster<TxnListItem>(resource, { page: 1, pageSize: 200 })
      setRows((page.data ?? []).map(mapTxnListItem))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [enabled, resource])

  useEffect(() => {
    void reload()
  }, [reload])

  return { rows, loading, error, reload }
}

export async function createTxn(resource: string, body: DocumentRequest) {
  return http.post(`/${resource}`, body)
}

export async function updateTxn(resource: string, id: string, body: DocumentRequest) {
  return http.put(`/${resource}/${id}`, body)
}

export async function fetchTxn(resource: string, id: string) {
  return http.get<TxnDocument>(`/${resource}/${id}`)
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
  if (!qs.has('pageSize')) qs.set('pageSize', '200')
  return http.get<PageResponse<Record<string, unknown>>>(`/reports/stock-register?${qs}`)
}

export async function fetchFullReport(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  if (!qs.has('page')) qs.set('page', '1')
  if (!qs.has('pageSize')) qs.set('pageSize', '200')
  return http.get<PageResponse<Record<string, unknown>>>(`/reports/full-report?${qs}`)
}

export type DashboardSummary = {
  totalItems: number
  totalVendors: number
  totalTransactions: number
  lowStockCount: number
  stockRows: number
}

export async function fetchDashboardSummary() {
  return http.get<DashboardSummary>('/dashboard/summary')
}
