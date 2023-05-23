import { createPinia, setActivePinia } from 'pinia'
import { useListsStore } from '../../../../src/stores/lists.js'
import { createStore } from 'vuex'
import apiModule from '../../../../src/modules/api.js'

setActivePinia(createPinia())
const store = useListsStore()
window.vuex = createStore({
  modules: {
    api: apiModule
  }
})

describe('The lists store', () => {
  describe('actions', () => {
    it('updates array of all lists', () => {
      store.$reset()
      const list = { id: '1', title: 'testList' }

      store.setLists([list])
      expect(store.allLists).to.have.length(1)
      expect(store.allLists).to.eql([list])
    })

    it('adds a new list with a title, updating the title for existing lists', () => {
      store.$reset()
      const list = { id: '1', title: 'testList' }
      const modList = { id: '1', title: 'anotherTestTitle' }

      store.setList({ listId: list.id, title: list.title })
      expect(store.allListsObject[list.id]).to.eql({ title: list.title, accountIds: [] })
      expect(store.allLists).to.have.length(1)
      expect(store.allLists[0]).to.eql(list)

      store.setList({ listId: modList.id, title: modList.title })
      expect(store.allListsObject[modList.id]).to.eql({ title: modList.title, accountIds: [] })
      expect(store.allLists).to.have.length(1)
      expect(store.allLists[0]).to.eql(modList)
    })

    it('adds a new list with an array of IDs, updating the IDs for existing lists', () => {
      store.$reset()
      const list = { id: '1', accountIds: ['1', '2', '3'] }
      const modList = { id: '1', accountIds: ['3', '4', '5'] }

      store.setListAccounts({ listId: list.id, accountIds: list.accountIds })
      expect(store.allListsObject[list.id].accountIds).to.eql(list.accountIds)

      store.setListAccounts({ listId: modList.id, accountIds: modList.accountIds })
      expect(store.allListsObject[modList.id].accountIds).to.eql(modList.accountIds)
    })

    it('deletes a list', () => {
      store.$patch({
        allLists: [{ id: '1', title: 'testList' }],
        allListsObject: {
          1: { title: 'testList', accountIds: ['1', '2', '3'] }
        }
      })
      const listId = '1'

      store.deleteList({ listId })
      expect(store.allLists).to.have.length(0)
      expect(store.allListsObject).to.eql({})
    })
  })

  describe('getters', () => {
    it('returns list title', () => {
      store.$patch({
        allLists: [{ id: '1', title: 'testList' }],
        allListsObject: {
          1: { title: 'testList', accountIds: ['1', '2', '3'] }
        }
      })
      const id = '1'

      expect(store.findListTitle(id)).to.eql('testList')
    })

    it('returns list accounts', () => {
      store.$patch({
        allLists: [{ id: '1', title: 'testList' }],
        allListsObject: {
          1: { title: 'testList', accountIds: ['1', '2', '3'] }
        }
      })
      const id = '1'

      expect(store.findListAccounts(id)).to.eql(['1', '2', '3'])
    })
  })
})
