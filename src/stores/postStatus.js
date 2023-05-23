import { defineStore } from 'pinia'

export const usePostStatusStore = defineStore('postStatus', {
  state: () => ({
    params: null,
    modalActivated: false
  }),
  actions: {
    openPostStatusModal (params) {
      this.params = params
      this.modalActivated = true
    },
    closePostStatusModal () {
      this.modalActivated = false
    }
  }
})
