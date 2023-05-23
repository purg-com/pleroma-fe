import { defineStore } from 'pinia'

const FETCH_ANNOUNCEMENT_INTERVAL_MS = 1000 * 60 * 5

export const useAnnouncementsStore = defineStore('announcements', {
  state: () => ({
    announcements: [],
    supportsAnnouncements: true,
    fetchAnnouncementsTimer: undefined
  }),
  getters: {
    unreadAnnouncementCount () {
      if (!window.vuex.state.users.currentUser) {
        return 0
      }

      const unread = this.announcements.filter(announcement => !(announcement.inactive || announcement.read))
      return unread.length
    }
  },
  actions: {
    fetchAnnouncements () {
      if (!this.supportsAnnouncements) {
        return Promise.resolve()
      }

      const currentUser = window.vuex.state.users.currentUser
      const isAdmin = currentUser && currentUser.privileges.includes('announcements_manage_announcements')

      const getAnnouncements = async () => {
        if (!isAdmin) {
          return window.vuex.state.api.backendInteractor.fetchAnnouncements()
        }

        const all = await window.vuex.state.api.backendInteractor.adminFetchAnnouncements()
        const visible = await window.vuex.state.api.backendInteractor.fetchAnnouncements()
        const visibleObject = visible.reduce((a, c) => {
          a[c.id] = c
          return a
        }, {})
        const getWithinVisible = announcement => visibleObject[announcement.id]

        all.forEach(announcement => {
          const visibleAnnouncement = getWithinVisible(announcement)
          if (!visibleAnnouncement) {
            announcement.inactive = true
          } else {
            announcement.read = visibleAnnouncement.read
          }
        })

        return all
      }

      return getAnnouncements()
        .then(announcements => {
          this.announcements = announcements
        })
        .catch(error => {
          // If and only if backend does not support announcements, it would return 404.
          // In this case, silently ignores it.
          if (error && error.statusCode === 404) {
            this.supportsAnnouncements = false
          } else {
            throw error
          }
        })
    },
    markAnnouncementAsRead (id) {
      return window.vuex.state.api.backendInteractor.dismissAnnouncement({ id })
        .then(() => {
          const index = this.announcements.findIndex(a => a.id === id)

          if (index < 0) {
            return
          }

          this.announcements[index].read = true
        })
    },
    startFetchingAnnouncements () {
      if (this.fetchAnnouncementsTimer) {
        return
      }

      const interval = setInterval(() => this.fetchAnnouncements(), FETCH_ANNOUNCEMENT_INTERVAL_MS)
      this.fetchAnnouncementsTimer = interval

      return this.fetchAnnouncements()
    },
    stopFetchingAnnouncements () {
      const interval = this.fetchAnnouncementsTimer
      this.fetchAnnouncementsTimer = undefined
      clearInterval(interval)
    },
    postAnnouncement ({ content, startsAt, endsAt, allDay }) {
      return window.vuex.state.api.backendInteractor.postAnnouncement({ content, startsAt, endsAt, allDay })
        .then(() => {
          return this.fetchAnnouncements()
        })
    },
    editAnnouncement ({ id, content, startsAt, endsAt, allDay }) {
      return window.vuex.state.api.backendInteractor.editAnnouncement({ id, content, startsAt, endsAt, allDay })
        .then(() => {
          return this.fetchAnnouncements()
        })
    },
    deleteAnnouncement (id) {
      return window.vuex.state.api.backendInteractor.deleteAnnouncement({ id })
        .then(() => {
          return this.fetchAnnouncements()
        })
    }
  }
})
