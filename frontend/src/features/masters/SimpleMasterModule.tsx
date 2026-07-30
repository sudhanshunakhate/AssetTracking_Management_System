import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DataTable, statusColumn, type Column } from '@/components/ui/DataTable'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field'
import { FormActions, PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/features/auth/AuthContext'

export type FieldDef = {
  name: string
  label: string
  type?: 'text' | 'number' | 'select' | 'textarea' | 'switch'
  required?: boolean
  hint?: string
  span?: 1 | 2 | 3 | 4
  options?: { value: string; label: string }[]
  uppercase?: boolean
}

type Row = { id: string; [key: string]: unknown }

interface SimpleMasterProps<T extends Row> {
  title: string
  description: string
  basePath: string
  rows: T[]
  columns: Column<T>[]
  fields: FieldDef[]
  searchPlaceholder?: string
  formTitle?: string
  saveLabel?: string
  addLabel?: string
  /** When false, hides Add New and blocks /new form. */
  allowCreate?: boolean
  /** Menu code used for create/edit permission checks. */
  menuCode?: string
  /** True while the parent list is still loading (avoids empty edit form). */
  listLoading?: boolean
  getDefaults?: () => Record<string, unknown>
  extraListContent?: ReactNode
  renderExtraForm?: (
    values: Record<string, unknown>,
    set: (k: string, v: unknown) => void,
    recordId: string,
  ) => ReactNode
  onSave?: (id: string, values: Record<string, unknown>) => Promise<void>
  /** Field names that should be read-only on the edit form. */
  readOnlyFields?: string[]
}

function toFormValues(initial: Record<string, unknown>, fields: FieldDef[]): Record<string, unknown> {
  const next: Record<string, unknown> = { ...initial }
  next.status = initial.status === 'Active' || initial.status === true
  for (const f of fields) {
    const v = next[f.name]
    if (f.type === 'switch') {
      next[f.name] = Boolean(v)
    } else if (f.type === 'select') {
      next[f.name] = v == null || v === '' ? '' : String(v)
    } else if (v == null) {
      next[f.name] = ''
    }
  }
  return next
}

export function SimpleMasterModule<T extends Row>({
  title,
  description,
  basePath,
  rows,
  columns,
  fields,
  searchPlaceholder,
  formTitle = 'Details',
  saveLabel = 'Save',
  addLabel = 'Add New',
  allowCreate = true,
  menuCode,
  listLoading = false,
  getDefaults,
  extraListContent,
  renderExtraForm,
  onSave,
  readOnlyFields = [],
}: SimpleMasterProps<T>) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canCreateMenu, canEditMenu } = useAuth()
  const canCreate = allowCreate && (!menuCode || canCreateMenu(menuCode))
  const canEdit = !menuCode || canEditMenu(menuCode)
  const isForm = id === 'new' || (id != null && id.length > 0 && id !== undefined)
  const editing = id && id !== 'new' ? rows.find((r) => String(r.id) === String(id)) : undefined
  const isNew = id === 'new'
  const formReadOnly = isNew ? !canCreate : !canEdit

  if (id === 'new' && !canCreate) {
    return <Navigate to={basePath} replace />
  }

  if (isForm && id) {
    // Wait until list row is available so fields patch correctly (every master screen).
    if (!isNew && !editing) {
      const stillLoading = listLoading || rows.length === 0
      return (
        <FadeContent>
          <div className="mb-3 flex justify-end">
            <Button variant="ghost" onClick={() => navigate(basePath)}>
              Back to List
            </Button>
          </div>
          <div className="text-sm text-[var(--text3)]">
            {stillLoading ? 'Loading record…' : `Record #${id} was not found.`}
          </div>
        </FadeContent>
      )
    }

    const initial = editing
      ? (editing as Record<string, unknown>)
      : (getDefaults?.() ?? { status: true })

    return (
      <MasterForm
        key={id}
        title={title}
        description={description}
        basePath={basePath}
        fields={fields}
        formTitle={formTitle}
        saveLabel={saveLabel}
        recordId={id}
        onSave={onSave}
        readOnly={formReadOnly}
        readOnlyFields={readOnlyFields}
        initial={initial}
        renderExtraForm={renderExtraForm}
      />
    )
  }

  return (
    <FadeContent>
      <PageHeader
        title={title}
        description={description}
        actions={
          canCreate ? <Button onClick={() => navigate(`${basePath}/new`)}>{addLabel}</Button> : undefined
        }
      />
      <Card>
        <CardBody>
          <DataTable
            columns={columns}
            rows={rows}
            searchPlaceholder={searchPlaceholder}
            onRowClick={(row) => navigate(`${basePath}/${row.id}`)}
          />
        </CardBody>
      </Card>
      {extraListContent}
    </FadeContent>
  )
}

function MasterForm({
  title,
  description,
  basePath,
  fields,
  formTitle,
  saveLabel,
  initial,
  recordId,
  onSave,
  renderExtraForm,
  readOnly = false,
  readOnlyFields = [],
}: {
  title: string
  description: string
  basePath: string
  fields: FieldDef[]
  formTitle: string
  saveLabel: string
  initial: Record<string, unknown>
  recordId: string
  onSave?: (id: string, values: Record<string, unknown>) => Promise<void>
  renderExtraForm?: (
    values: Record<string, unknown>,
    set: (k: string, v: unknown) => void,
    recordId: string,
  ) => ReactNode
  readOnly?: boolean
  readOnlyFields?: string[]
}) {
  const navigate = useNavigate()
  const [values, setValues] = useState<Record<string, unknown>>(() => toFormValues(initial, fields))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Re-patch only when record data actually changes (not on every parent re-render).
  const patchKey = useMemo(() => {
    const parts = fields.map((f) => `${f.name}=${String(initial[f.name] ?? '')}`)
    return `${recordId}|${String(initial.status ?? '')}|${parts.join('&')}`
  }, [recordId, initial, fields])

  useEffect(() => {
    setValues(toFormValues(initial, fields))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- patchKey captures field values
  }, [patchKey])

  const set = (k: string, v: unknown) => setValues((prev) => ({ ...prev, [k]: v }))

  const gridClass = useMemo(() => 'grid gap-2.5 grid-cols-1 md:grid-cols-2 xl:grid-cols-4', [])

  const handleSave = async () => {
    if (readOnly || !onSave) {
      navigate(basePath)
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(recordId, values)
      navigate(basePath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FadeContent>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <div className="text-lg font-bold tracking-[-0.3px] text-[var(--text)]">
            {title}{' '}
            <span className="text-[13px] font-medium text-[var(--text3)]">
              — {readOnly ? 'View' : 'Add / Edit'}
            </span>
          </div>
          <div className="mt-0.5 text-[12.5px] text-[var(--text2)]">{description}</div>
          {readOnly && (
            <div className="mt-1 text-[12px] text-[var(--danger)]">
              You do not have Edit permission for this screen. Ask an admin to grant Edit on Access Role.
            </div>
          )}
        </div>
        <Button variant="ghost" onClick={() => navigate(basePath)}>
          Back to List
        </Button>
      </div>

      <Card>
        <CardHeader title={formTitle} />
        <CardBody>
          <div className={gridClass}>
            {fields.map((f) => {
              const span =
                f.span === 4
                  ? 'xl:col-span-4 md:col-span-2'
                  : f.span === 3
                    ? 'xl:col-span-3 md:col-span-2'
                    : f.span === 2
                      ? 'md:col-span-2'
                      : ''
              const fieldReadOnly = readOnly || readOnlyFields.includes(f.name)
              if (f.type === 'switch') {
                return (
                  <div key={f.name} className={`pt-1 ${span}`}>
                    <Switch
                      label={f.label}
                      checked={Boolean(values[f.name])}
                      onChange={(v) => set(f.name, v)}
                      disabled={fieldReadOnly}
                    />
                  </div>
                )
              }
              return (
                <Field
                  key={f.name}
                  label={f.label}
                  required={f.required}
                  hint={f.hint}
                  className={span}
                >
                  {f.type === 'textarea' ? (
                    <Textarea
                      value={String(values[f.name] ?? '')}
                      onChange={(e) => set(f.name, e.target.value)}
                      placeholder={f.hint}
                      disabled={fieldReadOnly}
                    />
                  ) : f.type === 'select' ? (
                    <Select
                      value={String(values[f.name] ?? '')}
                      onChange={(e) => set(f.name, e.target.value)}
                      disabled={fieldReadOnly}
                    >
                      <option value="">— Select —</option>
                      {f.options?.map((o) => (
                        <option key={o.value} value={String(o.value)}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={String(values[f.name] ?? '')}
                      onChange={(e) =>
                        set(
                          f.name,
                          f.uppercase ? e.target.value.toUpperCase() : e.target.value,
                        )
                      }
                      placeholder={f.hint}
                      readOnly={fieldReadOnly}
                      disabled={fieldReadOnly}
                    />
                  )}
                </Field>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {renderExtraForm?.(values, set, recordId)}

      {error && <div className="mt-3 text-sm text-[var(--danger)]">{error}</div>}

      <FormActions
        onClear={
          readOnly
            ? undefined
            : () =>
                setValues({
                  ...Object.fromEntries(fields.map((f) => [f.name, f.type === 'switch' ? true : ''])),
                  status: true,
                })
        }
        onBack={() => navigate(basePath)}
        onSave={readOnly ? undefined : () => void handleSave()}
        saveLabel={saving ? 'Saving…' : saveLabel}
      />
    </FadeContent>
  )
}

export { statusColumn }
