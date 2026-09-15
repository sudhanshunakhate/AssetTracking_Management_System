import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { saveFavouritesApi } from '@/api/client'
import { navGroups, type NavItem } from '@/config/navigation'
import { useAuth } from '@/features/auth/AuthContext'

/** Flat list of every nav item the user can view, with its group label. */
function useViewableMenus() {
  const { canViewMenu, permissionsReady } = useAuth()
  return useMemo(() => {
    const rows: { item: NavItem; group: string }[] = []
    for (const group of navGroups) {
      for (const item of group.items) {
        if (!permissionsReady || canViewMenu(item.menuCode)) {
          rows.push({ item, group: group.label })
        }
      }
    }
    return rows
  }, [canViewMenu, permissionsReady])
}

/**
 * Lets the logged-in user pick which menus appear in the Favourites section
 * at the top of the sidebar. Order is the order they are selected.
 */
export function FavouritesModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { favouriteMenuCodes, setFavouriteMenuCodes } = useAuth()
  const viewable = useViewableMenus()
  const [draft, setDraft] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDraft([...favouriteMenuCodes])
    setError(null)
  }, [open, favouriteMenuCodes])

  const selected = useMemo(() => new Set(draft), [draft])

  const toggle = (code: string) => {
    setDraft((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code)
      if (prev.length >= 12) {
        setError('You can pin at most 12 favourite menus.')
        return prev
      }
      setError(null)
      return [...prev, code]
    })
  }

  const move = (code: string, dir: -1 | 1) => {
    setDraft((prev) => {
      const i = prev.indexOf(code)
      if (i < 0) return prev
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await saveFavouritesApi(draft)
      setFavouriteMenuCodes(res.menuCodes ?? draft)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save favourites')
    } finally {
      setSaving(false)
    }
  }

  const byCode = useMemo(() => {
    const map = new Map<string, { item: NavItem; group: string }>()
    for (const row of viewable) map.set(row.item.menuCode, row)
    return map
  }, [viewable])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Favourite Menus"
      subtitle="Pin menus to the top of your sidebar. Drag order with the arrows — only you see these."
      width="max-w-xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save Favourites'}
          </Button>
        </>
      }
    >
      {draft.length > 0 && (
        <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--surface2)] p-2.5">
          <div className="mb-1.5 text-[10.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase">
            Selected order ({draft.length}/12)
          </div>
          <div className="flex flex-col gap-1">
            {draft.map((code, idx) => {
              const row = byCode.get(code)
              return (
                <div
                  key={code}
                  className="flex items-center gap-1.5 rounded-md bg-[var(--surface)] px-2 py-1.5 text-[12px]"
                >
                  <span className="w-5 text-center font-mono text-[10.5px] text-[var(--text3)]">
                    {idx + 1}
                  </span>
                  <span className="flex-1 truncate font-medium text-[var(--text)]">
                    {row?.item.label ?? code}
                  </span>
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={idx === 0}
                    onClick={() => move(code, -1)}
                    className="rounded px-1.5 text-[11px] text-[var(--text3)] hover:bg-[var(--bg)] disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={idx === draft.length - 1}
                    onClick={() => move(code, 1)}
                    className="rounded px-1.5 text-[11px] text-[var(--text3)] hover:bg-[var(--bg)] disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => toggle(code)}
                    className="rounded px-1.5 text-[12px] text-[var(--danger)] hover:bg-[var(--danger-lt)]"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="max-h-[340px] overflow-y-auto rounded-lg border border-[var(--border)]">
        {navGroups.map((group) => {
          const items = viewable.filter((r) => r.group === group.label)
          if (items.length === 0) return null
          return (
            <div key={group.id} className="border-b border-[var(--border)] last:border-b-0">
              <div className="bg-[var(--surface2)] px-3 py-1.5 text-[10px] font-bold tracking-[0.7px] text-[var(--text3)] uppercase">
                {group.label}
              </div>
              {items.map(({ item }) => {
                const checked = selected.has(item.menuCode)
                return (
                  <label
                    key={item.menuCode}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-[12.5px] transition hover:bg-[var(--bg)]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(item.menuCode)}
                      className="h-3.5 w-3.5 accent-[var(--accent)]"
                    />
                    <span className="flex-1 font-medium text-[var(--text)]">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-full bg-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text3)]">
                        {item.badge}
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          )
        })}
      </div>

      {error && <div className="mt-2 text-[11.5px] font-medium text-[var(--danger)]">{error}</div>}
    </Modal>
  )
}
