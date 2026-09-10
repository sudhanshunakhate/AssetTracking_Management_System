import { useEffect, useRef, useState } from 'react'
import { useNotifications } from './NotificationContext'
import { sendTestPush } from '@/api/notifications'

function timeAgo(iso: string) {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function NotificationBell() {
  const { items, unreadCount, permission, markAllRead, enableOsNotifications, openItem } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (ref.current && event.target instanceof Node && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative mr-1 flex h-9 w-9 items-center justify-center rounded-full text-[var(--text2)] hover:bg-[var(--warm-lt)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 9a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] rounded-full bg-[var(--danger)] px-1 text-[9px] font-bold leading-4 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 z-[250] w-[340px] overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--sh-md)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
            <span className="text-[13px] font-bold text-[var(--text)]">Notifications</span>
            <button
              type="button"
              className="text-[11px] font-semibold text-[var(--accent)]"
              onClick={() => void markAllRead()}
            >
              Mark all read
            </button>
          </div>
          {permission !== 'granted' && permission !== 'unsupported' && (
            <button
              type="button"
              className="w-full border-b border-[var(--border)] bg-[var(--accent-lt)] px-3 py-2 text-left text-[12px] font-medium text-[var(--accent-deep)]"
              onClick={() => void enableOsNotifications()}
            >
              Enable Windows notifications
            </button>
          )}
          {permission === 'granted' && (
            <button
              type="button"
              className="w-full border-b border-[var(--border)] px-3 py-2 text-left text-[12px] font-medium text-[var(--text2)] hover:bg-[var(--surface2)]"
              onClick={() => void sendTestPush()}
            >
              Send test Windows notification
            </button>
          )}
          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12.5px] text-[var(--text3)]">No notifications yet</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`flex w-full flex-col gap-0.5 border-b border-[var(--border)] px-3 py-2.5 text-left hover:bg-[var(--surface2)] ${
                    item.read ? '' : 'bg-[var(--accent-lt)]/40'
                  }`}
                  onClick={() => {
                    openItem(item)
                    setOpen(false)
                  }}
                >
                  <span className="text-[12.5px] font-semibold text-[var(--text)]">{item.title}</span>
                  <span className="text-[12px] text-[var(--text2)]">{item.body}</span>
                  <span className="text-[10.5px] text-[var(--text3)]">{timeAgo(item.createdOn)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const POPUP_MS = 15_000

export function LoginNotificationPopup() {
  const { items, unreadCount, ready, openItem, permission, enableOsNotifications } = useNotifications()
  const [open, setOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const prevUnread = useRef<number | null>(null)

  const unread = items.filter((n) => !n.read)

  useEffect(() => {
    if (!ready) return
    const previous = prevUnread.current
    prevUnread.current = unreadCount
    if (previous === null) {
      if (unreadCount > 0) setOpen(true)
      return
    }
    if (unreadCount > previous) setOpen(true)
  }, [ready, unreadCount])

  useEffect(() => {
    if (!open || paused) return
    const id = window.setTimeout(() => setOpen(false), POPUP_MS)
    return () => window.clearTimeout(id)
  }, [open, paused, unreadCount])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open || unread.length === 0) return null

  return (
    <div
      className="fixed top-[calc(var(--topbar-h)+12px)] right-4 z-[420] w-[380px] overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--sh-md)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="dialog"
      aria-label="New notifications"
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2.5">
        <div>
          <div className="text-[13px] font-bold text-[var(--text)]">New notifications</div>
          <div className="text-[11px] text-[var(--text3)]">
            {unread.length} unread · closes in 15s
          </div>
        </div>
        <button
          type="button"
          aria-label="Close notifications"
          className="rounded-md px-2 py-1 text-[18px] leading-none text-[var(--text3)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
      </div>
      {permission !== 'granted' && permission !== 'unsupported' && (
            <button
              type="button"
              className="w-full border-b border-[var(--border)] bg-[var(--accent-lt)] px-3 py-2.5 text-left text-[12px] font-medium text-[var(--accent-deep)]"
              onClick={() => {
                setPaused(true)
                void enableOsNotifications()
              }}
            >
              Allow Windows notifications (needed when the browser is closed)
            </button>
          )}
      <div className="max-h-[320px] overflow-y-auto">
        {unread.map((item) => (
          <button
            key={item.id}
            type="button"
            className="flex w-full flex-col gap-0.5 border-b border-[var(--border)] px-3 py-2.5 text-left hover:bg-[var(--accent-lt)]"
            onClick={() => {
              openItem(item)
              setOpen(false)
            }}
          >
            <span className="text-[12.5px] font-semibold text-[var(--text)]">{item.title}</span>
            <span className="text-[12px] text-[var(--text2)]">{item.body}</span>
            <span className="text-[10.5px] text-[var(--text3)]">{timeAgo(item.createdOn)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function WindowsPushPrompt() {
  const { permission, enableOsNotifications } = useNotifications()
  if (permission === 'granted' || permission === 'unsupported') return null
  return (
    <div className="fixed bottom-4 left-1/2 z-[430] w-[min(440px,calc(100%-2rem))] -translate-x-1/2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--sh-md)]">
      <div className="text-[13px] font-bold text-[var(--text)]">Windows notifications</div>
      <p className="mt-1 text-[12px] text-[var(--text2)]">
        {permission === 'denied'
          ? 'Blocked in the browser. Click the lock icon in the address bar, allow Notifications, then refresh.'
          : 'Allow once so CAITS can alert you on the Windows tray even if this tab or Chrome is closed.'}
      </p>
      {permission !== 'denied' && (
        <button
          type="button"
          className="mt-2 rounded-md px-3 py-1.5 text-[12.5px] font-semibold text-white"
          style={{ background: 'var(--brand-gradient-hot)' }}
          onClick={() => void enableOsNotifications()}
        >
          Allow Windows notifications
        </button>
      )}
    </div>
  )
}

export function NotificationToasts() {
  const { toasts, dismissToast, items, openItem } = useNotifications()
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[400] flex w-[320px] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto relative rounded-[10px] border border-[var(--border)] bg-[var(--surface)] pr-8 shadow-[var(--sh-md)]"
        >
          <button
            type="button"
            className="w-full px-3 py-2.5 text-left"
            onClick={() => {
              const item = items.find((n) => n.id === t.id)
              if (item) openItem(item)
              dismissToast(t.id)
            }}
          >
            <div className="text-[12.5px] font-bold text-[var(--text)]">{t.title}</div>
            <div className="text-[12px] text-[var(--text2)]">{t.body}</div>
          </button>
          <button
            type="button"
            aria-label="Dismiss notification"
            className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md text-[var(--text3)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
            onClick={(e) => {
              e.stopPropagation()
              dismissToast(t.id)
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M2.5 2.5l7 7M9.5 2.5l-7 7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
