import { defineStore } from 'pinia'

export const useInterfaceStore = defineStore('interface', {
  state: () => ({
    settingsModalState: 'hidden',
    settingsModalLoaded: false,
    settingsModalTargetTab: null,
    settings: {
      currentSaveStateNotice: null,
      noticeClearTimeout: null,
      notificationPermission: null
    },
    browserSupport: {
      cssFilter: window.CSS && window.CSS.supports && (
        window.CSS.supports('filter', 'drop-shadow(0 0)') ||
        window.CSS.supports('-webkit-filter', 'drop-shadow(0 0)')
      )
    },
    layoutType: 'normal',
    globalNotices: [],
    layoutHeight: 0,
    lastTimeline: null
  }),
  actions: {
    setPageTitle (option = '') {
      try {
        document.title = `${option} ${window.vuex.state.instance.name}`
      } catch (error) {
        console.error(`${error}`)
      }
    },
    settingsSaved ({ success, error }) {
      if (success) {
        if (this.noticeClearTimeout) {
          clearTimeout(this.noticeClearTimeout)
        }
        this.settings.currentSaveStateNotice = { error: false, data: success }
        this.settings.noticeClearTimeout = setTimeout(() => delete this.settings.currentSaveStateNotice, 2000)
      } else {
        this.settings.currentSaveStateNotice = { error: true, errorData: error }
      }
    },
    setNotificationPermission (permission) {
      this.notificationPermission = permission
    },
    closeSettingsModal () {
      this.settingsModalState = 'hidden'
    },
    openSettingsModal () {
      this.settingsModalState = 'visible'
      if (!this.settingsModalLoaded) {
        this.settingsModalLoaded = true
      }
    },
    togglePeekSettingsModal () {
      switch (this.settingsModalState) {
        case 'minimized':
          this.settingsModalState = 'visible'
          return
        case 'visible':
          this.settingsModalState = 'minimized'
          return
        default:
          throw new Error('Illegal minimization state of settings modal')
      }
    },
    clearSettingsModalTargetTab () {
      this.settingsModalTargetTab = null
    },
    openSettingsModalTab (value) {
      this.settingsModalTargetTab = value
      this.openSettingsModal()
    },
    removeGlobalNotice (notice) {
      this.globalNotices = this.globalNotices.filter(n => n !== notice)
    },
    pushGlobalNotice (
      {
        messageKey,
        messageArgs = {},
        level = 'error',
        timeout = 0
      }) {
      const notice = {
        messageKey,
        messageArgs,
        level
      }

      this.globalNotices.push(notice)

      // Adding a new element to array wraps it in a Proxy, which breaks the comparison
      // TODO: Generate UUID or something instead or relying on !== operator?
      const newNotice = this.globalNotices[this.globalNotices.length - 1]
      if (timeout) {
        setTimeout(() => this.removeGlobalNotice(newNotice), timeout)
      }

      return newNotice
    },
    setLayoutHeight (value) {
      this.layoutHeight = value
    },
    setLayoutWidth (value) {
      let width = value
      if (value !== undefined) {
        this.layoutWidth = value
      } else {
        width = this.layoutWidth
      }

      const mobileLayout = width <= 800
      const normalOrMobile = mobileLayout ? 'mobile' : 'normal'
      const { thirdColumnMode } = window.vuex.getters.mergedConfig
      if (thirdColumnMode === 'none' || !window.vuex.state.users.currentUser) {
        this.layoutType = normalOrMobile
      } else {
        const wideLayout = width >= 1300
        this.layoutType = wideLayout ? 'wide' : normalOrMobile
      }
    },
    setLastTimeline (value) {
      this.lastTimeline = value
    }
  }
})
