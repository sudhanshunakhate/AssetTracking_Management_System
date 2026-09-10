/** Ensure transaction-form masters are warm (silent). Pages keep using useMasterList. */
import { ensureCatalog } from '@/api/masterCatalogStore'
import { listMaster } from '@/api/client'
import { cachedFetch, MASTER_TTL_MS } from '@/api/requestCache'

const LIST_PAGE_SIZE = 500
const MAX_LIST_PAGES = 40

async function listAllSilent<T>(resource: string): Promise<T[]> {
  return cachedFetch(
    `master:${resource}`,
    async () => {
      const first = await listMaster<T>(resource, { page: 1, pageSize: LIST_PAGE_SIZE }, { silent: true })
      const rows = first.data ?? []
      const total = first.totalRecords ?? rows.length
      if (rows.length >= total || rows.length === 0) return rows
      const served = rows.length
      const pageCount = Math.min(Math.ceil(total / served), MAX_LIST_PAGES)
      const rest = await Promise.all(
        Array.from({ length: pageCount - 1 }, (_, i) =>
          listMaster<T>(resource, { page: i + 2, pageSize: served }, { silent: true }),
        ),
      )
      return rest.reduce<T[]>((all, page) => all.concat(page.data ?? []), rows)
    },
    MASTER_TTL_MS,
  )
}

const TXN_RESOURCES = ['locations', 'units'] as const

export function ensureTxnLookupsBundle(): Promise<void> {
  return Promise.allSettled(
    TXN_RESOURCES.map((r) => ensureCatalog(r, () => listAllSilent(r))),
  ).then(() => undefined)
}
