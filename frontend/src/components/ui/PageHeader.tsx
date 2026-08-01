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
        <div className="text-lg font-bold tracking-[-0.3px] text-[var(--text)]">{title}</div>
        {description && <div className="mt-0.5 text-[12.5px] text-[var(--text2)]">{description}</div>}
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
}: {
  onClear?: () => void
  onBack: () => void
  onSave?: () => void
  saveLabel?: string
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
      {onSave && <Button onClick={onSave}>{saveLabel}</Button>}
    </div>
  )
}
