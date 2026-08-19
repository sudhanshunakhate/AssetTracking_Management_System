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

/** Opening Stock asset template — serial / network fields; qty is always 1 per row. */
export const OST_ASSET_IMPORT_HEADERS = [
  'itemCode*',
  'itemType*',
  'locationCode*',
  'serialNo*',
  'ipAddress',
  'macAddress',
  'hostname',
  'itemCondition',
  'supplierCode',
  'remark',
]

export const OST_ASSET_IMPORT_SAMPLE = [
  'LAP-HP-001',
  'asset',
  'STR-MAIN',
  'SN-12345',
  '192.168.0.10',
  'AA-BB-CC-DD-EE-FF',
  'laptop01',
  'Good',
  '',
  'Imported asset unit',
]

/** Opening Stock consumable template — quantity / batch / dates; no serial. */
export const OST_CONSUMABLE_IMPORT_HEADERS = [
  'itemCode*',
  'itemType*',
  'locationCode*',
  'qty*',
  'batch',
  'mfgDate',
  'expiryDate',
  'supplierCode',
  'remark',
]

export const OST_CONSUMABLE_IMPORT_SAMPLE = [
  'CON-001',
  'consumable',
  'STR-MAIN',
  '50',
  'BATCH-001',
  '2026-01-01',
  '2027-01-01',
  '',
  'Imported consumable',
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

function availableCodes(rows: ApiMasterRow[], limit = 8) {
  const codes = rows.map((r) => String(r.code ?? '').trim()).filter(Boolean)
  if (codes.length === 0) return '(none loaded)'
  const shown = codes.slice(0, limit).join(', ')
  return codes.length > limit ? `${shown}, …` : shown
}

function resolveLocationId(ctx: ResolveCtx, locationCode: string) {
  if (locationCode) {
    const loc = byCode(ctx.locations, locationCode)
    if (!loc) {
      throw new Error(
        `Location code not found: ${locationCode}. Use a code from Location Master, e.g. ${availableCodes(ctx.locations)}`,
      )
    }
    return loc.id
  }
  if (ctx.defaultLocationId) return ctx.defaultLocationId
  throw new Error('locationCode is required when header location is not set')
}

function masterKind(item: ApiMasterRow): ItemKind {
  return item.itemType === 'consumable' ? 'consumable' : 'asset'
}

function csvKind(rowType: string): ItemKind | null {
  const t = rowType.trim().toLowerCase()
  if (t === 'consumable') return 'consumable'
  if (t === 'asset') return 'asset'
  return null
}

function resolveItem(ctx: ResolveCtx, itemCode: string, rowType: string) {
  const item = resolveItemByCode(ctx.items, itemCode)
  const kind = masterKind(item)
  const want: ItemKind = csvKind(rowType) ?? kind
  if (want !== ctx.activeItemType) {
    throw new Error(`Item ${itemCode} is ${kind} but form Item Type is ${ctx.activeItemType}`)
  }
  return item
}

function csvVal(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const v = row[key]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

function assertItemCodeColumn(rows: Record<string, string>[]) {
  if (rows.length === 0) return
  if ('itemcode' in rows[0] || 'item' in rows[0]) return
  const found = Object.keys(rows[0]).filter(Boolean).join(', ') || '(none)'
  throw new Error(
    `CSV header must include itemCode. Found columns: ${found}.\nDownload the Asset or Consumable template and keep those column names in row 1.`,
  )
}

function resolveItemByCode(items: ApiMasterRow[], itemCode: string) {
  if (!itemCode) throw new Error('itemCode is required')
  const item = byCode(items, itemCode)
  if (!item) throw new Error(`Item code not found: ${itemCode}`)
  return item
}

export type OpeningStockImportResult = {
  itemType: ItemKind
  lines: OpeningStockLine[]
}

function resolveOpeningRowKind(item: ApiMasterRow, rowType: string, itemCode: string): ItemKind {
  const fromMaster = masterKind(item)
  const fromCsv = csvKind(rowType)
  if (fromCsv && fromCsv !== fromMaster) {
    throw new Error(`Item ${itemCode} is ${fromMaster} in Item Master but CSV itemType is ${fromCsv}`)
  }
  return fromCsv ?? fromMaster
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
): OpeningStockImportResult {
  assertItemCodeColumn(rows)
  const errors: string[] = []
  const parsed: { rowNo: number; code: string; kind: ItemKind; line: OpeningStockLine }[] = []

  rows.forEach((row, idx) => {
    const rowNo = idx + 2
    const itemCode = csvVal(row, 'itemcode', 'item')
    try {
      const item = resolveItemByCode(ctx.items, itemCode)
      const kind = resolveOpeningRowKind(item, csvVal(row, 'itemtype', 'type'), itemCode)
      const locationId = resolveLocationId(ctx, csvVal(row, 'locationcode', 'location'))
      const supplierCode = csvVal(row, 'suppliercode', 'supplier')
      const supplier = supplierCode ? byCode(ctx.vendors, supplierCode) : undefined
      if (supplierCode && !supplier) {
        throw new Error(
          `Supplier code not found: ${supplierCode}. Use a code from Vendor Master, e.g. ${availableCodes(ctx.vendors)}`,
        )
      }

      const line: OpeningStockLine = {
        ...emptyOpeningStockLine(),
        ...applyItemMaster(item, locationId),
        serialNo: csvVal(row, 'serialno', 'serial').toUpperCase(),
        ipAddress: csvVal(row, 'ipaddress', 'ip'),
        macAddress: csvVal(row, 'macaddress', 'mac').toUpperCase(),
        hostname: csvVal(row, 'hostname'),
        itemCondition: csvVal(row, 'itemcondition', 'condition'),
        batch: csvVal(row, 'batch', 'batchlotno').toUpperCase(),
        mfgDate: csvVal(row, 'mfgdate'),
        expiryDate: csvVal(row, 'expirydate'),
        supplierId: supplier?.id ?? '',
        remark: csvVal(row, 'remark'),
        qty: '',
      }

      if (kind === 'asset') {
        if (!line.serialNo.trim()) throw new Error('serialNo is required for asset lines')
        line.qty = '1'
      } else {
        const qty = toNum(csvVal(row, 'qty', 'receivedqty') || '0')
        if (qty <= 0) throw new Error('qty must be > 0 for consumable lines')
        line.qty = String(qty)
      }

      parsed.push({ rowNo, code: itemCode, kind, line })
    } catch (e) {
      errors.push(`Row ${rowNo}: ${e instanceof Error ? e.message : String(e)}`)
    }
  })

  const kinds = new Set(parsed.map((p) => p.kind))
  if (kinds.size > 1) {
    const assets = parsed.filter((p) => p.kind === 'asset').map((p) => `${p.code} (row ${p.rowNo})`)
    const consumables = parsed
      .filter((p) => p.kind === 'consumable')
      .map((p) => `${p.code} (row ${p.rowNo})`)
    errors.push(
      [
        'Opening Stock allows one item type per document. This file has both.',
        `Asset: ${assets.join(', ')}`,
        `Consumable: ${consumables.join(', ')}`,
        'Split into two CSV files (or two Opening Stock entries).',
      ].join('\n'),
    )
  }

  if (errors.length > 0) throw new Error(errors.join('\n'))
  if (parsed.length === 0) throw new Error('No valid data rows found in the file.')

  const itemType = parsed[0].kind
  return { itemType, lines: parsed.map((p) => p.line) }
}
