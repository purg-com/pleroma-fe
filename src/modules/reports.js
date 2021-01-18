import backendInteractorService from '../services/backend_interactor_service/backend_interactor_service.js'
import filter from 'lodash/filter'

const reports = {
  state: {
    reportModal: {
      userId: null,
      statuses: [],
      preTickedIds: [],
      activated: false
    },
    reports: {}
  },
  mutations: {
    openUserReportingModal (state, { userId, statuses, preTickedIds }) {
      state.reportModal.userId = userId
      state.reportModal.statuses = statuses
      state.reportModal.preTickedIds = preTickedIds
      state.reportModal.activated = true
    },
    closeUserReportingModal (state) {
      state.reportModal.modalActivated = false
    },
    setReportState (reportsState, { id, state }) {
      reportsState.reports[id].state = state
    },
    addReport (state, report) {
      state.reports[report.id] = report
    }
  },
  actions: {
    openUserReportingModal ({ rootState, commit }, { userId, statusIds = [] }) {
      const preTickedStatuses = statusIds.map(id => rootState.statuses.allStatusesObject[id])
      const preTickedIds = statusIds
      const statuses = preTickedStatuses.concat(
        filter(rootState.statuses.allStatuses,
          status => status.user.id === userId && !preTickedIds.includes(status.id)
        )
      )
      commit('openUserReportingModal', { userId, statuses, preTickedIds })
    },
    closeUserReportingModal ({ commit }) {
      commit('closeUserReportingModal')
    },
    setReportState ({ commit, rootState }, { id, state }) {
      const oldState = rootState.reports.reports[id].state
      commit('setReportState', { id, state })
      backendInteractorService.setReportState({ id, state }).then(report => {
        console.log(report)
      }).catch(e => {
        console.error('Failed to set report state', e)
        commit('setReportState', { id, oldState })
      })
    },
    addReport ({ commit }, report) {
      commit('addReport', report)
    }
  }
}

export default reports
