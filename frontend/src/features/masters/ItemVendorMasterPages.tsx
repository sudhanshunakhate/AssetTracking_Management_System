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
import { MSG, PATTERNS, RULES, validateFields } from './validation'

const URL_RE = /^https?:\/\/[^\s]+$/i

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
  ram: string
  storage: string
  processor: string
  productNo: string
  ipAddress: string
  macAddress: string
  ipAssignMode: string
  hostname: string
  assetCondition: string
  faultDesc: string
  parentItemId: string
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
  ram: '',
  storage: '',
  processor: '',
  productNo: '',
  ipAddress: '',
  macAddress: '',
  ipAssignMode: '',
  hostname: '',
  assetCondition: '',
  faultDesc: '',
  parentItemId: '',
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
  const { rows: categories } = useMasterList('categories', mapCat)
  const { rows: subCategories } = useMasterList('subcategories', mapSub)
  const { rows: units } = useMasterList('units', mapUnt)
  const { options: itemParamOpts } = useGenValues(GEN_TYPE.ITEM_PARAM, 'code')
  const { options: assetTypeOpts } = useGenValues(GEN_TYPE.ASSET_TYPE)
  const { options: consumableTypeOpts } = useGenValues(GEN_TYPE.CONSUMABLE_TYPE)
  const { options: deprOpts } = useGenValues(GEN_TYPE.DEPRECIATION)
  const mapItm = useCallback(mapItem, [])
  const { rows: allItems } = useMasterList('items', mapItm)

  const [values, setValues] = useState<ItemForm>(emptyItem)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof ItemForm>(k: K, v: ItemForm[K]) => setValues((p) => ({ ...p, [k]: v }))
  const touch = (k: string) => setTouched((prev) => (prev[k] ? prev : { ...prev, [k]: true }))

  const filteredSubs = useMemo(
    () => subCategories.filter((s) => !values.category || String(s.parentCode) === values.category),
    [subCategories, values.category],
  )

  const isAsset = values.itemType === 'asset'

  const errors = useMemo(() => {
    if (readOnly) return {} as Record<string, string>
    const bag = values as unknown as Record<string, unknown>
    const siblings = allItems.map((i) => ({ id: String(i.id), code: i.code }))
    const found = validateFields(
      [
        { name: 'code', label: 'Item Code', ...RULES.code(40), uniqueMessage: 'This Item Code is already used' },
        { name: 'name', label: 'Item / Asset Name', ...RULES.name(150) },
        { name: 'uom', label: 'Unit of Measure', required: true },
        {
          name: 'subCategory',
          label: 'Sub Category',
          validate: (v) => {
            const sub = subCategories.find((s) => String(s.id) === v)
            return sub && values.category && String(sub.parentCode) !== values.category
              ? 'Sub Category does not belong to the selected Category'
              : ''
          },
        },
        { name: 'standardCost', label: 'Standard Cost', type: 'number', min: 0, max: 99999999 },
        {
          name: 'imageUrl',
          label: 'Image URL',
          maxLength: 300,
          pattern: URL_RE,
          patternMessage: 'Enter a full URL starting with http:// or https://',
        },
        { name: 'description', label: 'Item Description', maxLength: 500 },
        { name: 'remarks', label: 'Remarks', maxLength: 250 },
      ],
      bag,
      siblings,
      id ?? 'new',
    )

    if (isAsset) {
      Object.assign(
        found,
        validateFields(
          [
            { name: 'assetType', label: 'Asset Type', required: true },
            { name: 'makeBrand', label: 'Make / Brand', maxLength: 100 },
            { name: 'model', label: 'Model', maxLength: 100 },
            { name: 'productNo', label: 'Product No.', maxLength: 100 },
            { name: 'usefulLifeYears', label: 'Useful Life (Years)', type: 'number', integer: true, min: 0, max: 50 },
            { name: 'depreciationRate', label: 'Depreciation Rate (%)', type: 'number', min: 0, max: 100 },
            { name: 'ram', label: 'RAM', maxLength: 50 },
            { name: 'storage', label: 'Storage', maxLength: 100 },
            { name: 'processor', label: 'Processor', maxLength: 100 },
          ],
          bag,
        ),
      )
    } else {
      Object.assign(
        found,
        validateFields(
          [{ name: 'consumableType', label: 'Consumable Type', required: true }],
          bag,
        ),
      )
    }
    return found
  }, [values, allItems, subCategories, id, isAsset, readOnly])

  const err = (k: string) => (submitted || touched[k] ? (errors[k] ?? '') : '')

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
          ram: it.ram ?? '',
          storage: it.storage ?? '',
          processor: it.processor ?? '',
          productNo: it.productNo ?? '',
          ipAddress: it.ipAddress ?? '',
          macAddress: it.macAddress ?? '',
          ipAssignMode: it.ipAssignMode ?? '',
          hostname: it.hostname ?? '',
          assetCondition: it.assetCondition ?? '',
          faultDesc: it.faultDesc ?? '',
          parentItemId: it.parentItemId != null ? String(it.parentItemId) : '',
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
    setSubmitted(true)
    const failed = Object.keys(errors)
    if (failed.length > 0) {
      setError(
        failed.length === 1
          ? errors[failed[0]]
          : `Please correct ${failed.length} highlighted field(s) before saving.`,
      )
      return
    }
    setSaving(true)
    setError('')
    try {
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
        // Instance-unique fields belong on stock / transactions, not the catalog item.
        serialNo: null,
        purchaseDate: null,
        purchaseCost: null,
        usefulLifeYears: values.itemType === 'asset' ? numOrNull(values.usefulLifeYears) : null,
        warrantyExpiry: null,
        depreciationMethod: values.itemType === 'asset' ? str(values.depreciationMethod) || null : null,
        depreciationRate: values.itemType === 'asset' ? numOrNull(values.depreciationRate) : null,
        assignedToEmpId: null,
        currentLocationId: null,
        isSerialized: values.itemType === 'asset' ? values.isSerialized : false,
        isReturnable: values.itemType === 'asset' ? values.isReturnable : false,
        isUnderAmc: values.itemType === 'asset' ? values.isUnderAmc : false,
        isInsuranceRequired: values.itemType === 'asset' ? values.isInsuranceRequired : false,
        inspectionNeeded: values.inspectionNeeded,
        consumableType: values.itemType === 'consumable' ? str(values.consumableType) || null : null,
        shelfBin: null,
        expiryDate: null,
        batchLotNo: null,
        trackBatchLot: values.itemType === 'consumable' ? values.trackBatchLot : false,
        trackExpiry: values.itemType === 'consumable' ? values.trackExpiry : false,
        isConsumable: values.itemType === 'consumable' ? values.isConsumable : false,
        allowNegativeStock: values.itemType === 'consumable' ? values.allowNegativeStock : false,
        ram: values.itemType === 'asset' ? str(values.ram) || null : null,
        storage: values.itemType === 'asset' ? str(values.storage) || null : null,
        processor: values.itemType === 'asset' ? str(values.processor) || null : null,
        productNo: values.itemType === 'asset' ? str(values.productNo) || null : null,
        ipAddress: null,
        macAddress: null,
        ipAssignMode: null,
        hostname: null,
        assetCondition: null,
        faultDesc: null,
        parentItemId: null,
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
            <Field label="Item Code" required error={err('code')}>
              <Input
                value={values.code}
                disabled={readOnly}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                onBlur={() => touch('code')}
                maxLength={40}
                invalid={Boolean(err('code'))}
                placeholder="ITM-001"
              />
            </Field>
            <Field label="Item / Asset Name" required error={err('name')} className="md:col-span-2">
              <Input
                value={values.name}
                disabled={readOnly}
                onChange={(e) => set('name', e.target.value)}
                onBlur={() => touch('name')}
                maxLength={150}
                invalid={Boolean(err('name'))}
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
            <Field label="Sub Category" error={err('subCategory')} className="md:col-span-2">
              <Select
                value={values.subCategory}
                disabled={readOnly}
                onChange={(e) => {
                  touch('subCategory')
                  set('subCategory', e.target.value)
                }}
                invalid={Boolean(err('subCategory'))}
              >
                <option value="">— Select Sub-Category —</option>
                {opt(filteredSubs).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Unit of Measure" required error={err('uom')}>
              <Select
                value={values.uom}
                disabled={readOnly}
                onChange={(e) => {
                  touch('uom')
                  set('uom', e.target.value)
                }}
                invalid={Boolean(err('uom'))}
              >
                <option value="">— Select —</option>
                {opt(units).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Standard Cost (₹)" error={err('standardCost')}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={values.standardCost}
                disabled={readOnly}
                onChange={(e) => set('standardCost', e.target.value)}
                onBlur={() => touch('standardCost')}
                invalid={Boolean(err('standardCost'))}
                placeholder="0.00"
              />
            </Field>
            <Field label="Image URL" error={err('imageUrl')}>
              <Input
                type="url"
                value={values.imageUrl}
                disabled={readOnly}
                onChange={(e) => set('imageUrl', e.target.value)}
                onBlur={() => touch('imageUrl')}
                maxLength={300}
                invalid={Boolean(err('imageUrl'))}
                placeholder="https://…"
              />
            </Field>
            <Field label="Item Description" error={err('description')} className="md:col-span-2">
              <Textarea
                value={values.description}
                disabled={readOnly}
                onChange={(e) => set('description', e.target.value)}
                onBlur={() => touch('description')}
                maxLength={500}
                invalid={Boolean(err('description'))}
                placeholder="Detailed description…"
              />
            </Field>
            <Field label="Remarks" error={err('remarks')} className="md:col-span-2">
              <Textarea
                value={values.remarks}
                disabled={readOnly}
                onChange={(e) => set('remarks', e.target.value)}
                onBlur={() => touch('remarks')}
                maxLength={250}
                invalid={Boolean(err('remarks'))}
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
          <CardHeader title="Asset Details" subtitle="Catalog attributes for this asset type" />
          <CardBody>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Asset Type" required error={err('assetType')}>
                <Select
                  value={values.assetType}
                  disabled={readOnly}
                  onChange={(e) => {
                    touch('assetType')
                    set('assetType', e.target.value)
                  }}
                  invalid={Boolean(err('assetType'))}
                >
                  <option value="">— Select —</option>
                  {assetTypeOpts.map((t) => (
                    <option key={t.code} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Make / Brand" error={err('makeBrand')}>
                <Input
                  value={values.makeBrand}
                  disabled={readOnly}
                  onChange={(e) => set('makeBrand', e.target.value)}
                  onBlur={() => touch('makeBrand')}
                  maxLength={100}
                  invalid={Boolean(err('makeBrand'))}
                  placeholder="Dell, HP, Kirloskar"
                />
              </Field>
              <Field label="Model" error={err('model')}>
                <Input
                  value={values.model}
                  disabled={readOnly}
                  onChange={(e) => set('model', e.target.value)}
                  onBlur={() => touch('model')}
                  maxLength={100}
                  invalid={Boolean(err('model'))}
                  placeholder="Latitude 5540"
                />
              </Field>
              <Field
                label="Product No."
                hint="Manufacturer product / model code"
                error={err('productNo')}
              >
                <Input
                  value={values.productNo}
                  disabled={readOnly}
                  onChange={(e) => set('productNo', e.target.value)}
                  onBlur={() => touch('productNo')}
                  maxLength={100}
                  invalid={Boolean(err('productNo'))}
                  placeholder="LAP_AVAIDHYA"
                />
              </Field>
              <Field label="Useful Life (Years)" error={err('usefulLifeYears')}>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={values.usefulLifeYears}
                  disabled={readOnly}
                  onChange={(e) => set('usefulLifeYears', e.target.value)}
                  onBlur={() => touch('usefulLifeYears')}
                  invalid={Boolean(err('usefulLifeYears'))}
                  placeholder="5"
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
              <Field label="Depreciation Rate (%)" error={err('depreciationRate')}>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={values.depreciationRate}
                  disabled={readOnly}
                  onChange={(e) => set('depreciationRate', e.target.value)}
                  onBlur={() => touch('depreciationRate')}
                  invalid={Boolean(err('depreciationRate'))}
                  placeholder="20"
                />
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
      ) : null}

      {isAsset ? (
        <Card>
          <CardHeader
            title="Hardware Specification"
            subtitle="Typical configuration for this item type — not a specific unit"
          />
          <CardBody>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
              <Field label="RAM" error={err('ram')}>
                <Input
                  value={values.ram}
                  disabled={readOnly}
                  onChange={(e) => set('ram', e.target.value)}
                  onBlur={() => touch('ram')}
                  maxLength={50}
                  invalid={Boolean(err('ram'))}
                  placeholder="16 GB"
                />
              </Field>
              <Field label="Storage" error={err('storage')}>
                <Input
                  value={values.storage}
                  disabled={readOnly}
                  onChange={(e) => set('storage', e.target.value)}
                  onBlur={() => touch('storage')}
                  maxLength={100}
                  invalid={Boolean(err('storage'))}
                  placeholder="512GB SSD (NVMe)"
                />
              </Field>
              <Field label="Processor" error={err('processor')}>
                <Input
                  value={values.processor}
                  disabled={readOnly}
                  onChange={(e) => set('processor', e.target.value)}
                  onBlur={() => touch('processor')}
                  maxLength={100}
                  invalid={Boolean(err('processor'))}
                  placeholder="Intel Core i5-1135G7"
                />
              </Field>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {!isAsset ? (
        <Card>
          <CardHeader title="Consumable Details" subtitle="Tracking policy for this item type" />
          <CardBody>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Consumable Type" required error={err('consumableType')}>
                <Select
                  value={values.consumableType}
                  disabled={readOnly}
                  onChange={(e) => {
                    touch('consumableType')
                    set('consumableType', e.target.value)
                  }}
                  invalid={Boolean(err('consumableType'))}
                >
                  <option value="">— Select —</option>
                  {consumableTypeOpts.map((t) => (
                    <option key={t.code} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
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
      ) : null}

      {error && <div className="mt-3 text-sm text-[var(--danger)]">{error}</div>}
      <FormActions
        onClear={
          readOnly
            ? undefined
            : () => {
                setValues(emptyItem())
                setTouched({})
                setSubmitted(false)
                setError('')
              }
        }
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
  const { rows, loading, error } = useMasterList('items', mapItemStable)
  const { rows: categories } = useMasterList('categories', mapCatStable)
  const { rows: units } = useMasterList('units', mapUnitStable)
  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])
  const uomById = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u])), [units])

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

  const mapVnd = useCallback(mapVendor, [])
  const { rows: allVendors } = useMasterList('vendors', mapVnd)

  const [values, setValues] = useState<VendorForm>(emptyVendor)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof VendorForm>(k: K, v: VendorForm[K]) => setValues((p) => ({ ...p, [k]: v }))
  const touch = (k: string) => setTouched((prev) => (prev[k] ? prev : { ...prev, [k]: true }))

  const errors = useMemo(() => {
    if (readOnly) return {} as Record<string, string>
    const bag = values as unknown as Record<string, unknown>
    const siblings = allVendors.map((v) => ({ id: String(v.id), code: v.code }))
    return validateFields(
      [
        { name: 'code', label: 'Vendor Code', ...RULES.code(20), uniqueMessage: 'This Vendor Code is already used' },
        { name: 'name', label: 'Vendor / Party Name', ...RULES.name(150) },
        { name: 'partyType', label: 'Party Type', required: true },
        {
          name: 'gstin',
          label: 'GSTIN',
          ...RULES.gstin(),
          // Characters 3–12 of a GSTIN are the holder's PAN, so the two must agree.
          validate: (v, all) => {
            const pan = String(all.panNo ?? '').trim().toUpperCase()
            return pan && v.slice(2, 12) !== pan ? 'GSTIN does not match the PAN entered' : ''
          },
        },
        { name: 'panNo', label: 'PAN', ...RULES.pan(), validate: (v) => validatePan(v) ?? '' },
        { name: 'rating', label: 'Rating', type: 'number', min: 1, max: 5 },
        { name: 'add1', label: 'Address Line 1', maxLength: 200 },
        { name: 'add2', label: 'Address Line 2', maxLength: 200 },
        { name: 'city', label: 'City', ...RULES.city() },
        { name: 'pin', label: 'Pincode', ...RULES.pincode() },
        { name: 'country', label: 'Country', ...RULES.city() },
        {
          name: 'contactPerson',
          label: 'Contact Person',
          maxLength: 80,
          pattern: PATTERNS.alphaSpace,
          patternMessage: MSG.alphaSpace,
        },
        {
          name: 'phone',
          label: 'Phone',
          required: true,
          validate: (v) => (isValidIndianMobile(v) ? '' : 'Enter a valid 10-digit Indian mobile number'),
        },
        {
          name: 'altPhone',
          label: 'Alt. Phone',
          validate: (v, all) => {
            if (!isValidIndianMobile(v)) return 'Enter a valid 10-digit Indian mobile number'
            const primary = String(all.phone ?? '')
            return normalizeIndianMobile(v) === normalizeIndianMobile(primary)
              ? 'Alt. Phone must differ from the primary phone'
              : ''
          },
        },
        { name: 'email', label: 'Email', ...RULES.email() },
        {
          name: 'website',
          label: 'Website',
          maxLength: 200,
          pattern: URL_RE,
          patternMessage: 'Enter a full URL starting with http:// or https://',
        },
        { name: 'notes', label: 'Notes', maxLength: 500 },
      ],
      bag,
      siblings,
      id ?? 'new',
    )
  }, [values, allVendors, id, readOnly])

  const err = (k: string) => (submitted || touched[k] ? (errors[k] ?? '') : '')

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
    setSubmitted(true)
    const failed = Object.keys(errors)
    if (failed.length > 0) {
      setError(
        failed.length === 1
          ? errors[failed[0]]
          : `Please correct ${failed.length} highlighted field(s) before saving.`,
      )
      return
    }
    setSaving(true)
    setError('')
    try {
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
            <Field label="Vendor Code" required error={err('code')}>
              <Input
                value={values.code}
                disabled={readOnly}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                onBlur={() => touch('code')}
                maxLength={20}
                invalid={Boolean(err('code'))}
                placeholder="VND-001"
              />
            </Field>
            <Field label="Vendor / Party Name" required error={err('name')} className="md:col-span-2">
              <Input
                value={values.name}
                disabled={readOnly}
                onChange={(e) => set('name', e.target.value)}
                onBlur={() => touch('name')}
                maxLength={150}
                invalid={Boolean(err('name'))}
                placeholder="TechSource India Pvt Ltd"
              />
            </Field>
            <Field label="Party Type" required error={err('partyType')}>
              <Select
                value={values.partyType}
                disabled={readOnly}
                onChange={(e) => {
                  touch('partyType')
                  set('partyType', e.target.value)
                }}
                invalid={Boolean(err('partyType'))}
              >
                <option value="">— Select —</option>
                {partyTypeOpts.map((t) => (
                  <option key={t.code} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="GSTIN" error={err('gstin')} className="md:col-span-2">
              <Input
                value={values.gstin}
                disabled={readOnly}
                maxLength={15}
                onChange={(e) => set('gstin', e.target.value.toUpperCase())}
                onBlur={() => touch('gstin')}
                invalid={Boolean(err('gstin'))}
                placeholder="27AABCT1234A1Z5"
              />
            </Field>
            <Field
              label="PAN Number"
              error={err('panNo')}
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
                onBlur={() => touch('panNo')}
                invalid={Boolean(err('panNo'))}
                placeholder="ABCPI1234A"
              />
            </Field>
            <Field label="Rating (1–5)" error={err('rating')}>
              <Select
                value={values.rating}
                disabled={readOnly}
                onChange={(e) => {
                  touch('rating')
                  set('rating', e.target.value)
                }}
                invalid={Boolean(err('rating'))}
              >
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
            <Field label="Address Line 1" error={err('add1')} className="md:col-span-2">
              <Input
                value={values.add1}
                disabled={readOnly}
                onChange={(e) => set('add1', e.target.value)}
                onBlur={() => touch('add1')}
                maxLength={200}
                invalid={Boolean(err('add1'))}
                placeholder="Building / Plot No., Street"
              />
            </Field>
            <Field label="Address Line 2" error={err('add2')} className="md:col-span-2">
              <Input
                value={values.add2}
                disabled={readOnly}
                onChange={(e) => set('add2', e.target.value)}
                onBlur={() => touch('add2')}
                maxLength={200}
                invalid={Boolean(err('add2'))}
                placeholder="Area / Locality"
              />
            </Field>
            <Field label="City" error={err('city')}>
              <Input
                value={values.city}
                disabled={readOnly}
                onChange={(e) => set('city', e.target.value)}
                onBlur={() => touch('city')}
                maxLength={60}
                invalid={Boolean(err('city'))}
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
            <Field label="Pincode" error={err('pin')}>
              <Input
                value={values.pin}
                disabled={readOnly}
                maxLength={6}
                onChange={(e) => set('pin', e.target.value.replace(/\D/g, ''))}
                onBlur={() => touch('pin')}
                invalid={Boolean(err('pin'))}
                placeholder="400001"
              />
            </Field>
            <Field label="Country" error={err('country')}>
              <Input
                value={values.country}
                disabled={readOnly}
                onChange={(e) => set('country', e.target.value)}
                onBlur={() => touch('country')}
                maxLength={60}
                invalid={Boolean(err('country'))}
              />
            </Field>
            <Field label="Contact Person" error={err('contactPerson')} className="md:col-span-2">
              <Input
                value={values.contactPerson}
                disabled={readOnly}
                onChange={(e) => set('contactPerson', e.target.value)}
                onBlur={() => touch('contactPerson')}
                maxLength={80}
                invalid={Boolean(err('contactPerson'))}
                placeholder="Ravi Sharma"
              />
            </Field>
            <Field label="Phone" required hint="10-digit Indian mobile" error={err('phone')}>
              <Input
                type="tel"
                value={values.phone}
                disabled={readOnly}
                maxLength={13}
                onChange={(e) => set('phone', e.target.value.replace(/[^\d+]/g, ''))}
                onBlur={() => touch('phone')}
                invalid={Boolean(err('phone'))}
                placeholder="98XXXXXXXX"
              />
            </Field>
            <Field label="Alt. Phone" hint="Must differ from primary" error={err('altPhone')}>
              <Input
                type="tel"
                value={values.altPhone}
                disabled={readOnly}
                maxLength={13}
                onChange={(e) => set('altPhone', e.target.value.replace(/[^\d+]/g, ''))}
                onBlur={() => touch('altPhone')}
                invalid={Boolean(err('altPhone'))}
                placeholder="98XXXXXXXX"
              />
            </Field>
            <Field label="Email" error={err('email')} className="md:col-span-2">
              <Input
                type="email"
                value={values.email}
                disabled={readOnly}
                onChange={(e) => set('email', e.target.value)}
                onBlur={() => touch('email')}
                maxLength={120}
                invalid={Boolean(err('email'))}
                placeholder="contact@vendor.in"
              />
            </Field>
            <Field label="Website" error={err('website')} className="md:col-span-2">
              <Input
                type="url"
                value={values.website}
                disabled={readOnly}
                onChange={(e) => set('website', e.target.value)}
                onBlur={() => touch('website')}
                maxLength={200}
                invalid={Boolean(err('website'))}
                placeholder="https://vendor.in"
              />
            </Field>
            <Field label="Notes" error={err('notes')} className="xl:col-span-4">
              <Input
                value={values.notes}
                disabled={readOnly}
                onChange={(e) => set('notes', e.target.value)}
                onBlur={() => touch('notes')}
                maxLength={500}
                invalid={Boolean(err('notes'))}
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
        onClear={
          readOnly
            ? undefined
            : () => {
                setValues(emptyVendor())
                setTouched({})
                setSubmitted(false)
                setError('')
              }
        }
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
