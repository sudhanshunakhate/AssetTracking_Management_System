/** Session-scoped document workspace: open tabs + form basket stashes. */

export type DocTab = {
  id: string
  path: string
  title: string
  subtitle?: string
  dirty: boolean
  kind: string
}

export type DocStash<T = unknown> = {
  v: 1
  path: string
  savedAt: number
  dirty: boolean
  data: T
}

const TABS_KEY = 'caits.docWorkspace.tabs'
const STASH_PREFIX = 'caits.docWorkspace.stash:'
export const MAX_DOC_TABS = 12

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode — ignore */
  }
}

export function loadTabs(): DocTab[] {
  const tabs = readJson<DocTab[]>(TABS_KEY, [])
  return Array.isArray(tabs) ? tabs.filter((t) => t?.path && t?.id) : []
}

export function saveTabs(tabs: DocTab[]) {
  writeJson(TABS_KEY, tabs.slice(0, MAX_DOC_TABS))
}

export function stashKey(path: string) {
  return `${STASH_PREFIX}${path}`
}

export function readStash<T>(path: string): DocStash<T> | null {
  const raw = readJson<DocStash<T> | null>(stashKey(path), null)
  if (!raw || raw.v !== 1 || raw.path !== path) return null
  return raw
}

export function writeStash<T>(path: string, data: T, dirty: boolean) {
  const envelope: DocStash<T> = {
    v: 1,
    path,
    savedAt: Date.now(),
    dirty,
    data,
  }
  writeJson(stashKey(path), envelope)
}

export function clearStash(path: string) {
  try {
    sessionStorage.removeItem(stashKey(path))
  } catch {
    /* ignore */
  }
}

export function migrateStash(fromPath: string, toPath: string) {
  const existing = readStash(fromPath)
  if (!existing) return
  writeStash(toPath, existing.data, existing.dirty)
  clearStash(fromPath)
}

export function clearAllDocWorkspace() {
  try {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i)
      if (k && (k === TABS_KEY || k.startsWith(STASH_PREFIX))) keys.push(k)
    }
    keys.forEach((k) => sessionStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}

/** Paths that should stay in the workspace tab strip (masters, txn, reports, dashboard). */
export function isWorkspaceTabPath(pathname: string): boolean {
  if (!pathname || pathname === '/' || pathname.startsWith('/login')) return false
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/masters/') ||
    pathname.startsWith('/transactions/') ||
    pathname.startsWith('/reports/')
  )
}

/** @deprecated Use isWorkspaceTabPath — kept for older imports. */
export function isTxnDocPath(pathname: string): boolean {
  return isWorkspaceTabPath(pathname) && pathname.startsWith('/transactions/')
}

export function tabIdForPath(path: string) {
  return `tab:${path}`
}

const NAV_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  units: 'Unit Master',
  items: 'Item Master',
  'inventory-categories': 'Inventory Category',
  'inventory-sub-categories': 'Inventory Sub-Category',
  'general-types': 'General Type',
  'general-masters': 'General Master',
  vendors: 'Vendor / Party',
  organizations: 'Organization',
  'operating-units': 'Operating Unit',
  stores: 'Location',
  roles: 'Role & Menu Mapping',
  employees: 'Employee',
  departments: 'Department',
  users: 'User Access Mapping',
  exceptions: 'User Access Exception',
  'opening-stock': 'Opening Stock',
  requisitions: 'Store Requisitions',
  grn: 'Goods Receipt Note',
  gatepass: 'Gatepass',
  issues: 'Store Issue',
  transfers: 'Material Transfer',
  returns: 'Material Return',
  'inspection-approvals': 'Inspection Approval',
  'stock-register': 'Stock Ledger',
  'full-report': 'Log Report',
  'stock-owner': 'Stock Owner Report',
  'stock-movement': 'Asset Movement Register',
  'item-register': 'Item Ledger',
  'pick-requisition': 'Pick Requisition',
}

export function defaultTabTitle(path: string): { title: string; kind: string; subtitle?: string } {
  const parts = path.split('/').filter(Boolean)
  const area = parts[0] ?? ''
  const module = parts[1] ?? parts[0] ?? 'page'
  const leaf = parts[parts.length - 1] ?? ''
  const baseLabel = NAV_LABELS[module] ?? NAV_LABELS[leaf] ?? module

  // Dashboard
  if (path === '/dashboard' || module === 'dashboard') {
    return { title: 'Dashboard', kind: 'Reports' }
  }

  // Master / report list screens (exact module root or one segment under area)
  const isListish =
    parts.length <= 2 ||
    leaf === 'pick-requisition' ||
    (area === 'reports' && parts.length === 2)

  if (isListish && leaf !== 'new' && !/^\d+$/.test(leaf)) {
    const kind =
      area === 'masters' ? 'Master' : area === 'transactions' ? 'Transaction' : area === 'reports' ? 'Report' : 'Page'
    return { title: baseLabel, kind }
  }

  // Detail / new forms
  const kind = baseLabel
  if (leaf === 'new') return { title: `New ${kind}`, kind, subtitle: area === 'transactions' ? 'Draft basket' : 'New' }
  if (/^\d+$/.test(leaf) || (parts.length >= 3 && leaf !== module)) {
    return { title: `${kind} · ${leaf}`, kind, subtitle: leaf }
  }
  return { title: baseLabel, kind }
}
