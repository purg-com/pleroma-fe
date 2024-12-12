import Cookies from 'js-cookie'
import { applyConfig } from '../services/style_setter/style_setter.js'
import messages from '../i18n/messages'
import { set } from 'lodash'
import localeService from '../services/locale/locale.service.js'

const BACKEND_LANGUAGE_COOKIE_NAME = 'userLanguage'
const APPEARANCE_SETTINGS_KEYS = new Set([
  'sidebarColumnWidth',
  'contentColumnWidth',
  'notifsColumnWidth',
  'textSize',
  'navbarSize',
  'panelHeaderSize',
  'forcedRoundness',
  'emojiSize',
  'emojiReactionsScale'
])

const browserLocale = (window.navigator.language || 'en').split('-')[0]

/* TODO this is a bit messy.
 * We need to declare settings with their types and also deal with
 * instance-default settings in some way, hopefully try to avoid copy-pasta
 * in general.
 */
export const multiChoiceProperties = [
  'postContentType',
  'subjectLineBehavior',
  'conversationDisplay', // tree | linear
  'conversationOtherRepliesButton', // below | inside
  'mentionLinkDisplay', // short | full_for_remote | full
  'userPopoverAvatarAction' // close | zoom | open
]

export const defaultState = {
  expertLevel: 0, // used to track which settings to show and hide

  // Theme  stuff
  theme: undefined, // Very old theme store, stores preset name, still in use

  // V1
  colors: {}, // VERY old theme store, just colors of V1, probably not even used anymore

  // V2
  customTheme: undefined, // "snapshot", previously was used as actual theme store for V2 so it's still used in case of PleromaFE downgrade event.
  customThemeSource: undefined, // "source", stores original theme data

  // V3
  style: null,
  styleCustomData: null,
  palette: null,
  paletteCustomData: null,
  themeDebug: false, // debug mode that uses computed backgrounds instead of real ones to debug contrast functions
  forceThemeRecompilation: false, //  flag that forces recompilation on boot even if cache exists
  theme3hacks: { // Hacks, user overrides that are independent of theme used
    underlay: 'none',
    fonts: {
      interface: undefined,
      input: undefined,
      post: undefined,
      monospace: undefined
    }
  },

  hideISP: false,
  hideInstanceWallpaper: false,
  hideShoutbox: false,
  // bad name: actually hides posts of muted USERS
  hideMutedPosts: undefined, // instance default
  hideMutedThreads: undefined, // instance default
  hideWordFilteredPosts: undefined, // instance default
  muteBotStatuses: undefined, // instance default
  muteSensitiveStatuses: undefined, // instance default
  collapseMessageWithSubject: undefined, // instance default
  padEmoji: true,
  hideAttachments: false,
  hideAttachmentsInConv: false,
  hideScrobbles: false,
  hideScrobblesAfter: '2d',
  maxThumbnails: 16,
  hideNsfw: true,
  preloadImage: true,
  loopVideo: true,
  loopVideoSilentOnly: true,
  streaming: false,
  emojiReactionsOnTimeline: true,
  alwaysShowNewPostButton: false,
  autohideFloatingPostButton: false,
  pauseOnUnfocused: true,
  stopGifs: true,
  replyVisibility: 'all',
  thirdColumnMode: 'notifications',
  notificationVisibility: {
    follows: true,
    mentions: true,
    statuses: true,
    likes: true,
    repeats: true,
    moves: true,
    emojiReactions: true,
    followRequest: true,
    reports: true,
    chatMention: true,
    polls: true
  },
  notificationNative: {
    follows: true,
    mentions: true,
    statuses: true,
    likes: false,
    repeats: false,
    moves: false,
    emojiReactions: false,
    followRequest: true,
    reports: true,
    chatMention: true,
    polls: true
  },
  webPushNotifications: false,
  webPushAlwaysShowNotifications: false,
  muteWords: [],
  highlight: {},
  interfaceLanguage: browserLocale,
  hideScopeNotice: false,
  useStreamingApi: false,
  sidebarRight: undefined, // instance default
  scopeCopy: undefined, // instance default
  subjectLineBehavior: undefined, // instance default
  alwaysShowSubjectInput: undefined, // instance default
  postContentType: undefined, // instance default
  minimalScopesMode: undefined, // instance default
  // This hides statuses filtered via a word filter
  hideFilteredStatuses: undefined, // instance default
  modalOnRepeat: undefined, // instance default
  modalOnUnfollow: undefined, // instance default
  modalOnBlock: undefined, // instance default
  modalOnMute: undefined, // instance default
  modalOnDelete: undefined, // instance default
  modalOnLogout: undefined, // instance default
  modalOnApproveFollow: undefined, // instance default
  modalOnDenyFollow: undefined, // instance default
  modalOnRemoveUserFromFollowers: undefined, // instance default
  playVideosInModal: false,
  useOneClickNsfw: false,
  useContainFit: true,
  disableStickyHeaders: false,
  showScrollbars: false,
  userPopoverAvatarAction: 'open',
  userPopoverOverlay: false,
  sidebarColumnWidth: '25rem',
  contentColumnWidth: '45rem',
  notifsColumnWidth: '25rem',
  emojiReactionsScale: undefined,
  textSize: undefined, // instance default
  emojiSize: undefined, // instance default
  navbarSize: undefined, // instance default
  panelHeaderSize: undefined, // instance default
  forcedRoundness: undefined, // instance default
  navbarColumnStretch: false,
  greentext: undefined, // instance default
  useAtIcon: undefined, // instance default
  mentionLinkDisplay: undefined, // instance default
  mentionLinkShowTooltip: undefined, // instance default
  mentionLinkShowAvatar: undefined, // instance default
  mentionLinkFadeDomain: undefined, // instance default
  mentionLinkShowYous: undefined, // instance default
  mentionLinkBoldenYou: undefined, // instance default
  hidePostStats: undefined, // instance default
  hideBotIndication: undefined, // instance default
  hideUserStats: undefined, // instance default
  virtualScrolling: undefined, // instance default
  sensitiveByDefault: undefined, // instance default
  conversationDisplay: undefined, // instance default
  conversationTreeAdvanced: undefined, // instance default
  conversationOtherRepliesButton: undefined, // instance default
  conversationTreeFadeAncestors: undefined, // instance default
  showExtraNotifications: undefined, // instance default
  showExtraNotificationsTip: undefined, // instance default
  showChatsInExtraNotifications: undefined, // instance default
  showAnnouncementsInExtraNotifications: undefined, // instance default
  showFollowRequestsInExtraNotifications: undefined, // instance default
  maxDepthInThread: undefined, // instance default
  autocompleteSelect: undefined, // instance default
  closingDrawerMarksAsSeen: undefined, // instance default
  unseenAtTop: undefined, // instance default
  ignoreInactionableSeen: undefined, // instance default
  useAbsoluteTimeFormat: undefined, // instance default
  absoluteTimeFormatMinAge: undefined // instance default
}

// caching the instance default properties
export const instanceDefaultProperties = Object.entries(defaultState)
  .filter(([key, value]) => value === undefined)
  .map(([key, value]) => key)

const config = {
  state: { ...defaultState },
  getters: {
    defaultConfig (state, getters, rootState, rootGetters) {
      const { instance } = rootState
      return {
        ...defaultState,
        ...Object.fromEntries(
          instanceDefaultProperties.map(key => [key, instance[key]])
        )
      }
    },
    mergedConfig (state, getters, rootState, rootGetters) {
      const { defaultConfig } = rootGetters
      return {
        ...defaultConfig,
        // Do not override with undefined
        ...Object.fromEntries(Object.entries(state).filter(([k, v]) => v !== undefined))
      }
    }
  },
  mutations: {
    setOptionTemporarily (state, { name, value }) {
      set(state, name, value)
      applyConfig(state)
    },
    setOption (state, { name, value }) {
      set(state, name, value)
    },
    setHighlight (state, { user, color, type }) {
      const data = this.state.config.highlight[user]
      if (color || type) {
        state.highlight[user] = { color: color || data.color, type: type || data.type }
      } else {
        delete state.highlight[user]
      }
    }
  },
  actions: {
    loadSettings ({ dispatch }, data) {
      const knownKeys = new Set(Object.keys(defaultState))
      const presentKeys = new Set(Object.keys(data))
      const intersection = new Set()
      for (const elem of presentKeys) {
        if (knownKeys.has(elem)) {
          intersection.add(elem)
        }
      }

      intersection.forEach(
        name => dispatch('setOption', { name, value: data[name] })
      )
    },
    setHighlight ({ commit, dispatch }, { user, color, type }) {
      commit('setHighlight', { user, color, type })
    },
    setOptionTemporarily ({ commit, dispatch, state, rootState }, { name, value }) {
      if (rootState.interface.temporaryChangesTimeoutId !== null) {
        console.warn('Can\'t track more than one temporary change')
        return
      }
      const oldValue = state[name]

      commit('setOptionTemporarily', { name, value })

      const confirm = () => {
        dispatch('setOption', { name, value })
        commit('clearTemporaryChanges')
      }

      const revert = () => {
        commit('setOptionTemporarily', { name, value: oldValue })
        commit('clearTemporaryChanges')
      }

      commit('setTemporaryChanges', {
        timeoutId: setTimeout(revert, 10000),
        confirm,
        revert
      })
    },
    setThemeV2 ({ commit, dispatch }, { customTheme, customThemeSource }) {
      commit('setOption', { name: 'theme', value: 'custom' })
      commit('setOption', { name: 'customTheme', value: customTheme })
      commit('setOption', { name: 'customThemeSource', value: customThemeSource })
      dispatch('setTheme', { themeData: customThemeSource, recompile: true })
    },
    setOption ({ commit, dispatch, state }, { name, value }) {
      const exceptions = new Set([
        'useStreamingApi'
      ])

      if (exceptions.has(name)) {
        switch (name) {
          case 'useStreamingApi': {
            const action = value ? 'enableMastoSockets' : 'disableMastoSockets'

            dispatch(action).then(() => {
              commit('setOption', { name: 'useStreamingApi', value })
            }).catch((e) => {
              console.error('Failed starting MastoAPI Streaming socket', e)
              dispatch('disableMastoSockets')
              dispatch('setOption', { name: 'useStreamingApi', value: false })
            })
            break
          }
        }
      } else {
        commit('setOption', { name, value })
        if (APPEARANCE_SETTINGS_KEYS.has(name)) {
          applyConfig(state)
        }
        if (name.startsWith('theme3hacks')) {
          dispatch('setTheme', { recompile: true })
        }
        switch (name) {
          case 'theme':
            if (value === 'custom') break
            dispatch('setTheme', { themeName: value, recompile: true, saveData: true })
            break
          case 'themeDebug': {
            dispatch('setTheme', { recompile: true })
            break
          }
          case 'interfaceLanguage':
            messages.setLanguage(this.getters.i18n, value)
            dispatch('loadUnicodeEmojiData', value)
            Cookies.set(
              BACKEND_LANGUAGE_COOKIE_NAME,
              localeService.internalToBackendLocaleMulti(value)
            )
            break
          case 'thirdColumnMode':
            dispatch('setLayoutWidth', undefined)
            break
        }
      }
    }
  }
}

export default config
