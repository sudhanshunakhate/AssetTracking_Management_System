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
      className={`relative max-h-[min(70vh,720px)] overflow-auto overscroll-contain ${className}`}
    >
      {children}
    </div>
  )
}

/** Sticky column header cell for report tables. */
export const reportThClass =
  'sticky top-0 z-[3] border-b-2 border-[var(--border)] bg-[#eef2f7] px-[11px] py-[7px] text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase whitespace-nowrap shadow-[0_1px_0_var(--border)] text-left'

export function reportThAlign(align: 'left' | 'right' = 'left', compact = false) {
  const base = compact
    ? 'sticky top-0 z-[3] border-b-2 border-[var(--border)] bg-[#eef2f7] px-1.5 py-[7px] text-[9px] font-bold tracking-[0.4px] text-[var(--text3)] uppercase leading-tight whitespace-normal shadow-[0_1px_0_var(--border)] w-16 min-w-[3.5rem] max-w-[4.5rem]'
    : 'sticky top-0 z-[3] border-b-2 border-[var(--border)] bg-[#eef2f7] px-[11px] py-[7px] text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase whitespace-nowrap shadow-[0_1px_0_var(--border)]'
  return `${base} ${align === 'right' ? 'text-right' : 'text-left'}`
}
