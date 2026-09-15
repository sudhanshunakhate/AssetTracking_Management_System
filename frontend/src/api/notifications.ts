import { http, type PageResponse } from '@/api/client'

export type AppNotification = {
  id: number
  title: string
  body: string
  kind: string
  menuCode?: string
  docType?: string
  docId?: number
  linkUrl?: string
  read: boolean
  createdOn: string
}

export function fetchNotifications(page = 1, pageSize = 30) {
  return http.get<PageResponse<AppNotification>>(`/notifications?page=${page}&pageSize=${pageSize}`)
}

export function fetchUnreadCount() {
  return http.get<{ count: number }>('/notifications/unread-count')
}

export function fetchVapidPublicKey() {
  return http.get<{ publicKey: string }>('/notifications/vapid-public-key')
}

export function markNotificationRead(id: number) {
  return http.post<void>(`/notifications/${id}/read`)
}

export function markAllNotificationsRead() {
  return http.post<void>('/notifications/read-all')
}

export function subscribePush(subscription: PushSubscriptionJSON) {
  return http.post<void>('/notifications/push/subscribe', subscription)
}

export function unsubscribePush(endpoint: string) {
  return http.post<void>('/notifications/push/unsubscribe', { endpoint })
}

export function sendTestPush() {
  return http.post<{ message: string }>('/notifications/push/test')
}
