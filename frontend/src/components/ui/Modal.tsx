import { useEffect, type ReactNode } from 'react'

/** Centred overlay dialog. Closes on Escape and on backdrop click. */
export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = 'max-w-md',
  panelClassName = '',
  bodyClassName = '',
  /** Centre the dialog in the main content area (right of the sidebar). */
  offsetSidebar = false,
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: string
  panelClassName?: string
  bodyClassName?: string
  offsetSidebar?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
      style={{ left: offsetSidebar ? 'var(--sidebar-current, 256px)' : 0 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`my-auto flex w-full ${width} max-h-[min(94vh,900px)] flex-col overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_12px_32px_rgba(15,23,42,.22)] ${panelClassName}`}
      >
        <div className="flex shrink-0 items-start gap-2.5 border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2">
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-[var(--text)]">{title}</div>
            {subtitle && <div className="mt-0.5 text-[10.5px] text-[var(--text3)]">{subtitle}</div>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-mt-0.5 rounded px-1.5 text-[16px] leading-none text-[var(--text3)] transition hover:text-[var(--text)]"
          >
            ×
          </button>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto px-3.5 py-3 ${bodyClassName}`}>{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
