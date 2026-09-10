import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { navGroups, type NavItem } from '@/config/navigation'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/features/auth/AuthContext'
import { FavouritesModal } from '@/features/auth/FavouritesModal'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation()
  const prefixActive = Boolean(
    item.activeMatch && location.pathname.startsWith(item.activeMatch),
  )
  return (
    <NavLink
      to={item.path}
      end={false}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `relative mx-2 my-px flex w-[calc(100%-16px)] items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition ${
          collapsed ? 'justify-center px-0' : ''
        } ${
          isActive || prefixActive
            ? 'bg-[var(--warm-lt)] text-[var(--warm-deep)] before:absolute before:-left-1.5 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-sm before:bg-[var(--warm)] before:content-[""]'
            : 'text-[var(--text2)] hover:bg-[var(--accent-lt)] hover:text-[var(--accent-deep)]'
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
                    isActive || prefixActive
                      ? 'bg-white/80 text-[var(--warm-deep)]'
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
  )
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { canViewMenu, permissionsReady, favouriteMenuCodes, menuPermissions } = useAuth()
  const [favouritesOpen, setFavouritesOpen] = useState(false)

  const itemByCode = useMemo(() => {
    const map = new Map<string, NavItem>()
    for (const group of navGroups) {
      for (const item of group.items) map.set(item.menuCode, item)
    }
    return map
  }, [])

  const favouriteItems = useMemo(() => {
    return favouriteMenuCodes
      .map((code) => itemByCode.get(code))
      .filter((item): item is NavItem => {
        if (!item) return false
        if (!permissionsReady) return true
        return canViewMenu(item.menuCode)
      })
  }, [favouriteMenuCodes, itemByCode, canViewMenu, permissionsReady])

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
      <div
        className={`flex h-[54px] shrink-0 items-center border-b border-[var(--border)] ${
          collapsed ? 'justify-center px-1.5' : 'px-3'
        }`}
      >
        <img
          src={
            collapsed
              ? '/logo/caits-homepage-icon.png?v=2'
              : '/logo/caits-homepage.png?v=2'
          }
          alt="CAITS"
          width={collapsed ? 36 : 96}
          height={collapsed ? 36 : 40}
          title="CAITS"
          decoding="async"
          className={
            collapsed
              ? 'h-9 w-9 shrink-0 object-contain'
              : 'h-10 w-auto max-w-[200px] shrink-0 object-contain object-left'
          }
        />
      </div>

      <nav className="flex-1 overflow-x-hidden overflow-y-auto py-2.5">
        {/* Favourites — pinned at the top, per user */}
        <div className="mb-0.5">
          {!collapsed && (
            <div className="flex items-center gap-1 px-[18px] pt-2 pb-1">
              <span className="flex-1 text-[10px] font-bold tracking-[0.9px] text-[var(--text3)] uppercase">
                Favourites
              </span>
              <button
                type="button"
                onClick={() => setFavouritesOpen(true)}
                className="rounded px-1 text-[10px] font-semibold text-[var(--accent)] hover:bg-[var(--accent-lt)]"
                title="Manage favourites"
              >
                Edit
              </button>
            </div>
          )}
          {collapsed && (
            <button
              type="button"
              onClick={() => setFavouritesOpen(true)}
              title="Favourite menus"
              className="mx-2 my-px flex w-[calc(100%-16px)] items-center justify-center rounded-lg py-2 text-[var(--text2)] transition hover:bg-[var(--bg)] hover:text-[var(--text)]"
            >
              ★
            </button>
          )}
          {favouriteItems.length === 0 && !collapsed && (
            <button
              type="button"
              onClick={() => setFavouritesOpen(true)}
              className="mx-2 mb-1 w-[calc(100%-16px)] rounded-lg border border-dashed border-[var(--border2)] px-3 py-2 text-left text-[11.5px] text-[var(--text3)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              + Pin menus you use often
            </button>
          )}
          {favouriteItems.map((item) => (
            <NavItemLink key={`fav-${item.id}`} item={item} collapsed={collapsed} />
          ))}
          <div className="mx-4 my-2 h-px bg-[var(--border)]" />
        </div>

        {visibleGroups.map((group) => (
          <div key={group.id} className="mb-0.5">
            {!collapsed && (
              <span className="block px-[18px] pt-2 pb-1 text-[10px] font-bold tracking-[0.9px] text-[var(--text3)] uppercase">
                {group.label}
              </span>
            )}
            {group.items.map((item) => (
              <NavItemLink key={item.id} item={item} collapsed={collapsed} />
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
          data-no-loader
          onClick={onToggle}
          className={`flex h-7 w-7 items-center justify-center rounded-[7px] border border-[var(--border2)] bg-[var(--surface)] text-xs text-[var(--text2)] transition hover:bg-[var(--bg)] ${
            collapsed ? 'rotate-180' : ''
          }`}
          aria-label="Toggle sidebar"
        >
          ‹
        </button>
      </div>

      <FavouritesModal open={favouritesOpen} onClose={() => setFavouritesOpen(false)} />
    </aside>
  )
}
