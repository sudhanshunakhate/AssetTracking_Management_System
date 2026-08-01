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
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: string
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[10vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${width} rounded-[10px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_12px_32px_rgba(15,23,42,.22)]`}
      >
        <div className="flex items-start gap-2.5 border-b border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2.5">
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
        <div className="px-3.5 py-3">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
