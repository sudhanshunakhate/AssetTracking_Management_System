import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LookupOption, QuickAddConfig } from '@/components/form/LookupSelect'
import {
  createMaster,
  listGenValues,
  mapEmployee,
  mapItem,
  mapLocation,
  mapUnit,
  mapVendor,
  useMasterList,
  type ApiMasterRow,
  type GenValueApi,
} from '@/api/masters'

/** Master lists every transaction form needs, with stable mapper identities. */
export function useTxnFormLookups() {
  const mapLoc = useCallback(mapLocation, [])
  const mapEmp = useCallback(mapEmployee, [])
  const mapVend = useCallback(mapVendor, [])
  const mapItm = useCallback(mapItem, [])
  const mapUnt = useCallback(mapUnit, [])
  return {
    locations: useMasterList('locations', mapLoc),
    employees: useMasterList('employees', mapEmp),
    vendors: useMasterList('vendors', mapVend),
    items: useMasterList('items', mapItm),
    units: useMasterList('units', mapUnt),
  }
}

export type GenLookup = ReturnType<typeof useGenLookup>

/** Loads a general-type value list and exposes an optimistic append for quick-add. */
export function useGenLookup(typeCode: string) {
  const [rows, setRows] = useState<GenValueApi[]>([])

  const reload = useCallback(async () => {
    try {
      setRows((await listGenValues(typeCode)) ?? [])
    } catch {
      setRows([])
    }
  }, [typeCode])

  useEffect(() => {
    void reload()
  }, [reload])

  const append = useCallback((row: GenValueApi) => setRows((p) => [...p, row]), [])
  const options = useMemo(
    () => rows.map((r) => ({ value: String(r.genmasterId), label: r.valueName })),
    [rows],
  )
  return { rows, options, append, reload }
}

export const empLabel = (e: ApiMasterRow) => `${e.code} – ${e.firstName} ${e.lastName}`.trim()
export const locLabel = (l: ApiMasterRow) => `${l.code} – ${l.name}`
export const vendorLabel = (v: ApiMasterRow) => `${v.code} – ${v.name}`

/** System stores used for quarantine / damaged / scrap / rejected stock — not operational pick lists. */
export const SPECIAL_SYSTEM_LOCATION_ROLES = new Set(['QUARANTINE', 'DAMAGED', 'SCRAP', 'REJECTED'])

export function isSpecialSystemLocation(loc: ApiMasterRow): boolean {
  const role = String(loc.systemRole ?? '').toUpperCase()
  if (SPECIAL_SYSTEM_LOCATION_ROLES.has(role)) return true
  const blob = `${loc.code ?? ''} ${loc.name ?? ''}`.toLowerCase()
  return (
    blob.includes('quarantine') ||
    blob.includes('damaged') ||
    blob.includes('scrap') ||
    blob.includes('reject')
  )
}

/** System-derived locations (global per Organization). */
export function systemLocations(rows: ApiMasterRow[]): ApiMasterRow[] {
  return rows.filter((l) => Boolean(l.isSystemLocation))
}

/** User-created operational locations (OU-specific, non-system). */
export function nonSystemLocations(rows: ApiMasterRow[]): ApiMasterRow[] {
  return rows.filter((l) => !l.isSystemLocation)
}

/** Operational pick lists — non-system locations only. */
export function operationalLocations(rows: ApiMasterRow[]): ApiMasterRow[] {
  return nonSystemLocations(rows)
}

export function systemLocationsForOrg(rows: ApiMasterRow[], entityId: string): ApiMasterRow[] {
  if (!entityId) return []
  return systemLocations(rows).filter((l) => String(l.orgCode) === String(entityId))
}

export function systemLocationsForOu(
  rows: ApiMasterRow[],
  ouId: string,
  ous: ApiMasterRow[],
): ApiMasterRow[] {
  const ou = ous.find((o) => o.id === ouId)
  if (!ou?.orgCode) return []
  return systemLocationsForOrg(rows, String(ou.orgCode))
}

export const systemLocationOptions = (rows: ApiMasterRow[]) =>
  locationOptions(systemLocations(rows))

/** Items assigned to the selected store in Item Master. */
export { itemsForLocation } from '@/api/masters'

export const employeeOptions = (rows: ApiMasterRow[]) =>
  rows.map((e) => ({ value: e.id, label: empLabel(e) }))
export const locationOptions = (rows: ApiMasterRow[]) =>
  rows.map((l) => ({ value: l.id, label: locLabel(l) }))
export const operationalLocationOptions = (rows: ApiMasterRow[]) =>
  locationOptions(nonSystemLocations(rows))
export const vendorOptions = (rows: ApiMasterRow[]) =>
  rows.map((v) => ({ value: v.id, label: vendorLabel(v) }))

/* ------------------------------------------------------- quick-add configs -- */

/** Adds a value to a general master addressed by type code. */
export function quickAddGenValue(title: string, typeCode: string, lookup: GenLookup): QuickAddConfig {
  return {
    title,
    subtitle: `Adds a value to the ${title.replace(/^Add\s+/, '')} general master.`,
    fields: [{ name: 'valueName', label: 'Name', required: true, maxLength: 80 }],
    onCreate: async (values): Promise<LookupOption> => {
      const created = await createMaster<{ valueName: string }, GenValueApi>(
        `general-types/${typeCode}/values`,
        { valueName: values.valueName.trim() },
      )
      lookup.append(created)
      return { value: String(created.genmasterId), label: created.valueName }
    },
  }
}

export function quickAddEmployee(reload: () => Promise<void>): QuickAddConfig {
  return {
    title: 'Add Employee',
    subtitle: 'Creates a minimal employee record you can complete later in Employee Master.',
    fields: [
      { name: 'employeeCode', label: 'Employee Code', required: true, uppercase: true, maxLength: 20, placeholder: 'EMP-001' },
      { name: 'firstName', label: 'First Name', required: true, maxLength: 50 },
      { name: 'lastName', label: 'Last Name', maxLength: 50 },
    ],
    onCreate: async (v): Promise<LookupOption> => {
      const created = await createMaster<Record<string, unknown>, { employeeId: number }>('employees', {
        employeeCode: v.employeeCode.trim(),
        firstName: v.firstName.trim(),
        lastName: (v.lastName ?? '').trim() || undefined,
        isActive: true,
      })
      await reload()
      return { value: String(created.employeeId), label: `${v.employeeCode} – ${v.firstName}` }
    },
  }
}

export function quickAddLocation(reload: () => Promise<void>): QuickAddConfig {
  return {
    title: 'Add Location',
    subtitle: 'Creates a minimal store/location you can complete later in Location Master.',
    fields: [
      { name: 'locationCode', label: 'Location Code', required: true, uppercase: true, maxLength: 20, placeholder: 'STR-01' },
      { name: 'locationName', label: 'Location Name', required: true, maxLength: 80 },
    ],
    onCreate: async (v): Promise<LookupOption> => {
      const created = await createMaster<Record<string, unknown>, { locationId: number }>('locations', {
        locationCode: v.locationCode.trim(),
        locationName: v.locationName.trim(),
        isActive: true,
      })
      await reload()
      return { value: String(created.locationId), label: `${v.locationCode} – ${v.locationName}` }
    },
  }
}

export function quickAddVendor(reload: () => Promise<void>): QuickAddConfig {
  return {
    title: 'Add Supplier',
    subtitle: 'Creates a minimal vendor record you can complete later in Vendor / Party Master.',
    fields: [
      { name: 'vendorCode', label: 'Supplier Code', required: true, uppercase: true, maxLength: 20, placeholder: 'VND-001' },
      { name: 'vendorName', label: 'Supplier Name', required: true, maxLength: 100 },
    ],
    onCreate: async (v): Promise<LookupOption> => {
      const created = await createMaster<Record<string, unknown>, { vendorId: number }>('vendors', {
        vendorCode: v.vendorCode.trim(),
        vendorName: v.vendorName.trim(),
        isActive: true,
      })
      await reload()
      return { value: String(created.vendorId), label: `${v.vendorCode} – ${v.vendorName}` }
    },
  }
}

/** Derive the system quarantine store for an operating unit (global per Organization). */
export function quarantineForOperatingUnit(
  ouId: string,
  locations: ApiMasterRow[],
  ous: ApiMasterRow[] = [],
): string {
  if (!ouId) return ''
  const ou = ous.find((o) => o.id === ouId)
  const entityId = ou?.orgCode ? String(ou.orgCode) : ''
  const q = systemLocationsForOrg(locations, entityId).find(
    (l) => String(l.systemRole ?? '').toUpperCase() === 'QUARANTINE',
  )
  return q?.id ?? ''
}

/** Quarantine store for the Organization of a given location. */
export function quarantineForLocation(locationId: string, locations: ApiMasterRow[]): string {
  if (!locationId) return ''
  const loc = locations.find((l) => String(l.id) === String(locationId))
  if (!loc?.orgCode) return ''
  const q = systemLocationsForOrg(locations, String(loc.orgCode)).find(
    (l) => String(l.systemRole ?? '').toUpperCase() === 'QUARANTINE',
  )
  return q?.id ?? ''
}

/** Derive document header entity/location from the first line with a location set. */
export function resolveTxnHeaderFromLines(
  lines: Array<{ locationId?: string }>,
  locations: ApiMasterRow[],
): { entityId?: number; locationId?: number } {
  const firstLineLoc = lines.find((l) => l.locationId)?.locationId
  if (!firstLineLoc) return {}
  const loc = locations.find((l) => l.id === firstLineLoc)
  const locationId = Number(firstLineLoc)
  const entityId = loc?.orgCode ? Number(loc.orgCode) : undefined
  return {
    locationId: Number.isFinite(locationId) ? locationId : undefined,
    entityId: entityId != null && Number.isFinite(entityId) ? entityId : undefined,
  }
}
