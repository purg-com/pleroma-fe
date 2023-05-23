import { defineStore } from 'pinia'

export const useEditStatusStore = defineStore('editStatus', {
  state: () => ({
    params: null,
    modalActivated: false
  }),
  actions: {
    openEditStatusModal (params) {
      this.params = params
      this.modalActivated = true
    },
    closeEditStatusModal () {
      this.modalActivated = false
    }
  }
})
