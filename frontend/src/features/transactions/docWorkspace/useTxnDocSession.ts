import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDocWorkspaceOptional } from './DocWorkspaceContext'
import { clearStash, migrateStash, readStash, writeStash } from './store'

export type SilentDraftConfig = {
  intervalMs?: number
  canSave: () => boolean
  save: () => Promise<{ id: string; docNo?: string } | null>
}

type SessionOpts<T> = {
  data: T
  enabled: boolean
  dirty?: boolean
  title?: string
  subtitle?: string
  kind?: string
  stashMs?: number
  silentDraft?: SilentDraftConfig
}

/**
 * Parks a transaction form basket in sessionStorage and syncs the workspace tab.
 * Restores the basket once per path on mount.
 */
export function useTxnDocSession<T>(opts: SessionOpts<T>) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const workspace = useDocWorkspaceOptional()
  const [restored, setRestored] = useState<T | null>(null)
  const [hydrateDone, setHydrateDone] = useState(false)

  const dataRef = useRef(opts.data)
  dataRef.current = opts.data
  const silentRef = useRef(opts.silentDraft)
  silentRef.current = opts.silentDraft
  const metaRef = useRef({ title: opts.title, subtitle: opts.subtitle, kind: opts.kind })
  metaRef.current = { title: opts.title, subtitle: opts.subtitle, kind: opts.kind }

  const lastSilentAt = useRef(0)
  const silentInFlight = useRef(false)

  useEffect(() => {
    setHydrateDone(false)
    setRestored(null)
    const stash = readStash<T>(pathname)
    // /new always prefers basket; existing docs only when the basket is marked dirty.
    if (stash?.data != null && (pathname.endsWith('/new') || stash.dirty)) {
      setRestored(stash.data)
    }
    setHydrateDone(true)
  }, [pathname])

  useEffect(() => {
    if (!opts.enabled || !hydrateDone) return
    const ms = opts.stashMs ?? 450
    const dirty = opts.dirty ?? true
    const timer = window.setTimeout(() => {
      writeStash(pathname, dataRef.current, dirty)
      workspace?.updateTab(pathname, {
        dirty,
        title: metaRef.current.title,
        subtitle: metaRef.current.subtitle,
        kind: metaRef.current.kind,
      })
    }, ms)
    return () => window.clearTimeout(timer)
  }, [opts.enabled, opts.dirty, opts.data, opts.stashMs, pathname, hydrateDone, workspace])

  useEffect(() => {
    if (!opts.enabled || !hydrateDone || !opts.silentDraft) return
    const interval = opts.silentDraft.intervalMs ?? 12_000
    const timer = window.setTimeout(() => {
      const cfg = silentRef.current
      if (!cfg || silentInFlight.current) return
      if (Date.now() - lastSilentAt.current < interval) return
      if (!cfg.canSave()) return
      silentInFlight.current = true
      void (async () => {
        try {
          const result = await cfg.save()
          lastSilentAt.current = Date.now()
          if (!result?.id) return
          const nextPath = pathname.endsWith('/new')
            ? pathname.replace(/\/new$/, `/${result.id}`)
            : pathname
          if (nextPath !== pathname) {
            migrateStash(pathname, nextPath)
            clearStash(pathname)
            workspace?.renameTab(pathname, nextPath, {
              title: result.docNo
                ? `${metaRef.current.kind ?? 'Doc'} ${result.docNo}`
                : metaRef.current.title,
              subtitle: 'Auto-saved draft',
              dirty: false,
              kind: metaRef.current.kind,
            })
            writeStash(nextPath, dataRef.current, false)
            navigate(nextPath, { replace: true })
          } else {
            workspace?.updateTab(pathname, {
              dirty: false,
              subtitle: result.docNo ? `Draft ${result.docNo}` : 'Auto-saved draft',
              title: result.docNo && metaRef.current.kind
                ? `${metaRef.current.kind} ${result.docNo}`
                : metaRef.current.title,
            })
            writeStash(pathname, dataRef.current, false)
          }
        } catch {
          /* best-effort */
        } finally {
          silentInFlight.current = false
        }
      })()
    }, interval)
    return () => window.clearTimeout(timer)
    // Re-arm when form data changes; callbacks live in refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.data, opts.enabled, hydrateDone, pathname, navigate, workspace])

  return {
    restored,
    hydrateDone,
    clearRestored: () => setRestored(null),
    clearBasket: () => {
      clearStash(pathname)
      workspace?.updateTab(pathname, { dirty: false })
    },
  }
}
