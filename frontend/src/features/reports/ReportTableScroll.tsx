import type { ReactNode } from 'react'

/** Scrollable report grid — header row stays sticky while body scrolls. */
export function ReportTableScroll({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`max-h-[min(62vh,640px)] overflow-auto overscroll-contain ${className}`}
    >
      {children}
    </div>
  )
}

/** Sticky column header cell for report tables. */
export const reportThClass =
  'sticky top-0 z-[1] border-b-2 border-[var(--border)] bg-[var(--surface2)] px-[11px] py-[7px] text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase whitespace-nowrap shadow-[inset_0_-1px_0_var(--border)] text-left'

export function reportThAlign(align: 'left' | 'right' = 'left') {
  const base =
    'sticky top-0 z-[1] border-b-2 border-[var(--border)] bg-[var(--surface2)] px-[11px] py-[7px] text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase whitespace-nowrap shadow-[inset_0_-1px_0_var(--border)]'
  return `${base} ${align === 'right' ? 'text-right' : 'text-left'}`
}
