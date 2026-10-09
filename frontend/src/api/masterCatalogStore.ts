/**
 * Shared in-memory master catalog store.
 * First subscriber loads; later mounts get warm data without a loading flash.
 */

type CatalogStatus = 'idle' | 'loading' | 'ready' | 'error'

export type CatalogSnapshot<T = unknown> = {
  status: CatalogStatus
  rows: T[]
  error: string | null
  updatedAt: number
  inflight: Promise<T[]> | null
}

type CatalogEntry<T = unknown> = {
  snapshot: CatalogSnapshot<T>
  subscribers: Set<() => void>
}

const catalogs = new Map<string, CatalogEntry<any>>()

function entry(resource: string): CatalogEntry {
  let e = catalogs.get(resource)
  if (!e) {
    e = {
      snapshot: {
        status: 'idle',
        rows: [],
        error: null,
        updatedAt: 0,
        inflight: null,
      },
      subscribers: new Set(),
    }
    catalogs.set(resource, e)
  }
  return e
}

function updateSnapshot<T>(resource: string, changes: Partial<CatalogSnapshot<T>>) {
  const e = entry(resource)
  e.snapshot = { ...e.snapshot, ...changes }
  for (const fn of e.subscribers) fn()
}

export function getCatalogSnapshot(resource: string): CatalogSnapshot {
  return entry(resource).snapshot
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
  const e = entry(resource)
  let snap = e.snapshot as CatalogSnapshot<T>

  if (opts?.force) {
    snap = {
      ...snap,
      status: 'idle',
      rows: [],
      error: null,
      inflight: null,
      updatedAt: 0,
    }
    updateSnapshot(resource, snap)
  }

  snap = entry(resource).snapshot as CatalogSnapshot<T>

  if (snap.status === 'ready' && !opts?.force) {
    return snap.rows
  }
  if (snap.inflight) return snap.inflight

  const inflightPromise = loader()
    .then((rows) => {
      updateSnapshot(resource, {
        rows,
        status: 'ready',
        error: null,
        updatedAt: Date.now(),
        inflight: null,
      })
      return rows
    })
    .catch((err) => {
      updateSnapshot(resource, {
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load',
        rows: [],
        inflight: null,
      })
      throw err
    })

  updateSnapshot(resource, {
    status: 'loading',
    error: null,
    inflight: inflightPromise,
  })

  return inflightPromise
}

export function invalidateCatalog(resource?: string) {
  if (!resource) {
    for (const key of [...catalogs.keys()]) {
      invalidateCatalog(key)
    }
    return
  }
  updateSnapshot(resource, {
    status: 'idle',
    rows: [],
    error: null,
    inflight: null,
    updatedAt: 0,
  })
}
