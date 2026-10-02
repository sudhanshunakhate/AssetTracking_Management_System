import type { ApiMasterRow } from '@/api/masters'
import { createMaster } from '@/api/masters'
import type { MasterImportDraftBase, MasterImportResult } from './MasterCsvImportPanel'

export function byCode(rows: ApiMasterRow[], code: string) {
  const q = code.trim().toUpperCase()
  return rows.find((r) => String(r.code ?? '').toUpperCase() === q)
}

function cell(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return (row[key] ?? '').trim()
    }
  }
  return ''
}

function trackDupes(seen: Map<string, number>, code: string, sourceRow: number): string {
  const key = code.toUpperCase()
  const prev = seen.get(key)
  if (prev) return `Duplicate code in file (also row ${prev})`
  seen.set(key, sourceRow)
  return ''
}

async function saveDrafts<T extends MasterImportDraftBase>(
  drafts: T[],
  buildBody: (draft: T) => Record<string, unknown>,
  resource: string,
): Promise<MasterImportResult> {
  const result: MasterImportResult = { created: 0, failed: [] }
  for (const draft of drafts) {
    if (draft.error) {
      result.failed.push({ row: draft.sourceRow, message: draft.error })
      continue
    }
    try {
      await createMaster(resource, buildBody(draft))
      result.created += 1
    } catch (e) {
      result.failed.push({
        row: draft.sourceRow,
        message: e instanceof Error ? e.message : 'Save failed',
      })
    }
  }
  return result
}

/* ─── Units ─── */

export const UNIT_IMPORT_HEADERS = ['unitCode*', 'unitName*', 'desc']
export const UNIT_IMPORT_SAMPLE = ['PCS', 'Pieces', 'Count unit']

export type UnitImportDraft = MasterImportDraftBase & {
  unitCode: string
  unitName: string
  desc: string
}

export function parseUnitsFromCsv(rows: Record<string, string>[], existing: ApiMasterRow[]) {
  const drafts: UnitImportDraft[] = []
  const failed: Array<{ row: number; message: string }> = []
  const seen = new Map<string, number>()

  rows.forEach((row, i) => {
    const sourceRow = i + 2
    const unitCode = cell(row, 'unitcode')
    const unitName = cell(row, 'unitname')
    const desc = cell(row, 'desc')
    let error = ''
    if (!unitCode) error = 'unitCode is required'
    else if (!unitName) error = 'unitName is required'
    else if (byCode(existing, unitCode)) error = `unitCode already exists: ${unitCode}`
    else error = trackDupes(seen, unitCode, sourceRow)

    const draft: UnitImportDraft = {
      key: `${sourceRow}-${unitCode || i}`,
      sourceRow,
      unitCode,
      unitName,
      desc,
      error,
    }
    drafts.push(draft)
    if (error) failed.push({ row: sourceRow, message: error })
  })
  return { drafts, failed }
}

export function saveUnitsFromDrafts(drafts: UnitImportDraft[]) {
  return saveDrafts(drafts, (d) => ({
    unitCode: d.unitCode,
    unitName: d.unitName,
    desc: d.desc || undefined,
    isActive: true,
  }), 'units')
}

/* ─── Categories ─── */

export const CATEGORY_IMPORT_HEADERS = ['categoryCode*', 'categoryName*', 'desc']
export const CATEGORY_IMPORT_SAMPLE = ['IT-HW', 'IT Hardware', 'Computers and peripherals']

export type CategoryImportDraft = MasterImportDraftBase & {
  categoryCode: string
  categoryName: string
  desc: string
}

export function parseCategoriesFromCsv(rows: Record<string, string>[], existing: ApiMasterRow[]) {
  const drafts: CategoryImportDraft[] = []
  const failed: Array<{ row: number; message: string }> = []
  const seen = new Map<string, number>()

  rows.forEach((row, i) => {
    const sourceRow = i + 2
    const categoryCode = cell(row, 'categorycode')
    const categoryName = cell(row, 'categoryname')
    const desc = cell(row, 'desc')
    let error = ''
    if (!categoryCode) error = 'categoryCode is required'
    else if (!categoryName) error = 'categoryName is required'
    else if (byCode(existing, categoryCode)) error = `categoryCode already exists: ${categoryCode}`
    else error = trackDupes(seen, categoryCode, sourceRow)

    const draft: CategoryImportDraft = {
      key: `${sourceRow}-${categoryCode || i}`,
      sourceRow,
      categoryCode,
      categoryName,
      desc,
      error,
    }
    drafts.push(draft)
    if (error) failed.push({ row: sourceRow, message: error })
  })
  return { drafts, failed }
}

export function saveCategoriesFromDrafts(drafts: CategoryImportDraft[]) {
  return saveDrafts(drafts, (d) => ({
    categoryCode: d.categoryCode,
    categoryName: d.categoryName,
    desc: d.desc || undefined,
    isActive: true,
  }), 'categories')
}

/* ─── Sub-categories ─── */

export const SUBCATEGORY_IMPORT_HEADERS = ['subcategoryCode*', 'subcategoryName*', 'categoryCode*', 'desc']
export const SUBCATEGORY_IMPORT_SAMPLE = ['LAPTOP', 'Laptops', 'IT-HW', 'Notebook computers']

export type SubcategoryImportDraft = MasterImportDraftBase & {
  subcategoryCode: string
  subcategoryName: string
  categoryCode: string
  categoryId?: number
  desc: string
}

export function parseSubcategoriesFromCsv(
  rows: Record<string, string>[],
  ctx: { existing: ApiMasterRow[]; categories: ApiMasterRow[] },
) {
  const drafts: SubcategoryImportDraft[] = []
  const failed: Array<{ row: number; message: string }> = []
  const seen = new Map<string, number>()

  rows.forEach((row, i) => {
    const sourceRow = i + 2
    const subcategoryCode = cell(row, 'subcategorycode')
    const subcategoryName = cell(row, 'subcategoryname')
    const categoryCode = cell(row, 'categorycode')
    const desc = cell(row, 'desc')
    const category = categoryCode ? byCode(ctx.categories, categoryCode) : undefined
    let error = ''
    if (!subcategoryCode) error = 'subcategoryCode is required'
    else if (!subcategoryName) error = 'subcategoryName is required'
    else if (!categoryCode) error = 'categoryCode is required'
    else if (!category) error = `categoryCode not found: ${categoryCode}`
    else if (byCode(ctx.existing, subcategoryCode)) error = `subcategoryCode already exists: ${subcategoryCode}`
    else error = trackDupes(seen, subcategoryCode, sourceRow)

    const draft: SubcategoryImportDraft = {
      key: `${sourceRow}-${subcategoryCode || i}`,
      sourceRow,
      subcategoryCode,
      subcategoryName,
      categoryCode,
      categoryId: category ? Number(category.id) : undefined,
      desc,
      error,
    }
    drafts.push(draft)
    if (error) failed.push({ row: sourceRow, message: error })
  })
  return { drafts, failed }
}

export function saveSubcategoriesFromDrafts(drafts: SubcategoryImportDraft[]) {
  return saveDrafts(drafts, (d) => ({
    subcategoryCode: d.subcategoryCode,
    subcategoryName: d.subcategoryName,
    categoryId: d.categoryId,
    desc: d.desc || undefined,
    isActive: true,
  }), 'subcategories')
}

/* ─── General types ─── */

export const GENTYPE_IMPORT_HEADERS = ['typeCode*', 'typeName*', 'desc']
export const GENTYPE_IMPORT_SAMPLE = ['GTY-CUSTOM', 'Custom Lookup', 'Example type']

export type GentypeImportDraft = MasterImportDraftBase & {
  typeCode: string
  typeName: string
  desc: string
}

export function parseGentypesFromCsv(rows: Record<string, string>[], existing: ApiMasterRow[]) {
  const drafts: GentypeImportDraft[] = []
  const failed: Array<{ row: number; message: string }> = []
  const seen = new Map<string, number>()

  rows.forEach((row, i) => {
    const sourceRow = i + 2
    const typeCode = cell(row, 'typecode')
    const typeName = cell(row, 'typename')
    const desc = cell(row, 'desc')
    let error = ''
    if (!typeCode) error = 'typeCode is required'
    else if (!typeName) error = 'typeName is required'
    else if (byCode(existing, typeCode)) error = `typeCode already exists: ${typeCode}`
    else error = trackDupes(seen, typeCode, sourceRow)

    const draft: GentypeImportDraft = {
      key: `${sourceRow}-${typeCode || i}`,
      sourceRow,
      typeCode,
      typeName,
      desc,
      error,
    }
    drafts.push(draft)
    if (error) failed.push({ row: sourceRow, message: error })
  })
  return { drafts, failed }
}

export function saveGentypesFromDrafts(drafts: GentypeImportDraft[]) {
  return saveDrafts(drafts, (d) => ({
    typeCode: d.typeCode,
    typeName: d.typeName,
    desc: d.desc || undefined,
    isActive: true,
  }), 'general-types')
}

/* ─── General masters ─── */

export const GENMASTER_IMPORT_HEADERS = ['valueCode*', 'valueName*', 'typeCode*', 'sortOrder', 'desc']
export const GENMASTER_IMPORT_SAMPLE = ['AC-NEW', 'New', 'GTY-ASSETCOND', '10', 'Asset condition']

export type GenmasterImportDraft = MasterImportDraftBase & {
  valueCode: string
  valueName: string
  typeCode: string
  gentypeId?: number
  sortOrder: number
  desc: string
}

export function parseGenmastersFromCsv(
  rows: Record<string, string>[],
  ctx: { existing: ApiMasterRow[]; types: ApiMasterRow[] },
) {
  const drafts: GenmasterImportDraft[] = []
  const failed: Array<{ row: number; message: string }> = []
  const seen = new Map<string, number>()

  rows.forEach((row, i) => {
    const sourceRow = i + 2
    const valueCode = cell(row, 'valuecode')
    const valueName = cell(row, 'valuename')
    const typeCode = cell(row, 'typecode')
    const desc = cell(row, 'desc')
    const sortRaw = cell(row, 'sortorder')
    const sortOrder = sortRaw === '' ? 0 : Number(sortRaw)
    const gentype = typeCode ? byCode(ctx.types, typeCode) : undefined
    let error = ''
    if (!valueCode) error = 'valueCode is required'
    else if (!valueName) error = 'valueName is required'
    else if (!typeCode) error = 'typeCode is required'
    else if (!gentype) error = `typeCode not found: ${typeCode}`
    else if (sortRaw !== '' && Number.isNaN(sortOrder)) error = 'sortOrder must be a number'
    else if (byCode(ctx.existing, valueCode)) error = `valueCode already exists: ${valueCode}`
    else error = trackDupes(seen, valueCode, sourceRow)

    const draft: GenmasterImportDraft = {
      key: `${sourceRow}-${valueCode || i}`,
      sourceRow,
      valueCode,
      valueName,
      typeCode,
      gentypeId: gentype ? Number(gentype.id) : undefined,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      desc,
      error,
    }
    drafts.push(draft)
    if (error) failed.push({ row: sourceRow, message: error })
  })
  return { drafts, failed }
}

export function saveGenmastersFromDrafts(drafts: GenmasterImportDraft[]) {
  return saveDrafts(drafts, (d) => ({
    valueCode: d.valueCode,
    valueName: d.valueName,
    gentypeId: d.gentypeId,
    sortOrder: d.sortOrder,
    desc: d.desc || undefined,
    isActive: true,
  }), 'general-masters')
}

/* ─── Vendors ─── */

export const VENDOR_IMPORT_HEADERS = [
  'vendorCode*',
  'vendorName*',
  'partyType*',
  'phone*',
  'email',
  'gstin',
  'panNo',
  'contactPerson',
  'city',
  'state',
  'pin',
  'country',
  'add1',
  'add2',
  'website',
  'notes',
  'rating',
]
export const VENDOR_IMPORT_SAMPLE = [
  'VND-001',
  'Acme Supplies',
  'Supplier',
  '9876543210',
  'sales@acme.example',
  '',
  '',
  'Ravi Kumar',
  'Nagpur',
  'MH',
  '440001',
  'India',
  'Plot 1',
  '',
  '',
  '',
  '4',
]

export type VendorImportDraft = MasterImportDraftBase & {
  vendorCode: string
  vendorName: string
  partyType: string
  phone: string
  email: string
  gstin: string
  panNo: string
  contactPerson: string
  city: string
  state: string
  pin: string
  country: string
  add1: string
  add2: string
  website: string
  notes: string
  rating?: number
}

export function parseVendorsFromCsv(
  rows: Record<string, string>[],
  ctx: { existing: ApiMasterRow[]; partyTypes: string[] },
) {
  const drafts: VendorImportDraft[] = []
  const failed: Array<{ row: number; message: string }> = []
  const seen = new Map<string, number>()
  const partySet = new Set(ctx.partyTypes.map((p) => p.trim().toLowerCase()))

  rows.forEach((row, i) => {
    const sourceRow = i + 2
    const vendorCode = cell(row, 'vendorcode')
    const vendorName = cell(row, 'vendorname')
    const partyType = cell(row, 'partytype')
    const phone = cell(row, 'phone')
    const ratingRaw = cell(row, 'rating')
    const rating = ratingRaw === '' ? undefined : Number(ratingRaw)
    let error = ''
    if (!vendorCode) error = 'vendorCode is required'
    else if (!vendorName) error = 'vendorName is required'
    else if (!partyType) error = 'partyType is required'
    else if (partySet.size > 0 && !partySet.has(partyType.toLowerCase())) {
      error = `partyType not found: ${partyType}`
    } else if (!phone) error = 'phone is required'
    else if (ratingRaw !== '' && (Number.isNaN(rating!) || rating! < 0 || rating! > 5)) {
      error = 'rating must be 0–5'
    } else if (byCode(ctx.existing, vendorCode)) error = `vendorCode already exists: ${vendorCode}`
    else error = trackDupes(seen, vendorCode, sourceRow)

    const matchedParty =
      ctx.partyTypes.find((p) => p.trim().toLowerCase() === partyType.toLowerCase()) ?? partyType

    const draft: VendorImportDraft = {
      key: `${sourceRow}-${vendorCode || i}`,
      sourceRow,
      vendorCode,
      vendorName,
      partyType: matchedParty,
      phone,
      email: cell(row, 'email'),
      gstin: cell(row, 'gstin'),
      panNo: cell(row, 'panno'),
      contactPerson: cell(row, 'contactperson'),
      city: cell(row, 'city'),
      state: cell(row, 'state'),
      pin: cell(row, 'pin'),
      country: cell(row, 'country') || 'India',
      add1: cell(row, 'add1'),
      add2: cell(row, 'add2'),
      website: cell(row, 'website'),
      notes: cell(row, 'notes'),
      rating,
      error,
    }
    drafts.push(draft)
    if (error) failed.push({ row: sourceRow, message: error })
  })
  return { drafts, failed }
}

export function saveVendorsFromDrafts(drafts: VendorImportDraft[]) {
  return saveDrafts(drafts, (d) => ({
    vendorCode: d.vendorCode,
    vendorName: d.vendorName,
    partyType: d.partyType,
    phone: d.phone,
    email: d.email || undefined,
    gstin: d.gstin || undefined,
    panNo: d.panNo || undefined,
    contactPerson: d.contactPerson || undefined,
    city: d.city || undefined,
    state: d.state || undefined,
    pin: d.pin || undefined,
    country: d.country || 'India',
    add1: d.add1 || undefined,
    add2: d.add2 || undefined,
    website: d.website || undefined,
    notes: d.notes || undefined,
    rating: d.rating,
    isActive: true,
  }), 'vendors')
}

/* ─── Items ─── */

/**
 * One column per Item Master field. Required columns are marked with *.
 * itemType must be: asset | consumable
 * For asset rows fill assetType (and optional makeBrand/model).
 * For consumable rows fill consumableType instead.
 */
export const ITEM_IMPORT_HEADERS = [
  'itemCode*',
  'itemName*',
  'itemType*',
  'entityCode*',
  'uomCode*',
  'locationCode*',
  'categoryCode',
  'subcategoryCode',
  'standardCost',
  'description',
  'remarks',
  'assetType',
  'consumableType',
  'makeBrand',
  'model',
  'productNo',
  'usefulLifeYears',
  'depreciationMethod',
  'depreciationRate',
  'trackBatchLot',
  'trackExpiry',
  'allowNegativeStock',
]

/** Consumable-only bulk template (Item Master) — no asset columns. */
export const CONSUMABLE_ITEM_IMPORT_HEADERS = [
  'itemCode*',
  'itemName*',
  'itemType*',
  'entityCode*',
  'uomCode*',
  'locationCode*',
  'consumableType*',
  'categoryCode',
  'subcategoryCode',
  'standardCost',
  'description',
  'remarks',
  'trackBatchLot',
  'trackExpiry',
  'allowNegativeStock',
]

/** Asset-only bulk template (Item Master). */
export const ASSET_ITEM_IMPORT_HEADERS = [
  'itemCode*',
  'itemName*',
  'itemType*',
  'entityCode*',
  'uomCode*',
  'locationCode*',
  'assetType*',
  'categoryCode',
  'subcategoryCode',
  'standardCost',
  'description',
  'remarks',
  'makeBrand',
  'model',
  'productNo',
  'usefulLifeYears',
  'depreciationMethod',
  'depreciationRate',
]

export const ITEM_IMPORT_SAMPLE = [
  'ITM-LAP-01',
  'Dell Laptop',
  'asset',
  '', // entityCode filled at download from logged-in org
  'PCS',
  '', // locationCode filled at download from user default location when available
  'IT-HW',
  'LAPTOP',
  '55000',
  'Standard business laptop',
  '',
  'Laptop',
  '',
  'Dell',
  'Latitude',
  '',
  '4',
  '',
  '',
  '',
  '',
  '',
]

/** Second example row (consumable) included in the combined template. */
export const ITEM_IMPORT_SAMPLE_CONSUMABLE = [
  'ITM-PEN-01',
  'Ball Point Pen',
  'consumable',
  '',
  'PCS',
  '',
  'STATIONERY',
  'PENS',
  '10',
  'Blue ink pen',
  '',
  '',
  'Stationery',
  '',
  '',
  '',
  '',
  '',
  '',
  'false',
  'false',
  'false',
]

export const CONSUMABLE_ITEM_IMPORT_SAMPLE = [
  'ITM-PEN-01',
  'Ball Point Pen',
  'consumable',
  '',
  'PCS',
  '',
  'Stationery',
  'STATIONERY',
  'PENS',
  '10',
  'Blue ink pen',
  '',
  'false',
  'false',
  'false',
]

export const ASSET_ITEM_IMPORT_SAMPLE = [
  'ITM-LAP-01',
  'Dell Laptop',
  'asset',
  '',
  'PCS',
  '',
  'Laptop',
  'IT-HW',
  'LAPTOP',
  '55000',
  'Standard business laptop',
  '',
  'Dell',
  'Latitude',
  '',
  '4',
  '',
  '',
]

function applyImportDefaults(
  headers: string[],
  row: string[],
  defaults?: { entityCode?: string; locationCode?: string },
) {
  const next = [...row]
  const entityIdx = headers.indexOf('entityCode*')
  const locationIdx = headers.indexOf('locationCode*')
  const entityCode = (defaults?.entityCode ?? '').trim()
  const locationCode = (defaults?.locationCode ?? '').trim()
  if (entityIdx >= 0 && entityCode) next[entityIdx] = entityCode
  if (locationIdx >= 0 && locationCode) next[locationIdx] = locationCode
  else if (locationIdx >= 0 && !next[locationIdx]) next[locationIdx] = 'LOC-001'
  return next
}

/** Fill entity/location defaults into combined template sample rows. */
export function buildItemImportSampleRows(defaults?: {
  entityCode?: string
  locationCode?: string
}): string[][] {
  return [
    applyImportDefaults(ITEM_IMPORT_HEADERS, ITEM_IMPORT_SAMPLE, defaults),
    applyImportDefaults(ITEM_IMPORT_HEADERS, ITEM_IMPORT_SAMPLE_CONSUMABLE, defaults),
  ]
}

export function buildConsumableItemImportSampleRows(defaults?: {
  entityCode?: string
  locationCode?: string
}): string[] {
  return applyImportDefaults(CONSUMABLE_ITEM_IMPORT_HEADERS, CONSUMABLE_ITEM_IMPORT_SAMPLE, defaults)
}

export function buildAssetItemImportSampleRows(defaults?: {
  entityCode?: string
  locationCode?: string
}): string[] {
  return applyImportDefaults(ASSET_ITEM_IMPORT_HEADERS, ASSET_ITEM_IMPORT_SAMPLE, defaults)
}

function parseBool(raw: string, fallback = false): boolean {
  const v = raw.trim().toLowerCase()
  if (!v) return fallback
  if (['1', 'true', 'yes', 'y'].includes(v)) return true
  if (['0', 'false', 'no', 'n'].includes(v)) return false
  return fallback
}

export type ItemImportDraft = MasterImportDraftBase & {
  itemCode: string
  itemName: string
  itemType: 'asset' | 'consumable' | ''
  entityCode: string
  entityId?: number
  uomCode: string
  uomId?: number
  locationCode: string
  currentLocationId?: number
  categoryCode: string
  categoryId?: number
  subcategoryCode: string
  subcategoryId?: number
  standardCost?: number
  description: string
  remarks: string
  assetType: string
  consumableType: string
  makeBrand: string
  model: string
  productNo: string
  usefulLifeYears?: number
  depreciationMethod: string
  depreciationRate?: number
  trackBatchLot: boolean
  trackExpiry: boolean
  allowNegativeStock: boolean
}

export function parseItemsFromCsv(
  rows: Record<string, string>[],
  ctx: {
    existing: ApiMasterRow[]
    entities: ApiMasterRow[]
    units: ApiMasterRow[]
    categories: ApiMasterRow[]
    subcategories: ApiMasterRow[]
    locations: ApiMasterRow[]
    /** Logged-in org — used when entityCode cell is blank. */
    defaultEntityCode?: string
    /** User default location — used when locationCode cell is blank. */
    defaultLocationCode?: string
    /** When set, every row must match this item type (used by dedicated templates). */
    forceItemType?: 'asset' | 'consumable'
  },
) {
  const drafts: ItemImportDraft[] = []
  const failed: Array<{ row: number; message: string }> = []
  const seen = new Map<string, number>()
  const fallbackEntity = (ctx.defaultEntityCode ?? '').trim()
  const fallbackLocation = (ctx.defaultLocationCode ?? '').trim()

  rows.forEach((row, i) => {
    const sourceRow = i + 2
    const itemCode = cell(row, 'itemcode', 'code')
    const itemName = cell(row, 'itemname', 'name', 'itemassetname')
    const itemTypeRaw = cell(row, 'itemtype', 'type').toLowerCase()
    const assetType = cell(row, 'assettype')
    const consumableType = cell(row, 'consumabletype')
    let itemType: 'asset' | 'consumable' | '' =
      itemTypeRaw === 'asset' || itemTypeRaw === 'consumable'
        ? (itemTypeRaw as 'asset' | 'consumable')
        : ''
    if (!itemType && ctx.forceItemType) itemType = ctx.forceItemType
    if (!itemType && consumableType && !assetType) itemType = 'consumable'
    if (!itemType && assetType && !consumableType) itemType = 'asset'

    const entityCode =
      cell(row, 'entitycode', 'orgcode', 'organizationcode') || fallbackEntity
    const uomCode = cell(row, 'uomcode', 'unitcode')
    const locationCode =
      cell(row, 'locationcode', 'currentlocationcode', 'storecode', 'homelocationcode') ||
      fallbackLocation
    const categoryCode = cell(row, 'categorycode')
    const subcategoryCode = cell(row, 'subcategorycode')
    const description = cell(row, 'description', 'desc', 'itemdescription')
    const remarks = cell(row, 'remarks')
    const makeBrand = cell(row, 'makebrand', 'brand', 'make')
    const model = cell(row, 'model')
    const productNo = cell(row, 'productno', 'productnumber')
    const depreciationMethod = cell(row, 'depreciationmethod')
    const costRaw = cell(row, 'standardcost', 'cost')
    const lifeRaw = cell(row, 'usefullifeyears', 'usefullife')
    const rateRaw = cell(row, 'depreciationrate')
    const standardCost = costRaw === '' ? undefined : Number(costRaw)
    const usefulLifeYears = lifeRaw === '' ? undefined : Number(lifeRaw)
    const depreciationRate = rateRaw === '' ? undefined : Number(rateRaw)
    const trackBatchLot = parseBool(cell(row, 'trackbatchlot', 'trackbatch'))
    const trackExpiry = parseBool(cell(row, 'trackexpiry'))
    const allowNegativeStock = parseBool(cell(row, 'allownegativestock'))

    const entity = entityCode ? byCode(ctx.entities, entityCode) : undefined
    const uom = uomCode ? byCode(ctx.units, uomCode) : undefined
    const location = locationCode ? byCode(ctx.locations, locationCode) : undefined
    const category = categoryCode ? byCode(ctx.categories, categoryCode) : undefined
    const subcategory = subcategoryCode ? byCode(ctx.subcategories, subcategoryCode) : undefined

    let error = ''
    if (!itemCode) error = 'itemCode is required'
    else if (!itemName) error = 'itemName is required'
    else if (!itemType) error = 'itemType must be asset or consumable'
    else if (ctx.forceItemType && itemType !== ctx.forceItemType) {
      error = `This template only accepts itemType=${ctx.forceItemType} (got ${itemType})`
    } else if (!entityCode) error = 'entityCode is required'
    else if (!entity) error = `entityCode not found: ${entityCode}`
    else if (!uomCode) error = 'uomCode is required'
    else if (!uom) error = `uomCode not found: ${uomCode}`
    else if (!locationCode) error = 'locationCode is required'
    else if (!location) error = `locationCode not found or not in your access: ${locationCode}`
    else if (categoryCode && !category) error = `categoryCode not found: ${categoryCode}`
    else if (subcategoryCode && !subcategory) error = `subcategoryCode not found: ${subcategoryCode}`
    else if (category && subcategory && String(subcategory.parentCode ?? '') !== String(category.id)) {
      error = `subcategory ${subcategoryCode} does not belong to category ${categoryCode}`
    } else if (costRaw !== '' && Number.isNaN(standardCost!)) error = 'standardCost must be a number'
    else if (lifeRaw !== '' && Number.isNaN(usefulLifeYears!)) error = 'usefulLifeYears must be a number'
    else if (rateRaw !== '' && Number.isNaN(depreciationRate!)) error = 'depreciationRate must be a number'
    else if (itemType === 'asset' && !assetType) error = 'assetType is required for asset items'
    else if (itemType === 'consumable' && !consumableType) {
      error = 'consumableType is required for consumable items'
    } else if (byCode(ctx.existing, itemCode)) error = `itemCode already exists: ${itemCode}`
    else error = trackDupes(seen, itemCode, sourceRow)

    const draft: ItemImportDraft = {
      key: `${sourceRow}-${itemCode || i}`,
      sourceRow,
      itemCode,
      itemName,
      itemType,
      entityCode,
      entityId: entity ? Number(entity.id) : undefined,
      uomCode,
      uomId: uom ? Number(uom.id) : undefined,
      locationCode,
      currentLocationId: location ? Number(location.id) : undefined,
      categoryCode,
      categoryId: category ? Number(category.id) : undefined,
      subcategoryCode,
      subcategoryId: subcategory ? Number(subcategory.id) : undefined,
      standardCost,
      description,
      remarks,
      assetType,
      consumableType,
      makeBrand,
      model,
      productNo,
      usefulLifeYears,
      depreciationMethod,
      depreciationRate,
      trackBatchLot,
      trackExpiry,
      allowNegativeStock,
      error,
    }
    drafts.push(draft)
    if (error) failed.push({ row: sourceRow, message: error })
  })
  return { drafts, failed }
}

export function saveItemsFromDrafts(drafts: ItemImportDraft[]) {
  return saveDrafts(drafts, (d) => {
    const isAsset = d.itemType === 'asset'
    return {
      itemCode: d.itemCode,
      itemName: d.itemName,
      itemType: d.itemType,
      entityId: d.entityId,
      buAccessScope: 'ALL',
      locationAccessScope: 'ALL',
      buIds: [],
      locationIds: [],
      categoryId: d.categoryId ?? null,
      subcategoryId: d.subcategoryId ?? null,
      uomId: d.uomId,
      standardCost: d.standardCost ?? null,
      desc: d.description || null,
      remarks: d.remarks || null,
      assetType: isAsset ? d.assetType || null : null,
      makeBrand: isAsset ? d.makeBrand || null : null,
      model: isAsset ? d.model || null : null,
      productNo: isAsset ? d.productNo || null : null,
      usefulLifeYears: isAsset ? d.usefulLifeYears ?? null : null,
      depreciationMethod: isAsset ? d.depreciationMethod || null : null,
      depreciationRate: isAsset ? d.depreciationRate ?? null : null,
      currentLocationId: d.currentLocationId ?? null,
      consumableType: !isAsset ? d.consumableType || null : null,
      isSerialized: false,
      isReturnable: false,
      isUnderAmc: false,
      isInsuranceRequired: false,
      inspectionNeeded: false,
      trackBatchLot: !isAsset ? d.trackBatchLot : false,
      trackExpiry: !isAsset ? d.trackExpiry : false,
      isConsumable: !isAsset,
      allowNegativeStock: !isAsset ? d.allowNegativeStock : false,
      parentItemId: null,
      isActive: true,
    }
  }, 'items')
}

/** Update preview-row location from the accessible-location dropdown. */
export function withItemDraftLocation(
  draft: ItemImportDraft,
  loc: { id: string; code?: string } | null,
): ItemImportDraft {
  if (!loc) {
    return {
      ...draft,
      locationCode: '',
      currentLocationId: undefined,
      error: /locationcode/i.test(draft.error) || !draft.error
        ? 'locationCode is required'
        : draft.error,
    }
  }
  const next: ItemImportDraft = {
    ...draft,
    locationCode: String(loc.code ?? '').trim(),
    currentLocationId: Number(loc.id),
  }
  if (/locationcode/i.test(draft.error)) {
    next.error = ''
  }
  return next
}
