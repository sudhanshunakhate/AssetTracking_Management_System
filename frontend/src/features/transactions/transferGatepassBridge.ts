import type { ApiMasterRow } from '@/api/masters'
import type { TxnDocument } from '@/api/transactions'
import type { TransferLine } from './TransferItemLines'
import { wholeQtyStr } from './lineGrid'

export type TransferType = 'INTERNAL' | 'OU'

export type GatepassOutwardPrefillLine = {
  itemId: string
  qty: string
  uomId: string
  batch?: string
}

/** Navigation payload from Material Transfer — UI shows only transfer type + returnable; lines are applied on submit. */
export type GatepassOutwardPrefill = {
  transferDocId: string
  transferType: TransferType
  returnFlag: string
  date: string
  storeId: string
  lines: GatepassOutwardPrefillLine[]
}

import {
  SPECIAL_SYSTEM_LOCATION_ROLES,
  isSpecialSystemLocation,
} from './txnLookups'

const SPECIAL_TO_ROLES = SPECIAL_SYSTEM_LOCATION_ROLES

export const PENDING_FOR_OUTWARD_STATUS = 'Pending for Outward'

/** Outward gatepass is required for OU moves and certain internal target stores. */
export function needsGatepassOutward(
  transferType: TransferType,
  fromStoreId: string,
  toStoreId: string,
  locations: ApiMasterRow[],
): boolean {
  if (!fromStoreId || !toStoreId || fromStoreId === toStoreId) return false

  if (transferType === 'OU') return true

  const toLoc = locations.find((l) => l.id === toStoreId)
  if (!toLoc) return false

  const role = String(toLoc.systemRole ?? '').toUpperCase()
  if (SPECIAL_TO_ROLES.has(role)) return true

  if (isSpecialSystemLocation(toLoc)) return true

  return false
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
    return transferType === 'OU'
      ? 'OU transfers require an outward gatepass at the source store gate. Transfer stays Pending for Outward until gatepass is submitted.'
      : 'This target store requires an outward gatepass. Transfer stays Pending for Outward until gatepass is submitted.'
  }
  return 'Outward gatepass is only needed for OU transfers or transfers to damaged / rejected system stores.'
}

export function buildGatepassPrefillFromTransfer(
  transferDocId: string,
  transferType: TransferType,
  transferDate: string,
  fromStoreId: string,
  toStoreId: string,
  _remarks: string,
  _transferNo: string,
  lines: TransferLine[],
  locations: ApiMasterRow[],
): GatepassOutwardPrefill | null {
  if (!needsGatepassOutward(transferType, fromStoreId, toStoreId, locations)) return null

  const toLoc = locations.find((l) => l.id === toStoreId)
  const toRole = String(toLoc?.systemRole ?? '').toUpperCase()
  const returnFlag =
    toRole === 'REJECTED' || String(toLoc?.name ?? '').toLowerCase().includes('reject') ? 'Y' : 'N'

  const prefillLines = lines
    .filter((l) => l.itemId)
    .map((l) => ({
      itemId: l.itemId,
      qty: l.transferQty || '1',
      uomId: l.uomId ?? '',
    }))

  if (prefillLines.length === 0) return null

  return {
    transferDocId,
    date: transferDate,
    storeId: fromStoreId,
    transferType,
    returnFlag,
    lines: prefillLines,
  }
}

/** Build outward prefill from a saved transfer document (list / view actions). */
export function buildGatepassPrefillFromTxnDoc(doc: TxnDocument, locations: ApiMasterRow[]): GatepassOutwardPrefill | null {
  const subtype = String(doc.docSubtype ?? '').toUpperCase()
  const transferType: TransferType = subtype === 'OU' || subtype === 'OPR' ? 'OU' : 'INTERNAL'
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
