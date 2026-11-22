import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import {
  clearAllDocWorkspace,
  clearStash,
  defaultTabTitle,
  isWorkspaceTabPath,
  loadTabs,
  MAX_DOC_TABS,
  saveTabs,
  tabIdForPath,
  type DocTab,
} from './store'

type DocWorkspaceApi = {
  tabs: DocTab[]
  openOrFocus: (path: string, meta?: Partial<Pick<DocTab, 'title' | 'subtitle' | 'kind' | 'dirty'>>) => void
  updateTab: (path: string, patch: Partial<Pick<DocTab, 'title' | 'subtitle' | 'kind' | 'dirty'>>) => void
  renameTab: (
    fromPath: string,
    toPath: string,
    meta?: Partial<Pick<DocTab, 'title' | 'subtitle' | 'kind' | 'dirty'>>,
  ) => void
  closeTab: (path: string, opts?: { force?: boolean }) => void
  closeOtherTabs: (path: string) => void
}

const DocWorkspaceContext = createContext<DocWorkspaceApi | null>(null)

export function DocWorkspaceProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [tabs, setTabs] = useState<DocTab[]>(() => loadTabs())

  // Drop workspace when the signed-in user changes / logs out.
  useEffect(() => {
    if (!user) {
      clearAllDocWorkspace()
      setTabs([])
    }
  }, [user?.userId, user])

  useEffect(() => {
    saveTabs(tabs)
  }, [tabs])

  const openOrFocus = useCallback(
    (path: string, meta?: Partial<Pick<DocTab, 'title' | 'subtitle' | 'kind' | 'dirty'>>) => {
      const defaults = defaultTabTitle(path)
      setTabs((prev) => {
        const existing = prev.find((t) => t.path === path)
        if (existing) {
          return prev.map((t) =>
            t.path === path
              ? {
                  ...t,
                  title: meta?.title ?? t.title,
                  subtitle: meta?.subtitle ?? t.subtitle,
                  kind: meta?.kind ?? t.kind,
                  dirty: meta?.dirty ?? t.dirty,
                }
              : t,
          )
        }
        const next: DocTab = {
          id: tabIdForPath(path),
          path,
          title: meta?.title ?? defaults.title,
          subtitle: meta?.subtitle ?? defaults.subtitle,
          kind: meta?.kind ?? defaults.kind,
          dirty: meta?.dirty ?? false,
        }
        const trimmed = prev.length >= MAX_DOC_TABS ? prev.slice(prev.length - (MAX_DOC_TABS - 1)) : prev
        // Drop stash for evicted tabs
        if (prev.length >= MAX_DOC_TABS) {
          prev.slice(0, prev.length - (MAX_DOC_TABS - 1)).forEach((t) => clearStash(t.path))
        }
        return [...trimmed, next]
      })
    },
    [],
  )

  const updateTab = useCallback(
    (path: string, patch: Partial<Pick<DocTab, 'title' | 'subtitle' | 'kind' | 'dirty'>>) => {
      setTabs((prev) => prev.map((t) => (t.path === path ? { ...t, ...patch } : t)))
    },
    [],
  )

  const renameTab = useCallback(
    (
      fromPath: string,
      toPath: string,
      meta?: Partial<Pick<DocTab, 'title' | 'subtitle' | 'kind' | 'dirty'>>,
    ) => {
      if (fromPath === toPath) {
        if (meta) updateTab(toPath, meta)
        return
      }
      const defaults = defaultTabTitle(toPath)
      setTabs((prev) => {
        const withoutTarget = prev.filter((t) => t.path !== toPath)
        return withoutTarget.map((t) =>
          t.path === fromPath
            ? {
                ...t,
                id: tabIdForPath(toPath),
                path: toPath,
                title: meta?.title ?? defaults.title,
                subtitle: meta?.subtitle ?? defaults.subtitle,
                kind: meta?.kind ?? t.kind,
                dirty: meta?.dirty ?? t.dirty,
              }
            : t,
        )
      })
    },
    [updateTab],
  )

  const closeTab = useCallback(
    (path: string, opts?: { force?: boolean }) => {
      setTabs((prev) => {
        const target = prev.find((t) => t.path === path)
        if (!target) return prev
        if (!opts?.force && target.dirty) {
          const ok = window.confirm('This tab has unsaved basket changes. Close anyway?')
          if (!ok) return prev
        }
        clearStash(path)
        const next = prev.filter((t) => t.path !== path)
        if (pathname === path) {
          const fallback = next[next.length - 1]?.path
          navigate(fallback ?? (path.replace(/\/[^/]+$/, '') || '/dashboard'))
        }
        return next
      })
    },
    [navigate, pathname],
  )

  const closeOtherTabs = useCallback(
    (path: string) => {
      setTabs((prev) => {
        prev.forEach((t) => {
          if (t.path !== path) clearStash(t.path)
        })
        return prev.filter((t) => t.path === path)
      })
    },
    [],
  )

  // Auto-register masters, transactions, reports, and dashboard as workspace tabs.
  useEffect(() => {
    if (!user) return
    if (!isWorkspaceTabPath(pathname)) return
    openOrFocus(pathname)
  }, [pathname, user, openOrFocus])

  const api = useMemo(
    () => ({ tabs, openOrFocus, updateTab, renameTab, closeTab, closeOtherTabs }),
    [tabs, openOrFocus, updateTab, renameTab, closeTab, closeOtherTabs],
  )

  return <DocWorkspaceContext.Provider value={api}>{children}</DocWorkspaceContext.Provider>
}

export function useDocWorkspace() {
  const ctx = useContext(DocWorkspaceContext)
  if (!ctx) throw new Error('useDocWorkspace requires DocWorkspaceProvider')
  return ctx
}

/** Safe variant for pages outside the provider (should not happen in AppShell). */
export function useDocWorkspaceOptional() {
  return useContext(DocWorkspaceContext)
}
