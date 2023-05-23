import { defineStore } from 'pinia'

export const useStatusHistoryStore = defineStore('statusHistory', {
  state: () => ({
    params: {},
    modalActivated: false
  }),
  actions: {
    openStatusHistoryModal (params) {
      this.params = params
      this.modalActivated = true
    },
    closeStatusHistoryModal () {
      this.modalActivated = false
    }
  }
})
