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
  numOrUndef,
  updateMaster,
  useGenValues,
  useMasterList,
  type EmployeeApi,
} from '@/api/masters'
import { http } from '@/api/client'
import type { Employee } from '@/types/masters'
import { useAuth } from '@/features/auth/AuthContext'

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
  department: string
  email: string
  phone: string
  altPhone: string
  role: string
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
  department: '',
  email: '',
  phone: '',
  altPhone: '',
  role: '',
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
  const { options: genderOpts } = useGenValues(GEN_TYPE.GENDER, 'code')
  const { options: employmentOpts } = useGenValues(GEN_TYPE.EMPLOYMENT_TYPE, 'code')

  const [values, setValues] = useState<EmpFormState>(emptyForm)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hasLogin, setHasLogin] = useState(false)

  const set = <K extends keyof EmpFormState>(k: K, v: EmpFormState[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }))

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
          department: emp.department ?? '',
          email: emp.email ?? '',
          phone: emp.phone ?? '',
          altPhone: emp.altPhone ?? '',
          role: emp.roleId != null ? String(emp.roleId) : '',
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

  const roleLabel = useMemo(() => {
    const r = roles.find((x) => x.id === values.role)
    return r ? `${r.code} – ${r.name}` : '— pick Role above —'
  }, [roles, values.role])

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
    setSaving(true)
    setError('')
    try {
      if (!values.code.trim() || !values.firstName.trim() || !values.email.trim()) {
        throw new Error('Employee Code, First Name and Email are required')
      }
      if (!values.role) throw new Error('Role is required')

      const createLogin = Boolean(values.createLogin) && (isNew || !hasLogin)
      if (createLogin) {
        if (!values.password || !values.confirmPassword) {
          throw new Error('Password and Confirm Password are required to create a User Login')
        }
        if (values.password !== values.confirmPassword) {
          throw new Error('Password and Confirm Password do not match')
        }
        if (values.password.length < 8) {
          throw new Error('Password must be at least 8 characters')
        }
      }

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
        department: values.department.trim() || null,
        roleId: numOrUndef(values.role),
        baseLocationId: numOrUndef(values.baseStore),
        reportingToEmpId: numOrUndef(values.reportingTo),
        isActive: isActiveFromForm(values.status),
        createLogin,
        loginId: values.loginId.trim().toLowerCase() || null,
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

  const showLoginFields = values.createLogin && (isNew || !hasLogin)

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
            <Field label="Employee Code" required>
              <Input
                value={values.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                placeholder="EMP-001"
              />
            </Field>
            <Field label="First Name" required className="md:col-span-2">
              <Input
                value={values.firstName}
                onChange={(e) => onNameChange('firstName', e.target.value)}
                placeholder="Aditya"
              />
            </Field>
            <Field label="Last Name">
              <Input
                value={values.lastName}
                onChange={(e) => onNameChange('lastName', e.target.value)}
                placeholder="Kulkarni"
              />
            </Field>
            <Field label="Gender">
              <Select value={values.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="">— Select —</option>
                {genderOpts.map((o) => (
                  <option key={o.code} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date of Birth">
              <Input type="date" value={values.dob} onChange={(e) => set('dob', e.target.value)} />
            </Field>
            <Field label="Joining Date">
              <Input
                type="date"
                value={values.joiningDate}
                onChange={(e) => set('joiningDate', e.target.value)}
              />
            </Field>
            <Field label="Employment Type">
              <Select
                value={values.employmentType}
                onChange={(e) => set('employmentType', e.target.value)}
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
        <CardHeader title="Professional Details" subtitle="Department, designation, role and location" />
        <CardBody>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Designation" className="md:col-span-2">
              <Input
                value={values.designation}
                onChange={(e) => set('designation', e.target.value)}
                placeholder="Store Manager"
              />
            </Field>
            <Field label="Department" className="md:col-span-2">
              <Input
                value={values.department}
                onChange={(e) => set('department', e.target.value)}
                placeholder="Stores / IT / Operations / Finance"
              />
            </Field>
            <Field label="Email" required className="md:col-span-2">
              <Input
                type="email"
                value={values.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="employee@company.in"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={values.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="99XXXXXXXX"
              />
            </Field>
            <Field label="Alt. Phone">
              <Input
                value={values.altPhone}
                onChange={(e) => set('altPhone', e.target.value)}
                placeholder="99XXXXXXXX"
              />
            </Field>
            <Field label="Role" required className="md:col-span-2">
              <Select value={values.role} onChange={(e) => set('role', e.target.value)}>
                <option value="">— Assign Role —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} – {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Base Store" className="md:col-span-2">
              <Select value={values.baseStore} onChange={(e) => set('baseStore', e.target.value)}>
                <option value="">— Assign Store —</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} – {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Reporting To" className="md:col-span-2">
              <Select value={values.reportingTo} onChange={(e) => set('reportingTo', e.target.value)}>
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
                onChange={(v) => set('createLogin', v)}
              />
            </div>
          )}

          {showLoginFields && (
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Login ID" required hint="Suggested from employee name — you can edit it">
                <Input
                  value={values.loginId}
                  onChange={(e) => {
                    set('loginIdTouched', true)
                    set('loginId', e.target.value.toLowerCase())
                  }}
                  placeholder="firstname.lastname"
                />
              </Field>
              <Field label="Password" required hint="Min 8 chars, mixed case, number & symbol">
                <Input
                  type="password"
                  value={values.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="••••••••"
                />
              </Field>
              <Field label="Confirm Password" required>
                <Input
                  type="password"
                  value={values.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                />
              </Field>
              <Field label="Role for Login" hint="Taken from Role above">
                <Input value={roleLabel} disabled />
              </Field>
              <Field label="Organization" required className="md:col-span-2">
                <Select value={values.entityId} onChange={(e) => set('entityId', e.target.value)}>
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
        onClear={readOnly ? undefined : () => setValues(emptyForm())}
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
  const { rows, loading, error } = useMasterList('employees', mapEmpStable)
  const { rows: roles } = useMasterList('roles', mapRoleStable)
  const roleById = useMemo(() => Object.fromEntries(roles.map((r) => [r.id, r])), [roles])

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
            <Button onClick={() => navigate('/masters/employees/new')}>Add Employee</Button>
          ) : undefined
        }
      />
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
