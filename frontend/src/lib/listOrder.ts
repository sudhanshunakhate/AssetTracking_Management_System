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
function wasEdited(row: { modifiedOn?: unknown; createdOn?: unknown }): boolean {
  const created = timeMs(row.createdOn)
  const modified = timeMs(row.modifiedOn)
  return modified > 0 && created > 0 && modified - created > 1000
}

/**
 * Transaction lists: edited docs first (most recent edit on top),
 * then document date descending (today / newest dates on top), then id.
 */
export function sortTxnListRows<T extends { id: string; docDate?: unknown; modifiedOn?: unknown; createdOn?: unknown }>(
  rows: T[],
): T[] {
  const copy = [...rows]
  copy.sort((a, b) => {
    const aEdited = wasEdited(a)
    const bEdited = wasEdited(b)
    if (aEdited !== bEdited) return aEdited ? -1 : 1
    if (aEdited && bEdited) {
      const modDiff = timeMs(b.modifiedOn) - timeMs(a.modifiedOn)
      if (modDiff !== 0) return modDiff
    }
    const dateDiff = dateKey(b.docDate).localeCompare(dateKey(a.docDate))
    if (dateDiff !== 0) return dateDiff
    const touchDiff = timeMs(b.modifiedOn || b.createdOn) - timeMs(a.modifiedOn || a.createdOn)
    if (touchDiff !== 0) return touchDiff
    return Number(b.id) - Number(a.id)
  })
  return copy
}
