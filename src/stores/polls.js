import { merge } from 'lodash'
import { defineStore } from 'pinia'

export const usePollsStore = defineStore('polls', {
  state: () => ({
    // Contains key = id, value = number of trackers for this poll
    trackedPolls: {},
    pollsObject: {}
  }),
  actions: {
    mergeOrAddPoll (poll) {
      const existingPoll = this.pollsObject[poll.id]
      // Make expired-state change trigger re-renders properly
      poll.expired = Date.now() > Date.parse(poll.expires_at)
      if (existingPoll) {
        this.pollsObject[poll.id] = merge(existingPoll, poll)
      } else {
        this.pollsObject[poll.id] = poll
      }
    },
    updateTrackedPoll (pollId) {
      window.vuex.state.api.backendInteractor.fetchPoll({ pollId }).then(poll => {
        setTimeout(() => {
          if (this.trackedPolls[pollId]) {
            this.updateTrackedPoll(pollId)
          }
        }, 30 * 1000)
        this.mergeOrAddPoll(poll)
      })
    },
    trackPoll (pollId) {
      if (!this.trackedPolls[pollId]) {
        setTimeout(() => this.updateTrackedPoll(pollId), 30 * 1000)
      }
      const currentValue = this.trackedPolls[pollId]
      if (currentValue) {
        this.trackedPolls[pollId] = currentValue + 1
      } else {
        this.trackedPolls[pollId] = 1
      }
    },
    untrackPoll (pollId) {
      const currentValue = this.trackedPolls[pollId]
      if (currentValue) {
        this.trackedPolls[pollId] = currentValue - 1
      } else {
        this.trackedPolls[pollId] = 0
      }
    },
    votePoll ({ id, pollId, choices }) {
      return window.vuex.state.api.backendInteractor.vote({ pollId, choices }).then(poll => {
        this.mergeOrAddPoll(poll)
        return poll
      })
    }
  }
})
