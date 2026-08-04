import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { pingBackend } from '@/api/client'
import { navGroups } from '@/config/navigation'
import { useAuth } from '@/features/auth/AuthContext'
import { ProfileModal } from '@/features/auth/ProfileModal'
import { FavouritesModal } from '@/features/auth/FavouritesModal'

function crumbFromPath(pathname: string) {
  for (const g of navGroups) {
    for (const item of g.items) {
      if (pathname === item.path || pathname.startsWith(item.path + '/')) {
        return { group: g.label, current: item.label }
      }
    }
  }
  if (pathname.startsWith('/dashboard')) return { group: 'Reports', current: 'Dashboard' }
  return { group: 'CAITS', current: 'Home' }
}

export function Topbar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const crumb = crumbFromPath(pathname)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [favouritesOpen, setFavouritesOpen] = useState(false)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const initials =
    user?.displayName
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'CA'

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      const ok = await pingBackend()
      if (!cancelled) setBackendOnline(ok)
    }
    void check()
    const id = window.setInterval(() => void check(), 15_000)
    const onFocus = () => void check()
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (event: PointerEvent) => {
      const el = menuRef.current
      if (!el) return
      if (event.target instanceof Node && !el.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const statusLabel =
    backendOnline === null ? 'Checking…' : backendOnline ? 'Online' : 'Offline'
  const statusOnline = backendOnline === true

  return (
    <header className="sticky top-0 z-[100] flex h-[54px] items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-6 shadow-[var(--sh)]">
      <div className="flex items-center gap-1.5 text-[13px]">
        <span className="font-medium text-[var(--text3)]">{crumb.group}</span>
        <span className="text-[11px] text-[var(--warm-mid)]">/</span>
        <span className="font-bold text-[var(--text)]">{crumb.current}</span>
      </div>
      <div className="flex-1" />
      <div
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${
          statusOnline
            ? 'border-[var(--success)]/35 bg-[var(--success-lt)] text-[var(--success)]'
            : backendOnline === false
              ? 'border-[var(--danger)]/35 bg-[var(--danger-lt)] text-[var(--danger)]'
              : 'border-[var(--border2)] bg-[var(--surface2)] text-[var(--text3)]'
        }`}
        title={
          statusOnline
            ? 'Backend is reachable'
            : backendOnline === false
              ? 'Backend is not responding'
              : 'Checking backend…'
        }
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            statusOnline
              ? 'bg-[var(--success)] shadow-[0_0_0_3px_rgba(5,150,105,0.25)]'
              : backendOnline === false
                ? 'bg-[var(--danger)] shadow-[0_0_0_3px_rgba(220,38,38,0.25)]'
                : 'bg-[var(--text3)]'
          }`}
        />
        {statusLabel}
      </div>
      <div className="relative ml-3" ref={menuRef}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full py-1 pr-2.5 pl-1 transition hover:bg-[var(--warm-lt)]"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[12.5px] font-bold text-white shadow-[var(--brand-glow)]"
            style={{ background: 'var(--brand-gradient-hot)' }}
          >
            {initials}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-[12.5px] font-bold text-[var(--text)]">
              {user?.displayName ?? 'User'}
            </span>
            <span className="block text-[10.5px] text-[var(--text3)]">{user?.role}</span>
          </span>
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute top-[calc(100%+8px)] right-0 z-[250] w-[210px] rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--sh-md)]"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full rounded-[7px] px-2.5 py-2 text-left text-[12.5px] font-medium text-[var(--text2)] hover:bg-[var(--surface2)]"
              onClick={() => {
                setMenuOpen(false)
                setProfileOpen(true)
              }}
            >
              Profile
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full rounded-[7px] px-2.5 py-2 text-left text-[12.5px] font-medium text-[var(--text2)] hover:bg-[var(--surface2)]"
              onClick={() => {
                setMenuOpen(false)
                setFavouritesOpen(true)
              }}
            >
              Favourite Menus
            </button>
            <div className="my-1 h-px bg-[var(--border)]" />
            <button
              type="button"
              role="menuitem"
              className="flex w-full rounded-[7px] px-2.5 py-2 text-left text-[12.5px] font-medium text-[var(--danger)] hover:bg-[var(--danger-lt)]"
              onClick={() => {
                setMenuOpen(false)
                void logout()
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <FavouritesModal open={favouritesOpen} onClose={() => setFavouritesOpen(false)} />
    </header>
  )
}
