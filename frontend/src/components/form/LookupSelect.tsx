import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'

export type LookupOption = { value: string; label: string }

export type QuickAddField = {
  name: string
  label: string
  required?: boolean
  uppercase?: boolean
  maxLength?: number
  placeholder?: string
}

export type QuickAddConfig = {
  title: string
  subtitle?: string
  fields: QuickAddField[]
  /** Persists the new record and returns the option to select. */
  onCreate: (values: Record<string, string>) => Promise<LookupOption>
}

/**
 * Dropdown backed by a master list, with an optional inline "Add option"
 * dialog that creates the missing record and selects it without leaving the form.
 */
export function LookupSelect({
  label,
  value,
  onChange,
  options,
  placeholder = '— Select —',
  required,
  error,
  hint,
  disabled,
  onBlur,
  className,
  quickAdd,
  addLabel = '+ Add option',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: LookupOption[]
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  disabled?: boolean
  onBlur?: () => void
  className?: string
  quickAdd?: QuickAddConfig
  addLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const openDialog = () => {
    setDraft({})
    setDialogError(null)
    setOpen(true)
  }

  const create = async () => {
    if (!quickAdd) return
    const missing = quickAdd.fields.find((f) => f.required && !String(draft[f.name] ?? '').trim())
    if (missing) {
      setDialogError(`${missing.label} is required`)
      return
    }
    setSaving(true)
    setDialogError(null)
    try {
      const created = await quickAdd.onCreate(draft)
      onChange(created.value)
      setOpen(false)
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={className}>
      <Field label={label} required={required} error={error} hint={hint}>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          invalid={Boolean(error)}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      {quickAdd && !disabled && (
        <button
          type="button"
          onClick={openDialog}
          className="mt-1 rounded border border-[var(--border2)] px-1.5 py-0.5 text-[10.5px] font-semibold text-[var(--accent)] transition hover:bg-[var(--accent-lt)]"
        >
          {addLabel}
        </button>
      )}

      {quickAdd && (
        <Modal
          open={open}
          title={quickAdd.title}
          subtitle={quickAdd.subtitle}
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={() => void create()} disabled={saving}>
                {saving ? 'Saving…' : 'Save & Select'}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-2.5">
            {quickAdd.fields.map((f) => (
              <Field key={f.name} label={f.label} required={f.required}>
                <Input
                  value={draft[f.name] ?? ''}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      [f.name]: f.uppercase ? e.target.value.toUpperCase() : e.target.value,
                    }))
                  }
                  maxLength={f.maxLength}
                  placeholder={f.placeholder}
                />
              </Field>
            ))}
            {dialogError && <div className="text-[11px] font-medium text-[var(--danger)]">{dialogError}</div>}
          </div>
        </Modal>
      )}
    </div>
  )
}
