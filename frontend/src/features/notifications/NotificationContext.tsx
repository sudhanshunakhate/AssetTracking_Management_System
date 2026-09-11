import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import {
  fetchNotifications,
  fetchUnreadCount,
  fetchVapidPublicKey,
  markAllNotificationsRead,
  markNotificationRead,
  subscribePush,
  unsubscribePush,
  type AppNotification,
} from '@/api/notifications'
import { useAuth } from '@/features/auth/AuthContext'

const TOAST_MS = 5_000

type Toast = { id: number; title: string; body: string }

type NotificationContextValue = {
  items: AppNotification[]
  unreadCount: number
  ready: boolean
  toasts: Toast[]
  permission: NotificationPermission | 'unsupported'
  refresh: () => Promise<void>
  markRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
  enableOsNotifications: () => Promise<boolean>
  openItem: (item: AppNotification) => void
  dismissToast: (id: number) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

function wsUrl() {
  const api = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
  if (api.startsWith('/')) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/ws`
  }
  const origin = api.replace(/\/api\/v1\/?$/, '')
  const u = new URL(origin)
  u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:'
  u.pathname = '/ws'
  u.search = ''
  return u.toString()
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [ready, setReady] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext) return 'unsupported'
    return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  })
  const seenIds = useRef(new Set<number>())
  const toastTimers = useRef(new Map<number, number>())

  const dismissToast = useCallback((id: number) => {
    const timer = toastTimers.current.get(id)
    if (timer != null) {
      window.clearTimeout(timer)
      toastTimers.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const scheduleToastDismiss = useCallback(
    (id: number) => {
      const existing = toastTimers.current.get(id)
      if (existing != null) window.clearTimeout(existing)
      const timer = window.setTimeout(() => dismissToast(id), TOAST_MS)
      toastTimers.current.set(id, timer)
    },
    [dismissToast],
  )

  useEffect(() => {
    return () => {
      for (const timer of toastTimers.current.values()) window.clearTimeout(timer)
      toastTimers.current.clear()
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      const [list, unread] = await Promise.all([fetchNotifications(1, 30), fetchUnreadCount()])
      setItems(list.data)
      setUnreadCount(unread.count)
      list.data.forEach((n) => seenIds.current.add(n.id))
    } catch {
      /* ignore */
    } finally {
      setReady(true)
    }
  }, [user])

  const presentIncoming = useCallback(
    (n: AppNotification) => {
      if (seenIds.current.has(n.id)) return
      seenIds.current.add(n.id)
      setItems((prev) => [n, ...prev.filter((x) => x.id !== n.id)].slice(0, 50))
      if (!n.read) setUnreadCount((c) => c + 1)
      setToasts((prev) => [...prev.slice(-4), { id: n.id, title: n.title, body: n.body }])
      scheduleToastDismiss(n.id)
    },
    [scheduleToastDismiss],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    let client: Client | null = null
    let retryTimer: number | null = null

    const connect = () => {
      if (cancelled) return
      client = new Client({
        brokerURL: wsUrl(),
        // Auth via HttpOnly cookie on the WebSocket handshake (same-origin proxy).
        reconnectDelay: 8000,
        heartbeatIncoming: 15000,
        heartbeatOutgoing: 15000,
        onConnect: () => {
          client?.subscribe('/user/queue/notifications', (msg) => {
            try {
              presentIncoming(JSON.parse(msg.body) as AppNotification)
            } catch {
              /* ignore */
            }
          })
        },
        onWebSocketError: () => {
          // Backend may still be starting; STOMP will retry with reconnectDelay.
        },
      })
      client.activate()
    }

    // Brief delay so Vite proxy / backend are ready after a hard refresh.
    retryTimer = window.setTimeout(connect, 400)

    return () => {
      cancelled = true
      if (retryTimer != null) window.clearTimeout(retryTimer)
      if (client) void client.deactivate()
    }
  }, [user, presentIncoming])

  const markRead = useCallback(async (id: number) => {
    await markNotificationRead(id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead()
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  /** Upsert existing browser push subscription without recreating it (no OS test blast). */
  const ensurePushSubscription = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return false
    }
    if (Notification.permission !== 'granted') return false
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        const { publicKey } = await fetchVapidPublicKey()
        if (!publicKey) return false
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      }
      await subscribePush(sub.toJSON())
      return true
    } catch (err) {
      console.error('Push ensure failed', err)
      return false
    }
  }, [])

  /** Explicit user gesture: request permission and (re)subscribe. */
  const enableOsNotifications = useCallback(async () => {
    if (
      (typeof window !== 'undefined' && !window.isSecureContext) ||
      typeof Notification === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      setPermission('unsupported')
      return false
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result !== 'granted') return false
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready
      const { publicKey } = await fetchVapidPublicKey()
      if (!publicKey) return false
      const appKey = urlBase64ToUint8Array(publicKey)
      let sub = await reg.pushManager.getSubscription()
      if (sub) {
        const endpoint = sub.endpoint
        try {
          await unsubscribePush(endpoint)
        } catch {
          /* best-effort server cleanup */
        }
        await sub.unsubscribe()
      }
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appKey,
      })
      await subscribePush(sub.toJSON())
      return true
    } catch (err) {
      console.error('Push subscribe failed', err)
      return false
    }
  }, [])

  useEffect(() => {
    if (!user) return
    if (typeof Notification === 'undefined') return
    setPermission(Notification.permission)
    // Already granted: quietly upsert subscription — do not force-recreate (that fired OS spam).
    if (Notification.permission === 'granted') {
      void ensurePushSubscription()
    }
  }, [user, ensurePushSubscription])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const onMessage = (event: MessageEvent) => {
      const url = event.data?.url
      if (event.data?.type === 'notification-click' && typeof url === 'string' && url.startsWith('/')) {
        navigate(url)
      }
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [navigate])

  const openItem = useCallback(
    (item: AppNotification) => {
      void markRead(item.id)
      if (item.linkUrl) navigate(item.linkUrl)
    },
    [markRead, navigate],
  )

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      ready,
      toasts,
      permission,
      refresh,
      markRead,
      markAllRead,
      enableOsNotifications,
      openItem,
      dismissToast,
    }),
    [
      items,
      unreadCount,
      ready,
      toasts,
      permission,
      refresh,
      markRead,
      markAllRead,
      enableOsNotifications,
      openItem,
      dismissToast,
    ],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
