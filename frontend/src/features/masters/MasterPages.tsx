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
import { Field, Input, Select, Switch } from '@/components/ui/Field'
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
    { name: 'code', label: 'Unit Code', required: true, uppercase: true, hint: 'e.g. PCS, KG, GB' },
    { name: 'name', label: 'Unit Name', required: true, hint: 'e.g. Pieces, Kilogram' },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
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
    { name: 'code', label: 'Organization Code', required: true, uppercase: true },
    { name: 'name', label: 'Organization / Entity Name', required: true, span: 2 },
    { name: 'shortName', label: 'Short Name' },
    { name: 'city', label: 'City' },
    { name: 'gstin', label: 'GSTIN', uppercase: true },
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
    { name: 'code', label: 'OU Code', required: true, uppercase: true },
    { name: 'name', label: 'Operating Unit Name', required: true, span: 2 },
    { name: 'orgCode', label: 'Organization (Entity)', type: 'select', required: true, options: opt(orgs) },
    { name: 'ouType', label: 'OU Type', type: 'select', options: ouTypeOpts.map((o) => ({ value: o.value, label: o.label })) },
    { name: 'city', label: 'City' },
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
    { name: 'code', label: 'Location Code', required: true, uppercase: true },
    { name: 'name', label: 'Location Name', required: true, span: 2 },
    {
      name: 'storeType',
      label: 'Location Type',
      type: 'select',
      options: storeTypeOpts.map((o) => ({ value: o.value, label: o.label })),
    },
    { name: 'orgCode', label: 'Organization', type: 'select', required: true, options: opt(orgs) },
    { name: 'ouCode', label: 'Operating Unit', type: 'select', required: true, options: opt(ous) },
    { name: 'city', label: 'City' },
    { name: 'status', label: 'Active Location', type: 'switch', span: 4 },
  ]
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
    { name: 'code', label: 'Category Code', required: true, uppercase: true },
    { name: 'name', label: 'Category Name', required: true, span: 2 },
    { name: 'description', label: 'Description', type: 'textarea', span: 3 },
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
    { name: 'code', label: 'Sub-Category Code', required: true, uppercase: true },
    { name: 'name', label: 'Sub-Category Name', required: true, span: 2 },
    { name: 'parentCode', label: 'Parent Category', type: 'select', required: true, span: 2, options: opt(categories) },
    { name: 'description', label: 'Description', type: 'textarea', span: 3 },
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
    { name: 'code', label: 'Type Code', required: true, uppercase: true },
    { name: 'name', label: 'Type Name', required: true, span: 2 },
    { name: 'description', label: 'Description', type: 'textarea', span: 3 },
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
    { name: 'code', label: 'Value Code', required: true, uppercase: true },
    { name: 'name', label: 'Value Name', required: true, span: 2 },
    { name: 'typeCode', label: 'Parent Type', type: 'select', required: true, span: 2, options: opt(types) },
    { name: 'sortOrder', label: 'Sort Order', type: 'number' },
    { name: 'description', label: 'Description', type: 'textarea', span: 3 },
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
    { name: 'code', label: 'Role Code', required: true, uppercase: true },
    { name: 'name', label: 'Role Name', required: true, span: 2 },
    {
      name: 'level',
      label: 'Role Level',
      type: 'select',
      required: true,
      options: roleLevelOpts.map((o) => ({ value: o.value, label: o.label })),
    },
    { name: 'description', label: 'Description', span: 3 },
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
  const locById = useMemo(() => Object.fromEntries(locations.map((l) => [l.id, l])), [locations])

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
      header: 'Location',
      searchText: (r) => locById[r.locationId ?? '']?.code ?? r.locationId ?? '',
      render: (r) => locById[r.locationId ?? '']?.code ?? r.locationId ?? '—',
    },
    { key: 'acct', header: 'Account', searchText: (r) => r.accountStatus, render: (r) => r.accountStatus },
    statusColumn(),
  ]

  const empOptions = useMemo(
    () =>
      employees
        .filter((e) => !e.hasLogin || rows.some((u) => u.employeeCode === e.id))
        .map((e) => ({
          value: e.id,
          label: `${e.code} – ${e.firstName} ${e.lastName}${e.hasLogin ? '' : ' (no login)'}`,
        })),
    [employees, rows],
  )

  const fields: FieldDef[] = [
    {
      name: 'employeeCode',
      label: 'Employee',
      type: 'select',
      span: 2,
      required: true,
      options: empOptions,
      hint: 'Choose an employee who does not already have a login',
    },
    { name: 'loginId', label: 'Login ID', required: true, hint: 'e.g. firstname.lastname' },
    { name: 'role', label: 'Role', type: 'select', required: true, options: opt(roles) },
    {
      name: 'accountStatus',
      label: 'Account Status',
      type: 'select',
      options: acctStatusOpts.map((o) => ({ value: o.value, label: o.label })),
    },
    { name: 'status', label: 'Active', type: 'switch' },
  ]

  return (
    <>
      <ListStatus loading={loading} error={error} label="user access mappings" />
      <MastersRoutes
        listLoading={loading}
        base="/masters/users"
        menuCode="USR"
        title="User Access Mapping"
        description="Create or map a login to Role, Organization, Operating Unit(s) and Location."
        rows={rows as never}
        columns={columns as never}
        fields={fields}
        saveLabel="Save Access Mapping"
        formTitle="Login Identity"
        addLabel="Add New"
        allowCreate
        readOnlyFields={['employeeCode', 'loginId']}
        getDefaults={() => ({
          employeeCode: '',
          loginId: '',
          role: '',
          orgCode: '',
          ouScope: 'ALL',
          locationId: '',
          ouIds: [] as string[],
          accountStatus: 'Active',
          status: true,
          password: '',
          confirmPassword: '',
        })}
        onSave={async (id, values) => {
          const scope = String(values.ouScope ?? 'ALL')
          const rawOuIds = Array.isArray(values.ouIds) ? values.ouIds : []
          const buIds = scope === 'SELECTED'
            ? rawOuIds.map((v) => Number(v)).filter((n) => Number.isFinite(n))
            : []
          if (scope === 'SELECTED' && buIds.length === 0) {
            throw new Error('Select at least one Operating Unit when OU Access is Selected')
          }
          if (!values.employeeCode || !values.loginId || !values.role || !values.orgCode) {
            throw new Error('Employee, Login ID, Role and Organization are required')
          }

          const body = {
            employeeId: numOrUndef(values.employeeCode),
            loginId: String(values.loginId ?? '').trim().toLowerCase(),
            roleId: numOrUndef(values.role),
            entityId: numOrUndef(values.orgCode),
            buAccessScope: scope,
            locationId: numOrUndef(values.locationId) ?? null,
            accountStatus: String(values.accountStatus ?? 'Active'),
            isActive: isActiveFromForm(values.status),
          }

          let userId = id
          if (id === 'new') {
            const password = String(values.password ?? '')
            const confirmPassword = String(values.confirmPassword ?? '')
            if (!password || password.length < 8) {
              throw new Error('Password is required (min 8 characters)')
            }
            if (password !== confirmPassword) {
              throw new Error('Password and Confirm Password do not match')
            }
            const created = await createMaster<typeof body & { password: string }, { userId: number }>('users', {
              ...body,
              password,
            })
            userId = String(created.userId)
          } else {
            await updateMaster('users', id, body)
          }
          await putUserOuAccess(userId, { buAccessScope: scope, buIds })
          await reload()
        }}
        renderExtraForm={(values, set, recordId) => (
          <UserAccessMappingExtra
            values={values}
            set={set}
            recordId={recordId}
            empById={empById}
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
  orgs,
  ous,
  locations,
  ouScopeOpts,
}: {
  values: Record<string, unknown>
  set: (k: string, v: unknown) => void
  recordId: string
  empById: Record<string, ApiMasterRow>
  orgs: ApiMasterRow[]
  ous: ApiMasterRow[]
  locations: ApiMasterRow[]
  ouScopeOpts: { value: string; label: string }[]
}) {
  const isNew = recordId === 'new'
  const orgId = String(values.orgCode ?? '')
  const scope = String(values.ouScope ?? 'ALL')
  const ouIds = Array.isArray(values.ouIds) ? (values.ouIds as string[]) : []
  const orgOus = ous.filter((o) => !orgId || String(o.orgCode) === orgId)
  const orgLocs = locations.filter((l) => !orgId || String(l.orgCode) === orgId)
  const suggestedForEmp = useRef('')

  // Suggest login + role once when employee is picked on create
  useEffect(() => {
    if (!isNew) return
    const empId = String(values.employeeCode ?? '')
    if (!empId || suggestedForEmp.current === empId) return
    const emp = empById[empId]
    if (!emp) return
    suggestedForEmp.current = empId
    if (!String(values.loginId ?? '').trim()) {
      const first = String(emp.firstName ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
      const last = String(emp.lastName ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
      if (first) set('loginId', last ? `${first}.${last}` : first)
    }
    if (!values.role && emp.role) set('role', String(emp.role))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when employee selection changes
  }, [isNew, values.employeeCode, empById])

  const onOrgChange = (nextOrg: string) => {
    set('orgCode', nextOrg)
    set('ouIds', [])
    set('locationId', '')
  }

  const onScopeChange = (nextScope: string) => {
    set('ouScope', nextScope)
    if (nextScope !== 'SELECTED') set('ouIds', [])
  }

  const toggleOu = (ouId: string, on: boolean) => {
    const next = on ? [...new Set([...ouIds, ouId])] : ouIds.filter((x) => x !== ouId)
    set('ouIds', next)
  }

  return (
    <>
      {isNew && (
        <Card className="mt-3">
          <CardHeader title="Login Password" subtitle="Required when creating a new access mapping" />
          <CardBody>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Password" required hint="Min 8 characters">
                <Input
                  type="password"
                  value={String(values.password ?? '')}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="••••••••"
                />
              </Field>
              <Field label="Confirm Password" required>
                <Input
                  type="password"
                  value={String(values.confirmPassword ?? '')}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                />
              </Field>
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="mt-3">
        <CardHeader
          title="Access Mapping"
          subtitle="Map Organization, Operating Unit access and Default Location for this login"
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
              hint={scope === 'SELECTED' ? 'Pick Operating Units below' : 'ALL = every OU under the Organization'}
            >
              <Select value={scope} onChange={(e) => onScopeChange(e.target.value)}>
                {ouScopeOpts.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Default Location" hint="Optional home / default location">
              <Select
                value={String(values.locationId ?? '')}
                onChange={(e) => set('locationId', e.target.value)}
                disabled={!orgId}
              >
                <option value="">— Select Location —</option>
                {orgLocs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} – {l.name}
                  </option>
                ))}
              </Select>
            </Field>

            {scope === 'SELECTED' && (
              <Field
                label="Select Operating Unit(s)"
                required
                className="xl:col-span-4 md:col-span-2"
                hint="Login will only see data for checked Operating Units"
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
          </div>
        </CardBody>
      </Card>
    </>
  )
}

export function ExceptionsMaster() {
  const mapExStable = useCallback(mapAccessException, [])
  const mapEmpStable = useCallback(mapEmployee, [])
  const { rows, loading, error, reload } = useMasterList('access-exceptions', mapExStable)
  const { rows: employees } = useMasterList('employees', mapEmpStable)
  const { options: excTypeOpts } = useGenValues(GEN_TYPE.EXCEPTION_TYPE, 'code')

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
      required: true,
      span: 2,
      options: employees.map((e) => ({
        value: e.id,
        label: `${e.code} – ${e.firstName} ${e.lastName}`,
      })),
    },
    {
      name: 'exceptionType',
      label: 'Exception Type',
      type: 'select',
      required: true,
      options: excTypeOpts.map((o) => ({ value: o.value, label: o.label })),
    },
    { name: 'menuItem', label: 'Menu Code', required: true, span: 3 },
    { name: 'reason', label: 'Reason / Remarks', required: true, span: 2 },
    { name: 'validFrom', label: 'Valid From' },
    { name: 'validUntil', label: 'Valid Until' },
    { name: 'status', label: 'Active Exception', type: 'switch', span: 4 },
  ]
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
