/**
 * List ordering helpers.
 * Masters: first visit in this browser session → A–Z; later visits → newest first.
 * Transactions: edited rows first, then document date descending (today on top).
 */

const VISIT_PREFIX = 'caits:list-seen:'

export function isFirstListVisit(listKey: string): boolean {
  try {
    const key = VISIT_PREFIX + listKey
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
    return true
  } catch {
    return false
  }
}

function alphaKey(row: { code?: unknown; name?: unknown; docNo?: unknown; id?: unknown }) {
  return String(row.code ?? row.name ?? row.docNo ?? row.id ?? '')
    .trim()
    .toLowerCase()
}

/** Master / setup lists: alphabetical on first open, otherwise last-added (highest id) on top. */
export function sortMasterListRows<T extends { id: string; code?: unknown; name?: unknown }>(
  rows: T[],
  listKey: string,
): T[] {
  const first = isFirstListVisit(listKey)
  const copy = [...rows]
  if (first) {
    copy.sort((a, b) => alphaKey(a).localeCompare(alphaKey(b), undefined, { numeric: true }))
  } else {
    copy.sort((a, b) => Number(b.id) - Number(a.id))
  }
  return copy
}

function timeMs(v: unknown): number {
  if (v == null || v === '') return 0
  const t = Date.parse(String(v))
  return Number.isFinite(t) ? t : 0
}

function dateKey(v: unknown): string {
  return String(v ?? '').slice(0, 10)
}

/** True when the row was saved again after create (edit / status change). */
export function wasEdited(row: { modifiedOn?: unknown; createdOn?: unknown }): boolean {
  const created = timeMs(row.createdOn)
  const modified = timeMs(row.modifiedOn)
  return modified > 0 && created > 0 && modified - created > 1000
}

/**
 * Transaction lists: document date descending (today / newest first),
 * then most recently touched, then id.
 */
export function sortTxnListRows<T extends { id: string; docDate?: unknown; modifiedOn?: unknown; createdOn?: unknown }>(
  rows: T[],
): T[] {
  const copy = [...rows]
  copy.sort((a, b) => {
    const dateDiff = dateKey(b.docDate).localeCompare(dateKey(a.docDate))
    if (dateDiff !== 0) return dateDiff
    const touchDiff = timeMs(b.modifiedOn || b.createdOn) - timeMs(a.modifiedOn || a.createdOn)
    if (touchDiff !== 0) return touchDiff
    return Number(b.id) - Number(a.id)
  })
  return copy
}

/** Unique status values for a Status filter beside the list search bar. */
export function txnStatusFilterOptions(rows: { status?: unknown }[]): { value: string; label: string }[] {
  const set = new Set<string>()
  for (const r of rows) {
    const s = String(r.status ?? '').trim()
    if (s) set.add(s)
  }
  return [
    { value: '', label: 'All Status' },
    ...[...set].sort((a, b) => a.localeCompare(b)).map((s) => ({ value: s, label: s })),
  ]
}

export function filterRowsByStatus<T extends { status?: unknown }>(rows: T[], status: string): T[] {
  if (!status) return rows
  return rows.filter((r) => String(r.status ?? '') === status)
}
