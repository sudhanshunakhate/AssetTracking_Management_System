/**
 * In-flight dedupe + short TTL cache for GET-style list loads.
 * Stops React Strict Mode double-mounts and sibling hooks from hammering the API.
 */

type Entry<T> = {
  data?: T
  at: number
  inflight?: Promise<T>
}

const store = new Map<string, Entry<unknown>>()

/** How long a successful response is reused without refetching. */
export const TTL_MS = 60_000
/** Master dropdown data changes rarely — reuse longer to avoid re-downloading full catalogs. */
export const MASTER_TTL_MS = 300_000

export async function cachedFetch<T>(key: string, loader: () => Promise<T>, ttlMs = TTL_MS): Promise<T> {
  const existing = store.get(key) as Entry<T> | undefined
  if (existing?.inflight) return existing.inflight
  if (existing?.data !== undefined && Date.now() - existing.at < ttlMs) {
    return existing.data
  }

  const inflight = loader()
    .then((data) => {
      store.set(key, { data, at: Date.now() })
      return data
    })
    .catch((err) => {
      store.delete(key)
      throw err
    })

  store.set(key, { at: 0, inflight })
  return inflight
}

/** Drop cached rows after create/update/delete so the next list load is fresh. */
export function invalidateCache(prefix?: string) {
  if (!prefix) {
    store.clear()
    return
  }
  for (const key of [...store.keys()]) {
    // Trailing ":" (e.g. master: / reports:) means a real prefix match.
    if (prefix.endsWith(':')) {
      if (key.startsWith(prefix) || key === prefix.slice(0, -1)) store.delete(key)
      continue
    }
    if (key === prefix || key.startsWith(`${prefix}:`) || key.startsWith(`${prefix}?`)) {
      store.delete(key)
    }
  }
}
