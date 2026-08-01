import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mb-2.5 overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--sh)] ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2">
      <div>
        <div className="text-[12.5px] font-semibold text-[var(--text)]">{title}</div>
        {subtitle && <div className="mt-0.5 text-[10.5px] text-[var(--text3)]">{subtitle}</div>}
      </div>
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-3.5 py-3 ${className}`}>{children}</div>
}
