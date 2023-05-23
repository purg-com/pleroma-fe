import { defineStore } from 'pinia'

import { remove, find } from 'lodash'

export const useListsStore = defineStore('lists', {
  state: () => ({
    allLists: [],
    allListsObject: {}
  }),
  getters: {
    findListTitle (state) {
      return (id) => {
        if (!this.allListsObject[id]) return
        return this.allListsObject[id].title
      }
    },
    findListAccounts (state) {
      return (id) => [...this.allListsObject[id].accountIds]
    }
  },
  actions: {
    setLists (value) {
      this.allLists = value
    },
    createList ({ title }) {
      return window.vuex.state.api.backendInteractor.createList({ title })
        .then((list) => {
          this.setList({ listId: list.id, title })
          return list
        })
    },
    fetchList ({ listId }) {
      return window.vuex.state.api.backendInteractor.getList({ listId })
        .then((list) => this.setList({ listId: list.id, title: list.title }))
    },
    fetchListAccounts ({ listId }) {
      return window.vuex.state.api.backendInteractor.getListAccounts({ listId })
        .then((accountIds) => {
          if (!this.allListsObject[listId]) {
            this.allListsObject[listId] = { accountIds: [] }
          }
          this.allListsObject[listId].accountIds = accountIds
        })
    },
    setList ({ listId, title }) {
      if (!this.allListsObject[listId]) {
        this.allListsObject[listId] = { accountIds: [] }
      }
      this.allListsObject[listId].title = title

      const entry = find(this.allLists, { id: listId })
      if (!entry) {
        this.allLists.push({ id: listId, title })
      } else {
        entry.title = title
      }
    },
    setListAccounts ({ listId, accountIds }) {
      const saved = this.allListsObject[listId].accountIds || []
      const added = accountIds.filter(id => !saved.includes(id))
      const removed = saved.filter(id => !accountIds.includes(id))
      if (!this.allListsObject[listId]) {
        this.allListsObject[listId] = { accountIds: [] }
      }
      this.allListsObject[listId].accountIds = accountIds
      if (added.length > 0) {
        window.vuex.state.api.backendInteractor.addAccountsToList({ listId, accountIds: added })
      }
      if (removed.length > 0) {
        window.vuex.state.api.backendInteractor.removeAccountsFromList({ listId, accountIds: removed })
      }
    },
    addListAccount ({ listId, accountId }) {
      return window.vuex.state
        .api
        .backendInteractor
        .addAccountsToList({ listId, accountIds: [accountId] })
        .then((result) => {
          if (!this.allListsObject[listId]) {
            this.allListsObject[listId] = { accountIds: [] }
          }
          this.allListsObject[listId].accountIds.push(accountId)
          return result
        })
    },
    removeListAccount ({ listId, accountId }) {
      return window.vuex.state
        .api
        .backendInteractor
        .removeAccountsFromList({ listId, accountIds: [accountId] })
        .then((result) => {
          if (!this.allListsObject[listId]) {
            this.allListsObject[listId] = { accountIds: [] }
          }
          const { accountIds } = this.allListsObject[listId]
          const set = new Set(accountIds)
          set.delete(accountId)
          this.allListsObject[listId].accountIds = [...set]

          return result
        })
    },
    deleteList ({ listId }) {
      window.vuex.state.api.backendInteractor.deleteList({ listId })

      delete this.allListsObject[listId]
      remove(this.allLists, list => list.id === listId)
    }
  }
})
