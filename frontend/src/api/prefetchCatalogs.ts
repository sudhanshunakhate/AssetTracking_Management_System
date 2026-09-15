/**
 * Post-login silent prefetch of small master catalogs.
 * Does not prefetch items / employees / vendors (those scale via search later).
 */

import { ensureCatalog } from '@/api/masterCatalogStore'
import { listMaster } from '@/api/client'
import { cachedFetch, MASTER_TTL_MS } from '@/api/requestCache'

const LIST_PAGE_SIZE = 500
const MAX_LIST_PAGES = 40

const SMALL_RESOURCES = [
  'locations',
  'units',
  'entities',
  'business-units',
  'departments',
  'categories',
] as const

async function listMasterAllSilent<TApi extends Record<string, unknown>>(resource: string): Promise<TApi[]> {
  return cachedFetch(
    `master:${resource}`,
    async () => {
      const first = await listMaster<TApi>(resource, { page: 1, pageSize: LIST_PAGE_SIZE }, { silent: true })
      const rows = first.data ?? []
      const total = first.totalRecords ?? rows.length
      if (rows.length >= total || rows.length === 0) return rows
      const served = rows.length
      const pageCount = Math.min(Math.ceil(total / served), MAX_LIST_PAGES)
      const rest = await Promise.all(
        Array.from({ length: pageCount - 1 }, (_, i) =>
          listMaster<TApi>(resource, { page: i + 2, pageSize: served }, { silent: true }),
        ),
      )
      return rest.reduce<TApi[]>((all, page) => all.concat(page.data ?? []), rows)
    },
    MASTER_TTL_MS,
  )
}

let prefetchInflight: Promise<void> | null = null

/** Warm small masters in the background after auth. Safe to call repeatedly. */
export function prefetchCatalogs(): Promise<void> {
  if (prefetchInflight) return prefetchInflight
  prefetchInflight = (async () => {
    await Promise.allSettled(
      SMALL_RESOURCES.map((resource) =>
        ensureCatalog(resource, () => listMasterAllSilent(resource)),
      ),
    )
  })().finally(() => {
    prefetchInflight = null
  })
  return prefetchInflight
}
