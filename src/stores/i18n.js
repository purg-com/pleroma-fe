import { defineStore } from 'pinia'

export const useI18nStore = defineStore('i18n', {
  state: () => ({
    i18n: null
  }),
  actions: {
    setI18n (newI18n) {
      this.$patch({
        i18n: newI18n.global
      })
    }
  }
})
