self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let data = { title: 'CAITS', body: 'You have a new notification', url: '/', id: 0 }
      try {
        if (event.data) {
          const parsed = event.data.json()
          data = { ...data, ...parsed }
        }
      } catch {
        try {
          const text = event.data ? event.data.text() : ''
          if (text) data.body = text
        } catch {
          /* keep defaults */
        }
      }
      const path = data.url || '/'
      await self.registration.showNotification(data.title || 'CAITS', {
        body: data.body || '',
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: data.id ? 'caits-' + data.id : 'caits-ntf-' + Date.now(),
        renotify: true,
        requireInteraction: false,
        data: { url: path },
      })
    })(),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = event.notification.data?.url || '/'
  const target = path.startsWith('http') ? path : self.location.origin + path
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'notification-click', url: path })
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target)
    }),
  )
})
