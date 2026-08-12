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
  'roleCode*',
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
  'ADMIN',
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

export type EmployeeImportResult = {
  created: number
  failed: Array<{ row: number; message: string }>
}

export async function importEmployeesFromCsv(
  rows: Record<string, string>[],
  ctx: LookupCtx,
): Promise<EmployeeImportResult> {
  const result: EmployeeImportResult = { created: 0, failed: [] }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2
    try {
      const employeeCode = (row.employeecode ?? '').trim()
      const firstName = (row.firstname ?? '').trim()
      const email = (row.email ?? '').trim()
      const roleCode = (row.rolecode ?? '').trim()

      if (!employeeCode) throw new Error('employeeCode is required')
      if (!firstName) throw new Error('firstName is required')
      if (!email) throw new Error('email is required')
      if (!roleCode) throw new Error('roleCode is required')

      const role = byCode(ctx.roles, roleCode)
      if (!role) throw new Error(`roleCode not found: ${roleCode}`)

      const deptCode = (row.departmentcode ?? '').trim()
      const dept = deptCode ? byCode(ctx.departments, deptCode) : undefined
      if (deptCode && !dept) throw new Error(`departmentCode not found: ${deptCode}`)

      const locCode = (row.baselocationcode ?? '').trim()
      const loc = locCode ? byCode(ctx.locations, locCode) : undefined
      if (locCode && !loc) throw new Error(`baseLocationCode not found: ${locCode}`)

      const repCode = (row.reportingtocode ?? '').trim()
      const rep = repCode ? byCode(ctx.employees, repCode) : undefined
      if (repCode && !rep) throw new Error(`reportingToCode not found: ${repCode}`)

      await createMaster('employees', {
        employeeCode,
        firstName,
        lastName: (row.lastname ?? '').trim() || undefined,
        email,
        phone: (row.phone ?? '').trim() || undefined,
        designation: (row.designation ?? '').trim() || undefined,
        departmentId: dept ? Number(dept.id) : undefined,
        roleId: Number(role.id),
        baseLocationId: loc ? Number(loc.id) : undefined,
        reportingToEmpId: rep ? Number(rep.id) : undefined,
        employmentType: (row.employmenttype ?? '').trim() || undefined,
        gender: (row.gender ?? '').trim() || undefined,
        dob: (row.dob ?? '').trim() || undefined,
        joiningDate: (row.joiningdate ?? '').trim() || undefined,
        isActive: true,
      })
      result.created += 1
    } catch (e) {
      result.failed.push({
        row: rowNum,
        message: e instanceof Error ? e.message : 'Import failed',
      })
    }
  }

  return result
}
