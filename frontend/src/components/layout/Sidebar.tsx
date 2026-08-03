import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { navGroups } from '@/config/navigation'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/features/auth/AuthContext'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { canViewMenu, menuPermissions, permissionsReady } = useAuth()

  const visibleGroups = useMemo(() => {
    const orderByCode = new Map<string, number>()
    const groupOrderByLabel = new Map<string, number>()
    for (const p of menuPermissions) {
      orderByCode.set(p.menuCode, p.sortOrder ?? 9999)
      if (p.menuGroup) {
        const g = p.groupSortOrder ?? 9999
        const prev = groupOrderByLabel.get(p.menuGroup)
        if (prev === undefined || g < prev) groupOrderByLabel.set(p.menuGroup, g)
      }
    }
    const byItemSeq = (a: { menuCode: string }, b: { menuCode: string }) =>
      (orderByCode.get(a.menuCode) ?? 9999) - (orderByCode.get(b.menuCode) ?? 9999)

    // While permissions load, keep static nav visible to avoid a blank flash.
    const groups = !permissionsReady
      ? navGroups
      : navGroups
          .map((group) => ({
            ...group,
            items: group.items.filter((item) => canViewMenu(item.menuCode)),
          }))
          .filter((group) => group.items.length > 0)

    return [...groups]
      .map((group) => {
        const items = permissionsReady ? [...group.items].sort(byItemSeq) : [...group.items]
        // navGroups.label matches sysm_menutree_mst.mtree_menu_group
        const sectionSeq = groupOrderByLabel.get(group.label)
        const minItem = items.reduce(
          (min, item) => Math.min(min, orderByCode.get(item.menuCode) ?? 9999),
          9999,
        )
        return { ...group, items, sectionSeq: sectionSeq ?? minItem }
      })
      .sort((a, b) => (permissionsReady ? a.sectionSeq - b.sectionSeq : 0))
  }, [canViewMenu, menuPermissions, permissionsReady])

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-[200] flex flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--surface)] transition-[width] duration-200 ${
        collapsed ? 'w-[62px]' : 'w-[256px]'
      }`}
    >
      <div className="flex h-[54px] shrink-0 items-center gap-[11px] border-b border-[var(--border)] px-4">
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--accent)] text-[11px] font-bold tracking-tight text-white">
          CA
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-tight text-[var(--text)]">CAITS</div>
            <div className="mt-px text-[10px] font-medium tracking-[0.3px] text-[var(--text3)] uppercase">
              Tracking System
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-x-hidden overflow-y-auto py-2.5">
        {visibleGroups.map((group) => (
          <div key={group.id} className="mb-0.5">
            {!collapsed && (
              <span className="block px-[18px] pt-2 pb-1 text-[10px] font-bold tracking-[0.9px] text-[var(--text3)] uppercase">
                {group.label}
              </span>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `relative mx-2 my-px flex w-[calc(100%-16px)] items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition ${
                    collapsed ? 'justify-center px-0' : ''
                  } ${
                    isActive
                      ? 'bg-[var(--accent-lt)] text-[var(--accent)] before:absolute before:-left-1.5 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-sm before:bg-[var(--accent)] before:content-[""]'
                      : 'text-[var(--text2)] hover:bg-[var(--bg)] hover:text-[var(--text)]'
                  }`
                }
              >
                {({ isActive }) =>
                  collapsed ? (
                    <Icon name={item.icon} size={18} />
                  ) : (
                    <>
                      <Icon name={item.icon} className="shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                            isActive
                              ? 'bg-[var(--accent-mid)] text-[var(--accent)]'
                              : 'bg-[var(--border)] text-[var(--text3)]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )
                }
              </NavLink>
            ))}
            <div className="mx-4 my-2 h-px bg-[var(--border)]" />
          </div>
        ))}
      </nav>

      <div
        className={`flex shrink-0 items-center gap-2.5 border-t border-[var(--border)] px-3.5 py-3 ${
          collapsed ? 'justify-center px-0' : ''
        }`}
      >
        {!collapsed && <span className="text-xs text-[var(--text3)]">Collapse menu</span>}
        <button
          type="button"
          onClick={onToggle}
          className={`flex h-7 w-7 items-center justify-center rounded-[7px] border border-[var(--border2)] bg-[var(--surface)] text-xs text-[var(--text2)] transition hover:bg-[var(--bg)] ${
            collapsed ? 'rotate-180' : ''
          }`}
          aria-label="Toggle sidebar"
        >
          ‹
        </button>
      </div>
    </aside>
  )
}
