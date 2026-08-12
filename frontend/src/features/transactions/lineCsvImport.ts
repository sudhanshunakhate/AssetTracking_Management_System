import type { ApiMasterRow } from '@/api/masters'
import { applyItemMaster, toNum } from './lineGrid'
import { emptyGrnLine, type GrnLine } from './GrnItemLines'
import { emptyOpeningStockLine, type ItemKind, type OpeningStockLine } from './OpeningStockItemLines'

/** Unified CSV columns for GRN and Opening Stock item lines (matches grid + import template). */
export const LINE_IMPORT_HEADERS = [
  'itemCode*',
  'itemType*',
  'locationCode*',
  'qty',
  'serialNo*',
  'ipAddress',
  'macAddress',
  'hostname',
  'itemCondition',
  'receivedQty',
  'acceptedQty',
  'rejectedQty',
  'batch',
  'mfgDate',
  'expiryDate',
  'supplierCode',
  'amount',
  'remark',
]

export const LINE_IMPORT_SAMPLE = [
  'LAP-HP-001',
  'asset',
  'STR-MAIN',
  '1',
  'SN-12345',
  '192.168.0.10',
  'AA-BB-CC-DD-EE-FF',
  'laptop01',
  'Good',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '45000',
  'Imported line',
]

type ResolveCtx = {
  items: ApiMasterRow[]
  locations: ApiMasterRow[]
  vendors: ApiMasterRow[]
  defaultLocationId: string
  activeItemType: ItemKind
  docKind: 'grn' | 'opening'
}

function byCode(rows: ApiMasterRow[], code: string) {
  const q = code.trim().toUpperCase()
  return rows.find((r) => String(r.code ?? '').toUpperCase() === q)
}

function resolveLocationId(ctx: ResolveCtx, locationCode: string) {
  if (locationCode) {
    const loc = byCode(ctx.locations, locationCode)
    if (!loc) throw new Error(`Location code not found: ${locationCode}`)
    return loc.id
  }
  if (ctx.defaultLocationId) return ctx.defaultLocationId
  throw new Error('locationCode is required when header location is not set')
}

function resolveItem(ctx: ResolveCtx, itemCode: string, rowType: string) {
  if (!itemCode) throw new Error('itemCode is required')
  const item = byCode(ctx.items, itemCode)
  if (!item) throw new Error(`Item code not found: ${itemCode}`)
  const kind: ItemKind = (item.itemType === 'consumable' ? 'consumable' : 'asset')
  const want: ItemKind = rowType === 'consumable' ? 'consumable' : rowType === 'asset' ? 'asset' : kind
  if (want !== ctx.activeItemType) {
    throw new Error(`Item ${itemCode} is ${kind} but form Item Type is ${ctx.activeItemType}`)
  }
  return item
}

export function importGrnLines(rows: Record<string, string>[], ctx: ResolveCtx): GrnLine[] {
  const out: GrnLine[] = []
  const isAsset = ctx.activeItemType === 'asset'

  rows.forEach((row, idx) => {
    const item = resolveItem(ctx, row.itemcode ?? '', row.itemtype ?? '')
    const locationId = resolveLocationId(ctx, row.locationcode ?? '')
    const base = {
      ...emptyGrnLine(),
      ...applyItemMaster(item, locationId),
      serialNo: (row.serialno ?? '').toUpperCase(),
      ipAddress: row.ipaddress ?? '',
      macAddress: (row.macaddress ?? '').toUpperCase(),
      hostname: row.hostname ?? '',
      itemCondition: row.itemcondition ?? '',
      batch: (row.batch ?? '').toUpperCase(),
      remark: row.remark ?? '',
      amount: row.amount ?? '',
    }

    if (isAsset) {
      if (!base.serialNo.trim()) throw new Error(`Row ${idx + 2}: serialNo is required for asset lines`)
      out.push({
        ...base,
        receivedQty: '1',
        acceptedQty: '1',
        rejectedQty: '0',
      })
    } else {
      const received = toNum(row.receivedqty || row.qty || '1')
      if (received <= 0) throw new Error(`Row ${idx + 2}: receivedQty or qty must be > 0`)
      const accepted = row.acceptedqty ? toNum(row.acceptedqty) : received
      const rejected = row.rejectedqty ? toNum(row.rejectedqty) : Math.max(received - accepted, 0)
      out.push({
        ...base,
        receivedQty: String(received),
        acceptedQty: String(accepted),
        rejectedQty: String(rejected),
      })
    }
  })
  return out
}

export function importOpeningStockLines(
  rows: Record<string, string>[],
  ctx: ResolveCtx,
): OpeningStockLine[] {
  const out: OpeningStockLine[] = []
  const isAsset = ctx.activeItemType === 'asset'

  rows.forEach((row, idx) => {
    const item = resolveItem(ctx, row.itemcode ?? '', row.itemtype ?? '')
    const locationId = resolveLocationId(ctx, row.locationcode ?? '')
    const supplier = row.suppliercode ? byCode(ctx.vendors, row.suppliercode) : undefined
    if (row.suppliercode && !supplier) throw new Error(`Supplier code not found: ${row.suppliercode}`)

    const base: OpeningStockLine = {
      ...emptyOpeningStockLine(),
      ...applyItemMaster(item, locationId),
      serialNo: (row.serialno ?? '').toUpperCase(),
      ipAddress: row.ipaddress ?? '',
      macAddress: (row.macaddress ?? '').toUpperCase(),
      hostname: row.hostname ?? '',
      itemCondition: row.itemcondition ?? '',
      batch: (row.batch ?? '').toUpperCase(),
      mfgDate: row.mfgdate ?? '',
      expiryDate: row.expirydate ?? '',
      supplierId: supplier?.id ?? '',
      remark: row.remark ?? '',
      qty: '',
    }

    if (isAsset) {
      if (!base.serialNo.trim()) throw new Error(`Row ${idx + 2}: serialNo is required for asset lines`)
      base.qty = '1'
      out.push(base)
    } else {
      const qty = toNum(row.qty || row.receivedqty || '0')
      if (qty <= 0) throw new Error(`Row ${idx + 2}: qty must be > 0 for consumable lines`)
      base.qty = String(qty)
      out.push(base)
    }
  })
  return out
}
