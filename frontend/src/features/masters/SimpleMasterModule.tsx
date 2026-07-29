import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FadeContent } from '@/components/react-bits'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DataTable, statusColumn, type Column } from '@/components/ui/DataTable'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field'
import { FormActions, PageHeader } from '@/components/ui/PageHeader'

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
  getDefaults?: () => Record<string, unknown>
  extraListContent?: ReactNode
  renderExtraForm?: (values: Record<string, unknown>, set: (k: string, v: unknown) => void) => ReactNode
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
  getDefaults,
  extraListContent,
  renderExtraForm,
}: SimpleMasterProps<T>) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isForm = id === 'new' || (id != null && id.length > 0 && id !== undefined)
  const editing = id && id !== 'new' ? rows.find((r) => r.id === id) : undefined

  if (isForm && id) {
    return (
      <MasterForm
        title={title}
        description={description}
        basePath={basePath}
        fields={fields}
        formTitle={formTitle}
        saveLabel={saveLabel}
        initial={
          editing
            ? (editing as Record<string, unknown>)
            : (getDefaults?.() ?? { status: true })
        }
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
          <Button onClick={() => navigate(`${basePath}/new`)}>{addLabel}</Button>
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
  renderExtraForm,
}: {
  title: string
  description: string
  basePath: string
  fields: FieldDef[]
  formTitle: string
  saveLabel: string
  initial: Record<string, unknown>
  renderExtraForm?: (values: Record<string, unknown>, set: (k: string, v: unknown) => void) => ReactNode
}) {
  const navigate = useNavigate()
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    ...initial,
    status: initial.status === 'Active' || initial.status === true,
  }))

  const set = (k: string, v: unknown) => setValues((prev) => ({ ...prev, [k]: v }))

  const gridClass = useMemo(() => 'grid gap-2.5 grid-cols-1 md:grid-cols-2 xl:grid-cols-4', [])

  return (
    <FadeContent>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <div className="text-lg font-bold tracking-[-0.3px] text-[var(--text)]">
            {title}{' '}
            <span className="text-[13px] font-medium text-[var(--text3)]">— Add / Edit</span>
          </div>
          <div className="mt-0.5 text-[12.5px] text-[var(--text2)]">{description}</div>
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
              if (f.type === 'switch') {
                return (
                  <div key={f.name} className={`pt-1 ${span}`}>
                    <Switch
                      label={f.label}
                      checked={Boolean(values[f.name])}
                      onChange={(v) => set(f.name, v)}
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
                    />
                  ) : f.type === 'select' ? (
                    <Select
                      value={String(values[f.name] ?? '')}
                      onChange={(e) => set(f.name, e.target.value)}
                    >
                      <option value="">— Select —</option>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
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
                    />
                  )}
                </Field>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {renderExtraForm?.(values, set)}

      <FormActions
        onClear={() =>
          setValues({
            ...Object.fromEntries(fields.map((f) => [f.name, f.type === 'switch' ? true : ''])),
            status: true,
          })
        }
        onBack={() => navigate(basePath)}
        onSave={() => navigate(basePath)}
        saveLabel={saveLabel}
      />
    </FadeContent>
  )
}

export { statusColumn }
