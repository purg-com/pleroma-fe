import Vue from 'vue'
import VueRouter from 'vue-router'
import routes from './routes'

import App from '../App.vue'

const afterStoreSetup = ({ store, i18n }) => {
  window.fetch('/api/statusnet/config.json')
    .then((res) => res.json())
    .then((data) => {
      const { name, closed: registrationClosed, textlimit, uploadlimit, server, vapidPublicKey } = data.site

      store.dispatch('setInstanceOption', { name: 'name', value: name })
      store.dispatch('setInstanceOption', { name: 'registrationOpen', value: (registrationClosed === '0') })
      store.dispatch('setInstanceOption', { name: 'textlimit', value: parseInt(textlimit) })
      store.dispatch('setInstanceOption', { name: 'uploadlimit', value: parseInt(uploadlimit.uploadlimit) })
      store.dispatch('setInstanceOption', { name: 'avatarlimit', value: parseInt(uploadlimit.avatarlimit) })
      store.dispatch('setInstanceOption', { name: 'backgroundlimit', value: parseInt(uploadlimit.backgroundlimit) })
      store.dispatch('setInstanceOption', { name: 'bannerlimit', value: parseInt(uploadlimit.bannerlimit) })
      store.dispatch('setInstanceOption', { name: 'server', value: server })

      if (data.nsfwCensorImage) {
        store.dispatch('setInstanceOption', { name: 'nsfwCensorImage', value: data.nsfwCensorImage })
      }

      if (vapidPublicKey) {
        store.dispatch('setInstanceOption', { name: 'vapidPublicKey', value: vapidPublicKey })
      }

      var apiConfig = data.site.pleromafe

      window.fetch('/static/config.json')
        .then((res) => res.json())
        .catch((err) => {
          console.warn('Failed to load static/config.json, continuing without it.')
          console.warn(err)
          return {}
        })
        .then((staticConfig) => {
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

          var theme = (config.theme)
          var background = (config.background)
          var hidePostStats = (config.hidePostStats)
          var hideUserStats = (config.hideUserStats)
          var logo = (config.logo)
          var logoMask = (typeof config.logoMask === 'undefined' ? true : config.logoMask)
          var logoMargin = (typeof config.logoMargin === 'undefined' ? 0 : config.logoMargin)
          var redirectRootNoLogin = (config.redirectRootNoLogin)
          var redirectRootLogin = (config.redirectRootLogin)
          var chatDisabled = (config.chatDisabled)
          var showInstanceSpecificPanel = (config.showInstanceSpecificPanel)
          var scopeOptionsEnabled = (config.scopeOptionsEnabled)
          var formattingOptionsEnabled = (config.formattingOptionsEnabled)
          var collapseMessageWithSubject = (config.collapseMessageWithSubject)
          var loginMethod = (config.loginMethod)
          var scopeCopy = (config.scopeCopy)
          var subjectLineBehavior = (config.subjectLineBehavior)
          var alwaysShowSubjectInput = (config.alwaysShowSubjectInput)

          store.dispatch('setInstanceOption', { name: 'theme', value: theme })
          store.dispatch('setInstanceOption', { name: 'background', value: background })
          store.dispatch('setInstanceOption', { name: 'hidePostStats', value: hidePostStats })
          store.dispatch('setInstanceOption', { name: 'hideUserStats', value: hideUserStats })
          store.dispatch('setInstanceOption', { name: 'logo', value: logo })
          store.dispatch('setInstanceOption', { name: 'logoMask', value: logoMask })
          store.dispatch('setInstanceOption', { name: 'logoMargin', value: logoMargin })
          store.dispatch('setInstanceOption', { name: 'redirectRootNoLogin', value: redirectRootNoLogin })
          store.dispatch('setInstanceOption', { name: 'redirectRootLogin', value: redirectRootLogin })
          store.dispatch('setInstanceOption', { name: 'showInstanceSpecificPanel', value: showInstanceSpecificPanel })
          store.dispatch('setInstanceOption', { name: 'scopeOptionsEnabled', value: scopeOptionsEnabled })
          store.dispatch('setInstanceOption', { name: 'formattingOptionsEnabled', value: formattingOptionsEnabled })
          store.dispatch('setInstanceOption', { name: 'collapseMessageWithSubject', value: collapseMessageWithSubject })
          store.dispatch('setInstanceOption', { name: 'loginMethod', value: loginMethod })
          store.dispatch('setInstanceOption', { name: 'scopeCopy', value: scopeCopy })
          store.dispatch('setInstanceOption', { name: 'subjectLineBehavior', value: subjectLineBehavior })
          store.dispatch('setInstanceOption', { name: 'alwaysShowSubjectInput', value: alwaysShowSubjectInput })
          if (chatDisabled) {
            store.dispatch('disableChat')
          }

          const router = new VueRouter({
            mode: 'history',
            routes: routes(store),
            scrollBehavior: (to, _from, savedPosition) => {
              if (to.matched.some(m => m.meta.dontScroll)) {
                return false
              }
              return savedPosition || { x: 0, y: 0 }
            }
          })

          /* eslint-disable no-new */
          new Vue({
            router,
            store,
            i18n,
            el: '#app',
            render: h => h(App)
          })
        })
    })

  window.fetch('/static/terms-of-service.html')
    .then((res) => res.text())
    .then((html) => {
      store.dispatch('setInstanceOption', { name: 'tos', value: html })
    })

  window.fetch('/api/pleroma/emoji.json')
    .then(
      (res) => res.json()
        .then(
          (values) => {
            const emoji = Object.keys(values).map((key) => {
              return { shortcode: key, image_url: values[key] }
            })
            store.dispatch('setInstanceOption', { name: 'customEmoji', value: emoji })
            store.dispatch('setInstanceOption', { name: 'pleromaBackend', value: true })
          },
          (failure) => {
            store.dispatch('setInstanceOption', { name: 'pleromaBackend', value: false })
          }
        ),
      (error) => console.log(error)
    )

  window.fetch('/static/emoji.json')
    .then((res) => res.json())
    .then((values) => {
      const emoji = Object.keys(values).map((key) => {
        return { shortcode: key, image_url: false, 'utf': values[key] }
      })
      store.dispatch('setInstanceOption', { name: 'emoji', value: emoji })
    })

  window.fetch('/instance/panel.html')
    .then((res) => res.text())
    .then((html) => {
      store.dispatch('setInstanceOption', { name: 'instanceSpecificPanelContent', value: html })
    })

  window.fetch('/nodeinfo/2.0.json')
    .then((res) => res.json())
    .then((data) => {
      const metadata = data.metadata

      const features = metadata.features
      store.dispatch('setInstanceOption', { name: 'mediaProxyAvailable', value: features.includes('media_proxy') })
      store.dispatch('setInstanceOption', { name: 'chatAvailable', value: features.includes('chat') })
      store.dispatch('setInstanceOption', { name: 'gopherAvailable', value: features.includes('gopher') })

      const suggestions = metadata.suggestions
      store.dispatch('setInstanceOption', { name: 'suggestionsEnabled', value: suggestions.enabled })
      store.dispatch('setInstanceOption', { name: 'suggestionsWeb', value: suggestions.web })
    })
}

export default afterStoreSetup
