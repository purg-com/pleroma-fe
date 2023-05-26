/* eslint-env serviceworker */

import localForage from 'localforage'
import { parseNotification } from './services/entity_normalizer/entity_normalizer.service.js'
import { prepareNotificationObject } from './services/notification_utils/notification_utils.js'
import { createI18n } from 'vue-i18n'
import messages from './i18n/service_worker_messages.js'

const i18n = createI18n({
  // By default, use the browser locale, we will update it if neccessary
  locale: 'en',
  fallbackLocale: 'en',
  messages
})

const state = {
  lastFocused: null,
  notificationIds: new Set(),
  allowedNotificationTypes: null
}

function getWindowClients () {
  return clients.matchAll({ includeUncontrolled: true })
    .then((clientList) => clientList.filter(({ type }) => type === 'window'))
}

const setSettings = async () => {
  const vuexState = await localForage.getItem('vuex-lz')
  const locale = vuexState.config.interfaceLanguage || 'en'
  i18n.locale = locale
  const notificationsNativeArray = Object.entries(vuexState.config.notificationNative)
  state.webPushAlwaysShowNotifications = vuexState.config.webPushAlwaysShowNotifications

  state.allowedNotificationTypes = new Set(
    notificationsNativeArray
      .filter(([k, v]) => v)
      .map(([k]) => {
        switch (k) {
          case 'mentions':
            return 'mention'
          case 'statuses':
            return 'status'
          case 'likes':
            return 'like'
          case 'repeats':
            return 'repeat'
          case 'emojiReactions':
            return 'pleroma:emoji_reaction'
          case 'reports':
            return 'pleroma:report'
          case 'followRequest':
            return 'follow_request'
          case 'follows':
            return 'follow'
          case 'polls':
            return 'poll'
          default:
            return k
        }
      })
  )
}

const showPushNotification = async (event) => {
  const activeClients = await getWindowClients()
  await setSettings()
  // Only show push notifications if all tabs/windows are closed
  if (state.webPushAlwaysShowNotifications || activeClients.length === 0) {
    const data = event.data.json()

    const url = `${self.registration.scope}api/v1/notifications/${data.notification_id}`
    const notification = await fetch(url, { headers: { Authorization: 'Bearer ' + data.access_token } })
    const notificationJson = await notification.json()
    const parsedNotification = parseNotification(notificationJson)

    const res = prepareNotificationObject(parsedNotification, i18n)

    if (state.webPushAlwaysShowNotifications || state.allowedNotificationTypes.has(parsedNotification.type)) {
      return self.registration.showNotification(res.title, res)
    }
  }
  return Promise.resolve()
}

const shouldCache = process.env.NODE_ENV === 'production'
const cacheKey = 'pleroma-fe'
const cacheFiles = self.serviceWorkerOption.assets
const emojiCacheKey = 'pleroma-fe-emoji'
const isEmoji = req => {
  if (req.method !== 'GET') {
    return false
  }
  const url = new URL(req.url)

  return url.pathname.startsWith('/emoji/')
}
const isNotMedia = req => {
  console.log('req.method=', req.method)
  if (req.method !== 'GET') {
    return false
  }
  const url = new URL(req.url)
  console.log('pathname=', url.pathname)
  return !url.pathname.startsWith('/media/')
}

self.addEventListener('install', async (event) => {
  if (shouldCache) {
    event.waitUntil((async () => {
      const cache = await caches.open(cacheKey)
      await cache.addAll(cacheFiles)
    })())
  }
})

self.addEventListener('activate', async (event) => {
  if (shouldCache) {
    event.waitUntil((async () => {
      const cache = await caches.open(cacheKey)
      const keys = await cache.keys()
      await Promise.all(
        keys.filter(request => {
          const url = new URL(request.url)
          const shouldKeep = cacheFiles.includes(url.pathname)
          return !shouldKeep
        }).map(k => cache.delete(k))
      )
    })())
  }
})

self.addEventListener('push', async (event) => {
  if (event.data) {
    // Supposedly, we HAVE to return a promise inside waitUntil otherwise it will
    // show (extra) notification that website is updated in background
    event.waitUntil(showPushNotification(event))
  }
})

self.addEventListener('message', async (event) => {
  await setSettings()
  const { type, content } = event.data

  if (type === 'desktopNotification') {
    const { title, ...rest } = content
    const { tag, type } = rest
    if (state.notificationIds.has(tag)) return
    state.notificationIds.add(tag)
    setTimeout(() => state.notificationIds.delete(tag), 10000)
    if (state.allowedNotificationTypes.has(type)) {
      self.registration.showNotification(title, rest)
    }
  }

  if (type === 'desktopNotificationClose') {
    const { id, all } = content
    const search = all ? null : { tag: id }
    const notifications = await self.registration.getNotifications(search)
    notifications.forEach(n => n.close())
  }

  if (type === 'updateFocus') {
    state.lastFocused = event.source.id

    const notifications = await self.registration.getNotifications()
    notifications.forEach(n => n.close())
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(getWindowClients().then((list) => {
    for (let i = 0; i < list.length; i++) {
      const client = list[i]
      client.postMessage({ type: 'notificationClicked', id: event.notification.tag })
    }

    for (let i = 0; i < list.length; i++) {
      const client = list[i]
      if (state.lastFocused === null || client.id === state.lastFocused) {
        if ('focus' in client) return client.focus()
      }
    }

    if (clients.openWindow) return clients.openWindow('/')
  }))
})

self.addEventListener('fetch', (event) => {
  // Do not mess up with remote things
  const isSameOrigin = (new URL(event.request.url)).origin === self.location.origin
  if (shouldCache && event.request.method === 'GET' && isSameOrigin && isNotMedia(event.request)) {
    event.respondWith((async () => {
      const r = await caches.match(event.request)

      if (r) {
        return r
      }

      try {
        const response = await fetch(event.request)
        if (response.ok && isEmoji(event.request)) {
          const cache = await caches.open(emojiCacheKey)
          await cache.put(event.request.clone(), response.clone())
        }
        return response
      } catch (e) {
        throw e
      }
    })())
  }
})
