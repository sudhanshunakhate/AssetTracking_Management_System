import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { Pill } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DataTable, statusColumn, type Column } from '@/components/ui/DataTable'
import { Field, Input, Select, Switch } from '@/components/ui/Field'
import { FormActions, PageHeader } from '@/components/ui/PageHeader'
import {
  createMaster,
  GEN_TYPE,
  isActiveFromForm,
  mapEmployee,
  mapEntity,
  mapLocation,
  mapRole,
  mapDepartment,
  numOrUndef,
  updateMaster,
  useGenValues,
  useMasterList,
  type EmployeeApi,
} from '@/api/masters'
import { http } from '@/api/client'
import type { Employee } from '@/types/masters'
import { useAuth } from '@/features/auth/AuthContext'
import { confirmClearForm, scrollToFirstInvalid } from '@/lib/csvExport'
import { MSG, PATTERNS, RULES, notBefore, validateFields } from './validation'
import { CsvImportButton } from '@/components/ui/CsvImportButton'
import {
  EMPLOYEE_IMPORT_HEADERS,
  EMPLOYEE_IMPORT_SAMPLE,
  parseEmployeesFromCsv,
  saveEmployeesFromDrafts,
  type EmployeeImportDraft,
  type EmployeeImportResult,
} from './employeeCsvImport'

const LOGIN_ID = /^[a-z0-9][a-z0-9._-]*$/

function checkDob(value: string): string {
  const dob = new Date(`${value}T00:00:00`)
  if (Number.isNaN(dob.getTime())) return 'Enter a valid Date of Birth'
  const today = new Date()
  if (dob > today) return 'Date of Birth cannot be in the future'
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1
  if (age < 15) return 'Employee must be at least 15 years old'
  if (age > 100) return 'Enter a valid Date of Birth'
  return ''
}

function checkPasswordStrength(value: string): string {
  if (!/[a-z]/.test(value)) return 'Password needs at least one lowercase letter'
  if (!/[A-Z]/.test(value)) return 'Password needs at least one uppercase letter'
  if (!/[0-9]/.test(value)) return 'Password needs at least one number'
  if (!/[^A-Za-z0-9]/.test(value)) return 'Password needs at least one symbol'
  return ''
}

function suggestLogin(firstName: string, lastName: string) {
  const first = firstName.trim().toLowerCase().replace(/\s+/g, '')
  const last = lastName.trim().toLowerCase().replace(/\s+/g, '')
  if (!first) return ''
  return last ? `${first}.${last}` : first
}

type EmpFormState = {
  code: string
  firstName: string
  lastName: string
  gender: string
  dob: string
  joiningDate: string
  employmentType: string
  designation: string
  departmentId: string
  email: string
  phone: string
  altPhone: string
  loginRole: string
  baseStore: string
  reportingTo: string
  status: boolean
  createLogin: boolean
  loginId: string
  password: string
  confirmPassword: string
  entityId: string
  loginIdTouched: boolean
}

const emptyForm = (): EmpFormState => ({
  code: '',
  firstName: '',
  lastName: '',
  gender: '',
  dob: '',
  joiningDate: '',
  employmentType: 'permanent',
  designation: '',
  departmentId: '',
  email: '',
  phone: '',
  altPhone: '',
  loginRole: '',
  baseStore: '',
  reportingTo: '',
  status: true,
  createLogin: true,
  loginId: '',
  password: '',
  confirmPassword: '',
  entityId: '',
  loginIdTouched: false,
})

function EmployeeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const { canCreateMenu, canEditMenu } = useAuth()
  const canCreate = canCreateMenu('EMP')
  const canEdit = canEditMenu('EMP')
  const readOnly = isNew ? !canCreate : !canEdit
  const mapRoleStable = useCallback(mapRole, [])
  const mapLocStable = useCallback(mapLocation, [])
  const mapEmpStable = useCallback(mapEmployee, [])
  const mapEntityStable = useCallback(mapEntity, [])
  const { rows: roles } = useMasterList('roles', mapRoleStable)
  const { rows: stores } = useMasterList('locations', mapLocStable)
  const { rows: employees } = useMasterList('employees', mapEmpStable)
  const { rows: entities } = useMasterList('entities', mapEntityStable)
  const mapDeptStable = useCallback(mapDepartment, [])
  const { rows: departments } = useMasterList('departments', mapDeptStable)
  const { options: genderOpts } = useGenValues(GEN_TYPE.GENDER, 'code')
  const { options: employmentOpts } = useGenValues(GEN_TYPE.EMPLOYMENT_TYPE, 'code')

  const [values, setValues] = useState<EmpFormState>(emptyForm)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hasLogin, setHasLogin] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof EmpFormState>(k: K, v: EmpFormState[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }))
  const touch = (k: string) => setTouched((prev) => (prev[k] ? prev : { ...prev, [k]: true }))

  useEffect(() => {
    if (isNew) {
      setValues((prev) => ({
        ...prev,
        entityId: prev.entityId || entities[0]?.id || '',
      }))
      return
    }
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const emp = await http.get<EmployeeApi>(`/employees/${id}`)
        if (cancelled) return
        setHasLogin(Boolean(emp.hasLogin))
        setValues({
          code: emp.employeeCode ?? '',
          firstName: emp.firstName ?? '',
          lastName: emp.lastName ?? '',
          gender: emp.gender ?? '',
          dob: emp.dob ?? '',
          joiningDate: emp.joiningDate ?? '',
          employmentType: emp.employmentType ?? 'permanent',
          designation: emp.designation ?? '',
          departmentId: emp.departmentId != null ? String(emp.departmentId) : '',
          email: emp.email ?? '',
          phone: emp.phone ?? '',
          altPhone: emp.altPhone ?? '',
          loginRole: emp.roleId != null ? String(emp.roleId) : '',
          baseStore: emp.baseLocationId != null ? String(emp.baseLocationId) : '',
          reportingTo: emp.reportingToEmpId != null ? String(emp.reportingToEmpId) : '',
          status: emp.isActive !== false,
          createLogin: false,
          loginId: '',
          password: '',
          confirmPassword: '',
          entityId: entities[0]?.id ?? '',
          loginIdTouched: true,
        })
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load employee')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isNew, entities])

  const managerOptions = useMemo(
    () =>
      employees
        .filter((e) => e.id !== id)
        .map((e) => ({
          value: e.id,
          label: `${e.code} – ${e.firstName} ${e.lastName}`.trim(),
        })),
    [employees, id],
  )

  const showLoginFields = values.createLogin && (isNew || !hasLogin)

  const errors = useMemo(() => {
    if (readOnly) return {} as Record<string, string>
    const bag = values as unknown as Record<string, unknown>
    const siblings = employees.map((e) => ({ id: e.id, code: e.code, email: e.email }))
    const found = validateFields(
      [
        { name: 'code', label: 'Employee Code', ...RULES.code(20), uniqueMessage: 'This Employee Code is already used' },
        {
          name: 'firstName',
          label: 'First Name',
          required: true,
          minLength: 2,
          maxLength: 50,
          pattern: PATTERNS.alphaSpace,
          patternMessage: MSG.alphaSpace,
        },
        {
          name: 'lastName',
          label: 'Last Name',
          minLength: 2,
          maxLength: 50,
          pattern: PATTERNS.alphaSpace,
          patternMessage: MSG.alphaSpace,
        },
        { name: 'dob', label: 'Date of Birth', type: 'date', validate: checkDob },
        {
          name: 'joiningDate',
          label: 'Joining Date',
          type: 'date',
          validate: notBefore('dob', 'Date of Birth'),
        },
        { name: 'designation', label: 'Designation', maxLength: 80 },
        {
          name: 'email',
          label: 'Email',
          ...RULES.email(true),
          unique: true,
          uniqueMessage: 'This email is already used by another employee',
        },
        { name: 'phone', label: 'Phone', ...RULES.phone() },
        {
          name: 'altPhone',
          label: 'Alt. Phone',
          ...RULES.phone(),
          validate: (v, all) =>
            v === String(all.phone ?? '').trim() ? 'Alt. Phone must differ from Phone' : '',
        },
      ],
      bag,
      siblings,
      id ?? 'new',
    )

    if (showLoginFields) {
      Object.assign(
        found,
        validateFields(
          [
            {
              name: 'loginId',
              label: 'Login ID',
              required: true,
              minLength: 3,
              maxLength: 60,
              pattern: LOGIN_ID,
              patternMessage: 'Use lowercase letters, digits, dot, dash or underscore',
            },
            {
              name: 'password',
              label: 'Password',
              required: true,
              minLength: 8,
              maxLength: 72,
              validate: checkPasswordStrength,
            },
            {
              name: 'confirmPassword',
              label: 'Confirm Password',
              required: true,
              validate: (v, all) => (v === String(all.password ?? '') ? '' : 'Passwords do not match'),
            },
            { name: 'entityId', label: 'Organization', required: true },
            { name: 'loginRole', label: 'Role for Login', required: true },
          ],
          bag,
        ),
      )
    }
    return found
  }, [values, employees, id, showLoginFields, readOnly])

  const err = (k: string) => (submitted || touched[k] ? (errors[k] ?? '') : '')

  const onNameChange = (field: 'firstName' | 'lastName', value: string) => {
    setValues((prev) => {
      const next = { ...prev, [field]: value }
      if (!prev.loginIdTouched && (isNew || (!hasLogin && prev.createLogin))) {
        next.loginId = suggestLogin(
          field === 'firstName' ? value : prev.firstName,
          field === 'lastName' ? value : prev.lastName,
        )
      }
      return next
    })
  }

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
      scrollToFirstInvalid()
      return
    }
    setSaving(true)
    setError('')
    try {
      const createLogin = Boolean(values.createLogin) && (isNew || !hasLogin)
      const body = {
        employeeCode: values.code.trim().toUpperCase(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim() || null,
        gender: values.gender || null,
        dob: values.dob || null,
        joiningDate: values.joiningDate || null,
        employmentType: values.employmentType || null,
        email: values.email.trim(),
        phone: values.phone.trim() || null,
        altPhone: values.altPhone.trim() || null,
        designation: values.designation.trim() || null,
        departmentId: numOrUndef(values.departmentId),
        roleId: createLogin ? numOrUndef(values.loginRole) : null,
        baseLocationId: numOrUndef(values.baseStore),
        reportingToEmpId: numOrUndef(values.reportingTo),
        isActive: isActiveFromForm(values.status),
        createLogin,
        loginId: createLogin ? values.loginId.trim().toLowerCase() || null : null,
        password: createLogin ? values.password : null,
        confirmPassword: createLogin ? values.confirmPassword : null,
        entityId: createLogin ? numOrUndef(values.entityId) : null,
      }

      if (isNew) await createMaster('employees', body)
      else await updateMaster('employees', String(id), body)
      navigate('/masters/employees')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (isNew && !canCreate) {
    return <Navigate to="/masters/employees" replace />
  }

  if (loading) {
    return <div className="text-sm text-[var(--text3)]">Loading employee…</div>
  }

  return (
    <FadeContent>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <div className="text-lg font-bold tracking-[-0.3px] text-[var(--text)]">
            Employee Master{' '}
            <span className="text-[13px] font-medium text-[var(--text3)]">
              — {readOnly ? 'View' : 'Add / Edit'}
            </span>
          </div>
          <div className="mt-0.5 text-[12.5px] text-[var(--text2)]">
            Onboard system users with role assignment, base location and reporting hierarchy.
          </div>
          {readOnly && (
            <div className="mt-1 text-[12px] text-[var(--danger)]">
              You do not have Edit permission for this screen. Ask an admin to grant Edit on Role & Menu Mapping.
            </div>
          )}
        </div>
        <Button variant="ghost" onClick={() => navigate('/masters/employees')}>
          Back to List
        </Button>
      </div>

      <Card>
        <CardHeader title="Personal Information" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Employee Code" required error={err('code')}>
              <Input
                value={values.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                onBlur={() => touch('code')}
                maxLength={20}
                invalid={Boolean(err('code'))}
                placeholder="EMP-001"
                disabled={readOnly}
              />
            </Field>
            <Field label="First Name" required error={err('firstName')} className="md:col-span-2">
              <Input
                value={values.firstName}
                onChange={(e) => onNameChange('firstName', e.target.value)}
                onBlur={() => touch('firstName')}
                maxLength={50}
                invalid={Boolean(err('firstName'))}
                placeholder="Aditya"
                disabled={readOnly}
              />
            </Field>
            <Field label="Last Name" error={err('lastName')}>
              <Input
                value={values.lastName}
                onChange={(e) => onNameChange('lastName', e.target.value)}
                onBlur={() => touch('lastName')}
                maxLength={50}
                invalid={Boolean(err('lastName'))}
                placeholder="Kulkarni"
                disabled={readOnly}
              />
            </Field>
            <Field label="Gender">
              <Select value={values.gender} onChange={(e) => set('gender', e.target.value)} disabled={readOnly}>
                <option value="">— Select —</option>
                {genderOpts.map((o) => (
                  <option key={o.code} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date of Birth" error={err('dob')}>
              <Input
                type="date"
                value={values.dob}
                onChange={(e) => set('dob', e.target.value)}
                onBlur={() => touch('dob')}
                invalid={Boolean(err('dob'))}
                disabled={readOnly}
              />
            </Field>
            <Field label="Joining Date" error={err('joiningDate')}>
              <Input
                type="date"
                value={values.joiningDate}
                onChange={(e) => set('joiningDate', e.target.value)}
                onBlur={() => touch('joiningDate')}
                invalid={Boolean(err('joiningDate'))}
                disabled={readOnly}
              />
            </Field>
            <Field label="Employment Type">
              <Select
                value={values.employmentType}
                onChange={(e) => set('employmentType', e.target.value)}
                disabled={readOnly}
              >
                {employmentOpts.map((o) => (
                  <option key={o.code} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Professional Details" subtitle="Department, designation and location" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Designation" error={err('designation')} className="md:col-span-2">
              <Input
                value={values.designation}
                onChange={(e) => set('designation', e.target.value)}
                onBlur={() => touch('designation')}
                maxLength={80}
                invalid={Boolean(err('designation'))}
                placeholder="Store Manager"
                disabled={readOnly}
              />
            </Field>
            <Field label="Department" error={err('departmentId')} className="md:col-span-2">
              <Select
                value={values.departmentId}
                onChange={(e) => set('departmentId', e.target.value)}
                onBlur={() => touch('departmentId')}
                disabled={readOnly}
              >
                <option value="">— Select Department —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.code} · {d.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Email" required error={err('email')} className="md:col-span-2">
              <Input
                type="email"
                value={values.email}
                onChange={(e) => set('email', e.target.value)}
                onBlur={() => touch('email')}
                maxLength={120}
                invalid={Boolean(err('email'))}
                placeholder="employee@company.in"
                disabled={readOnly}
              />
            </Field>
            <Field label="Phone" error={err('phone')}>
              <Input
                value={values.phone}
                onChange={(e) => set('phone', e.target.value)}
                onBlur={() => touch('phone')}
                maxLength={15}
                invalid={Boolean(err('phone'))}
                placeholder="99XXXXXXXX"
                disabled={readOnly}
              />
            </Field>
            <Field label="Alt. Phone" error={err('altPhone')}>
              <Input
                value={values.altPhone}
                onChange={(e) => set('altPhone', e.target.value)}
                onBlur={() => touch('altPhone')}
                maxLength={15}
                invalid={Boolean(err('altPhone'))}
                placeholder="99XXXXXXXX"
                disabled={readOnly}
              />
            </Field>
            <Field label="Base Store" className="md:col-span-2">
              <Select value={values.baseStore} onChange={(e) => set('baseStore', e.target.value)} disabled={readOnly}>
                <option value="">— Assign Store —</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} – {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Reporting To" className="md:col-span-2">
              <Select value={values.reportingTo} onChange={(e) => set('reportingTo', e.target.value)} disabled={readOnly}>
                <option value="">— Select Manager —</option>
                {managerOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end pt-1 md:col-span-2">
              <Switch
                label="Active Employee"
                checked={values.status}
                onChange={(v) => set('status', v)}
                disabled={readOnly}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="System Access"
          subtitle="Create login credentials here. Role / Organization / OU / Location mapping is done in User Access Mapping."
        />
        <CardBody>
          {hasLogin ? (
            <div className="mb-3 text-[12.5px] text-[var(--text2)]">
              Login already exists. Use User Access Mapping to map role, organization, OU and location.
            </div>
          ) : (
            <div className="mb-3.5">
              <Switch
                label="Create User Login Automatically on Save"
                checked={values.createLogin}
                onChange={(v) => {
                  set('createLogin', v)
                  if (!v) {
                    setValues((prev) => ({
                      ...prev,
                      loginId: '',
                      password: '',
                      confirmPassword: '',
                      loginRole: '',
                    }))
                  }
                }}
                disabled={readOnly}
              />
            </div>
          )}

          {showLoginFields && (
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
              <Field
                label="Login ID"
                required
                hint="Suggested from employee name — you can edit it"
                error={err('loginId')}
              >
                <Input
                  value={values.loginId}
                  onChange={(e) => {
                    set('loginIdTouched', true)
                    set('loginId', e.target.value.toLowerCase())
                  }}
                  onBlur={() => touch('loginId')}
                  maxLength={60}
                  invalid={Boolean(err('loginId'))}
                  placeholder="firstname.lastname"
                  disabled={readOnly}
                />
              </Field>
              <Field
                label="Password"
                required
                hint="Min 8 chars, mixed case, number & symbol"
                error={err('password')}
              >
                <Input
                  type="password"
                  value={values.password}
                  onChange={(e) => set('password', e.target.value)}
                  onBlur={() => touch('password')}
                  maxLength={72}
                  invalid={Boolean(err('password'))}
                  placeholder="••••••••"
                  disabled={readOnly}
                />
              </Field>
              <Field label="Confirm Password" required error={err('confirmPassword')}>
                <Input
                  type="password"
                  value={values.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  onBlur={() => touch('confirmPassword')}
                  maxLength={72}
                  invalid={Boolean(err('confirmPassword'))}
                  placeholder="••••••••"
                  disabled={readOnly}
                />
              </Field>
              <Field label="Role for Login" required error={err('loginRole')}>
                <Select
                  value={values.loginRole}
                  onChange={(e) => {
                    touch('loginRole')
                    set('loginRole', e.target.value)
                  }}
                  invalid={Boolean(err('loginRole'))}
                  disabled={readOnly}
                >
                  <option value="">— Select Role —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} – {r.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Organization" required error={err('entityId')} className="md:col-span-2">
                <Select
                  value={values.entityId}
                  onChange={(e) => {
                    touch('entityId')
                    set('entityId', e.target.value)
                  }}
                  invalid={Boolean(err('entityId'))}
                  disabled={readOnly}
                >
                  <option value="">— Select Organization —</option>
                  {entities.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.code} – {o.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
        </CardBody>
      </Card>

      {error && <div className="mt-3 text-sm text-[var(--danger)]">{error}</div>}

      <FormActions
        onClear={
          readOnly
            ? undefined
            : () => {
                if (!confirmClearForm()) return
                setValues(emptyForm())
                setTouched({})
                setSubmitted(false)
                setError('')
              }
        }
        onBack={() => navigate('/masters/employees')}
        onSave={readOnly ? undefined : () => void save()}
        saveLabel={saving ? 'Saving…' : 'Save Employee'}
      />
    </FadeContent>
  )
}

function EmployeeList() {
  const navigate = useNavigate()
  const { canCreateMenu } = useAuth()
  const mapEmpStable = useCallback(mapEmployee, [])
  const mapRoleStable = useCallback(mapRole, [])
  const mapDeptStable = useCallback(mapDepartment, [])
  const mapLocStable = useCallback(mapLocation, [])
  const { rows, loading, error, reload } = useMasterList('employees', mapEmpStable)
  const { rows: roles } = useMasterList('roles', mapRoleStable)
  const { rows: departments } = useMasterList('departments', mapDeptStable)
  const { rows: locations } = useMasterList('locations', mapLocStable)
  const roleById = useMemo(() => Object.fromEntries(roles.map((r) => [r.id, r])), [roles])
  const [previewRows, setPreviewRows] = useState<EmployeeImportDraft[]>([])
  const [importResult, setImportResult] = useState<EmployeeImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [savingImport, setSavingImport] = useState(false)

  const validPreviewCount = previewRows.filter((r) => !r.error).length
  const invalidPreviewCount = previewRows.filter((r) => r.error).length

  const onUploadEmployees = (csvRows: Record<string, string>[]) => {
    const parsed = parseEmployeesFromCsv(csvRows, {
      roles,
      departments,
      locations,
      employees: rows,
    })
    setImportResult(null)
    setPreviewRows(parsed.drafts)
  }

  const removePreviewRow = (key: string) => {
    setPreviewRows((prev) => prev.filter((r) => r.key !== key))
  }

  const clearPreview = () => {
    setPreviewRows([])
    setImportResult(null)
  }

  const savePreview = async () => {
    const toSave = previewRows.filter((r) => !r.error)
    if (toSave.length === 0) {
      setImportResult({ created: 0, failed: previewRows.map((r) => ({ row: r.sourceRow, message: r.error || 'Invalid row' })) })
      return
    }
    setSavingImport(true)
    try {
      const result = await saveEmployeesFromDrafts(toSave)
      setImportResult(result)
      if (result.created > 0) {
        await reload()
        setPreviewRows([])
      }
    } finally {
      setSavingImport(false)
    }
  }

  const columns: Column<Employee>[] = [
    { key: 'code', header: 'Code', searchText: (r) => r.code, render: (r) => <span className="font-mono">{r.code}</span> },
    {
      key: 'name',
      header: 'Name',
      searchText: (r) => `${r.firstName} ${r.lastName}`,
      render: (r) => `${r.firstName} ${r.lastName}`.trim(),
    },
    { key: 'designation', header: 'Designation', searchText: (r) => r.designation, render: (r) => r.designation },
    { key: 'dept', header: 'Department', searchText: (r) => r.department, render: (r) => r.department },
    {
      key: 'role',
      header: 'Role',
      searchText: (r) => roleById[r.role]?.code ?? r.role,
      render: (r) => <Pill>{roleById[r.role]?.code ?? r.role}</Pill>,
    },
    {
      key: 'email',
      header: 'Email',
      searchText: (r) => r.email,
      render: (r) => r.email,
    },
    statusColumn(),
  ]

  return (
    <FadeContent>
      <PageHeader
        title="Employee Master"
        description="Onboard system users with role assignment, base location and reporting hierarchy."
        actions={
          canCreateMenu('EMP') ? (
            <div className="flex flex-wrap items-center gap-2">
              <CsvImportButton
                label={importing ? 'Uploading…' : 'Upload CSV'}
                templateFilename="employee_import_template.csv"
                templateHeaders={EMPLOYEE_IMPORT_HEADERS}
                sampleRow={EMPLOYEE_IMPORT_SAMPLE}
                disabled={importing || savingImport}
                onRows={(csvRows) => {
                  setImporting(true)
                  try {
                    onUploadEmployees(csvRows)
                  } finally {
                    setImporting(false)
                  }
                }}
              />
              <Button onClick={() => navigate('/masters/employees/new')}>Add Employee</Button>
            </div>
          ) : undefined
        }
      />
      {previewRows.length > 0 && (
        <Card className="mb-3">
          <CardHeader
            title="CSV preview"
            subtitle={`${previewRows.length} row(s) loaded — ${validPreviewCount} ready to save, ${invalidPreviewCount} with errors. Review and remove rows, then Save.`}
          />
          <CardBody className="!p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--surface2)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text2)]">
                    <th className="w-[54px] px-2 py-2 text-center">Action</th>
                    <th className="px-2 py-2">Code</th>
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Email</th>
                    <th className="px-2 py-2">Role</th>
                    <th className="px-2 py-2">Department</th>
                    <th className="px-2 py-2">Location</th>
                    <th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r) => (
                    <tr key={r.key} className="border-t border-[var(--border)] align-middle text-[12px]">
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          aria-label={`Remove ${r.employeeCode || `row ${r.sourceRow}`}`}
                          disabled={savingImport}
                          onClick={() => removePreviewRow(r.key)}
                          className="rounded px-1.5 text-[14px] leading-none text-[var(--text3)] transition hover:text-[var(--danger)] disabled:opacity-40"
                        >
                          ×
                        </button>
                      </td>
                      <td className="px-2 py-1.5 font-mono">{r.employeeCode || '—'}</td>
                      <td className="px-2 py-1.5">{`${r.firstName} ${r.lastName}`.trim() || '—'}</td>
                      <td className="px-2 py-1.5">{r.email || '—'}</td>
                      <td className="px-2 py-1.5">{r.roleCode || '—'}</td>
                      <td className="px-2 py-1.5">{r.departmentCode || '—'}</td>
                      <td className="px-2 py-1.5">{r.locationCode || '—'}</td>
                      <td className={`px-2 py-1.5 ${r.error ? 'text-[var(--danger)]' : 'text-[var(--accent)]'}`}>
                        {r.error || 'Ready'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] px-3 py-2.5">
              <Button variant="danger" disabled={savingImport} onClick={clearPreview}>
                Clear
              </Button>
              <Button disabled={savingImport || validPreviewCount === 0} onClick={() => void savePreview()}>
                {savingImport ? 'Saving…' : `Save ${validPreviewCount} employee${validPreviewCount === 1 ? '' : 's'}`}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
      {importResult && (
        <div className="mb-3 rounded-md border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[12px]">
          <div className="font-semibold text-[var(--text)]">
            Import complete: {importResult.created} created, {importResult.failed.length} failed
          </div>
          {importResult.failed.length > 0 && (
            <ul className="mt-1 max-h-40 overflow-y-auto text-[var(--danger)]">
              {importResult.failed.map((f) => (
                <li key={`${f.row}-${f.message}`}>Row {f.row}: {f.message}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="mt-1 text-[11px] font-semibold text-[var(--accent)] underline"
            onClick={() => setImportResult(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
      {loading && <div className="mb-2 text-sm text-[var(--text3)]">Loading employees…</div>}
      <Card>
        <CardBody>
          <DataTable
            columns={columns}
            rows={rows as never}
            searchPlaceholder="Search employee code / name / email…"
            onRowClick={(row) => navigate(`/masters/employees/${row.id}`)}
          />
        </CardBody>
      </Card>
    </FadeContent>
  )
}

export function EmployeesMaster() {
  return (
    <Routes>
      <Route index element={<EmployeeList />} />
      <Route path=":id" element={<EmployeeForm />} />
    </Routes>
  )
}
