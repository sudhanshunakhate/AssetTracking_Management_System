import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

export function Field({
  label,
  required,
  hint,
  className = '',
  children,
}: {
  label: string
  required?: boolean
  hint?: string
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
      {hint && <span className="text-[10.5px] text-[var(--text3)]">{hint}</span>}
    </div>
  )
}

const control =
  'w-full rounded-md border border-[var(--border2)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] text-[var(--text)] outline-none transition hover:border-[#a0a8be] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(37,99,235,.1)]'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${control} ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${control} cursor-pointer ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${control} min-h-[54px] resize-y leading-normal ${props.className ?? ''}`}
    />
  )
}

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  id?: string
}) {
  const sid = id ?? label.replace(/\s+/g, '-').toLowerCase()
  return (
    <div className="flex items-center gap-2.5">
      <label className="relative h-[22px] w-[38px] shrink-0">
        <input
          id={sid}
          type="checkbox"
          className="absolute h-0 w-0 opacity-0"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={`absolute inset-0 cursor-pointer rounded-[11px] border transition ${
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
      <label htmlFor={sid} className="cursor-pointer text-[12.5px] font-medium text-[var(--text2)]">
        {label}
      </label>
    </div>
  )
}
