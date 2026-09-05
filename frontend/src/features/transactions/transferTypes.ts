/** Canonical material-transfer / gatepass-outward transfer types (txh_doc_subtype). */
export type TransferType = 'INTERNAL' | 'OU'

/** Values written to txn_header_mst.txh_doc_subtype for transfers & outward gatepass. */
export const TRANSFER_TYPE_OPTIONS: ReadonlyArray<{ value: TransferType; label: string }> = [
  { value: 'INTERNAL', label: 'Internal Transfer' },
  { value: 'OU', label: 'OU Transfer' },
]

/** Legacy DB alias — treat as OU Transfer. */
const OU_ALIASES = new Set(['OU', 'OPR'])

/** Normalize any stored subtype (including blank / OPR) to the canonical TransferType. */
export function normalizeTransferType(raw: string | null | undefined): TransferType {
  const t = String(raw ?? '').trim().toUpperCase()
  if (OU_ALIASES.has(t)) return 'OU'
  return 'INTERNAL'
}

export function transferTypeLabel(raw: string | null | undefined): string {
  return normalizeTransferType(raw) === 'OU' ? 'OU Transfer' : 'Internal Transfer'
}

export function isOuTransferType(raw: string | null | undefined): boolean {
  return normalizeTransferType(raw) === 'OU'
}
