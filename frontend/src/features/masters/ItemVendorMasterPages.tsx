import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { Pill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DataTable, statusColumn, type Column } from '@/components/ui/DataTable'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field'
import { FormActions, PageHeader } from '@/components/ui/PageHeader'
import {
  createMaster,
  GEN_TYPE,
  isActiveFromForm,
  itemTypeFromGenCode,
  mapCategory,
  mapEmployee,
  mapItem,
  mapLocation,
  mapSubcategory,
  mapUnit,
  mapVendor,
  numOrUndef,
  updateMaster,
  useGenValues,
  useMasterList,
  type ItemApi,
  type VendorApi,
} from '@/api/masters'
import { http } from '@/api/client'
import type { Item, Vendor } from '@/types/masters'
import { useAuth } from '@/features/auth/AuthContext'

function opt(rows: { id: string; code?: string; name?: string }[], label?: (r: { id: string; code?: string; name?: string }) => string) {
  const fmt = label ?? ((r: { code?: string; name?: string }) => `${r.code} – ${r.name}`)
  return rows.map((r) => ({ value: r.id, label: fmt(r) }))
}

function numOrNull(v: unknown): number | null {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function str(v: unknown) {
  return String(v ?? '').trim()
}

function digitsOnly(v: string) {
  return v.replace(/\D/g, '')
}

/** Indian mobile: 10 digits starting 6–9, optional +91 / 91 prefix. */
function normalizeIndianMobile(v: string) {
  let d = digitsOnly(v)
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  return d
}

function isValidIndianMobile(v: string) {
  return /^[6-9]\d{9}$/.test(normalizeIndianMobile(v))
}

/** PAN AAAAA9999A — 4th char: I/P=Individual, C=Company, H=HUF, F=Firm, etc. */
function panHolderType(pan: string): string | null {
  const p = pan.trim().toUpperCase()
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(p)) return null
  const map: Record<string, string> = {
    I: 'Individual',
    P: 'Individual (Person)',
    C: 'Company',
    H: 'HUF',
    F: 'Firm',
    A: 'Association of Persons (AOP)',
    T: 'Trust',
    B: 'Body of Individuals (BOI)',
    L: 'Local Authority',
    J: 'Artificial Juridical Person',
    G: 'Government',
  }
  return map[p.charAt(3)] ?? `Unknown type (${p.charAt(3)})`
}

function validatePan(pan: string): string | null {
  const p = pan.trim().toUpperCase()
  if (!p) return null
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(p)) return 'PAN must be in format AAAAA9999A'
  if (!panHolderType(p)) return 'Invalid PAN 4th character'
  return null
}

/* ───────────────────────── Item Master ───────────────────────── */

type ItemForm = {
  itemType: 'asset' | 'consumable'
  code: string
  name: string
  category: string
  subCategory: string
  uom: string
  standardCost: string
  imageUrl: string
  description: string
  remarks: string
  status: boolean
  assetType: string
  makeBrand: string
  model: string
  serialNo: string
  purchaseDate: string
  purchaseCost: string
  usefulLifeYears: string
  warrantyExpiry: string
  depreciationMethod: string
  depreciationRate: string
  assignedTo: string
  currentStore: string
  isSerialized: boolean
  isReturnable: boolean
  isUnderAmc: boolean
  isInsuranceRequired: boolean
  inspectionNeeded: boolean
  consumableType: string
  storageLocation: string
  shelfBin: string
  expiryDate: string
  batchLotNo: string
  trackBatchLot: boolean
  trackExpiry: boolean
  isConsumable: boolean
  allowNegativeStock: boolean
}

const emptyItem = (): ItemForm => ({
  itemType: 'asset',
  code: '',
  name: '',
  category: '',
  subCategory: '',
  uom: '',
  standardCost: '',
  imageUrl: '',
  description: '',
  remarks: '',
  status: true,
  assetType: '',
  makeBrand: '',
  model: '',
  serialNo: '',
  purchaseDate: '',
  purchaseCost: '',
  usefulLifeYears: '',
  warrantyExpiry: '',
  depreciationMethod: '',
  depreciationRate: '',
  assignedTo: '',
  currentStore: '',
  isSerialized: false,
  isReturnable: false,
  isUnderAmc: false,
  isInsuranceRequired: false,
  inspectionNeeded: false,
  consumableType: '',
  storageLocation: '',
  shelfBin: '',
  expiryDate: '',
  batchLotNo: '',
  trackBatchLot: false,
  trackExpiry: false,
  isConsumable: true,
  allowNegativeStock: false,
})

function ItemFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const { canCreateMenu, canEditMenu } = useAuth()
  const canCreate = canCreateMenu('AIM')
  const canEdit = canEditMenu('AIM')
  const readOnly = isNew ? !canCreate : !canEdit

  const mapCat = useCallback(mapCategory, [])
  const mapSub = useCallback(mapSubcategory, [])
  const mapUnt = useCallback(mapUnit, [])
  const mapEmp = useCallback(mapEmployee, [])
  const mapLoc = useCallback(mapLocation, [])
  const { rows: categories } = useMasterList('categories', mapCat)
  const { rows: subCategories } = useMasterList('subcategories', mapSub)
  const { rows: units } = useMasterList('units', mapUnt)
  const { rows: employees } = useMasterList('employees', mapEmp)
  const { rows: stores } = useMasterList('locations', mapLoc)
  const { options: itemParamOpts } = useGenValues(GEN_TYPE.ITEM_PARAM, 'code')
  const { options: assetTypeOpts } = useGenValues(GEN_TYPE.ASSET_TYPE)
  const { options: consumableTypeOpts } = useGenValues(GEN_TYPE.CONSUMABLE_TYPE)
  const { options: deprOpts } = useGenValues(GEN_TYPE.DEPRECIATION)

  const [values, setValues] = useState<ItemForm>(emptyItem)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof ItemForm>(k: K, v: ItemForm[K]) => setValues((p) => ({ ...p, [k]: v }))

  const filteredSubs = useMemo(
    () => subCategories.filter((s) => !values.category || String(s.parentCode) === values.category),
    [subCategories, values.category],
  )

  useEffect(() => {
    if (isNew) return
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const it = await http.get<ItemApi>(`/items/${id}`)
        if (cancelled) return
        setValues({
          itemType: it.itemType === 'consumable' ? 'consumable' : 'asset',
          code: it.itemCode ?? '',
          name: it.itemName ?? '',
          category: it.categoryId != null ? String(it.categoryId) : '',
          subCategory: it.subcategoryId != null ? String(it.subcategoryId) : '',
          uom: it.uomId != null ? String(it.uomId) : '',
          standardCost: it.standardCost != null ? String(it.standardCost) : '',
          imageUrl: it.imageUrl ?? '',
          description: it.desc ?? '',
          remarks: it.remarks ?? '',
          status: it.isActive !== false,
          assetType: it.assetType ?? '',
          makeBrand: it.makeBrand ?? '',
          model: it.model ?? '',
          serialNo: it.serialNo ?? '',
          purchaseDate: it.purchaseDate ?? '',
          purchaseCost: it.purchaseCost != null ? String(it.purchaseCost) : '',
          usefulLifeYears: it.usefulLifeYears != null ? String(it.usefulLifeYears) : '',
          warrantyExpiry: it.warrantyExpiry ?? '',
          depreciationMethod: it.depreciationMethod ?? '',
          depreciationRate: it.depreciationRate != null ? String(it.depreciationRate) : '',
          assignedTo: it.assignedToEmpId != null ? String(it.assignedToEmpId) : '',
          currentStore: it.currentLocationId != null ? String(it.currentLocationId) : '',
          isSerialized: Boolean(it.isSerialized),
          isReturnable: Boolean(it.isReturnable),
          isUnderAmc: Boolean(it.isUnderAmc),
          isInsuranceRequired: Boolean(it.isInsuranceRequired),
          inspectionNeeded: Boolean(it.inspectionNeeded),
          consumableType: it.consumableType ?? '',
          storageLocation: it.currentLocationId != null ? String(it.currentLocationId) : '',
          shelfBin: it.shelfBin ?? '',
          expiryDate: it.expiryDate ?? '',
          batchLotNo: it.batchLotNo ?? '',
          trackBatchLot: Boolean(it.trackBatchLot),
          trackExpiry: Boolean(it.trackExpiry),
          isConsumable: it.isConsumable !== false,
          allowNegativeStock: Boolean(it.allowNegativeStock),
        })
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load item')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  const save = async () => {
    if (readOnly) return
    setSaving(true)
    setError('')
    try {
      if (!values.code.trim() || !values.name.trim() || !values.uom) {
        throw new Error('Item Code, Name and Unit of Measure are required')
      }
      if (values.itemType === 'asset' && !values.assetType) {
        throw new Error('Asset Type is required for Asset items')
      }
      if (values.itemType === 'consumable' && !values.consumableType) {
        throw new Error('Consumable Type is required for Consumable items')
      }
      const locId =
        values.itemType === 'asset' ? numOrUndef(values.currentStore) : numOrUndef(values.storageLocation)
      const body = {
        itemCode: values.code.trim().toUpperCase(),
        itemName: values.name.trim(),
        itemType: values.itemType,
        categoryId: numOrNull(values.category),
        subcategoryId: numOrNull(values.subCategory),
        uomId: numOrUndef(values.uom),
        standardCost: numOrNull(values.standardCost),
        imageUrl: str(values.imageUrl) || null,
        desc: str(values.description) || null,
        remarks: str(values.remarks) || null,
        assetType: values.itemType === 'asset' ? str(values.assetType) || null : null,
        makeBrand: values.itemType === 'asset' ? str(values.makeBrand) || null : null,
        model: values.itemType === 'asset' ? str(values.model) || null : null,
        serialNo: values.itemType === 'asset' ? str(values.serialNo) || null : null,
        purchaseDate: values.itemType === 'asset' ? values.purchaseDate || null : null,
        purchaseCost: values.itemType === 'asset' ? numOrNull(values.purchaseCost) : null,
        usefulLifeYears: values.itemType === 'asset' ? numOrNull(values.usefulLifeYears) : null,
        warrantyExpiry: values.itemType === 'asset' ? values.warrantyExpiry || null : null,
        depreciationMethod: values.itemType === 'asset' ? str(values.depreciationMethod) || null : null,
        depreciationRate: values.itemType === 'asset' ? numOrNull(values.depreciationRate) : null,
        assignedToEmpId: values.itemType === 'asset' ? numOrNull(values.assignedTo) : null,
        currentLocationId: locId ?? null,
        isSerialized: values.itemType === 'asset' ? values.isSerialized : false,
        isReturnable: values.itemType === 'asset' ? values.isReturnable : false,
        isUnderAmc: values.itemType === 'asset' ? values.isUnderAmc : false,
        isInsuranceRequired: values.itemType === 'asset' ? values.isInsuranceRequired : false,
        inspectionNeeded: values.inspectionNeeded,
        consumableType: values.itemType === 'consumable' ? str(values.consumableType) || null : null,
        shelfBin: values.itemType === 'consumable' ? str(values.shelfBin) || null : null,
        expiryDate: values.itemType === 'consumable' ? values.expiryDate || null : null,
        batchLotNo: values.itemType === 'consumable' ? str(values.batchLotNo) || null : null,
        trackBatchLot: values.itemType === 'consumable' ? values.trackBatchLot : false,
        trackExpiry: values.itemType === 'consumable' ? values.trackExpiry : false,
        isConsumable: values.itemType === 'consumable' ? values.isConsumable : false,
        allowNegativeStock: values.itemType === 'consumable' ? values.allowNegativeStock : false,
        isActive: isActiveFromForm(values.status),
      }
      if (isNew) await createMaster('items', body)
      else await updateMaster('items', String(id), body)
      navigate('/masters/items')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (isNew && !canCreate) return <Navigate to="/masters/items" replace />
  if (loading) return <div className="text-sm text-[var(--text3)]">Loading item…</div>

  const isAsset = values.itemType === 'asset'
  const typeBadge = isAsset ? 'Fixed Asset / Equipment' : 'Stock / Consumable Material'

  return (
    <FadeContent>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <div className="text-lg font-bold tracking-[-0.3px] text-[var(--text)]">
            Item Master{' '}
            <span className="text-[13px] font-medium text-[var(--text3)]">
              — {readOnly ? 'View' : 'Add / Edit'}
            </span>
          </div>
          <div className="mt-0.5 text-[12.5px] text-[var(--text2)]">
            Select the Item Type first — the rest of the fields, including Category and Sub Category options,
            adjust based on that choice.
          </div>
        </div>
        <Button variant="ghost" onClick={() => navigate('/masters/items')}>
          Back to List
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[12px] font-semibold text-[var(--text2)]">
              Item Type <span className="text-[var(--danger)]">*</span>
            </span>
            <Select
              className="min-w-[200px]"
              value={values.itemType}
              disabled={readOnly}
              onChange={(e) => {
                const next = e.target.value as 'asset' | 'consumable'
                setValues((prev) => ({
                  ...prev,
                  itemType: next,
                  category: '',
                  subCategory: '',
                  isConsumable: next === 'consumable',
                }))
              }}
            >
              {(itemParamOpts.length
                ? itemParamOpts.map((o) => ({
                    value: itemTypeFromGenCode(o.code, o.name),
                    label: o.label,
                  }))
                : [
                    { value: 'asset' as const, label: 'Asset' },
                    { value: 'consumable' as const, label: 'Consumable' },
                  ]
              ).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <span className="rounded-md bg-[var(--accent-lt,#eef3ff)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--accent)]">
              {typeBadge}
            </span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Basic Information" subtitle="Common fields for all record types" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Item Code" required>
              <Input
                value={values.code}
                disabled={readOnly}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                placeholder="ITM-001"
              />
            </Field>
            <Field label="Item / Asset Name" required className="md:col-span-2">
              <Input
                value={values.name}
                disabled={readOnly}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Dell Latitude 5540 Laptop"
              />
            </Field>
            <Field label="Category" className="md:col-span-2">
              <Select
                value={values.category}
                disabled={readOnly}
                onChange={(e) => setValues((p) => ({ ...p, category: e.target.value, subCategory: '' }))}
              >
                <option value="">— Select Category —</option>
                {opt(categories).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sub Category" className="md:col-span-2">
              <Select
                value={values.subCategory}
                disabled={readOnly}
                onChange={(e) => set('subCategory', e.target.value)}
              >
                <option value="">— Select Sub-Category —</option>
                {opt(filteredSubs).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Unit of Measure" required>
              <Select value={values.uom} disabled={readOnly} onChange={(e) => set('uom', e.target.value)}>
                <option value="">— Select —</option>
                {opt(units).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Standard Cost (₹)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={values.standardCost}
                disabled={readOnly}
                onChange={(e) => set('standardCost', e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="Image URL">
              <Input
                type="url"
                value={values.imageUrl}
                disabled={readOnly}
                onChange={(e) => set('imageUrl', e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Item Description" className="md:col-span-2">
              <Textarea
                value={values.description}
                disabled={readOnly}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Detailed description…"
              />
            </Field>
            <Field label="Remarks" className="md:col-span-2">
              <Textarea
                value={values.remarks}
                disabled={readOnly}
                onChange={(e) => set('remarks', e.target.value)}
                placeholder="Additional remarks / notes…"
              />
            </Field>
            <div className="flex flex-wrap gap-6 pt-1 xl:col-span-4">
              <Switch label="Active" checked={values.status} disabled={readOnly} onChange={(v) => set('status', v)} />
              <Switch
                label="Inspection Needed"
                checked={values.inspectionNeeded}
                disabled={readOnly}
                onChange={(v) => set('inspectionNeeded', v)}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {isAsset ? (
        <Card>
          <CardHeader title="Asset Details" subtitle="Technical specs, depreciation and assignment" />
          <CardBody>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Asset Type" required>
                <Select
                  value={values.assetType}
                  disabled={readOnly}
                  onChange={(e) => set('assetType', e.target.value)}
                >
                  <option value="">— Select —</option>
                  {assetTypeOpts.map((t) => (
                    <option key={t.code} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Make / Brand">
                <Input
                  value={values.makeBrand}
                  disabled={readOnly}
                  onChange={(e) => set('makeBrand', e.target.value)}
                  placeholder="Dell, HP, Kirloskar"
                />
              </Field>
              <Field label="Model">
                <Input
                  value={values.model}
                  disabled={readOnly}
                  onChange={(e) => set('model', e.target.value)}
                  placeholder="Latitude 5540"
                />
              </Field>
              <Field label="Serial No.">
                <Input
                  value={values.serialNo}
                  disabled={readOnly}
                  onChange={(e) => set('serialNo', e.target.value)}
                  placeholder="SN-XXXXXXXXX"
                />
              </Field>
              <Field label="Purchase Date">
                <Input
                  type="date"
                  value={values.purchaseDate}
                  disabled={readOnly}
                  onChange={(e) => set('purchaseDate', e.target.value)}
                />
              </Field>
              <Field label="Purchase Cost (₹)">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={values.purchaseCost}
                  disabled={readOnly}
                  onChange={(e) => set('purchaseCost', e.target.value)}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Useful Life (Years)">
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={values.usefulLifeYears}
                  disabled={readOnly}
                  onChange={(e) => set('usefulLifeYears', e.target.value)}
                  placeholder="5"
                />
              </Field>
              <Field label="Warranty Expiry">
                <Input
                  type="date"
                  value={values.warrantyExpiry}
                  disabled={readOnly}
                  onChange={(e) => set('warrantyExpiry', e.target.value)}
                />
              </Field>
              <Field label="Depreciation Method">
                <Select
                  value={values.depreciationMethod}
                  disabled={readOnly}
                  onChange={(e) => set('depreciationMethod', e.target.value)}
                >
                  <option value="">— Select —</option>
                  {deprOpts.map((m) => (
                    <option key={m.code} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Depreciation Rate (%)">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={values.depreciationRate}
                  disabled={readOnly}
                  onChange={(e) => set('depreciationRate', e.target.value)}
                  placeholder="20"
                />
              </Field>
              <Field label="Assigned To (Employee)">
                <Select
                  value={values.assignedTo}
                  disabled={readOnly}
                  onChange={(e) => set('assignedTo', e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.code} – {e.firstName} {e.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Current Location">
                <Select
                  value={values.currentStore}
                  disabled={readOnly}
                  onChange={(e) => set('currentStore', e.target.value)}
                >
                  <option value="">— Assign Location —</option>
                  {opt(stores).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex flex-wrap gap-6 pt-2 xl:col-span-4">
                <Switch
                  label="Serialized"
                  checked={values.isSerialized}
                  disabled={readOnly}
                  onChange={(v) => set('isSerialized', v)}
                />
                <Switch
                  label="Returnable Asset"
                  checked={values.isReturnable}
                  disabled={readOnly}
                  onChange={(v) => set('isReturnable', v)}
                />
                <Switch
                  label="Under AMC"
                  checked={values.isUnderAmc}
                  disabled={readOnly}
                  onChange={(v) => set('isUnderAmc', v)}
                />
                <Switch
                  label="Insurance Required"
                  checked={values.isInsuranceRequired}
                  disabled={readOnly}
                  onChange={(v) => set('isInsuranceRequired', v)}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Consumable Details" subtitle="Stock levels, thresholds and tracking" />
          <CardBody>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Consumable Type" required>
                <Select
                  value={values.consumableType}
                  disabled={readOnly}
                  onChange={(e) => set('consumableType', e.target.value)}
                >
                  <option value="">— Select —</option>
                  {consumableTypeOpts.map((t) => (
                    <option key={t.code} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Storage Location">
                <Select
                  value={values.storageLocation}
                  disabled={readOnly}
                  onChange={(e) => set('storageLocation', e.target.value)}
                >
                  <option value="">— Assign Location —</option>
                  {opt(stores).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Shelf / Bin">
                <Input
                  value={values.shelfBin}
                  disabled={readOnly}
                  onChange={(e) => set('shelfBin', e.target.value)}
                  placeholder="A-12-B3"
                />
              </Field>
              <Field label="Expiry Date">
                <Input
                  type="date"
                  value={values.expiryDate}
                  disabled={readOnly}
                  onChange={(e) => set('expiryDate', e.target.value)}
                />
              </Field>
              <Field label="Batch / Lot No.">
                <Input
                  value={values.batchLotNo}
                  disabled={readOnly}
                  onChange={(e) => set('batchLotNo', e.target.value)}
                  placeholder="BATCH-001"
                />
              </Field>
              <div className="flex flex-wrap gap-6 pt-2 xl:col-span-4">
                <Switch
                  label="Track Batch / Lot"
                  checked={values.trackBatchLot}
                  disabled={readOnly}
                  onChange={(v) => set('trackBatchLot', v)}
                />
                <Switch
                  label="Track Expiry"
                  checked={values.trackExpiry}
                  disabled={readOnly}
                  onChange={(v) => set('trackExpiry', v)}
                />
                <Switch
                  label="Consumable"
                  checked={values.isConsumable}
                  disabled={readOnly}
                  onChange={(v) => set('isConsumable', v)}
                />
                <Switch
                  label="Allow Negative Stock"
                  checked={values.allowNegativeStock}
                  disabled={readOnly}
                  onChange={(v) => set('allowNegativeStock', v)}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {error && <div className="mt-3 text-sm text-[var(--danger)]">{error}</div>}
      <FormActions
        onClear={readOnly ? undefined : () => setValues(emptyItem())}
        onBack={() => navigate('/masters/items')}
        onSave={readOnly ? undefined : () => void save()}
        saveLabel={saving ? 'Saving…' : 'Save Item'}
      />
    </FadeContent>
  )
}

function ItemList() {
  const navigate = useNavigate()
  const { canCreateMenu } = useAuth()
  const mapItemStable = useCallback(mapItem, [])
  const mapCatStable = useCallback(mapCategory, [])
  const mapUnitStable = useCallback(mapUnit, [])
  const mapLocStable = useCallback(mapLocation, [])
  const { rows, loading, error } = useMasterList('items', mapItemStable)
  const { rows: categories } = useMasterList('categories', mapCatStable)
  const { rows: units } = useMasterList('units', mapUnitStable)
  const { rows: stores } = useMasterList('locations', mapLocStable)
  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])
  const uomById = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u])), [units])
  const storeById = useMemo(() => Object.fromEntries(stores.map((s) => [s.id, s])), [stores])

  const columns: Column<Item>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono font-semibold">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    {
      key: 'type',
      header: 'Type',
      searchText: (r) => r.itemType,
      render: (r) => <Pill>{r.itemType === 'consumable' ? 'Inventory' : 'Asset'}</Pill>,
    },
    {
      key: 'category',
      header: 'Category',
      searchText: (r) => catById[r.category]?.name ?? r.category,
      render: (r) => catById[r.category]?.name ?? r.category,
    },
    {
      key: 'uom',
      header: 'UOM',
      searchText: (r) => uomById[r.uom]?.code ?? r.uom,
      render: (r) => uomById[r.uom]?.code ?? r.uom,
    },
    {
      key: 'cost',
      header: 'Std. Cost (₹)',
      searchText: (r) => String(r.standardCost),
      render: (r) => Number(r.standardCost).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    },
    {
      key: 'store',
      header: 'Location',
      searchText: (r) => storeById[r.store ?? '']?.code ?? r.store ?? '',
      render: (r) => storeById[r.store ?? '']?.code ?? r.store ?? '—',
    },
    statusColumn(),
  ]

  return (
    <FadeContent>
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading items…</div>}
      <PageHeader
        title="Item Master"
        description="All registered assets and consumables."
        actions={
          canCreateMenu('AIM') ? (
            <Button onClick={() => navigate('/masters/items/new')}>Add Item</Button>
          ) : undefined
        }
      />
      <Card>
        <CardBody>
          <DataTable
            columns={columns}
            rows={rows as never}
            searchPlaceholder="Search items…"
            onRowClick={(row) => navigate(`/masters/items/${row.id}`)}
          />
        </CardBody>
      </Card>
    </FadeContent>
  )
}

export function ItemsMaster() {
  return (
    <Routes>
      <Route index element={<ItemList />} />
      <Route path=":id" element={<ItemFormPage />} />
    </Routes>
  )
}

/* ───────────────────────── Vendor Master ───────────────────────── */

type VendorForm = {
  code: string
  name: string
  partyType: string
  gstin: string
  panNo: string
  rating: string
  add1: string
  add2: string
  city: string
  state: string
  pin: string
  country: string
  contactPerson: string
  phone: string
  altPhone: string
  email: string
  website: string
  notes: string
  status: boolean
}

const emptyVendor = (): VendorForm => ({
  code: '',
  name: '',
  partyType: '',
  gstin: '',
  panNo: '',
  rating: '',
  add1: '',
  add2: '',
  city: '',
  state: '',
  pin: '',
  country: 'India',
  contactPerson: '',
  phone: '',
  altPhone: '',
  email: '',
  website: '',
  notes: '',
  status: true,
})

const STATES = [
  'Maharashtra',
  'Karnataka',
  'Delhi',
  'Gujarat',
  'Tamil Nadu',
  'Telangana',
  'Rajasthan',
  'West Bengal',
  'Other',
]

function ratingStars(n: number | string | undefined) {
  const v = Number(n)
  if (!Number.isFinite(v) || v <= 0) return '—'
  return '★'.repeat(Math.min(5, Math.max(1, Math.round(v))))
}

function VendorFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const { canCreateMenu, canEditMenu } = useAuth()
  const canCreate = canCreateMenu('VPM')
  const canEdit = canEditMenu('VPM')
  const readOnly = isNew ? !canCreate : !canEdit
  const { options: partyTypeOpts } = useGenValues(GEN_TYPE.PARTY_TYPE)
  const { options: ratingOpts } = useGenValues(GEN_TYPE.RATING, 'code')

  const [values, setValues] = useState<VendorForm>(emptyVendor)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof VendorForm>(k: K, v: VendorForm[K]) => setValues((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    if (isNew) return
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const v = await http.get<VendorApi>(`/vendors/${id}`)
        if (cancelled) return
        setValues({
          code: v.vendorCode ?? '',
          name: v.vendorName ?? '',
          partyType: v.partyType ?? '',
          gstin: v.gstin ?? '',
          panNo: v.panNo ?? '',
          rating: v.rating != null ? String(v.rating) : '',
          add1: v.add1 ?? '',
          add2: v.add2 ?? '',
          city: v.city ?? '',
          state: v.state ?? '',
          pin: v.pin ?? '',
          country: v.country || 'India',
          contactPerson: v.contactPerson ?? '',
          phone: v.phone ?? '',
          altPhone: v.altPhone ?? '',
          email: v.email ?? '',
          website: v.website ?? '',
          notes: v.notes ?? '',
          status: v.isActive !== false,
        })
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load vendor')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  const save = async () => {
    if (readOnly) return
    setSaving(true)
    setError('')
    try {
      if (!values.code.trim() || !values.name.trim() || !values.partyType || !values.phone.trim()) {
        throw new Error('Vendor Code, Name, Party Type and Phone are required')
      }
      if (!isValidIndianMobile(values.phone)) {
        throw new Error('Primary phone must be a valid 10-digit Indian mobile number')
      }
      if (values.altPhone.trim()) {
        if (!isValidIndianMobile(values.altPhone)) {
          throw new Error('Alternate phone must be a valid 10-digit Indian mobile number')
        }
        if (normalizeIndianMobile(values.phone) === normalizeIndianMobile(values.altPhone)) {
          throw new Error('Primary and alternate phone numbers cannot be the same')
        }
      }
      const panErr = validatePan(values.panNo)
      if (panErr) throw new Error(panErr)
      const body = {
        vendorCode: values.code.trim().toUpperCase(),
        vendorName: values.name.trim(),
        partyType: values.partyType,
        gstin: str(values.gstin).toUpperCase() || null,
        panNo: str(values.panNo).toUpperCase() || null,
        rating: numOrNull(values.rating),
        add1: str(values.add1) || null,
        add2: str(values.add2) || null,
        city: str(values.city) || null,
        state: str(values.state) || null,
        pin: str(values.pin) || null,
        country: str(values.country) || 'India',
        contactPerson: str(values.contactPerson) || null,
        phone: values.phone.trim(),
        altPhone: str(values.altPhone) || null,
        email: str(values.email) || null,
        website: str(values.website) || null,
        notes: str(values.notes) || null,
        isActive: isActiveFromForm(values.status),
      }
      if (isNew) await createMaster('vendors', body)
      else await updateMaster('vendors', String(id), body)
      navigate('/masters/vendors')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (isNew && !canCreate) return <Navigate to="/masters/vendors" replace />
  if (loading) return <div className="text-sm text-[var(--text3)]">Loading vendor…</div>

  return (
    <FadeContent>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <div className="text-lg font-bold tracking-[-0.3px] text-[var(--text)]">
            Vendor / Party Master{' '}
            <span className="text-[13px] font-medium text-[var(--text3)]">
              — {readOnly ? 'View' : 'Add / Edit'}
            </span>
          </div>
          <div className="mt-0.5 text-[12.5px] text-[var(--text2)]">
            Register vendors, suppliers, contractors and internal parties with contact and tax details.
          </div>
        </div>
        <Button variant="ghost" onClick={() => navigate('/masters/vendors')}>
          Back to List
        </Button>
      </div>

      <Card>
        <CardHeader title="Party Identity" subtitle="Vendor code, name, type and tax registration" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Vendor Code" required>
              <Input
                value={values.code}
                disabled={readOnly}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                placeholder="VND-001"
              />
            </Field>
            <Field label="Vendor / Party Name" required className="md:col-span-2">
              <Input
                value={values.name}
                disabled={readOnly}
                onChange={(e) => set('name', e.target.value)}
                placeholder="TechSource India Pvt Ltd"
              />
            </Field>
            <Field label="Party Type" required>
              <Select
                value={values.partyType}
                disabled={readOnly}
                onChange={(e) => set('partyType', e.target.value)}
              >
                <option value="">— Select —</option>
                {partyTypeOpts.map((t) => (
                  <option key={t.code} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="GSTIN" className="md:col-span-2">
              <Input
                value={values.gstin}
                disabled={readOnly}
                maxLength={20}
                onChange={(e) => set('gstin', e.target.value.toUpperCase())}
                placeholder="27AABCT1234A1Z5"
              />
            </Field>
            <Field
              label="PAN Number"
              hint={
                values.panNo.trim().length >= 4
                  ? panHolderType(values.panNo)
                    ? `Holder type: ${panHolderType(values.panNo)}`
                    : 'Invalid PAN format'
                  : '4th letter: I/P = Individual, C = Company, H = HUF, F = Firm'
              }
            >
              <Input
                value={values.panNo}
                disabled={readOnly}
                maxLength={10}
                onChange={(e) => set('panNo', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="ABCPI1234A"
              />
            </Field>
            <Field label="Rating (1–5)">
              <Select value={values.rating} disabled={readOnly} onChange={(e) => set('rating', e.target.value)}>
                <option value="">— No Rating —</option>
                {ratingOpts.map((r) => (
                  <option key={r.code} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Address & Contact" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Address Line 1" className="md:col-span-2">
              <Input
                value={values.add1}
                disabled={readOnly}
                onChange={(e) => set('add1', e.target.value)}
                placeholder="Building / Plot No., Street"
              />
            </Field>
            <Field label="Address Line 2" className="md:col-span-2">
              <Input
                value={values.add2}
                disabled={readOnly}
                onChange={(e) => set('add2', e.target.value)}
                placeholder="Area / Locality"
              />
            </Field>
            <Field label="City">
              <Input
                value={values.city}
                disabled={readOnly}
                onChange={(e) => set('city', e.target.value)}
                placeholder="Mumbai"
              />
            </Field>
            <Field label="State">
              <Select value={values.state} disabled={readOnly} onChange={(e) => set('state', e.target.value)}>
                <option value="">— State —</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Pincode">
              <Input
                value={values.pin}
                disabled={readOnly}
                maxLength={10}
                onChange={(e) => set('pin', e.target.value)}
                placeholder="400001"
              />
            </Field>
            <Field label="Country">
              <Input value={values.country} disabled={readOnly} onChange={(e) => set('country', e.target.value)} />
            </Field>
            <Field label="Contact Person" className="md:col-span-2">
              <Input
                value={values.contactPerson}
                disabled={readOnly}
                onChange={(e) => set('contactPerson', e.target.value)}
                placeholder="Ravi Sharma"
              />
            </Field>
            <Field label="Phone" required hint="10-digit Indian mobile">
              <Input
                type="tel"
                value={values.phone}
                disabled={readOnly}
                maxLength={13}
                onChange={(e) => set('phone', e.target.value.replace(/[^\d+]/g, ''))}
                placeholder="98XXXXXXXX"
              />
            </Field>
            <Field label="Alt. Phone" hint="Must differ from primary">
              <Input
                type="tel"
                value={values.altPhone}
                disabled={readOnly}
                maxLength={13}
                onChange={(e) => set('altPhone', e.target.value.replace(/[^\d+]/g, ''))}
                placeholder="98XXXXXXXX"
              />
            </Field>
            <Field label="Email" className="md:col-span-2">
              <Input
                type="email"
                value={values.email}
                disabled={readOnly}
                onChange={(e) => set('email', e.target.value)}
                placeholder="contact@vendor.in"
              />
            </Field>
            <Field label="Website" className="md:col-span-2">
              <Input
                type="url"
                value={values.website}
                disabled={readOnly}
                onChange={(e) => set('website', e.target.value)}
                placeholder="https://vendor.in"
              />
            </Field>
            <Field label="Notes" className="xl:col-span-4">
              <Input
                value={values.notes}
                disabled={readOnly}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Additional remarks…"
              />
            </Field>
            <div className="pt-1 xl:col-span-4">
              <Switch
                label="Active Vendor"
                checked={values.status}
                disabled={readOnly}
                onChange={(v) => set('status', v)}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {error && <div className="mt-3 text-sm text-[var(--danger)]">{error}</div>}
      <FormActions
        onClear={readOnly ? undefined : () => setValues(emptyVendor())}
        onBack={() => navigate('/masters/vendors')}
        onSave={readOnly ? undefined : () => void save()}
        saveLabel={saving ? 'Saving…' : 'Save Vendor'}
      />
    </FadeContent>
  )
}

function VendorList() {
  const navigate = useNavigate()
  const { canCreateMenu } = useAuth()
  const mapVendorStable = useCallback(mapVendor, [])
  const { rows, loading, error } = useMasterList('vendors', mapVendorStable)

  const columns: Column<Vendor>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono font-semibold">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    {
      key: 'type',
      header: 'Type',
      searchText: (r) => r.partyType,
      render: (r) => <Pill>{r.partyType}</Pill>,
    },
    { key: 'gstin', header: 'GSTIN', searchText: (r) => r.gstin, render: (r) => r.gstin || '—' },
    { key: 'phone', header: 'Phone', searchText: (r) => r.phone, render: (r) => r.phone },
    { key: 'city', header: 'City', searchText: (r) => r.city, render: (r) => r.city || '—' },
    {
      key: 'rating',
      header: 'Rating',
      searchText: (r) => String(r.rating ?? ''),
      render: (r) => ratingStars(r.rating),
    },
    statusColumn(),
  ]

  return (
    <FadeContent>
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading vendors…</div>}
      <PageHeader
        title="Vendor / Party Master"
        description="All registered vendors, suppliers and contractors."
        actions={
          canCreateMenu('VPM') ? (
            <Button onClick={() => navigate('/masters/vendors/new')}>Add Vendor</Button>
          ) : undefined
        }
      />
      <Card>
        <CardBody>
          <DataTable
            columns={columns}
            rows={rows as never}
            searchPlaceholder="Search vendors…"
            onRowClick={(row) => navigate(`/masters/vendors/${row.id}`)}
          />
        </CardBody>
      </Card>
    </FadeContent>
  )
}

export function VendorsMaster() {
  return (
    <Routes>
      <Route index element={<VendorList />} />
      <Route path=":id" element={<VendorFormPage />} />
    </Routes>
  )
}
