import { createStore } from 'vuex'
import { createPinia } from 'pinia'

import 'custom-event-polyfill'
import './lib/event_target_polyfill.js'

import instanceModule from './modules/instance.js'
import statusesModule from './modules/statuses.js'
import usersModule from './modules/users.js'
import apiModule from './modules/api.js'
import configModule from './modules/config.js'
import serverSideConfigModule from './modules/serverSideConfig.js'
import serverSideStorageModule from './modules/serverSideStorage.js'
import oauthModule from './modules/oauth.js'
import authFlowModule from './modules/auth_flow.js'
import oauthTokensModule from './modules/oauth_tokens.js'

import chatsModule from './modules/chats.js'

import { createI18n } from 'vue-i18n'

import createPersistedState from './lib/persisted_state.js'
import pushNotifications from './lib/push_notifications_plugin.js'

import messages from './i18n/messages.js'

import afterStoreSetup from './boot/after_store.js'

const currentLocale = (window.navigator.language || 'en').split('-')[0]

const i18n = createI18n({
  // By default, use the browser locale, we will update it if neccessary
  locale: 'en',
  fallbackLocale: 'en',
  messages: messages.default
})

messages.setLanguage(i18n.global, currentLocale)

const persistedStateOptions = {
  paths: [
    'serverSideStorage.cache',
    'config',
    'users.lastLoginName',
    'oauth'
  ]
};

(async () => {
  let storageError = false
  const plugins = [pushNotifications]
  const pinia = createPinia()
  try {
    const persistedState = await createPersistedState(persistedStateOptions)
    plugins.push(persistedState)
  } catch (e) {
    console.error(e)
    storageError = true
  }

  // Temporarily storing as a global variable while we migrate to Pinia
  window.vuex = createStore({
    modules: {
      instance: instanceModule,
      // TODO refactor users/statuses modules, they depend on each other
      users: usersModule,
      statuses: statusesModule,
      api: apiModule,
      config: configModule,
      serverSideConfig: serverSideConfigModule,
      serverSideStorage: serverSideStorageModule,
      oauth: oauthModule,
      authFlow: authFlowModule,
      oauthTokens: oauthTokensModule,
      chats: chatsModule
    },
    plugins,
    strict: false // Socket modifies itself, let's ignore this for now.
    // strict: process.env.NODE_ENV !== 'production'
  })

  const store = window.vuex

  // Temporarily passing pinia and vuex stores along with storageError result until migration is fully complete.
  afterStoreSetup({ pinia, store, storageError, i18n })
})()

// These are inlined by webpack's DefinePlugin
/* eslint-disable */
window.___pleromafe_mode = process.env
window.___pleromafe_commit_hash = COMMIT_HASH
window.___pleromafe_dev_overrides = DEV_OVERRIDES
