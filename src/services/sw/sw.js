import runtime from 'serviceworker-webpack5-plugin/lib/runtime'

function urlBase64ToUint8Array (base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export function isSWSupported () {
  return 'serviceWorker' in navigator
}

function isPushSupported () {
  return 'PushManager' in window
}

function getOrCreateServiceWorker () {
  return runtime.register()
    .catch((err) => console.error('Unable to get or create a service worker.', err))
}

function subscribePush (registration, isEnabled, vapidPublicKey) {
  if (!isEnabled) return Promise.reject(new Error('Web Push is disabled in config'))
  if (!vapidPublicKey) return Promise.reject(new Error('VAPID public key is not found'))

  const subscribeOptions = {
    userVisibleOnly: false,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  }
  return registration.pushManager.subscribe(subscribeOptions)
}

function unsubscribePush (registration) {
  return registration.pushManager.getSubscription()
    .then((subscription) => {
      if (subscription === null) { return }
      return subscription.unsubscribe()
    })
}

function deleteSubscriptionFromBackEnd (token) {
  return fetch('/api/v1/push/subscription/', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }).then((response) => {
    if (!response.ok) throw new Error('Bad status code from server.')
    return response
  })
}

function sendSubscriptionToBackEnd (subscription, token, notificationVisibility) {
  return window.fetch('/api/v1/push/subscription/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      subscription,
      data: {
        alerts: {
          follow: notificationVisibility.follows,
          favourite: notificationVisibility.likes,
          mention: notificationVisibility.mentions,
          reblog: notificationVisibility.repeats,
          move: notificationVisibility.moves
        }
      }
    })
  }).then((response) => {
    if (!response.ok) throw new Error('Bad status code from server.')
    return response.json()
  }).then((responseData) => {
    if (!responseData.id) throw new Error('Bad response from server.')
    return responseData
  })
}
export async function initServiceWorker (store) {
  if (!isSWSupported()) return
  await getOrCreateServiceWorker()
  navigator.serviceWorker.addEventListener('message', (event) => {
    const { dispatch } = store
    const { type, ...rest } = event.data

    switch (type) {
      case 'notificationClicked':
        dispatch('notificationClicked', { id: rest.id })
    }
  })
}

export async function showDesktopNotification (content) {
  if (!isSWSupported) return
  const { active: sw } = await window.navigator.serviceWorker.getRegistration()
  if (!sw) return console.error('No serviceworker found!')
  sw.postMessage({ type: 'desktopNotification', content })
}

export async function closeDesktopNotification ({ id }) {
  if (!isSWSupported) return
  const { active: sw } = await window.navigator.serviceWorker.getRegistration()
  if (!sw) return console.error('No serviceworker found!')
  if (id >= 0) {
    sw.postMessage({ type: 'desktopNotificationClose', content: { id } })
  } else {
    sw.postMessage({ type: 'desktopNotificationClose', content: { all: true } })
  }
}

export async function updateFocus () {
  if (!isSWSupported) return
  const { active: sw } = await window.navigator.serviceWorker.getRegistration()
  if (!sw) return console.error('No serviceworker found!')
  sw.postMessage({ type: 'updateFocus' })
}

export function registerPushNotifications (isEnabled, vapidPublicKey, token, notificationVisibility) {
  if (isPushSupported()) {
    getOrCreateServiceWorker()
      .then((registration) => subscribePush(registration, isEnabled, vapidPublicKey))
      .then((subscription) => sendSubscriptionToBackEnd(subscription, token, notificationVisibility))
      .catch((e) => console.warn(`Failed to setup Web Push Notifications: ${e.message}`))
  }
}

export function unregisterPushNotifications (token) {
  if (isPushSupported()) {
    Promise.all([
      deleteSubscriptionFromBackEnd(token),
      getOrCreateServiceWorker()
        .then((registration) => {
          return unsubscribePush(registration).then((result) => [registration, result])
        })
        .then(([registration, unsubResult]) => {
          if (!unsubResult) {
            console.warn('Push subscription cancellation wasn\'t successful')
          }
        })
    ]).catch((e) => console.warn(`Failed to disable Web Push Notifications: ${e.message}`))
  }
}

export { getOrCreateServiceWorker }
