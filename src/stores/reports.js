import { defineStore } from 'pinia'

import filter from 'lodash/filter'
import { useInterfaceStore } from '../stores/interface'

export const useReportsStore = defineStore('reports', {
  state: () => ({
    reportModal: {
      userId: null,
      statuses: [],
      preTickedIds: [],
      activated: false
    },
    reports: {}
  }),
  actions: {
    openUserReportingModal ({ userId, statusIds = [] }) {
      const preTickedStatuses = statusIds.map(id => window.vuex.state.statuses.allStatusesObject[id])
      const preTickedIds = statusIds
      const statuses = preTickedStatuses.concat(
        filter(window.vuex.state.statuses.allStatuses,
          status => status.user.id === userId && !preTickedIds.includes(status.id)
        )
      )

      this.reportModal.userId = userId
      this.reportModal.statuses = statuses
      this.reportModal.preTickedIds = preTickedIds
      this.reportModal.activated = true
    },
    closeUserReportingModal () {
      this.reportModal.activated = false
    },
    setReportState ({ id, state }) {
      const oldState = window.vuex.state.reports.reports[id].state
      this.reports[id].state = state
      window.vuex.state.api.backendInteractor.setReportState({ id, state }).catch(e => {
        console.error('Failed to set report state', e)
        useInterfaceStore().pushGlobalNotice({
          level: 'error',
          messageKey: 'general.generic_error_message',
          messageArgs: [e.message],
          timeout: 5000
        })
        this.reports[id].state = oldState
      })
    },
    addReport (report) {
      this.reports[report.id] = report
    }
  }
})
