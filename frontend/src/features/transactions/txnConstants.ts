/** Shown in document No. fields while creating a new transaction (before save). */
export const AUTO_DOC_NO_LABEL = 'Auto Generated'

/** Legacy placeholder — still recognised when comparing or loading old state. */
export const LEGACY_AUTO_DOC_NO = '(auto)'

export function isPendingDocNo(value: string | undefined | null): boolean {
  const v = String(value ?? '').trim()
  if (!v) return true
  if (v === LEGACY_AUTO_DOC_NO) return true
  return v.toLowerCase() === AUTO_DOC_NO_LABEL.toLowerCase()
}
