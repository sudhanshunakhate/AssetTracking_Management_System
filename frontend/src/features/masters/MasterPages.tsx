import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Pill } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { statusColumn, type Column } from '@/components/ui/DataTable'
import {
  createMaster,
  getRolePermissions,
  isActiveFromForm,
  listMenus,
  mapAccessException,
  mapBusinessUnit,
  mapCategory,
  mapEmployee,
  mapEntity,
  mapGenmaster,
  mapGentype,
  mapLocation,
  mapRole,
  mapSubcategory,
  mapUnit,
  mapUser,
  numOrUndef,
  putRolePermissions,
  putUserOuAccess,
  updateMaster,
  GEN_TYPE,
  useGenValues,
  useMasterList,
  type ApiMasterRow,
  type MenuApi,
  type RolePermissionApi,
} from '@/api/masters'
import { Field, Select, Switch } from '@/components/ui/Field'
import type {
  AccessException,
  AccessRole,
  GeneralMaster,
  GeneralType,
  InventoryCategory,
  InventorySubCategory,
  OperatingUnit,
  Organization,
  Store,
  Unit,
  UserLogin,
} from '@/types/masters'
import { useAuth } from '@/features/auth/AuthContext'
import { SimpleMasterModule, type FieldDef } from './SimpleMasterModule'
import { RULES, notBefore } from './validation'

function MastersRoutes({
  base,
  title,
  description,
  rows,
  columns,
  fields,
  searchPlaceholder,
  saveLabel,
  formTitle,
  getDefaults,
  renderExtraForm,
  onSave,
  allowCreate = true,
  readOnlyFields,
  menuCode,
  listLoading = false,
  addLabel,
  validateForm,
}: {
  base: string
  title: string
  description: string
  rows: { id: string }[]
  columns: Column<{ id: string }>[]
  fields: FieldDef[]
  searchPlaceholder?: string
  saveLabel?: string
  formTitle?: string
  getDefaults?: () => Record<string, unknown>
  renderExtraForm?: (
    values: Record<string, unknown>,
    set: (k: string, v: unknown) => void,
    recordId: string,
  ) => ReactNode
  onSave?: (id: string, values: Record<string, unknown>) => Promise<void>
  allowCreate?: boolean
  readOnlyFields?: string[]
  menuCode?: string
  listLoading?: boolean
  addLabel?: string
  validateForm?: (values: Record<string, unknown>, recordId: string) => Record<string, string>
}) {
  return (
    <Routes>
      <Route
        index
        element={
          <SimpleMasterModule
            title={title}
            description={description}
            basePath={base}
            rows={rows as never}
            columns={columns as never}
            fields={fields}
            searchPlaceholder={searchPlaceholder}
            saveLabel={saveLabel}
            formTitle={formTitle}
            getDefaults={getDefaults}
            renderExtraForm={renderExtraForm}
            onSave={onSave}
            allowCreate={allowCreate}
            readOnlyFields={readOnlyFields}
            menuCode={menuCode}
            listLoading={listLoading}
            addLabel={addLabel}
            validateForm={validateForm}
          />
        }
      />
      <Route
        path=":id"
        element={
          <SimpleMasterModule
            title={title}
            description={description}
            basePath={base}
            rows={rows as never}
            columns={columns as never}
            fields={fields}
            searchPlaceholder={searchPlaceholder}
            saveLabel={saveLabel}
            formTitle={formTitle}
            getDefaults={getDefaults}
            renderExtraForm={renderExtraForm}
            onSave={onSave}
            allowCreate={allowCreate}
            readOnlyFields={readOnlyFields}
            menuCode={menuCode}
            listLoading={listLoading}
            addLabel={addLabel}
            validateForm={validateForm}
          />
        }
      />
    </Routes>
  )
}

function ListStatus({ loading, error, label }: { loading: boolean; error: string | null; label: string }) {
  return (
    <>
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading {label}…</div>}
    </>
  )
}

function opt(rows: ApiMasterRow[], label = (r: ApiMasterRow) => `${r.code} – ${r.name}`) {
  return rows.map((r) => ({ value: r.id, label: label(r) }))
}

export function UnitsMaster() {
  const mapUnitStable = useCallback(mapUnit, [])
  const { rows, loading, error, reload } = useMasterList('units', mapUnitStable)
  const columns: Column<Unit>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    { key: 'description', header: 'Description', searchText: (r) => r.description, render: (r) => r.description },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'code', label: 'Unit Code', uppercase: true, hint: 'e.g. PCS, KG, GB', ...RULES.code(20, 1) },
    { name: 'name', label: 'Unit Name', hint: 'e.g. Pieces, Kilogram', ...RULES.name(50) },
    { name: 'description', label: 'Description', type: 'textarea', span: 2, ...RULES.text(250) },
    { name: 'status', label: 'Mark as Active', type: 'switch', span: 4 },
  ]
  return (
    <>
      <ListStatus loading={loading} error={error} label="units" />
      <MastersRoutes
        listLoading={loading}
        base="/masters/units"
        menuCode="UOM"
        title="Unit Master"
        description="All measurement units defined in the system."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        searchPlaceholder="Search unit code / name…"
        saveLabel="Save Unit"
        formTitle="Unit Information"
        onSave={async (id, values) => {
          const body = {
            unitCode: String(values.code ?? ''),
            unitName: String(values.name ?? ''),
            desc: String(values.description ?? ''),
            isActive: isActiveFromForm(values.status),
          }
          if (id === 'new') await createMaster('units', body)
          else await updateMaster('units', id, body)
          await reload()
        }}
      />
    </>
  )
}

export { ItemsMaster, VendorsMaster } from './ItemVendorMasterPages'

export function OrganizationsMaster() {
  const mapEntityStable = useCallback(mapEntity, [])
  const { rows, loading, error, reload } = useMasterList('entities', mapEntityStable)
  const columns: Column<Organization>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    { key: 'short', header: 'Short', searchText: (r) => r.shortName, render: (r) => r.shortName },
    { key: 'city', header: 'City', searchText: (r) => r.city, render: (r) => r.city },
    { key: 'gstin', header: 'GSTIN', searchText: (r) => r.gstin, render: (r) => r.gstin },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'code', label: 'Organization Code', uppercase: true, hint: 'e.g. CAITS', ...RULES.code(20) },
    { name: 'name', label: 'Organization / Entity Name', span: 2, ...RULES.name(150, 3) },
    { name: 'shortName', label: 'Short Name', ...RULES.text(30) },
    { name: 'city', label: 'City', ...RULES.city() },
    { name: 'gstin', label: 'GSTIN', uppercase: true, hint: '15-character GSTIN', ...RULES.gstin() },
    { name: 'status', label: 'Active Entity', type: 'switch', span: 4 },
  ]
  return (
    <>
      <ListStatus loading={loading} error={error} label="organizations" />
      <MastersRoutes
        listLoading={loading}
        base="/masters/organizations"
        menuCode="ORG"
        title="Organization (Entity) Master"
        description="Top level legal entities under which Operating Units and Locations are defined."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        saveLabel="Save Organization"
        formTitle="Entity Identity"
        onSave={async (id, values) => {
          const body = {
            entityCode: String(values.code ?? ''),
            entityName: String(values.name ?? ''),
            shortName: String(values.shortName ?? ''),
            city: String(values.city ?? ''),
            gstin: String(values.gstin ?? ''),
            isActive: isActiveFromForm(values.status),
          }
          if (id === 'new') await createMaster('entities', body)
          else await updateMaster('entities', id, body)
          await reload()
        }}
      />
    </>
  )
}

export function OperatingUnitsMaster() {
  const mapBuStable = useCallback(mapBusinessUnit, [])
  const mapEntityStable = useCallback(mapEntity, [])
  const { rows, loading, error, reload } = useMasterList('business-units', mapBuStable)
  const { rows: orgs } = useMasterList('entities', mapEntityStable)
  const { options: ouTypeOpts } = useGenValues(GEN_TYPE.OU_TYPE)

  const orgById = useMemo(() => Object.fromEntries(orgs.map((o) => [o.id, o])), [orgs])

  const columns: Column<OperatingUnit>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    {
      key: 'org',
      header: 'Organization',
      searchText: (r) => orgById[r.orgCode]?.name ?? r.orgCode,
      render: (r) => orgById[r.orgCode]?.name ?? r.orgCode,
    },
    { key: 'type', header: 'Type', searchText: (r) => r.ouType, render: (r) => r.ouType },
    { key: 'city', header: 'City', searchText: (r) => r.city, render: (r) => r.city },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'code', label: 'OU Code', uppercase: true, ...RULES.code(20) },
    { name: 'name', label: 'Operating Unit Name', span: 2, ...RULES.name(150, 3) },
    { name: 'orgCode', label: 'Organization (Entity)', type: 'select', options: opt(orgs), ...RULES.select() },
    { name: 'ouType', label: 'OU Type', type: 'select', options: ouTypeOpts.map((o) => ({ value: o.value, label: o.label })), ...RULES.select() },
    { name: 'city', label: 'City', ...RULES.city() },
    { name: 'status', label: 'Active', type: 'switch', span: 4 },
  ]
  return (
    <>
      <ListStatus loading={loading} error={error} label="operating units" />
      <MastersRoutes
        listLoading={loading}
        base="/masters/operating-units"
        menuCode="OU"
        title="Operating Unit Master"
        description="Business / operating locations under each Organization (Entity)."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        saveLabel="Save Operating Unit"
        formTitle="Operating Unit Details"
        onSave={async (id, values) => {
          const body = {
            buCode: String(values.code ?? ''),
            buName: String(values.name ?? ''),
            entityId: numOrUndef(values.orgCode),
            buType: String(values.ouType ?? ''),
            city: String(values.city ?? ''),
            isActive: isActiveFromForm(values.status),
          }
          if (id === 'new') await createMaster('business-units', body)
          else await updateMaster('business-units', id, body)
          await reload()
        }}
      />
    </>
  )
}

export function StoresMaster() {
  const mapLocStable = useCallback(mapLocation, [])
  const mapEntityStable = useCallback(mapEntity, [])
  const mapBuStable = useCallback(mapBusinessUnit, [])
  const { rows, loading, error, reload } = useMasterList('locations', mapLocStable)
  const { rows: orgs } = useMasterList('entities', mapEntityStable)
  const { rows: ous } = useMasterList('business-units', mapBuStable)
  const { options: storeTypeOpts } = useGenValues(GEN_TYPE.STORE_TYPE)

  const columns: Column<Store>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    { key: 'type', header: 'Type', searchText: (r) => r.storeType, render: (r) => r.storeType },
    {
      key: 'ou',
      header: 'OU',
      searchText: (r) => r.ouCode,
      render: (r) => ous.find((o) => o.id === r.ouCode)?.code ?? r.ouCode,
    },
    { key: 'city', header: 'City', searchText: (r) => r.city, render: (r) => r.city },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'code', label: 'Location Code', uppercase: true, ...RULES.code(20) },
    { name: 'name', label: 'Location Name', span: 2, ...RULES.name(150, 3) },
    {
      name: 'storeType',
      label: 'Location Type',
      type: 'select',
      options: storeTypeOpts.map((o) => ({ value: o.value, label: o.label })),
      ...RULES.select(),
    },
    { name: 'orgCode', label: 'Organization', type: 'select', options: opt(orgs), ...RULES.select() },
    { name: 'ouCode', label: 'Operating Unit', type: 'select', options: opt(ous), ...RULES.select() },
    { name: 'city', label: 'City', ...RULES.city() },
    { name: 'status', label: 'Active Location', type: 'switch', span: 4 },
  ]

  // The chosen OU has to sit under the chosen entity, otherwise the location is orphaned.
  const validateForm = useCallback(
    (values: Record<string, unknown>): Record<string, string> => {
      const orgCode = String(values.orgCode ?? '')
      const ouCode = String(values.ouCode ?? '')
      if (!orgCode || !ouCode) return {}
      const ou = ous.find((o) => String(o.id) === ouCode)
      if (ou && String(ou.orgCode) !== orgCode) {
        const org = orgs.find((o) => String(o.id) === orgCode)
        return {
          ouCode: `${ou.name} does not belong to ${org?.name ?? 'the selected organization'}`,
        }
      }
      return {}
    },
    [ous, orgs],
  )
  return (
    <>
      <ListStatus loading={loading} error={error} label="locations" />
      <MastersRoutes
        listLoading={loading}
        base="/masters/stores"
        menuCode="STR"
        title="Location Master"
        description="Locations defined entity-wise, mapped to an Organization and Operating Unit."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        saveLabel="Save Location"
        formTitle="Location Details"
        validateForm={validateForm}
        onSave={async (id, values) => {
          const body = {
            locationCode: String(values.code ?? ''),
            locationName: String(values.name ?? ''),
            locationType: String(values.storeType ?? ''),
            entityId: numOrUndef(values.orgCode),
            buId: numOrUndef(values.ouCode),
            city: String(values.city ?? ''),
            isActive: isActiveFromForm(values.status),
          }
          if (id === 'new') await createMaster('locations', body)
          else await updateMaster('locations', id, body)
          await reload()
        }}
      />
    </>
  )
}

export function InventoryCategoriesMaster() {
  const mapCategoryStable = useCallback(mapCategory, [])
  const { rows, loading, error, reload } = useMasterList('categories', mapCategoryStable)
  const columns: Column<InventoryCategory>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    { key: 'description', header: 'Description', searchText: (r) => r.description, render: (r) => r.description },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'code', label: 'Category Code', uppercase: true, hint: 'e.g. IT-HW', ...RULES.code(20) },
    { name: 'name', label: 'Category Name', span: 2, ...RULES.name(100) },
    { name: 'description', label: 'Description', type: 'textarea', span: 3, ...RULES.text(250) },
    { name: 'status', label: 'Mark as Active', type: 'switch', span: 4 },
  ]
  return (
    <>
      <ListStatus loading={loading} error={error} label="categories" />
      <MastersRoutes
        listLoading={loading}
        base="/masters/inventory-categories"
        menuCode="ICM"
        title="Inventory Category Master"
        description="Top level classification for asset & inventory items."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        saveLabel="Save Category"
        formTitle="Category Information"
        onSave={async (id, values) => {
          const body = {
            categoryCode: String(values.code ?? ''),
            categoryName: String(values.name ?? ''),
            desc: String(values.description ?? ''),
            isActive: isActiveFromForm(values.status),
          }
          if (id === 'new') await createMaster('categories', body)
          else await updateMaster('categories', id, body)
          await reload()
        }}
      />
    </>
  )
}

export function InventorySubCategoriesMaster() {
  const mapSubStable = useCallback(mapSubcategory, [])
  const mapCatStable = useCallback(mapCategory, [])
  const { rows, loading, error, reload } = useMasterList('subcategories', mapSubStable)
  const { rows: categories } = useMasterList('categories', mapCatStable)

  const columns: Column<InventorySubCategory>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    { key: 'parent', header: 'Parent Category', searchText: (r) => r.parentName, render: (r) => r.parentName || r.parentCode },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'code', label: 'Sub-Category Code', uppercase: true, ...RULES.code(20) },
    { name: 'name', label: 'Sub-Category Name', span: 2, ...RULES.name(100) },
    { name: 'parentCode', label: 'Parent Category', type: 'select', span: 2, options: opt(categories), ...RULES.select() },
    { name: 'description', label: 'Description', type: 'textarea', span: 3, ...RULES.text(250) },
    { name: 'status', label: 'Mark as Active', type: 'switch', span: 4 },
  ]
  return (
    <>
      <ListStatus loading={loading} error={error} label="sub-categories" />
      <MastersRoutes
        listLoading={loading}
        base="/masters/inventory-sub-categories"
        menuCode="ISC"
        title="Inventory Sub-Category Master"
        description="Second level classification, mapped to a parent Inventory Category."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        saveLabel="Save Sub-Category"
        formTitle="Sub-Category Information"
        onSave={async (id, values) => {
          const body = {
            subcategoryCode: String(values.code ?? ''),
            subcategoryName: String(values.name ?? ''),
            categoryId: numOrUndef(values.parentCode),
            desc: String(values.description ?? ''),
            isActive: isActiveFromForm(values.status),
          }
          if (id === 'new') await createMaster('subcategories', body)
          else await updateMaster('subcategories', id, body)
          await reload()
        }}
      />
    </>
  )
}

export function GeneralTypesMaster() {
  const mapGentypeStable = useCallback(mapGentype, [])
  const { rows, loading, error, reload } = useMasterList('general-types', mapGentypeStable)
  const columns: Column<GeneralType>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    { key: 'description', header: 'Description', searchText: (r) => r.description, render: (r) => r.description },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'code', label: 'Type Code', uppercase: true, hint: 'e.g. GTY-ASSETCOND', ...RULES.code(30, 3) },
    { name: 'name', label: 'Type Name', span: 2, ...RULES.name(100) },
    { name: 'description', label: 'Description', type: 'textarea', span: 3, ...RULES.text(250) },
    { name: 'status', label: 'Mark as Active', type: 'switch', span: 4 },
  ]
  return (
    <>
      <ListStatus loading={loading} error={error} label="general types" />
      <MastersRoutes
        listLoading={loading}
        base="/masters/general-types"
        menuCode="GTY"
        title="General Type Master"
        description="Generic lookup groups used to organize General Master values."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        saveLabel="Save Type"
        formTitle="Type Information"
        onSave={async (id, values) => {
          const body = {
            typeCode: String(values.code ?? ''),
            typeName: String(values.name ?? ''),
            desc: String(values.description ?? ''),
            isActive: isActiveFromForm(values.status),
          }
          if (id === 'new') await createMaster('general-types', body)
          else await updateMaster('general-types', id, body)
          await reload()
        }}
      />
    </>
  )
}

export function GeneralMastersMaster() {
  const mapGmStable = useCallback(mapGenmaster, [])
  const mapGtStable = useCallback(mapGentype, [])
  const { rows, loading, error, reload } = useMasterList('general-masters', mapGmStable)
  const { rows: types } = useMasterList('general-types', mapGtStable)

  const typeById = useMemo(() => Object.fromEntries(types.map((t) => [t.id, t])), [types])

  const columns: Column<GeneralMaster>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    {
      key: 'type',
      header: 'Parent Type',
      searchText: (r) => {
        const t = typeById[r.typeCode]
        return t ? `${t.code} – ${t.name}` : r.typeCode
      },
      render: (r) => {
        const t = typeById[r.typeCode]
        return t ? `${t.code} – ${t.name}` : r.typeCode
      },
    },
    { key: 'sort', header: 'Sort', searchText: (r) => String(r.sortOrder), render: (r) => r.sortOrder },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    {
      name: 'code',
      label: 'Value Code',
      uppercase: true,
      hint: 'Unique across all types, e.g. AC-INSTOCK',
      ...RULES.code(40),
    },
    { name: 'name', label: 'Value Name', span: 2, ...RULES.name(100) },
    { name: 'typeCode', label: 'Parent Type', type: 'select', span: 2, options: opt(types), ...RULES.select() },
    { name: 'sortOrder', label: 'Sort Order', type: 'number', integer: true, min: 0, max: 999 },
    { name: 'description', label: 'Description', type: 'textarea', span: 3, ...RULES.text(250) },
    { name: 'status', label: 'Mark as Active', type: 'switch', span: 4 },
  ]
  return (
    <>
      <ListStatus loading={loading} error={error} label="general masters" />
      <MastersRoutes
        listLoading={loading}
        base="/masters/general-masters"
        menuCode="GNM"
        title="General Master"
        description="Values / entries mapped to a parent General Type — used to power generic dropdowns across the system."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        saveLabel="Save Value"
        formTitle="Value Information"
        onSave={async (id, values) => {
          const body = {
            valueCode: String(values.code ?? ''),
            valueName: String(values.name ?? ''),
            gentypeId: numOrUndef(values.typeCode),
            sortOrder: numOrUndef(values.sortOrder) ?? 0,
            desc: String(values.description ?? ''),
            isActive: isActiveFromForm(values.status),
          }
          if (id === 'new') await createMaster('general-masters', body)
          else await updateMaster('general-masters', id, body)
          await reload()
        }}
      />
    </>
  )
}

export function RolesMaster() {
  const { refreshPermissions } = useAuth()
  const mapRoleStable = useCallback(mapRole, [])
  const { rows, loading, error, reload } = useMasterList('roles', mapRoleStable)
  const { options: roleLevelOpts } = useGenValues(GEN_TYPE.ROLE_LEVEL)
  const columns: Column<AccessRole>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    { key: 'level', header: 'Level', searchText: (r) => String(r.level), render: (r) => <Pill>{`L${r.level}`}</Pill> },
    { key: 'description', header: 'Description', searchText: (r) => r.description, render: (r) => r.description },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'code', label: 'Role Code', uppercase: true, hint: 'e.g. ADMIN, STORE-MGR', ...RULES.code(20) },
    { name: 'name', label: 'Role Name', span: 2, ...RULES.name(80) },
    {
      name: 'level',
      label: 'Role Level',
      type: 'select',
      options: roleLevelOpts.map((o) => ({ value: o.value, label: o.label })),
      ...RULES.select(),
    },
    { name: 'description', label: 'Description', span: 3, ...RULES.text(250) },
    { name: 'systemRole', label: 'System Role', type: 'switch' },
    { name: 'status', label: 'Active', type: 'switch' },
  ]
  return (
    <>
      <ListStatus loading={loading} error={error} label="roles" />
      <MastersRoutes
        listLoading={loading}
        base="/masters/roles"
        menuCode="ARM"
        title="Role & Menu Mapping"
        description="Define the role and grant View / Create / Edit rights for each screen on the same form."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        saveLabel="Save Role & Access"
        formTitle="Role & Menu Mapping"
        onSave={async (id, values) => {
          const body = {
            roleCode: String(values.code ?? ''),
            roleName: String(values.name ?? ''),
            roleLevel: numOrUndef(values.level) ?? 1,
            desc: String(values.description ?? ''),
            isSystemRole: Boolean(values.systemRole),
            isActive: isActiveFromForm(values.status),
          }
          let roleId = id
          if (id === 'new') {
            const created = await createMaster<typeof body, { roleId: number }>('roles', body)
            roleId = String(created.roleId)
          } else {
            await updateMaster('roles', id, body)
          }
          const matrix = values.__menuPerms as Record<string, PermFlags> | undefined
          if (matrix && roleId && roleId !== 'new') {
            const perms: RolePermissionApi[] = Object.entries(matrix).map(([module, flags]) => ({
              module,
              ...flags,
            }))
            await putRolePermissions(roleId, perms)
            await refreshPermissions()
          }
          await reload()
        }}
        renderExtraForm={(_values, set, recordId) => (
          <RoleMenuAccessPanel
            roleId={recordId === 'new' ? null : recordId}
            onMatrixChange={(matrix) => set('__menuPerms', matrix)}
          />
        )}
      />
    </>
  )
}

export { EmployeesMaster } from './EmployeeMasterPages'

export function UsersMaster() {
  const mapUserStable = useCallback(mapUser, [])
  const mapEmpStable = useCallback(mapEmployee, [])
  const mapRoleStable = useCallback(mapRole, [])
  const mapEntityStable = useCallback(mapEntity, [])
  const mapBuStable = useCallback(mapBusinessUnit, [])
  const mapLocStable = useCallback(mapLocation, [])
  const { rows, loading, error, reload } = useMasterList('users', mapUserStable)
  const { rows: employees } = useMasterList('employees', mapEmpStable)
  const { rows: roles } = useMasterList('roles', mapRoleStable)
  const { rows: orgs } = useMasterList('entities', mapEntityStable)
  const { rows: ous } = useMasterList('business-units', mapBuStable)
  const { rows: locations } = useMasterList('locations', mapLocStable)
  const { options: ouScopeOpts } = useGenValues(GEN_TYPE.OU_SCOPE, 'code')
  const { options: acctStatusOpts } = useGenValues(GEN_TYPE.ACCOUNT_STATUS)

  const empById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees])
  const roleById = useMemo(() => Object.fromEntries(roles.map((r) => [r.id, r])), [roles])
  const orgById = useMemo(() => Object.fromEntries(orgs.map((o) => [o.id, o])), [orgs])

  const columns: Column<UserLogin>[] = [
    { key: 'login', header: 'Login ID', searchText: (r) => r.loginId, render: (r) => <span className="font-mono">{r.loginId}</span> },
    {
      key: 'emp',
      header: 'Employee',
      searchText: (r) => {
        const emp = empById[r.employeeCode]
        return emp ? `${emp.code} ${emp.firstName} ${emp.lastName}` : r.employeeCode
      },
      render: (r) => {
        const emp = empById[r.employeeCode]
        return emp ? `${emp.code} – ${emp.firstName} ${emp.lastName}` : r.employeeCode
      },
    },
    {
      key: 'role',
      header: 'Role',
      searchText: (r) => roleById[r.role]?.code ?? r.role,
      render: (r) => <Pill>{roleById[r.role]?.code ?? r.role}</Pill>,
    },
    {
      key: 'org',
      header: 'Organization',
      searchText: (r) => orgById[r.orgCode]?.code ?? r.orgCode,
      render: (r) => orgById[r.orgCode]?.code ?? r.orgCode,
    },
    {
      key: 'ou',
      header: 'OU Access',
      searchText: (r) => r.ouScope,
      render: (r) => (r.ouScope === 'SELECTED' ? `Selected (${(r.ouIds ?? []).length})` : r.ouScope || 'ALL'),
    },
    {
      key: 'loc',
      header: 'Location Access',
      searchText: (r) => `${r.locationScope ?? ''} ${(r.locationIds ?? []).join(' ')}`,
      render: (r) =>
        (r.locationScope ?? 'ALL') === 'SELECTED'
          ? `Selected (${(r.locationIds ?? []).length})`
          : r.locationScope || 'ALL',
    },
    { key: 'acct', header: 'Account', searchText: (r) => r.accountStatus, render: (r) => r.accountStatus },
    statusColumn(),
  ]

  const empOptions = useMemo(
    () =>
      employees
        .filter((e) => Boolean(e.hasLogin))
        .map((e) => ({
          value: e.id,
          label: `${e.code} – ${e.firstName} ${e.lastName}`,
        })),
    [employees],
  )

  const userByEmpId = useMemo(() => {
    const map: Record<string, UserLogin> = {}
    for (const u of rows as unknown as UserLogin[]) {
      if (u.employeeCode) map[u.employeeCode] = u
    }
    return map
  }, [rows])

  const fields: FieldDef[] = [
    {
      name: 'employeeCode',
      label: 'Employee',
      type: 'select',
      span: 2,
      options: empOptions,
      hint: 'Select employee — Login ID and Role fill automatically',
      ...RULES.select(),
    },
    {
      name: 'loginId',
      label: 'Login ID',
      required: true,
      minLength: 3,
      maxLength: 60,
      hint: 'Auto-filled from selected employee',
    },
    { name: 'role', label: 'Role', type: 'select', options: opt(roles), ...RULES.select() },
    {
      name: 'accountStatus',
      label: 'Account Status',
      type: 'select',
      options: acctStatusOpts.map((o) => ({ value: o.value, label: o.label })),
      ...RULES.select(),
    },
    { name: 'status', label: 'Active', type: 'switch' },
  ]

  const validateForm = useCallback((values: Record<string, unknown>) => {
    const errors: Record<string, string> = {}
    if (!String(values.orgCode ?? '')) errors.orgCode = 'Organization is required.'
    const ouIds = Array.isArray(values.ouIds) ? values.ouIds : []
    const locIds = Array.isArray(values.locationIds) ? values.locationIds : []
    if (String(values.ouScope ?? 'ALL') === 'SELECTED' && ouIds.length === 0) {
      errors.ouIds = 'Select at least one Operating Unit when OU Access is "Selected".'
    }
    if (String(values.locationScope ?? 'ALL') === 'SELECTED' && locIds.length === 0) {
      errors.locationIds = 'Select at least one Location when Location Access is "Selected".'
    }
    return errors
  }, [])

  return (
    <>
      <ListStatus loading={loading} error={error} label="user access mappings" />
      <MastersRoutes
        listLoading={loading}
        base="/masters/users"
        menuCode="USR"
        title="User Access Mapping"
        description="Assign Organization, Operating Unit(s) and Location(s) this login can see and operate on."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        saveLabel="Save Access Mapping"
        formTitle="Login Identity"
        addLabel="Add New"
        allowCreate
        readOnlyFields={['employeeCode', 'loginId']}
        validateForm={validateForm}
        getDefaults={() => ({
          employeeCode: '',
          loginId: '',
          role: '',
          orgCode: '',
          ouScope: 'ALL',
          locationScope: 'ALL',
          locationId: '',
          ouIds: [] as string[],
          locationIds: [] as string[],
          accountStatus: 'Active',
          status: true,
          existingUserId: '',
        })}
        onSave={async (id, values) => {
          const scope = String(values.ouScope ?? 'ALL')
          const locScope = String(values.locationScope ?? 'ALL')
          const rawOuIds = Array.isArray(values.ouIds) ? values.ouIds : []
          const rawLocIds = Array.isArray(values.locationIds) ? values.locationIds : []
          const buIds = scope === 'SELECTED'
            ? rawOuIds.map((v) => Number(v)).filter((n) => Number.isFinite(n))
            : []
          const locationIds = locScope === 'SELECTED'
            ? rawLocIds.map((v) => Number(v)).filter((n) => Number.isFinite(n))
            : []
          // Default location = first assigned when SELECTED, else optional single pick
          const defaultLoc =
            locScope === 'SELECTED'
              ? (numOrUndef(values.locationId) && locationIds.includes(Number(values.locationId))
                  ? numOrUndef(values.locationId)
                  : locationIds[0] ?? null)
              : (numOrUndef(values.locationId) ?? null)

          const body = {
            employeeId: numOrUndef(values.employeeCode),
            loginId: String(values.loginId ?? '').trim().toLowerCase(),
            roleId: numOrUndef(values.role),
            entityId: numOrUndef(values.orgCode),
            buAccessScope: scope,
            locationId: defaultLoc,
            accountStatus: String(values.accountStatus ?? 'Active'),
            isActive: isActiveFromForm(values.status),
          }

          // Mapping only — login must already exist (created from Employee Master)
          let userId = id === 'new' ? String(values.existingUserId ?? '') : id
          if (!userId) {
            const existing = userByEmpId[String(values.employeeCode)]
            userId = existing?.id ? String(existing.id) : ''
          }
          if (!userId) {
            throw new Error('No login found for this employee. Create the login from Employee Master first.')
          }

          await updateMaster('users', userId, body)
          await putUserOuAccess(userId, {
            buAccessScope: scope,
            buIds,
            locationAccessScope: locScope,
            locationIds,
          })
          await reload()
        }}
        renderExtraForm={(values, set, recordId) => (
          <UserAccessMappingExtra
            values={values}
            set={set}
            recordId={recordId}
            empById={empById}
            userByEmpId={userByEmpId}
            orgs={orgs}
            ous={ous}
            locations={locations}
            ouScopeOpts={ouScopeOpts}
          />
        )}
      />
    </>
  )
}

function UserAccessMappingExtra({
  values,
  set,
  recordId,
  empById,
  userByEmpId,
  orgs,
  ous,
  locations,
  ouScopeOpts,
}: {
  values: Record<string, unknown>
  set: (k: string, v: unknown) => void
  recordId: string
  empById: Record<string, ApiMasterRow>
  userByEmpId: Record<string, UserLogin>
  orgs: ApiMasterRow[]
  ous: ApiMasterRow[]
  locations: ApiMasterRow[]
  ouScopeOpts: { value: string; label: string }[]
}) {
  const isNew = recordId === 'new'
  const orgId = String(values.orgCode ?? '')
  const scope = String(values.ouScope ?? 'ALL')
  const locScope = String(values.locationScope ?? 'ALL')
  const ouIds = Array.isArray(values.ouIds) ? (values.ouIds as string[]) : []
  const locationIds = Array.isArray(values.locationIds) ? (values.locationIds as string[]) : []
  const orgOus = ous.filter((o) => !orgId || String(o.orgCode) === orgId)
  // Locations under org; if OUs are selected, narrow to those OUs
  const orgLocs = locations.filter((l) => {
    if (orgId && String(l.orgCode) !== orgId) return false
    if (scope === 'SELECTED' && ouIds.length > 0) {
      return ouIds.includes(String(l.ouCode ?? ''))
    }
    return true
  })
  const filledForEmp = useRef('')

  // Auto-fill login identity (+ existing mapping) when employee is selected
  useEffect(() => {
    if (!isNew) return
    const empId = String(values.employeeCode ?? '')
    if (!empId || filledForEmp.current === empId) return
    const emp = empById[empId]
    const user = userByEmpId[empId]
    if (!emp && !user) return
    filledForEmp.current = empId

    if (user) {
      set('existingUserId', user.id)
      set('loginId', String(user.loginId ?? ''))
      set('role', String(user.role ?? emp?.role ?? ''))
      set('accountStatus', String(user.accountStatus ?? 'Active'))
      set('status', user.status === 'Active')
      set('orgCode', String(user.orgCode ?? ''))
      set('ouScope', String(user.ouScope ?? 'ALL'))
      set('locationScope', String(user.locationScope ?? 'ALL'))
      set('locationId', String(user.locationId ?? ''))
      set('ouIds', Array.isArray(user.ouIds) ? user.ouIds : [])
      set('locationIds', Array.isArray(user.locationIds) ? user.locationIds : [])
      return
    }

    set('existingUserId', '')
    const first = String(emp?.firstName ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
    const last = String(emp?.lastName ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
    set('loginId', first ? (last ? `${first}.${last}` : first) : '')
    if (emp?.role) set('role', String(emp.role))
    if (emp?.baseStore) set('locationId', String(emp.baseStore))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when employee selection changes
  }, [isNew, values.employeeCode, empById, userByEmpId])

  const onOrgChange = (nextOrg: string) => {
    set('orgCode', nextOrg)
    set('ouIds', [])
    set('locationIds', [])
    set('locationId', '')
  }

  const onScopeChange = (nextScope: string) => {
    set('ouScope', nextScope)
    if (nextScope !== 'SELECTED') set('ouIds', [])
    // Re-filter locations when OU scope changes
    set('locationIds', [])
    if (locScope === 'SELECTED') set('locationId', '')
  }

  const onLocScopeChange = (nextScope: string) => {
    set('locationScope', nextScope)
    if (nextScope !== 'SELECTED') {
      set('locationIds', [])
    }
  }

  const toggleOu = (ouId: string, on: boolean) => {
    const next = on ? [...new Set([...ouIds, ouId])] : ouIds.filter((x) => x !== ouId)
    set('ouIds', next)
    // Drop location picks that no longer belong to remaining OUs
    if (scope === 'SELECTED') {
      const allowed = new Set(
        locations
          .filter((l) => (!orgId || String(l.orgCode) === orgId) && next.includes(String(l.ouCode ?? '')))
          .map((l) => l.id),
      )
      const kept = locationIds.filter((id) => allowed.has(id))
      set('locationIds', kept)
      if (values.locationId && !allowed.has(String(values.locationId))) set('locationId', kept[0] ?? '')
    }
  }

  const toggleLoc = (locId: string, on: boolean) => {
    const next = on ? [...new Set([...locationIds, locId])] : locationIds.filter((x) => x !== locId)
    set('locationIds', next)
    if (!next.includes(String(values.locationId ?? ''))) {
      set('locationId', next[0] ?? '')
    }
  }

  return (
    <Card className="mt-3">
      <CardHeader
        title="Access Mapping"
        subtitle="Multi-select Operating Units and Locations this login can see and operate on"
      />
      <CardBody>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Organization" required className="md:col-span-2">
            <Select value={orgId} onChange={(e) => onOrgChange(e.target.value)}>
              <option value="">— Select Organization —</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} – {o.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="OU Access"
            required
            hint={scope === 'SELECTED' ? 'Pick one or more Operating Units below' : 'ALL = every OU under the Organization'}
          >
            <Select value={scope} onChange={(e) => onScopeChange(e.target.value)}>
              {ouScopeOpts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Location Access"
            required
            hint={locScope === 'SELECTED' ? 'Pick one or more Locations below' : 'ALL = every Location under the Organization / OUs'}
          >
            <Select value={locScope} onChange={(e) => onLocScopeChange(e.target.value)}>
              {ouScopeOpts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value === 'ALL' ? 'All Locations' : o.value === 'SELECTED' ? 'Selected Locations' : o.label}
                </option>
              ))}
            </Select>
          </Field>

          {scope === 'SELECTED' && (
            <Field
              label="Select Operating Unit(s)"
              required
              className="xl:col-span-4 md:col-span-2"
              hint="User can see / operate data for checked Operating Units only"
            >
              <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">
                {!orgId ? (
                  <span className="text-xs text-[var(--text3)]">Select Organization first</span>
                ) : orgOus.length === 0 ? (
                  <span className="text-xs text-[var(--text3)]">No Operating Units for this Organization</span>
                ) : (
                  orgOus.map((o) => (
                    <Switch
                      key={o.id}
                      label={`${o.code} – ${o.name}`}
                      checked={ouIds.includes(o.id)}
                      onChange={(v) => toggleOu(o.id, v)}
                    />
                  ))
                )}
              </div>
            </Field>
          )}

          {locScope === 'SELECTED' && (
            <Field
              label="Select Location(s)"
              required
              className="xl:col-span-4 md:col-span-2"
              hint="User can see / operate data for checked Locations only"
            >
              <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">
                {!orgId ? (
                  <span className="text-xs text-[var(--text3)]">Select Organization first</span>
                ) : orgLocs.length === 0 ? (
                  <span className="text-xs text-[var(--text3)]">
                    {scope === 'SELECTED' && ouIds.length === 0
                      ? 'Select Operating Unit(s) first'
                      : 'No Locations available for current Organization / OU selection'}
                  </span>
                ) : (
                  orgLocs.map((l) => (
                    <Switch
                      key={l.id}
                      label={`${l.code} – ${l.name}`}
                      checked={locationIds.includes(l.id)}
                      onChange={(v) => toggleLoc(l.id, v)}
                    />
                  ))
                )}
              </div>
            </Field>
          )}

          <Field
            label="Default Location"
            className="md:col-span-2"
            hint={locScope === 'SELECTED' ? 'Home location among the selected ones' : 'Optional home / default location'}
          >
            <Select
              value={String(values.locationId ?? '')}
              onChange={(e) => set('locationId', e.target.value)}
              disabled={!orgId || (locScope === 'SELECTED' && locationIds.length === 0)}
            >
              <option value="">— Select Location —</option>
              {(locScope === 'SELECTED' ? orgLocs.filter((l) => locationIds.includes(l.id)) : orgLocs).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} – {l.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </CardBody>
    </Card>
  )
}

export function ExceptionsMaster() {
  const mapExStable = useCallback(mapAccessException, [])
  const mapEmpStable = useCallback(mapEmployee, [])
  const { rows, loading, error, reload } = useMasterList('access-exceptions', mapExStable)
  const { rows: employees } = useMasterList('employees', mapEmpStable)
  const { options: excTypeOpts } = useGenValues(GEN_TYPE.EXCEPTION_TYPE, 'code')
  const [menus, setMenus] = useState<MenuApi[]>([])

  useEffect(() => {
    let cancelled = false
    void listMenus()
      .then((list) => {
        if (!cancelled) setMenus((list ?? []).filter((m) => m.menuCode !== 'MNU'))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  const empById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees])

  const columns: Column<AccessException>[] = [
    {
      key: 'emp',
      header: 'Employee',
      searchText: (r) => {
        const emp = empById[r.employeeCode]
        return emp ? `${emp.code} ${emp.firstName} ${emp.lastName}` : r.employeeCode
      },
      render: (r) => {
        const emp = empById[r.employeeCode]
        return emp ? `${emp.code} – ${emp.firstName} ${emp.lastName}` : r.employeeCode
      },
    },
    { key: 'type', header: 'Type', searchText: (r) => r.exceptionType, render: (r) => <Pill>{r.exceptionType}</Pill> },
    { key: 'menu', header: 'Menu Item', searchText: (r) => r.menuItem, render: (r) => r.menuItem },
    { key: 'reason', header: 'Reason', searchText: (r) => r.reason, render: (r) => r.reason },
    { key: 'until', header: 'Valid Until', searchText: (r) => r.validUntil, render: (r) => r.validUntil },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    {
      name: 'employeeCode',
      label: 'Employee',
      type: 'select',
      span: 2,
      options: employees.map((e) => ({
        value: e.id,
        label: `${e.code} – ${e.firstName} ${e.lastName}`,
      })),
      ...RULES.select(),
    },
    {
      name: 'exceptionType',
      label: 'Exception Type',
      type: 'select',
      options: excTypeOpts.map((o) => ({ value: o.value, label: o.label })),
      ...RULES.select(),
    },
    {
      name: 'menuItem',
      label: 'Menu Code',
      type: 'select',
      span: 3,
      options: menus.map((m) => ({ value: m.menuCode, label: `${m.menuCode} – ${m.menuLabel}` })),
      ...RULES.select(),
    },
    {
      name: 'reason',
      label: 'Reason / Remarks',
      span: 2,
      required: true,
      minLength: 5,
      maxLength: 250,
      hint: 'Why this user needs the exception',
    },
    { name: 'validFrom', label: 'Valid From', type: 'date' },
    {
      name: 'validUntil',
      label: 'Valid Until',
      type: 'date',
      validate: notBefore('validFrom', 'Valid From'),
    },
    { name: 'status', label: 'Active Exception', type: 'switch', span: 4 },
  ]

  // One live exception per employee + menu + type; a second row would make the effective right ambiguous.
  const validateForm = useCallback(
    (values: Record<string, unknown>, recordId: string): Record<string, string> => {
      const emp = String(values.employeeCode ?? '')
      const menu = String(values.menuItem ?? '')
      const type = String(values.exceptionType ?? '')
      if (!emp || !menu || !type) return {}
      const clash = rows.some(
        (r) =>
          String(r.id) !== recordId &&
          String(r.employeeCode) === emp &&
          String(r.menuItem).toUpperCase() === menu.toUpperCase() &&
          String(r.exceptionType).toUpperCase() === type.toUpperCase(),
      )
      return clash
        ? { menuItem: `A "${type}" exception on ${menu} already exists for this employee` }
        : {}
    },
    [rows],
  )
  return (
    <>
      <ListStatus loading={loading} error={error} label="access exceptions" />
      <MastersRoutes
        listLoading={loading}
        base="/masters/exceptions"
        menuCode="UAE"
        title="User Access Exception"
        description="Grant or revoke specific menu permissions for individual users, irrespective of their assigned role."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        saveLabel="Save Exception"
        formTitle="Exception Details"
        validateForm={validateForm}
        onSave={async (id, values) => {
          const body = {
            employeeId: numOrUndef(values.employeeCode),
            exceptionType: String(values.exceptionType ?? 'Grant'),
            menuCode: String(values.menuItem ?? ''),
            reason: String(values.reason ?? ''),
            validFrom: String(values.validFrom || '') || null,
            validUntil: String(values.validUntil || '') || null,
            isActive: isActiveFromForm(values.status),
          }
          if (id === 'new') await createMaster('access-exceptions', body)
          else await updateMaster('access-exceptions', id, body)
          await reload()
        }}
      />
    </>
  )
}

type PermFlags = {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  canReject: boolean
  canPrint: boolean
  canExport: boolean
}

const PERM_COLS: { key: keyof PermFlags; label: string; supportKey: keyof MenuApi }[] = [
  { key: 'canView', label: 'View', supportKey: 'supportsView' },
  { key: 'canCreate', label: 'Create', supportKey: 'supportsCreate' },
  { key: 'canEdit', label: 'Edit', supportKey: 'supportsEdit' },
  { key: 'canDelete', label: 'Delete', supportKey: 'supportsDelete' },
  { key: 'canApprove', label: 'Approve', supportKey: 'supportsApprove' },
  { key: 'canReject', label: 'Reject', supportKey: 'supportsReject' },
  { key: 'canPrint', label: 'Print', supportKey: 'supportsPrint' },
  { key: 'canExport', label: 'Export', supportKey: 'supportsExport' },
]

function emptyPerms(): PermFlags {
  return {
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canReject: false,
    canPrint: false,
    canExport: false,
  }
}

function menuSupports(menu: MenuApi, supportKey: keyof MenuApi): boolean {
  const v = menu[supportKey]
  // If support flag missing, allow the checkbox so Edit/Create stay assignable.
  if (v === undefined || v === null) return true
  return Boolean(v)
}

function RoleMenuAccessPanel({
  roleId,
  onMatrixChange,
  readOnly = false,
}: {
  roleId: string | null
  onMatrixChange: (matrix: Record<string, PermFlags>) => void
  readOnly?: boolean
}) {
  const [menus, setMenus] = useState<MenuApi[]>([])
  const [matrix, setMatrix] = useState<Record<string, PermFlags>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await listMenus()
        // Menu Access is merged into Role & Menu Mapping — hide standalone MNU row.
        const filtered = (list ?? []).filter((m) => m.menuCode !== 'MNU')
        if (!cancelled) setMenus(filtered)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load menus')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const next: Record<string, PermFlags> = {}
        for (const m of menus) next[m.menuCode] = emptyPerms()
        if (roleId) {
          const perms = await getRolePermissions(roleId)
          if (cancelled) return
          for (const p of perms ?? []) {
            if (p.module === 'MNU') continue
            next[p.module] = {
              canView: Boolean(p.canView),
              canCreate: Boolean(p.canCreate),
              canEdit: Boolean(p.canEdit),
              canDelete: Boolean(p.canDelete),
              canApprove: Boolean(p.canApprove),
              canReject: Boolean(p.canReject),
              canPrint: Boolean(p.canPrint),
              canExport: Boolean(p.canExport),
            }
          }
        }
        if (cancelled) return
        setMatrix(next)
        onMatrixChange(next)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load permissions')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // Intentionally omit onMatrixChange to avoid reload loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId, menus])

  const grouped = useMemo(() => {
    const map = new Map<string, MenuApi[]>()
    for (const m of menus) {
      const g = m.menuGroup || 'Other'
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(m)
    }
    return [...map.entries()]
  }, [menus])

  const applyMatrix = (updater: (prev: Record<string, PermFlags>) => Record<string, PermFlags>) => {
    setMatrix((prev) => {
      const next = updater(prev)
      onMatrixChange(next)
      return next
    })
  }

  const toggle = (menuCode: string, key: keyof PermFlags) => {
    if (readOnly) return
    applyMatrix((prev) => ({
      ...prev,
      [menuCode]: {
        ...(prev[menuCode] ?? emptyPerms()),
        [key]: !(prev[menuCode]?.[key] ?? false),
      },
    }))
  }

  const toggleColumn = (col: (typeof PERM_COLS)[number], checked: boolean) => {
    if (readOnly) return
    applyMatrix((prev) => {
      const next = { ...prev }
      for (const m of menus) {
        if (!menuSupports(m, col.supportKey)) continue
        next[m.menuCode] = {
          ...(next[m.menuCode] ?? emptyPerms()),
          [col.key]: checked,
        }
      }
      return next
    })
  }

  const columnAllChecked = (col: (typeof PERM_COLS)[number]) => {
    const eligible = menus.filter((m) => menuSupports(m, col.supportKey))
    return eligible.length > 0 && eligible.every((m) => Boolean(matrix[m.menuCode]?.[col.key]))
  }

  return (
    <Card>
      <CardHeader
        title="Menu Access"
        subtitle={
          roleId
            ? 'Grant View / Create / Edit and other rights for this role. Header checkboxes apply to all screens.'
            : 'Set screen rights now — they are saved together with the new role.'
        }
      />
      <CardBody>
        {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
        {loading ? (
          <div className="text-sm text-[var(--text3)]">Loading menu access…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--surface2)]">
                  <th className="border-b-2 border-[var(--border)] px-3 py-2 text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase">
                    Menu
                  </th>
                  <th className="border-b-2 border-[var(--border)] px-3 py-2 text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase">
                    Code
                  </th>
                  {PERM_COLS.map((c) => (
                    <th
                      key={c.key}
                      className="border-b-2 border-[var(--border)] px-3 py-2 text-center text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{c.label}</span>
                        <input
                          type="checkbox"
                          className="accent-[var(--accent)]"
                          title={`Toggle ${c.label} for all screens`}
                          checked={columnAllChecked(c)}
                          disabled={readOnly}
                          onChange={(e) => toggleColumn(c, e.target.checked)}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grouped.map(([group, items]) => (
                  <Fragment key={`g-${group}`}>
                    <tr>
                      <td
                        colSpan={2 + PERM_COLS.length}
                        className="bg-[var(--surface2)] px-3 py-2 text-[11px] font-bold tracking-[0.4px] text-[var(--text2)] uppercase"
                      >
                        {group}
                      </td>
                    </tr>
                    {items.map((m) => (
                      <tr key={m.menuCode} className="hover:bg-[#f0f5ff]">
                        <td className="border-b border-[var(--border)] px-3 py-2 font-medium">{m.menuLabel}</td>
                        <td className="border-b border-[var(--border)] px-3 py-2 font-mono">{m.menuCode}</td>
                        {PERM_COLS.map((c) => {
                          const supported = menuSupports(m, c.supportKey)
                          return (
                            <td key={c.key} className="border-b border-[var(--border)] px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                className="accent-[var(--accent)]"
                                checked={supported && Boolean(matrix[m.menuCode]?.[c.key])}
                                disabled={readOnly || !supported}
                                onChange={() => toggle(m.menuCode, c.key)}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

/** @deprecated Merged into Role & Menu Mapping — redirects for old bookmarks. */
export function MenuAccessPage() {
  return <Navigate to="/masters/roles" replace />
}
