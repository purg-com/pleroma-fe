import { storage } from 'src/lib/storage.js'

export const defaultState = {
  drafts: {}
}

export const mutations = {
  addOrSaveDraft (state, { draft }) {
    state.drafts[draft.id] = draft
  },
  abandonDraft (state, { id }) {
    delete state.drafts[id]
  },
  loadDrafts (state, data) {
    state.drafts = data
  }
}

const storageKey = 'pleroma-fe-drafts'

/*
 * Note: we do not use the persist state plugin because
 * it is not impossible for a user to have two windows at
 * the same time. The persist state plugin is just overriding
 * everything with the current state. This isn't good because
 * if a draft is created in one window and another draft is
 * created in another, the draft in the first window will just
 * be overriden.
 * Here, we can't guarantee 100% atomicity unless one uses
 * different keys, which will just pollute the whole storage.
 * It is indeed best to have backend support for this.
 */
const getStorageData = async () => ((await storage.getItem(storageKey)) || {})

const saveDraftToStorage = async (draft) => {
  const currentData = await getStorageData()
  currentData[draft.id] = JSON.parse(JSON.stringify(draft))
  await storage.setItem(storageKey, currentData)
}

const deleteDraftFromStorage = async (id) => {
  const currentData = await getStorageData()
  delete currentData[id]
  await storage.setItem(storageKey, currentData)
}

export const actions = {
  async addOrSaveDraft (store, { draft }) {
    const id = draft.id || (new Date().getTime()).toString()
    const draftWithId = { ...draft, id }
    store.commit('addOrSaveDraft', { draft: draftWithId })
    await saveDraftToStorage(draftWithId)
    return id
  },
  async abandonDraft (store, { id }) {
    store.commit('abandonDraft', { id })
    await deleteDraftFromStorage(id)
  },
  async loadDrafts (store) {
    const currentData = await getStorageData()
    store.commit('loadDrafts', currentData)
  }
}

export const getters = {
  draftsByTypeAndRefId (state) {
    return (type, refId) => {
      return Object.values(state.drafts).filter(draft => draft.type === type && draft.refId === refId)
    }
  },
  draftsArray (state) {
    return Object.values(state.drafts)
  },
  draftCount (state) {
    return Object.values(state.drafts).length
  }
}

const drafts = {
  state: defaultState,
  mutations,
  getters,
  actions
}

export default drafts
