import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

const styles: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-white shadow-[0_1px_3px_rgba(37,99,235,.3)] hover:bg-[#1d4ed8]',
  ghost:
    'bg-[var(--surface)] text-[var(--text2)] border border-[var(--border2)] hover:bg-[var(--bg)] hover:text-[var(--text)]',
  danger: 'bg-[var(--danger-lt)] text-[var(--danger)] border border-[#fecaca] hover:bg-[#fee2e2]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-[15px] py-[7px] text-[12.5px] font-semibold tracking-[0.1px] transition active:scale-[0.97] disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
