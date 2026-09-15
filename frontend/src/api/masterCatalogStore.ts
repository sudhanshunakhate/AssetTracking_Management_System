/**
 * Shared in-memory master catalog store.
 * First subscriber loads; later mounts get warm data without a loading flash.
 */

type CatalogStatus = 'idle' | 'loading' | 'ready' | 'error'

export type CatalogEntry<T = unknown> = {
  status: CatalogStatus
  rows: T[]
  error: string | null
  updatedAt: number
  subscribers: Set<() => void>
  inflight: Promise<T[]> | null
}

const catalogs = new Map<string, CatalogEntry>()

function entry(resource: string): CatalogEntry {
  let e = catalogs.get(resource)
  if (!e) {
    e = {
      status: 'idle',
      rows: [],
      error: null,
      updatedAt: 0,
      subscribers: new Set(),
      inflight: null,
    }
    catalogs.set(resource, e)
  }
  return e
}

function notify(resource: string) {
  const e = catalogs.get(resource)
  if (!e) return
  for (const fn of e.subscribers) fn()
}

export function getCatalogSnapshot(resource: string): CatalogEntry {
  return entry(resource)
}

export function subscribeCatalog(resource: string, listener: () => void): () => void {
  const e = entry(resource)
  e.subscribers.add(listener)
  return () => {
    e.subscribers.delete(listener)
  }
}

export async function ensureCatalog<T>(
  resource: string,
  loader: () => Promise<T[]>,
  opts?: { force?: boolean },
): Promise<T[]> {
  const e = entry(resource) as CatalogEntry<T>
  if (opts?.force) {
    e.status = 'idle'
    e.rows = []
    e.error = null
    e.inflight = null
    e.updatedAt = 0
  }
  if (e.status === 'ready' && !opts?.force) {
    return e.rows
  }
  if (e.inflight) return e.inflight

  e.status = 'loading'
  e.error = null
  notify(resource)

  const inflight = loader()
    .then((rows) => {
      e.rows = rows
      e.status = 'ready'
      e.error = null
      e.updatedAt = Date.now()
      e.inflight = null
      notify(resource)
      return rows
    })
    .catch((err) => {
      e.status = 'error'
      e.error = err instanceof Error ? err.message : 'Failed to load'
      e.rows = []
      e.inflight = null
      notify(resource)
      throw err
    })

  e.inflight = inflight
  return inflight
}

export function invalidateCatalog(resource?: string) {
  if (!resource) {
    for (const key of [...catalogs.keys()]) {
      invalidateCatalog(key)
    }
    return
  }
  const e = catalogs.get(resource)
  if (!e) return
  e.status = 'idle'
  e.rows = []
  e.error = null
  e.inflight = null
  e.updatedAt = 0
  notify(resource)
}
