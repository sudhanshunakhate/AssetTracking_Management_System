import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DataTable, statusColumn, type Column } from '@/components/ui/DataTable'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field'
import { FormActions, PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/features/auth/AuthContext'
import { validateFields, areRequiredFieldsFilled, HEADER_BEFORE_LINES_HINT, type ValidationRules } from './validation'

export type FieldDef = ValidationRules & {
  name: string
  label: string
  type?: 'text' | 'number' | 'select' | 'textarea' | 'switch' | 'date'
  hint?: string
  span?: 1 | 2 | 3 | 4
  options?:
    | { value: string; label: string }[]
    | ((values: Record<string, unknown>) => { value: string; label: string }[])
  uppercase?: boolean
  /** Shown as the empty option label for select fields. */
  placeholder?: string
  /**
   * When true, the field stays disabled until every other required field
   * (without this flag) is filled — used for item / line fields on txn forms.
   */
  lockedUntilHeader?: boolean
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
  /** When set, shows a secondary Save Draft button next to the primary save. */
  draftLabel?: string
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
  onSave?: (
    id: string,
    values: Record<string, unknown>,
    action?: 'SAVE_DRAFT' | 'SUBMIT',
  ) => Promise<void>
  /**
   * When a field changes, return extra patches (e.g. item → auto-fill uom).
   * Merged into form state after the primary field update.
   */
  onFieldChange?: (
    name: string,
    value: unknown,
    values: Record<string, unknown>,
  ) => Partial<Record<string, unknown>> | void | Promise<Partial<Record<string, unknown>> | void>
  /** Field names that should be read-only on the edit form. */
  readOnlyFields?: string[]
  /**
   * Cross-field validation run before save, on top of the per-field rules.
   * Return a map of field name → message; use the `_form` key for a form-level error.
   */
  validateForm?: (values: Record<string, unknown>, recordId: string) => Record<string, string>
  /** Optional loader to hydrate the edit form from GET-by-id (header + lines). */
  loadRecord?: (id: string) => Promise<Record<string, unknown> | null>
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
  draftLabel,
  addLabel = 'Add New',
  allowCreate = true,
  menuCode,
  listLoading = false,
  getDefaults,
  extraListContent,
  renderExtraForm,
  onSave,
  onFieldChange,
  readOnlyFields = [],
  validateForm,
  loadRecord,
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
  const [loadedRecord, setLoadedRecord] = useState<Record<string, unknown> | null>(null)
  const [recordLoading, setRecordLoading] = useState(false)
  const [recordError, setRecordError] = useState('')

  useEffect(() => {
    if (!isForm || !id || isNew || !loadRecord) {
      setLoadedRecord(null)
      setRecordError('')
      setRecordLoading(false)
      return
    }
    let cancelled = false
    setRecordLoading(true)
    setRecordError('')
    void loadRecord(id)
      .then((rec) => {
        if (!cancelled) setLoadedRecord(rec)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadedRecord(null)
          setRecordError(err instanceof Error ? err.message : 'Failed to load record')
        }
      })
      .finally(() => {
        if (!cancelled) setRecordLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, isForm, isNew, loadRecord])

  if (id === 'new' && !canCreate) {
    return <Navigate to={basePath} replace />
  }

  if (isForm && id) {
    const detailReady = !loadRecord || loadedRecord != null || recordError !== ''
    // Wait until list row / detail is available so fields patch correctly.
    if (!isNew && !editing && !loadRecord) {
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

    if (!isNew && loadRecord && (recordLoading || !detailReady)) {
      return (
        <FadeContent>
          <div className="mb-3 flex justify-end">
            <Button variant="ghost" onClick={() => navigate(basePath)}>
              Back to List
            </Button>
          </div>
          <div className="text-sm text-[var(--text3)]">
            {recordError || 'Loading record…'}
          </div>
        </FadeContent>
      )
    }

    if (!isNew && loadRecord && !loadedRecord) {
      return (
        <FadeContent>
          <div className="mb-3 flex justify-end">
            <Button variant="ghost" onClick={() => navigate(basePath)}>
              Back to List
            </Button>
          </div>
          <div className="text-sm text-[var(--danger)]">
            {recordError || `Record #${id} was not found.`}
          </div>
        </FadeContent>
      )
    }

    const initial = isNew
      ? (getDefaults?.() ?? { status: true })
      : ((loadedRecord ?? editing) as Record<string, unknown>)

    return (
      <MasterForm
        key={id}
        title={title}
        description={description}
        basePath={basePath}
        fields={fields}
        formTitle={formTitle}
        saveLabel={saveLabel}
        draftLabel={draftLabel}
        recordId={id}
        onSave={onSave}
        onFieldChange={onFieldChange}
        readOnly={formReadOnly}
        readOnlyFields={readOnlyFields}
        initial={initial}
        renderExtraForm={renderExtraForm}
        siblings={rows}
        validateForm={validateForm}
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
  draftLabel,
  initial,
  recordId,
  onSave,
  onFieldChange,
  renderExtraForm,
  readOnly = false,
  readOnlyFields = [],
  siblings = [],
  validateForm,
}: {
  title: string
  description: string
  basePath: string
  fields: FieldDef[]
  formTitle: string
  saveLabel: string
  draftLabel?: string
  initial: Record<string, unknown>
  recordId: string
  onSave?: (
    id: string,
    values: Record<string, unknown>,
    action?: 'SAVE_DRAFT' | 'SUBMIT',
  ) => Promise<void>
  onFieldChange?: (
    name: string,
    value: unknown,
    values: Record<string, unknown>,
  ) => Partial<Record<string, unknown>> | void | Promise<Partial<Record<string, unknown>> | void>
  renderExtraForm?: (
    values: Record<string, unknown>,
    set: (k: string, v: unknown) => void,
    recordId: string,
  ) => ReactNode
  readOnly?: boolean
  readOnlyFields?: string[]
  siblings?: Row[]
  validateForm?: (values: Record<string, unknown>, recordId: string) => Record<string, string>
}) {
  const navigate = useNavigate()
  const [values, setValues] = useState<Record<string, unknown>>(() => toFormValues(initial, fields))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const isNew = recordId === 'new'

  // Re-patch only when record data actually changes (not on every parent re-render).
  const patchKey = useMemo(() => {
    const parts = fields.map((f) => `${f.name}=${String(initial[f.name] ?? '')}`)
    return `${recordId}|${String(initial.status ?? '')}|${parts.join('&')}`
  }, [recordId, initial, fields])

  useEffect(() => {
    setValues(toFormValues(initial, fields))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- patchKey captures field values
  }, [patchKey])

  const set = (k: string, v: unknown) => {
    setValues((prev) => {
      const next = { ...prev, [k]: v }
      void Promise.resolve(onFieldChange?.(k, v, next)).then((extra) => {
        if (extra && Object.keys(extra).length > 0) {
          setValues((p) => ({ ...p, ...extra }))
        }
      })
      return next
    })
  }
  const markTouched = (k: string) => setTouched((prev) => (prev[k] ? prev : { ...prev, [k]: true }))

  const gridClass = useMemo(() => 'grid gap-2.5 grid-cols-1 md:grid-cols-2 xl:grid-cols-4', [])

  const errors = useMemo(() => {
    if (readOnly) return {}
    return {
      ...validateFields(fields, values, siblings, recordId),
      ...(validateForm?.(values, recordId) ?? {}),
    }
  }, [fields, values, siblings, recordId, readOnly, validateForm])

  const headerReady = useMemo(() => {
    const headerFields = fields.filter((f) => f.required && !f.lockedUntilHeader)
    if (headerFields.length === 0) return true
    return areRequiredFieldsFilled(headerFields, values)
  }, [fields, values])

  /** Errors stay hidden until the field is visited or the user tries to save. */
  const errorFor = (name: string) => (submitted || touched[name] ? (errors[name] ?? '') : '')

  const handleSave = async (action: 'SAVE_DRAFT' | 'SUBMIT' = 'SUBMIT') => {
    if (readOnly || !onSave) {
      navigate(basePath)
      return
    }
    setSubmitted(true)
    const names = Object.keys(errors)
    if (names.length > 0) {
      // Rules from validateForm can target panels outside the field grid, so spell those out.
      const inGrid = new Set(fields.map((f) => f.name))
      const offGrid = names.filter((n) => !inGrid.has(n)).map((n) => errors[n])
      const highlighted = names.length - offGrid.length
      const parts = [...offGrid]
      if (highlighted === 1 && offGrid.length === 0) parts.push(errors[names[0]])
      else if (highlighted > 0) parts.push(`Please correct ${highlighted} highlighted field(s).`)
      setError(parts.join(' '))
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(recordId, values, action)
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
              You do not have Edit permission for this screen. Ask an admin to grant Edit on Role & Menu Mapping.
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
              // loginId stays locked even on Add when listed (auto-filled identity)
              const lockedByHeader = Boolean(f.lockedUntilHeader) && !headerReady
              const fieldReadOnly =
                readOnly ||
                lockedByHeader ||
                (readOnlyFields.includes(f.name) && (!isNew || f.name === 'loginId'))
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
              const fieldError = errorFor(f.name)
              return (
                <Field
                  key={f.name}
                  label={f.label}
                  required={f.required}
                  hint={lockedByHeader ? HEADER_BEFORE_LINES_HINT : f.hint}
                  error={fieldError}
                  className={span}
                >
                  {f.type === 'textarea' ? (
                    <Textarea
                      value={String(values[f.name] ?? '')}
                      onChange={(e) => set(f.name, e.target.value)}
                      onBlur={() => markTouched(f.name)}
                      placeholder={f.hint}
                      maxLength={f.maxLength}
                      invalid={Boolean(fieldError)}
                      disabled={fieldReadOnly}
                    />
                  ) : f.type === 'select' ? (
                    <Select
                      value={String(values[f.name] ?? '')}
                      onChange={(e) => {
                        markTouched(f.name)
                        set(f.name, e.target.value)
                      }}
                      onBlur={() => markTouched(f.name)}
                      invalid={Boolean(fieldError)}
                      disabled={fieldReadOnly}
                    >
                      <option value="">{f.placeholder ?? '— Select —'}</option>
                      {(typeof f.options === 'function' ? f.options(values) : f.options ?? []).map((o) => (
                        <option key={o.value} value={String(o.value)}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      value={String(values[f.name] ?? '')}
                      onChange={(e) =>
                        set(
                          f.name,
                          f.uppercase ? e.target.value.toUpperCase() : e.target.value,
                        )
                      }
                      onBlur={() => markTouched(f.name)}
                      placeholder={f.hint}
                      maxLength={f.maxLength}
                      min={f.min}
                      max={f.max}
                      invalid={Boolean(fieldError)}
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
            : () => {
                setValues({
                  ...Object.fromEntries(fields.map((f) => [f.name, f.type === 'switch' ? true : ''])),
                  status: true,
                })
                setTouched({})
                setSubmitted(false)
                setError('')
              }
        }
        onBack={() => navigate(basePath)}
        onSaveDraft={
          readOnly || !draftLabel || !onSave ? undefined : () => void handleSave('SAVE_DRAFT')
        }
        draftLabel={saving ? 'Saving…' : draftLabel}
        onSave={readOnly ? undefined : () => void handleSave('SUBMIT')}
        saveLabel={saving ? 'Saving…' : saveLabel}
      />
    </FadeContent>
  )
}

export { statusColumn }
