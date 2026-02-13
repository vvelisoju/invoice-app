/* eslint-disable no-undef */
// Firebase Messaging Service Worker
// This runs in the background to handle push notifications when the app is not in focus.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// Firebase config is injected at build time or hardcoded here.
// Since service workers can't access import.meta.env, we read from a query param
// or use a default config. The recommended approach is to keep this in sync
// with your VITE_FIREBASE_* env vars.
firebase.initializeApp({
  apiKey: self.__FIREBASE_CONFIG__?.apiKey || '',
  authDomain: self.__FIREBASE_CONFIG__?.authDomain || '',
  projectId: self.__FIREBASE_CONFIG__?.projectId || '',
  storageBucket: self.__FIREBASE_CONFIG__?.storageBucket || '',
  messagingSenderId: self.__FIREBASE_CONFIG__?.messagingSenderId || '',
  appId: self.__FIREBASE_CONFIG__?.appId || '',
})

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {}
  const data = payload.data || {}

  const notificationOptions = {
    body: body || '',
    icon: '/assets/brand/icon.png',
    badge: '/assets/brand/favicon.png',
    data: data,
    tag: data.notificationId || 'invoice-baba',
    renotify: true,
  }

  self.registration.showNotification(title || 'Invoice Baba', notificationOptions)
})

// Handle notification click — navigate to the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const route = data.route || '/'
  const urlToOpen = new URL(route, self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.focus()
          client.postMessage({ type: 'NOTIFICATION_CLICK', route })
          return
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
