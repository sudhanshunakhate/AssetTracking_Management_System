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
import { getToken } from '@/api/client'
import {
  fetchNotifications,
  fetchUnreadCount,
  fetchVapidPublicKey,
  markAllNotificationsRead,
  markNotificationRead,
  subscribePush,
  type AppNotification,
} from '@/api/notifications'
import { useAuth } from '@/features/auth/AuthContext'

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
  const api = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8085/api/v1'
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
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )
  const seenIds = useRef(new Set<number>())

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

  const presentIncoming = useCallback((n: AppNotification) => {
    if (seenIds.current.has(n.id)) return
    seenIds.current.add(n.id)
    setItems((prev) => [n, ...prev.filter((x) => x.id !== n.id)].slice(0, 50))
    if (!n.read) setUnreadCount((c) => c + 1)
    setToasts((prev) => [...prev.slice(-4), { id: n.id, title: n.title, body: n.body }])
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!user) return
    const token = getToken()
    if (!token) return
    const client = new Client({
      brokerURL: wsUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 4000,
      heartbeatIncoming: 15000,
      heartbeatOutgoing: 15000,
      onConnect: () => {
        client.subscribe('/user/queue/notifications', (msg) => {
          try {
            presentIncoming(JSON.parse(msg.body) as AppNotification)
          } catch {
            /* ignore */
          }
        })
      },
    })
    client.activate()
    return () => {
      void client.deactivate()
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

  const enableOsNotifications = useCallback(async () => {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
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
    if (Notification.permission === 'granted') {
      void enableOsNotifications()
    }
  }, [user, enableOsNotifications])

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

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

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
    [items, unreadCount, ready, toasts, permission, refresh, markRead, markAllRead, enableOsNotifications, openItem, dismissToast],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
