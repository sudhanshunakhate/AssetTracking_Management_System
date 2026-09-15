import { Fragment, useEffect, useMemo, useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { getRolePermissions, listMenus, type MenuApi } from '@/api/masters'

export type PermFlags = {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  canReject: boolean
  canPrint: boolean
  canExport: boolean
}

const PERM_COLS: { key: keyof PermFlags; label: string; supportKey: keyof MenuApi }[] = [
  { key: 'canView', label: 'View', supportKey: 'supportsView' },
  { key: 'canCreate', label: 'Create', supportKey: 'supportsCreate' },
  { key: 'canEdit', label: 'Edit', supportKey: 'supportsEdit' },
  { key: 'canDelete', label: 'Delete', supportKey: 'supportsDelete' },
  { key: 'canApprove', label: 'Approve', supportKey: 'supportsApprove' },
  { key: 'canReject', label: 'Reject', supportKey: 'supportsReject' },
  { key: 'canPrint', label: 'Print', supportKey: 'supportsPrint' },
  { key: 'canExport', label: 'Export', supportKey: 'supportsExport' },
]

function emptyPerms(): PermFlags {
  return {
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canReject: false,
    canPrint: false,
    canExport: false,
  }
}

function menuSupports(menu: MenuApi, supportKey: keyof MenuApi): boolean {
  const v = menu[supportKey]
  if (v === undefined || v === null) return true
  return Boolean(v)
}

/**
 * Role ↔ menu rights grid with Sequence on both section headers and menu rows.
 * Sequence writes through to menutree (global across roles).
 */
export function RoleMenuAccessPanel({
  roleId,
  onMatrixChange,
  onSequencesChange,
  onSectionSequencesChange,
  readOnly = false,
}: {
  roleId: string | null
  onMatrixChange: (matrix: Record<string, PermFlags>) => void
  onSequencesChange: (sequences: Record<string, number>) => void
  onSectionSequencesChange: (
    sectionSequences: Record<string, number>,
    menuGroupByCode: Record<string, string>,
  ) => void
  readOnly?: boolean
}) {
  const [menus, setMenus] = useState<MenuApi[]>([])
  const [matrix, setMatrix] = useState<Record<string, PermFlags>>({})
  const [sequences, setSequences] = useState<Record<string, number>>({})
  const [sectionSequences, setSectionSequences] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await listMenus()
        const filtered = (list ?? []).filter((m) => m.menuCode !== 'MNU')
        if (!cancelled) setMenus(filtered)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load menus')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const nextMenus: Record<string, number> = {}
    const nextSections: Record<string, number> = {}
    const groupByCode: Record<string, string> = {}
    for (const m of menus) {
      nextMenus[m.menuCode] = m.sortOrder ?? 0
      const g = m.menuGroup || 'Other'
      groupByCode[m.menuCode] = g
      if (nextSections[g] === undefined) nextSections[g] = m.groupSortOrder ?? 9
    }
    setSequences(nextMenus)
    setSectionSequences(nextSections)
    onSequencesChange(nextMenus)
    onSectionSequencesChange(nextSections, groupByCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menus])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const next: Record<string, PermFlags> = {}
        for (const m of menus) next[m.menuCode] = emptyPerms()
        if (roleId) {
          const perms = await getRolePermissions(roleId)
          if (cancelled) return
          for (const p of perms ?? []) {
            if (p.module === 'MNU') continue
            next[p.module] = {
              canView: Boolean(p.canView),
              canCreate: Boolean(p.canCreate),
              canEdit: Boolean(p.canEdit),
              canDelete: Boolean(p.canDelete),
              canApprove: Boolean(p.canApprove),
              canReject: Boolean(p.canReject),
              canPrint: Boolean(p.canPrint),
              canExport: Boolean(p.canExport),
            }
          }
        }
        if (cancelled) return
        setMatrix(next)
        onMatrixChange(next)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load permissions')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId, menus])

  const grouped = useMemo(() => {
    const map = new Map<string, MenuApi[]>()
    for (const m of menus) {
      const g = m.menuGroup || 'Other'
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(m)
    }
    return [...map.entries()]
      .map(
        ([group, items]) =>
          [
            group,
            [...items].sort(
              (a, b) =>
                (sequences[a.menuCode] ?? a.sortOrder ?? 0) - (sequences[b.menuCode] ?? b.sortOrder ?? 0),
            ),
          ] as [string, MenuApi[]],
      )
      .sort((a, b) => (sectionSequences[a[0]] ?? 9) - (sectionSequences[b[0]] ?? 9))
  }, [menus, sequences, sectionSequences])

  const applyMatrix = (updater: (prev: Record<string, PermFlags>) => Record<string, PermFlags>) => {
    setMatrix((prev) => {
      const next = updater(prev)
      onMatrixChange(next)
      return next
    })
  }

  const pushSectionSequences = (next: Record<string, number>) => {
    const groupByCode: Record<string, string> = {}
    for (const m of menus) groupByCode[m.menuCode] = m.menuGroup || 'Other'
    onSectionSequencesChange(next, groupByCode)
  }

  const setSequence = (menuCode: string, raw: string) => {
    if (readOnly) return
    const n = raw === '' ? 0 : Number(raw)
    if (!Number.isFinite(n) || n < 0) return
    setSequences((prev) => {
      const next = { ...prev, [menuCode]: Math.trunc(n) }
      onSequencesChange(next)
      return next
    })
  }

  const setSectionSequence = (group: string, raw: string) => {
    if (readOnly) return
    const n = raw === '' ? 0 : Number(raw)
    if (!Number.isFinite(n) || n < 0) return
    setSectionSequences((prev) => {
      const next = { ...prev, [group]: Math.trunc(n) }
      pushSectionSequences(next)
      return next
    })
  }

  const toggle = (menuCode: string, key: keyof PermFlags) => {
    if (readOnly) return
    applyMatrix((prev) => ({
      ...prev,
      [menuCode]: {
        ...(prev[menuCode] ?? emptyPerms()),
        [key]: !(prev[menuCode]?.[key] ?? false),
      },
    }))
  }

  const toggleColumn = (col: (typeof PERM_COLS)[number], checked: boolean) => {
    if (readOnly) return
    applyMatrix((prev) => {
      const next = { ...prev }
      for (const m of menus) {
        if (!menuSupports(m, col.supportKey)) continue
        next[m.menuCode] = {
          ...(next[m.menuCode] ?? emptyPerms()),
          [col.key]: checked,
        }
      }
      return next
    })
  }

  const columnAllChecked = (col: (typeof PERM_COLS)[number]) => {
    const eligible = menus.filter((m) => menuSupports(m, col.supportKey))
    return eligible.length > 0 && eligible.every((m) => Boolean(matrix[m.menuCode]?.[col.key]))
  }

  return (
    <Card>
      <CardHeader
        title="Menu Access"
        subtitle={
          roleId
            ? 'Set Sequence on section headers and menu rows to control sidebar order. Sequence is shared across all roles.'
            : 'Set screen rights and Sequence now — they are saved together with the new role.'
        }
      />
      <CardBody>
        {error && <div className="mb-2 text-sm text-[var(--danger)]">{error}</div>}
        {loading ? (
          <div className="text-sm text-[var(--text3)]">Loading menu access…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--surface2)]">
                  <th className="border-b-2 border-[var(--border)] px-3 py-2 text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase">
                    Menu
                  </th>
                  <th className="border-b-2 border-[var(--border)] px-3 py-2 text-left text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase">
                    Code
                  </th>
                  <th
                    className="border-b-2 border-[var(--border)] px-3 py-2 text-center text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase"
                    title="Lower numbers appear first in the sidebar"
                  >
                    Sequence
                  </th>
                  {PERM_COLS.map((c) => (
                    <th
                      key={c.key}
                      className="border-b-2 border-[var(--border)] px-3 py-2 text-center text-[9.5px] font-bold tracking-[0.6px] text-[var(--text3)] uppercase"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{c.label}</span>
                        <input
                          type="checkbox"
                          className="accent-[var(--accent)]"
                          title={`Toggle ${c.label} for all screens`}
                          checked={columnAllChecked(c)}
                          disabled={readOnly}
                          onChange={(e) => toggleColumn(c, e.target.checked)}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grouped.map(([group, items]) => (
                  <Fragment key={`g-${group}`}>
                    <tr>
                      <td
                        colSpan={2}
                        className="bg-[var(--surface2)] px-3 py-2 text-[11px] font-bold tracking-[0.4px] text-[var(--text2)] uppercase"
                      >
                        {group}
                      </td>
                      <td className="bg-[var(--surface2)] px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={sectionSequences[group] ?? 9}
                          disabled={readOnly}
                          onChange={(e) => setSectionSequence(group, e.target.value)}
                          className="w-[72px] rounded border border-[var(--border2)] bg-[var(--surface)] px-1.5 py-1 text-center text-[12px] tabular-nums text-[var(--text)] disabled:opacity-50"
                          title="Section sequence — lower numbers appear first in the sidebar"
                        />
                      </td>
                      <td
                        colSpan={PERM_COLS.length}
                        className="bg-[var(--surface2)] px-3 py-2 text-[10px] font-medium text-[var(--text3)]"
                      >
                        Section order
                      </td>
                    </tr>
                    {items.map((m) => (
                      <tr key={m.menuCode} className="hover:bg-[#f0f5ff]">
                        <td className="border-b border-[var(--border)] px-3 py-2 font-medium">{m.menuLabel}</td>
                        <td className="border-b border-[var(--border)] px-3 py-2 font-mono">{m.menuCode}</td>
                        <td className="border-b border-[var(--border)] px-3 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={sequences[m.menuCode] ?? m.sortOrder ?? 0}
                            disabled={readOnly}
                            onChange={(e) => setSequence(m.menuCode, e.target.value)}
                            className="w-[72px] rounded border border-[var(--border2)] bg-[var(--surface)] px-1.5 py-1 text-center text-[12px] tabular-nums text-[var(--text)] disabled:opacity-50"
                            title="Menu sequence within its section"
                          />
                        </td>
                        {PERM_COLS.map((c) => {
                          const supported = menuSupports(m, c.supportKey)
                          return (
                            <td key={c.key} className="border-b border-[var(--border)] px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                className="accent-[var(--accent)]"
                                checked={supported && Boolean(matrix[m.menuCode]?.[c.key])}
                                disabled={readOnly || !supported}
                                onChange={() => toggle(m.menuCode, c.key)}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
