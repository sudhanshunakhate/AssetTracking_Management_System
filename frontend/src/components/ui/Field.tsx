import {
  Children,
  isValidElement,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

function selectedOptionLabel(children: ReactNode, value: unknown): string {
  if (value == null || String(value) === '') return ''
  const want = String(value)
  let found = ''
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    const props = child.props as { value?: unknown; children?: ReactNode }
    if (child.type === 'optgroup') {
      const nested = selectedOptionLabel(props.children, value)
      if (nested) found = nested
      return
    }
    if (String(props.value ?? '') === want) {
      const text =
        typeof props.children === 'string' || typeof props.children === 'number'
          ? String(props.children)
          : ''
      if (text) found = text
    }
  })
  return found
}

function displayTitle(explicit: string | undefined, fallback: string): string | undefined {
  if (explicit != null && explicit !== '') return explicit
  const t = fallback.trim()
  return t ? t : undefined
}

export function Field({
  label,
  required,
  hint,
  error,
  className = '',
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`flex flex-col gap-[3px] ${className}`}>
      <label className="flex items-center gap-1 text-[11px] font-semibold tracking-[0.15px] text-[var(--text2)]">
        {label}
        {required && <span className="text-[10px] text-[var(--danger)]">*</span>}
      </label>
      {children}
      {error ? (
        <span className="text-[10.5px] font-medium text-[var(--danger)]">{error}</span>
      ) : (
        hint && <span className="text-[10.5px] text-[var(--text3)]">{hint}</span>
      )}
    </div>
  )
}

const control =
  'w-full rounded-md border border-[var(--border2)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] text-[var(--text)] outline-none transition hover:border-[#a0a8be] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(37,99,235,.1)]'

const invalid =
  'border-[var(--danger)] hover:border-[var(--danger)] focus:border-[var(--danger)] focus:shadow-[0_0_0_3px_rgba(220,38,38,.12)]'

type Invalidatable = { invalid?: boolean }

export function Input({ invalid: bad, title, ...props }: InputHTMLAttributes<HTMLInputElement> & Invalidatable) {
  const valueTitle = typeof props.value === 'string' ? props.value : String(props.value ?? '')
  return (
    <input
      {...props}
      title={displayTitle(title, valueTitle)}
      aria-invalid={bad || undefined}
      className={`${control} truncate ${bad ? invalid : ''} ${props.className ?? ''}`}
    />
  )
}

export function Select({
  invalid: bad,
  title,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & Invalidatable) {
  const label = selectedOptionLabel(children, props.value)
  return (
    <select
      {...props}
      title={displayTitle(title, label)}
      aria-invalid={bad || undefined}
      className={`${control} cursor-pointer truncate ${bad ? invalid : ''} ${props.className ?? ''}`}
    >
      {children}
    </select>
  )
}

export function Textarea({
  invalid: bad,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & Invalidatable) {
  return (
    <textarea
      {...props}
      aria-invalid={bad || undefined}
      className={`${control} min-h-[54px] resize-y leading-normal ${bad ? invalid : ''} ${props.className ?? ''}`}
    />
  )
}

export function Switch({
  checked,
  onChange,
  label,
  id,
  disabled = false,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  id?: string
  disabled?: boolean
}) {
  const sid = id ?? label.replace(/\s+/g, '-').toLowerCase()
  return (
    <div className={`flex items-center gap-2.5 ${disabled ? 'opacity-60' : ''}`}>
      <label className="relative h-[22px] w-[38px] shrink-0">
        <input
          id={sid}
          type="checkbox"
          className="absolute h-0 w-0 opacity-0"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={`absolute inset-0 rounded-[11px] border transition ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          } ${
            checked
              ? 'border-[var(--accent)] bg-[var(--accent)]'
              : 'border-[var(--border)] bg-[var(--border2)]'
          }`}
        >
          <span
            className={`absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-white shadow transition ${
              checked ? 'translate-x-4' : ''
            }`}
          />
        </span>
      </label>
      <label
        htmlFor={sid}
        className={`${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} text-[12.5px] font-medium text-[var(--text2)]`}
      >
        {label}
      </label>
    </div>
  )
}
