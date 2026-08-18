import type { ApiMasterRow } from '@/api/masters'
import { createMaster } from '@/api/masters'

export const EMPLOYEE_IMPORT_HEADERS = [
  'employeeCode*',
  'firstName*',
  'lastName',
  'email*',
  'phone',
  'designation',
  'departmentCode',
  'roleCode',
  'baseLocationCode',
  'reportingToCode',
  'employmentType',
  'gender',
  'dob',
  'joiningDate',
]

export const EMPLOYEE_IMPORT_SAMPLE = [
  'EMP-001',
  'John',
  'Doe',
  'john.doe@example.com',
  '9876543210',
  'Executive',
  'DEPT-IT',
  '',
  'STR-MAIN',
  '',
  'permanent',
  'Male',
  '1990-01-15',
  '2024-06-01',
]

type LookupCtx = {
  roles: ApiMasterRow[]
  departments: ApiMasterRow[]
  locations: ApiMasterRow[]
  employees: ApiMasterRow[]
}

function byCode(rows: ApiMasterRow[], code: string) {
  const q = code.trim().toUpperCase()
  return rows.find((r) => String(r.code ?? '').toUpperCase() === q)
}

export type EmployeeImportDraft = {
  key: string
  sourceRow: number
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  phone: string
  designation: string
  departmentCode: string
  departmentId?: number
  roleCode: string
  roleId?: number
  locationCode: string
  baseLocationId?: number
  reportingToCode: string
  reportingToEmpId?: number
  employmentType: string
  gender: string
  dob: string
  joiningDate: string
  error: string
}

export type EmployeeImportParseResult = {
  drafts: EmployeeImportDraft[]
  failed: Array<{ row: number; message: string }>
}

export type EmployeeImportResult = {
  created: number
  failed: Array<{ row: number; message: string }>
}

export function parseEmployeesFromCsv(
  rows: Record<string, string>[],
  ctx: LookupCtx,
): EmployeeImportParseResult {
  const drafts: EmployeeImportDraft[] = []
  const failed: Array<{ row: number; message: string }> = []
  const seenCodes = new Map<string, number>()

  rows.forEach((row, i) => {
    const sourceRow = i + 2
    const employeeCode = (row.employeecode ?? '').trim()
    const firstName = (row.firstname ?? '').trim()
    const email = (row.email ?? '').trim()
    const roleCode = (row.rolecode ?? '').trim()
    const deptCode = (row.departmentcode ?? '').trim()
    const locCode = (row.baselocationcode ?? '').trim()
    const repCode = (row.reportingtocode ?? '').trim()

    const role = roleCode ? byCode(ctx.roles, roleCode) : undefined
    const dept = deptCode ? byCode(ctx.departments, deptCode) : undefined
    const loc = locCode ? byCode(ctx.locations, locCode) : undefined
    const rep = repCode ? byCode(ctx.employees, repCode) : undefined

    let error = ''
    if (!employeeCode) error = 'employeeCode is required'
    else if (!firstName) error = 'firstName is required'
    else if (!email) error = 'email is required'
    else if (roleCode && !role) error = `roleCode not found: ${roleCode}`
    else if (deptCode && !dept) error = `departmentCode not found: ${deptCode}`
    else if (locCode && !loc) error = `baseLocationCode not found: ${locCode}`
    else if (repCode && !rep) error = `reportingToCode not found: ${repCode}`
    else if (byCode(ctx.employees, employeeCode)) error = `employeeCode already exists: ${employeeCode}`
    else {
      const dup = seenCodes.get(employeeCode.toUpperCase())
      if (dup) error = `Duplicate employeeCode in file (also row ${dup})`
      else seenCodes.set(employeeCode.toUpperCase(), sourceRow)
    }

    const draft: EmployeeImportDraft = {
      key: `${sourceRow}-${employeeCode || i}`,
      sourceRow,
      employeeCode,
      firstName,
      lastName: (row.lastname ?? '').trim(),
      email,
      phone: (row.phone ?? '').trim(),
      designation: (row.designation ?? '').trim(),
      departmentCode: deptCode,
      departmentId: dept ? Number(dept.id) : undefined,
      roleCode,
      roleId: role ? Number(role.id) : undefined,
      locationCode: locCode,
      baseLocationId: loc ? Number(loc.id) : undefined,
      reportingToCode: repCode,
      reportingToEmpId: rep ? Number(rep.id) : undefined,
      employmentType: (row.employmenttype ?? '').trim(),
      gender: (row.gender ?? '').trim(),
      dob: (row.dob ?? '').trim(),
      joiningDate: (row.joiningdate ?? '').trim(),
      error,
    }
    drafts.push(draft)
    if (error) failed.push({ row: sourceRow, message: error })
  })

  return { drafts, failed }
}

export async function saveEmployeesFromDrafts(
  drafts: EmployeeImportDraft[],
): Promise<EmployeeImportResult> {
  const result: EmployeeImportResult = { created: 0, failed: [] }

  for (const draft of drafts) {
    if (draft.error) {
      result.failed.push({ row: draft.sourceRow, message: draft.error })
      continue
    }
    try {
      await createMaster('employees', {
        employeeCode: draft.employeeCode,
        firstName: draft.firstName,
        lastName: draft.lastName || undefined,
        email: draft.email,
        phone: draft.phone || undefined,
        designation: draft.designation || undefined,
        departmentId: draft.departmentId,
        roleId: draft.roleId,
        baseLocationId: draft.baseLocationId,
        reportingToEmpId: draft.reportingToEmpId,
        employmentType: draft.employmentType || undefined,
        gender: draft.gender || undefined,
        dob: draft.dob || undefined,
        joiningDate: draft.joiningDate || undefined,
        isActive: true,
      })
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
