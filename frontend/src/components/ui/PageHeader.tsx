import type { ReactNode } from 'react'
import { Button } from './Button'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2.5">
      <div>
        <div className="relative inline-block text-lg font-bold tracking-[-0.3px] text-[var(--text)]">
          {title}
          <span
            aria-hidden
            className="mt-1.5 block h-[3px] w-[min(100%,72px)] rounded-full"
            style={{ background: 'var(--brand-gradient-hot)' }}
          />
        </div>
        {description && <div className="mt-1.5 text-[12.5px] text-[var(--text2)]">{description}</div>}
      </div>
      {actions}
    </div>
  )
}

export function FormActions({
  onClear,
  onBack,
  onSave,
  saveLabel = 'Save',
  onSaveDraft,
  draftLabel = 'Save Draft',
}: {
  onClear?: () => void
  onBack: () => void
  onSave?: () => void
  saveLabel?: string
  onSaveDraft?: () => void
  draftLabel?: string
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <div className="flex-1" />
      {onClear && (
        <Button variant="danger" onClick={onClear}>
          Clear
        </Button>
      )}
      <Button variant="ghost" onClick={onBack}>
        Back to List
      </Button>
      {onSaveDraft && (
        <Button variant="ghost" onClick={onSaveDraft}>
          {draftLabel}
        </Button>
      )}
      {onSave && <Button onClick={onSave}>{saveLabel}</Button>}
    </div>
  )
}
