import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import vClickOutside from 'click-outside-vue3'
import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome'

import App from '../App.vue'
import routes from './routes'
import VBodyScrollLock from 'src/directives/body_scroll_lock'

import { windowWidth, windowHeight } from '../services/window_utils/window_utils'
import { getOrCreateApp, getClientToken } from '../services/new_api/oauth.js'
import backendInteractorService from '../services/backend_interactor_service/backend_interactor_service.js'
import { applyConfig } from '../services/style_setter/style_setter.js'
import FaviconService from '../services/favicon_service/favicon_service.js'
import { initServiceWorker, updateFocus } from '../services/sw/sw.js'

let staticInitialResults = null

const parsedInitialResults = () => {
  if (!document.getElementById('initial-results')) {
    return null
  }
  if (!staticInitialResults) {
    staticInitialResults = JSON.parse(document.getElementById('initial-results').textContent)
  }
  return staticInitialResults
}

const decodeUTF8Base64 = (data) => {
  const rawData = atob(data)
  const array = Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
  const text = new TextDecoder().decode(array)
  return text
}

const preloadFetch = async (request) => {
  const data = parsedInitialResults()
  if (!data || !data[request]) {
    return window.fetch(request)
  }
  const decoded = decodeUTF8Base64(data[request])
  const requestData = JSON.parse(decoded)
  return {
    ok: true,
    json: () => requestData,
    text: () => requestData
  }
}

const getInstanceConfig = async ({ store }) => {
  try {
    const res = await preloadFetch('/api/v1/instance')
    if (res.ok) {
      const data = await res.json()
      const textlimit = data.max_toot_chars
      const vapidPublicKey = data.pleroma.vapid_public_key

      store.dispatch('setInstanceOption', { name: 'textlimit', value: textlimit })
      store.dispatch('setInstanceOption', { name: 'accountApprovalRequired', value: data.approval_required })
      store.dispatch('setInstanceOption', { name: 'birthdayRequired', value: !!data.pleroma.metadata.birthday_required })
      store.dispatch('setInstanceOption', { name: 'birthdayMinAge', value: data.pleroma.metadata.birthday_min_age || 0 })

      if (vapidPublicKey) {
        store.dispatch('setInstanceOption', { name: 'vapidPublicKey', value: vapidPublicKey })
      }
    } else {
      throw (res)
    }
  } catch (error) {
    console.error('Could not load instance config, potentially fatal')
    console.error(error)
  }
}

const getBackendProvidedConfig = async ({ store }) => {
  try {
    const res = await window.fetch('/api/pleroma/frontend_configurations')
    if (res.ok) {
      const data = await res.json()
      return data.pleroma_fe
    } else {
      throw (res)
    }
  } catch (error) {
    console.error('Could not load backend-provided frontend config, potentially fatal')
    console.error(error)
  }
}

const getStaticConfig = async () => {
  try {
    const res = await window.fetch('/static/config.json')
    if (res.ok) {
      return res.json()
    } else {
      throw (res)
    }
  } catch (error) {
    console.warn('Failed to load static/config.json, continuing without it.')
    console.warn(error)
    return {}
  }
}

const setSettings = async ({ apiConfig, staticConfig, store }) => {
  const overrides = window.___pleromafe_dev_overrides || {}
  const env = window.___pleromafe_mode.NODE_ENV

  // This takes static config and overrides properties that are present in apiConfig
  let config = {}
  if (overrides.staticConfigPreference && env === 'development') {
    console.warn('OVERRIDING API CONFIG WITH STATIC CONFIG')
    config = Object.assign({}, apiConfig, staticConfig)
  } else {
    config = Object.assign({}, staticConfig, apiConfig)
  }

  const copyInstanceOption = (name) => {
    store.dispatch('setInstanceOption', { name, value: config[name] })
  }

  copyInstanceOption('theme')
  copyInstanceOption('style')
  copyInstanceOption('palette')
  copyInstanceOption('nsfwCensorImage')
  copyInstanceOption('background')
  copyInstanceOption('hidePostStats')
  copyInstanceOption('hideBotIndication')
  copyInstanceOption('hideUserStats')
  copyInstanceOption('hideFilteredStatuses')
  copyInstanceOption('logo')

  store.dispatch('setInstanceOption', {
    name: 'logoMask',
    value: typeof config.logoMask === 'undefined'
      ? true
      : config.logoMask
  })

  store.dispatch('setInstanceOption', {
    name: 'logoMargin',
    value: typeof config.logoMargin === 'undefined'
      ? 0
      : config.logoMargin
  })
  copyInstanceOption('logoLeft')
  store.commit('authFlow/setInitialStrategy', config.loginMethod)

  copyInstanceOption('redirectRootNoLogin')
  copyInstanceOption('redirectRootLogin')
  copyInstanceOption('showInstanceSpecificPanel')
  copyInstanceOption('minimalScopesMode')
  copyInstanceOption('hideMutedPosts')
  copyInstanceOption('collapseMessageWithSubject')
  copyInstanceOption('scopeCopy')
  copyInstanceOption('subjectLineBehavior')
  copyInstanceOption('postContentType')
  copyInstanceOption('alwaysShowSubjectInput')
  copyInstanceOption('showFeaturesPanel')
  copyInstanceOption('hideSitename')
  copyInstanceOption('sidebarRight')
}

const getTOS = async ({ store }) => {
  try {
    const res = await window.fetch('/static/terms-of-service.html')
    if (res.ok) {
      const html = await res.text()
      store.dispatch('setInstanceOption', { name: 'tos', value: html })
    } else {
      throw (res)
    }
  } catch (e) {
    console.warn("Can't load TOS")
    console.warn(e)
  }
}

const getInstancePanel = async ({ store }) => {
  try {
    const res = await preloadFetch('/instance/panel.html')
    if (res.ok) {
      const html = await res.text()
      store.dispatch('setInstanceOption', { name: 'instanceSpecificPanelContent', value: html })
    } else {
      throw (res)
    }
  } catch (e) {
    console.warn("Can't load instance panel")
    console.warn(e)
  }
}

const getStickers = async ({ store }) => {
  try {
    const res = await window.fetch('/static/stickers.json')
    if (res.ok) {
      const values = await res.json()
      const stickers = (await Promise.all(
        Object.entries(values).map(async ([name, path]) => {
          const resPack = await window.fetch(path + 'pack.json')
          let meta = {}
          if (resPack.ok) {
            meta = await resPack.json()
          }
          return {
            pack: name,
            path,
            meta
          }
        })
      )).sort((a, b) => {
        return a.meta.title.localeCompare(b.meta.title)
      })
      store.dispatch('setInstanceOption', { name: 'stickers', value: stickers })
    } else {
      throw (res)
    }
  } catch (e) {
    console.warn("Can't load stickers")
    console.warn(e)
  }
}

const getAppSecret = async ({ store }) => {
  const { state, commit } = store
  const { oauth, instance } = state
  return getOrCreateApp({ ...oauth, instance: instance.server, commit })
    .then((app) => getClientToken({ ...app, instance: instance.server }))
    .then((token) => {
      commit('setAppToken', token.access_token)
      commit('setBackendInteractor', backendInteractorService(store.getters.getToken()))
    })
}

const resolveStaffAccounts = ({ store, accounts }) => {
  const nicknames = accounts.map(uri => uri.split('/').pop())
  store.dispatch('setInstanceOption', { name: 'staffAccounts', value: nicknames })
}

const getNodeInfo = async ({ store }) => {
  try {
    const res = await preloadFetch('/nodeinfo/2.1.json')
    if (res.ok) {
      const data = await res.json()
      const metadata = data.metadata
      const features = metadata.features
      store.dispatch('setInstanceOption', { name: 'name', value: metadata.nodeName })
      store.dispatch('setInstanceOption', { name: 'registrationOpen', value: data.openRegistrations })
      store.dispatch('setInstanceOption', { name: 'mediaProxyAvailable', value: features.includes('media_proxy') })
      store.dispatch('setInstanceOption', { name: 'safeDM', value: features.includes('safe_dm_mentions') })
      store.dispatch('setInstanceOption', { name: 'shoutAvailable', value: features.includes('chat') })
      store.dispatch('setInstanceOption', { name: 'pleromaChatMessagesAvailable', value: features.includes('pleroma_chat_messages') })
      store.dispatch('setInstanceOption', { name: 'pleromaCustomEmojiReactionsAvailable', value: features.includes('pleroma_custom_emoji_reactions') })
      store.dispatch('setInstanceOption', { name: 'pleromaBookmarkFoldersAvailable', value: features.includes('pleroma:bookmark_folders') })
      store.dispatch('setInstanceOption', { name: 'gopherAvailable', value: features.includes('gopher') })
      store.dispatch('setInstanceOption', { name: 'pollsAvailable', value: features.includes('polls') })
      store.dispatch('setInstanceOption', { name: 'editingAvailable', value: features.includes('editing') })
      store.dispatch('setInstanceOption', { name: 'pollLimits', value: metadata.pollLimits })
      store.dispatch('setInstanceOption', { name: 'mailerEnabled', value: metadata.mailerEnabled })
      store.dispatch('setInstanceOption', { name: 'quotingAvailable', value: features.includes('quote_posting') })
      store.dispatch('setInstanceOption', { name: 'groupActorAvailable', value: features.includes('pleroma:group_actors') })

      const uploadLimits = metadata.uploadLimits
      store.dispatch('setInstanceOption', { name: 'uploadlimit', value: parseInt(uploadLimits.general) })
      store.dispatch('setInstanceOption', { name: 'avatarlimit', value: parseInt(uploadLimits.avatar) })
      store.dispatch('setInstanceOption', { name: 'backgroundlimit', value: parseInt(uploadLimits.background) })
      store.dispatch('setInstanceOption', { name: 'bannerlimit', value: parseInt(uploadLimits.banner) })
      store.dispatch('setInstanceOption', { name: 'fieldsLimits', value: metadata.fieldsLimits })

      store.dispatch('setInstanceOption', { name: 'restrictedNicknames', value: metadata.restrictedNicknames })
      store.dispatch('setInstanceOption', { name: 'postFormats', value: metadata.postFormats })

      const suggestions = metadata.suggestions
      store.dispatch('setInstanceOption', { name: 'suggestionsEnabled', value: suggestions.enabled })
      store.dispatch('setInstanceOption', { name: 'suggestionsWeb', value: suggestions.web })

      const software = data.software
      store.dispatch('setInstanceOption', { name: 'backendVersion', value: software.version })
      store.dispatch('setInstanceOption', { name: 'backendRepository', value: software.repository })
      store.dispatch('setInstanceOption', { name: 'pleromaBackend', value: software.name === 'pleroma' })

      const priv = metadata.private
      store.dispatch('setInstanceOption', { name: 'private', value: priv })

      const frontendVersion = window.___pleromafe_commit_hash
      store.dispatch('setInstanceOption', { name: 'frontendVersion', value: frontendVersion })

      const federation = metadata.federation

      store.dispatch('setInstanceOption', {
        name: 'tagPolicyAvailable',
        value: typeof federation.mrf_policies === 'undefined'
          ? false
          : metadata.federation.mrf_policies.includes('TagPolicy')
      })

      store.dispatch('setInstanceOption', { name: 'federationPolicy', value: federation })
      store.dispatch('setInstanceOption', {
        name: 'federating',
        value: typeof federation.enabled === 'undefined'
          ? true
          : federation.enabled
      })

      const accountActivationRequired = metadata.accountActivationRequired
      store.dispatch('setInstanceOption', { name: 'accountActivationRequired', value: accountActivationRequired })

      const accounts = metadata.staffAccounts
      resolveStaffAccounts({ store, accounts })
    } else {
      throw (res)
    }
  } catch (e) {
    console.warn('Could not load nodeinfo')
    console.warn(e)
  }
}

const setConfig = async ({ store }) => {
  // apiConfig, staticConfig
  const configInfos = await Promise.all([getBackendProvidedConfig({ store }), getStaticConfig()])
  const apiConfig = configInfos[0]
  const staticConfig = configInfos[1]

  await setSettings({ store, apiConfig, staticConfig }).then(getAppSecret({ store }))
}

const checkOAuthToken = async ({ store }) => {
  if (store.getters.getUserToken()) {
    return store.dispatch('loginUser', store.getters.getUserToken())
  }
  return Promise.resolve()
}

const afterStoreSetup = async ({ store, i18n }) => {
  store.dispatch('setLayoutWidth', windowWidth())
  store.dispatch('setLayoutHeight', windowHeight())

  FaviconService.initFaviconService()
  initServiceWorker(store)

  window.addEventListener('focus', () => updateFocus())

  const overrides = window.___pleromafe_dev_overrides || {}
  const server = (typeof overrides.target !== 'undefined') ? overrides.target : window.location.origin
  store.dispatch('setInstanceOption', { name: 'server', value: server })

  await setConfig({ store })
  try {
    await store.dispatch('applyTheme').catch((e) => { console.error('Error setting theme', e) })
  } catch (e) {
    window.splashError(e)
    return Promise.reject(e)
  }

  applyConfig(store.state.config, i18n.global)

  // Now we can try getting the server settings and logging in
  // Most of these are preloaded into the index.html so blocking is minimized
  await Promise.all([
    checkOAuthToken({ store }),
    getInstancePanel({ store }),
    getNodeInfo({ store }),
    getInstanceConfig({ store })
  ]).catch(e => Promise.reject(e))

  // Start fetching things that don't need to block the UI
  store.dispatch('fetchMutes')
  store.dispatch('startFetchingAnnouncements')
  getTOS({ store })
  getStickers({ store })

  const router = createRouter({
    history: createWebHistory(),
    routes: routes(store),
    scrollBehavior: (to, _from, savedPosition) => {
      if (to.matched.some(m => m.meta.dontScroll)) {
        return false
      }
      return savedPosition || { left: 0, top: 0 }
    }
  })

  const app = createApp(App)

  app.use(router)
  app.use(store)
  app.use(i18n)

  // Little thing to get out of invalid theme state
  window.resetThemes = () => {
    store.dispatch('resetThemeV3')
    store.dispatch('resetThemeV3Palette')
    store.dispatch('resetThemeV2')
  }

  app.use(vClickOutside)
  app.use(VBodyScrollLock)
  app.use(VueVirtualScroller)

  app.component('FAIcon', FontAwesomeIcon)
  app.component('FALayers', FontAwesomeLayers)

  // remove after vue 3.3
  app.config.unwrapInjectedRef = true

  app.mount('#app')
  return app
}

export default afterStoreSetup
