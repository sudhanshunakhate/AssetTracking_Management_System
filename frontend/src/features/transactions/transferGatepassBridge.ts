import type { ApiMasterRow } from '@/api/masters'
import type { TxnDocument } from '@/api/transactions'
import type { TransferLine } from './TransferItemLines'
import { wholeQtyStr } from './lineGrid'
import {
  normalizeTransferType,
  type TransferType,
} from './transferTypes'

export type { TransferType }
export { normalizeTransferType, transferTypeLabel, isOuTransferType, TRANSFER_TYPE_OPTIONS } from './transferTypes'

export type GatepassOutwardPrefillLine = {
  itemId: string
  qty: string
  uomId: string
  batch?: string
  serialNo?: string
  itemCode?: string
  itemName?: string
}

/** Navigation payload from Material Transfer — form fields are filled for display; lines are applied on submit. */
export type GatepassOutwardPrefill = {
  transferDocId: string
  transferType: TransferType
  returnFlag: string
  date: string
  /** Source / from store (gate location). */
  storeId: string
  /** Destination store — shown as Customer / Party. */
  toStoreId: string
  party: string
  transferNo?: string
  lines: GatepassOutwardPrefillLine[]
}

import { locLabel } from './txnLookups'

export const PENDING_FOR_OUTWARD_STATUS = 'Pending for Outward'

/** Outward gatepass is required only for OU (cross–operating-unit) transfers. */
export function needsGatepassOutward(
  transferType: TransferType,
  fromStoreId: string,
  toStoreId: string,
  _locations: ApiMasterRow[],
): boolean {
  if (!fromStoreId || !toStoreId || fromStoreId === toStoreId) return false
  return transferType === 'OU'
}

export function gatepassOutwardHint(
  transferType: TransferType,
  fromStoreId: string,
  toStoreId: string,
  locations: ApiMasterRow[],
): string {
  if (!fromStoreId || !toStoreId) {
    return 'Select From and To stores to check if an outward gatepass is needed.'
  }
  if (fromStoreId === toStoreId) {
    return 'From and To store must differ.'
  }
  if (needsGatepassOutward(transferType, fromStoreId, toStoreId, locations)) {
    return 'OU transfers require an outward gatepass at the source store gate. Transfer stays Pending for Outward until gatepass is submitted.'
  }
  return 'Internal transfers do not need an outward gatepass — stock moves on submit.'
}

export function buildGatepassPrefillFromTransfer(
  transferDocId: string,
  transferType: TransferType,
  transferDate: string,
  fromStoreId: string,
  toStoreId: string,
  _remarks: string,
  transferNo: string,
  lines: TransferLine[],
  locations: ApiMasterRow[],
): GatepassOutwardPrefill | null {
  if (!needsGatepassOutward(transferType, fromStoreId, toStoreId, locations)) return null

  const toLoc = locations.find((l) => l.id === toStoreId)
  const toRole = String(toLoc?.systemRole ?? '').toUpperCase()
  const returnFlag =
    toRole === 'REJECTED' || String(toLoc?.name ?? '').toLowerCase().includes('reject') ? 'Y' : 'N'

  const party = toLoc != null ? locLabel(toLoc) : ''

  const prefillLines = lines
    .filter((l) => l.itemId)
    .map((l) => ({
      itemId: l.itemId,
      qty: l.transferQty || '1',
      uomId: l.uomId ?? '',
      serialNo: l.serialNo || undefined,
      batch: l.serialNo || undefined,
      itemCode: l.itemCode || undefined,
      itemName: l.itemName || undefined,
    }))

  if (prefillLines.length === 0) return null

  return {
    transferDocId,
    date: transferDate,
    storeId: fromStoreId,
    toStoreId,
    party,
    transferNo: transferNo || undefined,
    transferType,
    returnFlag,
    lines: prefillLines,
  }
}

/** Build outward prefill from a saved transfer document (list / view actions). */
export function buildGatepassPrefillFromTxnDoc(doc: TxnDocument, locations: ApiMasterRow[]): GatepassOutwardPrefill | null {
  const subtype = String(doc.docSubtype ?? '').toUpperCase()
  const transferType = normalizeTransferType(subtype)
  const lines: TransferLine[] = (doc.lines ?? []).map((l) => ({
    key: String(l.srNo ?? 0),
    itemId: l.itemId != null ? String(l.itemId) : '',
    itemCode: l.itemCode ?? '',
    itemName: l.itemName ?? '',
    uomId: l.uomId != null ? String(l.uomId) : '',
    transferQty: wholeQtyStr(l.qty),
    availableStock: wholeQtyStr(l.availableStock),
    locationId: l.locationId != null ? String(l.locationId) : '',
    remark: l.remark ?? '',
    serialNo: String(l.serialNo ?? l.batchLotNo ?? '').trim(),
    itemType: '',
  }))
  return buildGatepassPrefillFromTransfer(
    String(doc.docId),
    transferType,
    doc.docDate ?? '',
    doc.fromLocationId != null ? String(doc.fromLocationId) : '',
    doc.toLocationId != null ? String(doc.toLocationId) : '',
    doc.remarks ?? '',
    doc.docNo ?? '',
    lines,
    locations,
  )
}
