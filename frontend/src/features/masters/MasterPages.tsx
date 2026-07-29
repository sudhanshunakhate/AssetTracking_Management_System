import { useCallback, useState, type ReactNode } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { Pill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { statusColumn, type Column } from '@/components/ui/DataTable'
import { Field, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { createMaster, mapCategory, mapUnit, updateMaster, useMasterList } from '@/api/masters'
import {
  employees,
  exceptions,
  generalMasters,
  generalTypes,
  inventoryCategories,
  inventorySubCategories,
  items,
  menuAccessMatrix,
  operatingUnits,
  organizations,
  roles,
  stores,
  units,
  users,
  vendors,
} from '@/data/mock'
import type {
  AccessException,
  AccessRole,
  Employee,
  GeneralMaster,
  GeneralType,
  InventoryCategory,
  InventorySubCategory,
  Item,
  OperatingUnit,
  Organization,
  Store,
  Unit,
  UserLogin,
  Vendor,
} from '@/types/masters'
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
  ) => ReactNode
  onSave?: (id: string, values: Record<string, unknown>) => Promise<void>
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
          />
        }
      />
    </Routes>
  )
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
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading units…</div>}
      <MastersRoutes
        base="/masters/units"
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
            isActive: values.status !== false,
          }
          if (id === 'new') await createMaster('units', body)
          else await updateMaster('units', id, body)
          await reload()
        }}
      />
    </>
  )
}

export function ItemsMaster() {
  const columns: Column<Item>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    { key: 'type', header: 'Type', searchText: (r) => r.itemType, render: (r) => <Pill>{r.itemType}</Pill> },
    { key: 'category', header: 'Category', searchText: (r) => r.category, render: (r) => r.category },
    { key: 'uom', header: 'UOM', searchText: (r) => r.uom, render: (r) => r.uom },
    { key: 'cost', header: 'Std Cost', searchText: (r) => String(r.standardCost), render: (r) => `₹ ${r.standardCost.toLocaleString('en-IN')}` },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'itemType', label: 'Item Type', type: 'select', required: true, options: [{ value: 'asset', label: 'Asset' }, { value: 'consumable', label: 'Consumable' }] },
    { name: 'code', label: 'Item Code', required: true, uppercase: true, hint: 'ITM-001' },
    { name: 'name', label: 'Item / Asset Name', required: true, span: 2 },
    { name: 'category', label: 'Category', type: 'select', span: 2, options: inventoryCategories.map((c) => ({ value: c.name, label: `${c.code} – ${c.name}` })) },
    { name: 'subCategory', label: 'Sub Category', type: 'select', span: 2, options: inventorySubCategories.map((c) => ({ value: c.name, label: `${c.code} – ${c.name}` })) },
    { name: 'uom', label: 'Unit of Measure', type: 'select', required: true, options: units.map((u) => ({ value: u.code, label: `${u.code} – ${u.name}` })) },
    { name: 'standardCost', label: 'Standard Cost (₹)', type: 'number' },
    { name: 'description', label: 'Item Description', type: 'textarea', span: 2 },
    { name: 'status', label: 'Active', type: 'switch', span: 4 },
  ]
  return (
    <MastersRoutes
      base="/masters/items"
      title="Item Master"
      description="All registered assets and consumables."
      rows={items}
      columns={columns as never}
      fields={fields}
      searchPlaceholder="Search item code / name…"
      saveLabel="Save Item"
      formTitle="Basic Information"
      getDefaults={() => ({ itemType: 'asset', status: true, uom: 'PCS' })}
    />
  )
}

export function VendorsMaster() {
  const columns: Column<Vendor>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    { key: 'type', header: 'Type', searchText: (r) => r.partyType, render: (r) => r.partyType },
    { key: 'city', header: 'City', searchText: (r) => r.city, render: (r) => r.city },
    { key: 'phone', header: 'Phone', searchText: (r) => r.phone, render: (r) => r.phone },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'code', label: 'Vendor Code', required: true, uppercase: true },
    { name: 'name', label: 'Vendor / Party Name', required: true, span: 2 },
    { name: 'partyType', label: 'Party Type', type: 'select', required: true, options: ['Vendor', 'Supplier', 'Customer', 'Contractor', 'Internal', 'Other'].map((v) => ({ value: v, label: v })) },
    { name: 'gstin', label: 'GSTIN', uppercase: true, span: 2 },
    { name: 'city', label: 'City' },
    { name: 'phone', label: 'Phone', required: true },
    { name: 'status', label: 'Active Vendor', type: 'switch', span: 4 },
  ]
  return (
    <MastersRoutes base="/masters/vendors" title="Vendor / Party Master" description="All registered vendors, suppliers and contractors." rows={vendors} columns={columns as never} fields={fields} searchPlaceholder="Search vendor…" saveLabel="Save Vendor" formTitle="Party Identity" />
  )
}

export function OrganizationsMaster() {
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
    <MastersRoutes base="/masters/organizations" title="Organization (Entity) Master" description="Top level legal entities under which Operating Units and Stores are defined." rows={organizations} columns={columns as never} fields={fields} saveLabel="Save Organization" formTitle="Entity Identity" />
  )
}

export function OperatingUnitsMaster() {
  const columns: Column<OperatingUnit>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    { key: 'org', header: 'Organization', searchText: (r) => r.orgName, render: (r) => r.orgName },
    { key: 'type', header: 'Type', searchText: (r) => r.ouType, render: (r) => r.ouType },
    { key: 'city', header: 'City', searchText: (r) => r.city, render: (r) => r.city },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'code', label: 'OU Code', required: true, uppercase: true },
    { name: 'name', label: 'Operating Unit Name', required: true, span: 2 },
    { name: 'orgCode', label: 'Organization (Entity)', type: 'select', required: true, options: organizations.map((o) => ({ value: o.code, label: `${o.code} – ${o.name}` })) },
    { name: 'ouType', label: 'OU Type', type: 'select', options: ['Branch', 'Region', 'Plant', 'Zone', 'Corporate', 'Other'].map((v) => ({ value: v, label: v })) },
    { name: 'city', label: 'City' },
    { name: 'status', label: 'Active', type: 'switch', span: 4 },
  ]
  return (
    <MastersRoutes base="/masters/operating-units" title="Operating Unit Master" description="Business / operating locations under each Organization (Entity)." rows={operatingUnits} columns={columns as never} fields={fields} saveLabel="Save Operating Unit" formTitle="Operating Unit Details" />
  )
}

export function StoresMaster() {
  const columns: Column<Store>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    { key: 'type', header: 'Type', searchText: (r) => r.storeType, render: (r) => r.storeType },
    { key: 'ou', header: 'OU', searchText: (r) => r.ouCode, render: (r) => r.ouCode },
    { key: 'city', header: 'City', searchText: (r) => r.city, render: (r) => r.city },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'code', label: 'Store Code', required: true, uppercase: true },
    { name: 'name', label: 'Store Name', required: true, span: 2 },
    { name: 'storeType', label: 'Store Type', type: 'select', options: ['FM', 'General Store', 'IT Store', 'Quarantine', 'Rejected', 'Warehouse'].map((v) => ({ value: v, label: v })) },
    { name: 'orgCode', label: 'Organization', type: 'select', required: true, options: organizations.map((o) => ({ value: o.code, label: `${o.code} – ${o.name}` })) },
    { name: 'ouCode', label: 'Operating Unit', type: 'select', required: true, options: operatingUnits.map((o) => ({ value: o.code, label: `${o.code} – ${o.name}` })) },
    { name: 'city', label: 'City' },
    { name: 'status', label: 'Active Store', type: 'switch', span: 4 },
  ]
  return (
    <MastersRoutes base="/masters/stores" title="Store Master" description="Stores defined entity / location-wise, mapped to an Organization and Operating Unit." rows={stores} columns={columns as never} fields={fields} saveLabel="Save Store" formTitle="Store Details" />
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
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading categories…</div>}
      <MastersRoutes
        base="/masters/inventory-categories"
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
            isActive: values.status !== false,
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
  const columns: Column<InventorySubCategory>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    { key: 'parent', header: 'Parent Category', searchText: (r) => r.parentName, render: (r) => `${r.parentCode} – ${r.parentName}` },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'code', label: 'Sub-Category Code', required: true, uppercase: true },
    { name: 'name', label: 'Sub-Category Name', required: true, span: 2 },
    { name: 'parentCode', label: 'Parent Category', type: 'select', required: true, span: 2, options: inventoryCategories.map((c) => ({ value: c.code, label: `${c.code} – ${c.name}` })) },
    { name: 'description', label: 'Description', type: 'textarea', span: 3 },
    { name: 'status', label: 'Mark as Active', type: 'switch', span: 4 },
  ]
  return (
    <MastersRoutes base="/masters/inventory-sub-categories" title="Inventory Sub-Category Master" description="Second level classification, mapped to a parent Inventory Category." rows={inventorySubCategories} columns={columns as never} fields={fields} saveLabel="Save Sub-Category" formTitle="Sub-Category Information" />
  )
}

export function GeneralTypesMaster() {
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
    <MastersRoutes base="/masters/general-types" title="General Type Master" description="Generic lookup groups used to organize General Master values." rows={generalTypes} columns={columns as never} fields={fields} saveLabel="Save Type" formTitle="Type Information" />
  )
}

export function GeneralMastersMaster() {
  const columns: Column<GeneralMaster>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => r.name, render: (r) => r.name },
    { key: 'type', header: 'Parent Type', searchText: (r) => r.typeName, render: (r) => `${r.typeCode} – ${r.typeName}` },
    { key: 'sort', header: 'Sort', searchText: (r) => String(r.sortOrder), render: (r) => r.sortOrder },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'code', label: 'Value Code', required: true, uppercase: true },
    { name: 'name', label: 'Value Name', required: true, span: 2 },
    { name: 'typeCode', label: 'Parent Type', type: 'select', required: true, span: 2, options: generalTypes.map((t) => ({ value: t.code, label: `${t.code} – ${t.name}` })) },
    { name: 'sortOrder', label: 'Sort Order', type: 'number' },
    { name: 'description', label: 'Description', type: 'textarea', span: 3 },
    { name: 'status', label: 'Mark as Active', type: 'switch', span: 4 },
  ]
  return (
    <MastersRoutes base="/masters/general-masters" title="General Master" description="Values / entries mapped to a parent General Type — used to power generic dropdowns across the system." rows={generalMasters} columns={columns as never} fields={fields} saveLabel="Save Value" formTitle="Value Information" />
  )
}

export function RolesMaster() {
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
    { name: 'level', label: 'Role Level', type: 'select', required: true, options: Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}` })) },
    { name: 'description', label: 'Description', span: 3 },
    { name: 'systemRole', label: 'System Role', type: 'switch' },
    { name: 'status', label: 'Active', type: 'switch' },
  ]
  const modules = ['Item Master', 'Vendor / Party', 'Store', 'Inventory', 'Reports', 'Admin']
  const perms = ['View', 'Create', 'Edit', 'Delete', 'Approve', 'Export']
  return (
    <MastersRoutes
      base="/masters/roles"
      title="Access Role Master"
      description="All access roles and their permission levels."
      rows={roles}
      columns={columns as never}
      fields={fields}
      saveLabel="Save Role"
      formTitle="Role Identity"
      renderExtraForm={() => (
        <Card>
          <CardHeader title="Module Permissions" subtitle="Granular access per module — check to grant" />
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-[var(--surface2)] px-3 py-2 text-left text-[10px] font-bold tracking-[0.7px] text-[var(--text3)] uppercase">Module</th>
                  {perms.map((p) => (
                    <th key={p} className="bg-[var(--surface2)] px-3 py-2 text-center text-[10px] font-bold tracking-[0.7px] text-[var(--text3)] uppercase">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m} className="hover:bg-[#f8faff]">
                    <td className="border-b border-[var(--border)] px-3 py-2.5 text-left text-[12.5px] font-semibold">{m}</td>
                    {perms.map((p) => (
                      <td key={p} className="border-b border-[var(--border)] px-3 py-2.5 text-center">
                        <input type="checkbox" defaultChecked={p === 'View'} className="accent-[var(--accent)]" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    />
  )
}

export function EmployeesMaster() {
  const columns: Column<Employee>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'name', header: 'Name', searchText: (r) => `${r.firstName} ${r.lastName}`, render: (r) => `${r.firstName} ${r.lastName}` },
    { key: 'designation', header: 'Designation', searchText: (r) => r.designation, render: (r) => r.designation },
    { key: 'dept', header: 'Department', searchText: (r) => r.department, render: (r) => r.department },
    { key: 'role', header: 'Role', searchText: (r) => r.role, render: (r) => <Pill>{r.role}</Pill> },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'code', label: 'Employee Code', required: true, uppercase: true },
    { name: 'firstName', label: 'First Name', required: true, span: 2 },
    { name: 'lastName', label: 'Last Name' },
    { name: 'designation', label: 'Designation', span: 2 },
    { name: 'department', label: 'Department', span: 2 },
    { name: 'email', label: 'Email', required: true, span: 2 },
    { name: 'role', label: 'Access Role', type: 'select', required: true, span: 2, options: roles.map((r) => ({ value: r.code, label: `${r.code} – ${r.name}` })) },
    { name: 'baseStore', label: 'Base Store', type: 'select', span: 2, options: stores.map((s) => ({ value: s.code, label: `${s.code} – ${s.name}` })) },
    { name: 'status', label: 'Active Employee', type: 'switch', span: 4 },
  ]
  return (
    <MastersRoutes base="/masters/employees" title="Employee Master" description="All system users with roles and locations." rows={employees} columns={columns as never} fields={fields} saveLabel="Save Employee" formTitle="Personal & Professional Details" />
  )
}

export function UsersMaster() {
  const columns: Column<UserLogin>[] = [
    { key: 'login', header: 'Login ID', searchText: (r) => r.loginId, render: (r) => <span className="font-mono">{r.loginId}</span> },
    { key: 'emp', header: 'Employee', searchText: (r) => r.employeeName, render: (r) => `${r.employeeCode} – ${r.employeeName}` },
    { key: 'role', header: 'Role', searchText: (r) => r.role, render: (r) => <Pill>{r.role}</Pill> },
    { key: 'org', header: 'Org', searchText: (r) => r.orgCode, render: (r) => r.orgCode },
    { key: 'acct', header: 'Account', searchText: (r) => r.accountStatus, render: (r) => r.accountStatus },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'employeeCode', label: 'Employee Mapping', type: 'select', required: true, span: 2, options: employees.map((e) => ({ value: e.code, label: `${e.code} – ${e.firstName} ${e.lastName}` })) },
    { name: 'loginId', label: 'Login ID', required: true },
    { name: 'role', label: 'Role Assignment', type: 'select', required: true, options: roles.map((r) => ({ value: r.code, label: `${r.code} – ${r.name}` })) },
    { name: 'orgCode', label: 'Organization', type: 'select', required: true, options: organizations.map((o) => ({ value: o.code, label: `${o.code} – ${o.name}` })) },
    { name: 'ouScope', label: 'OU Access', type: 'select', required: true, options: [{ value: 'All', label: 'All Operating Units' }, ...operatingUnits.map((o) => ({ value: o.code, label: `${o.code} – ${o.name}` }))] },
    { name: 'accountStatus', label: 'Account Status', type: 'select', options: ['Active', 'Locked', 'Disabled'].map((v) => ({ value: v, label: v })) },
    { name: 'status', label: 'Active', type: 'switch', span: 4 },
  ]
  return (
    <MastersRoutes base="/masters/users" title="User Login Master" description="System login credentials mapped to an Employee, Role, Organization, Operating Unit and Store." rows={users} columns={columns as never} fields={fields} saveLabel="Save User" formTitle="Login Credentials" />
  )
}

export function ExceptionsMaster() {
  const columns: Column<AccessException>[] = [
    { key: 'emp', header: 'Employee', searchText: (r) => r.employeeName, render: (r) => `${r.employeeCode} – ${r.employeeName}` },
    { key: 'type', header: 'Type', searchText: (r) => r.exceptionType, render: (r) => <Pill>{r.exceptionType}</Pill> },
    { key: 'menu', header: 'Menu Item', searchText: (r) => r.menuItem, render: (r) => r.menuItem },
    { key: 'reason', header: 'Reason', searchText: (r) => r.reason, render: (r) => r.reason },
    { key: 'until', header: 'Valid Until', searchText: (r) => r.validUntil, render: (r) => r.validUntil },
    statusColumn(),
  ]
  const fields: FieldDef[] = [
    { name: 'employeeCode', label: 'Employee', type: 'select', required: true, span: 2, options: employees.map((e) => ({ value: e.code, label: `${e.code} – ${e.firstName} ${e.lastName}` })) },
    { name: 'exceptionType', label: 'Exception Type', type: 'select', required: true, options: [{ value: 'Grant', label: 'Grant Access' }, { value: 'Revoke', label: 'Revoke Access' }] },
    { name: 'menuItem', label: 'Menu Item', required: true, span: 3 },
    { name: 'reason', label: 'Reason / Remarks', required: true, span: 2 },
    { name: 'validFrom', label: 'Valid From' },
    { name: 'validUntil', label: 'Valid Until' },
    { name: 'status', label: 'Active Exception', type: 'switch', span: 4 },
  ]
  return (
    <MastersRoutes base="/masters/exceptions" title="User Access Exception" description="Grant or revoke specific menu permissions for individual users, irrespective of their assigned role." rows={exceptions} columns={columns as never} fields={fields} saveLabel="Save Exception" formTitle="Exception Details" />
  )
}

export function MenuAccessPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState(roles[0]?.code ?? '')
  return (
    <FadeContent>
      <PageHeader
        title="User Menu Access — Role & Menu Mapping"
        description="Map which menu areas each role can open. UI-only matrix for Phase 1."
      />
      <Card>
        <CardBody>
          <div className="mb-4 max-w-sm">
            <Field label="Preview Role">
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                {roles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.code} – {r.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--surface2)]">
                  {['Role', 'Dashboard', 'Masters', 'Transactions', 'Reports', 'Admin'].map((h) => (
                    <th key={h} className="border-b-2 border-[var(--border)] px-3 py-2 text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {menuAccessMatrix.map((row) => (
                  <tr key={row.role} className={`hover:bg-[#f0f5ff] ${row.role === role ? 'bg-[var(--accent-lt)]' : ''}`}>
                    <td className="border-b border-[var(--border)] px-3 py-2 font-mono font-semibold">{row.role}</td>
                    {(['dashboard', 'masters', 'transactions', 'reports', 'admin'] as const).map((k) => (
                      <td key={k} className="border-b border-[var(--border)] px-3 py-2 text-center">
                        <input type="checkbox" checked={row[k]} readOnly className="accent-[var(--accent)]" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => navigate('/masters/roles')}>
              Open Roles
            </Button>
            <Button onClick={() => undefined}>Save Mapping</Button>
          </div>
        </CardBody>
      </Card>
    </FadeContent>
  )
}
