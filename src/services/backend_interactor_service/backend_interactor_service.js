import apiService, { getMastodonSocketURI, ProcessedWS } from '../api/api.service.js'
import timelineFetcher from '../timeline_fetcher/timeline_fetcher.service.js'
import notificationsFetcher from '../notifications_fetcher/notifications_fetcher.service.js'
import followRequestFetcher from '../../services/follow_request_fetcher/follow_request_fetcher.service'
import listsFetcher from '../../services/lists_fetcher/lists_fetcher.service.js'
import bookmarkFoldersFetcher from '../../services/bookmark_folders_fetcher/bookmark_folders_fetcher.service.js'

const backendInteractorService = credentials => ({
  startFetchingTimeline ({ timeline, store, userId = false, listId = false, statusId = false, bookmarkFolderId = false, tag }) {
    return timelineFetcher.startFetching({ timeline, store, credentials, userId, listId, statusId, bookmarkFolderId, tag })
  },

  fetchTimeline (args) {
    return timelineFetcher.fetchAndUpdate({ ...args, credentials })
  },

  startFetchingNotifications ({ store }) {
    return notificationsFetcher.startFetching({ store, credentials })
  },

  fetchNotifications (args) {
    return notificationsFetcher.fetchAndUpdate({ ...args, credentials })
  },

  startFetchingFollowRequests ({ store }) {
    return followRequestFetcher.startFetching({ store, credentials })
  },

  startFetchingLists ({ store }) {
    return listsFetcher.startFetching({ store, credentials })
  },

  startFetchingBookmarkFolders ({ store }) {
    return bookmarkFoldersFetcher.startFetching({ store, credentials })
  },

  startUserSocket ({ store }) {
    const serv = store.rootState.instance.server.replace('http', 'ws')
    const url = getMastodonSocketURI({}, serv)
    return ProcessedWS({ url, id: 'Unified', credentials })
  },

  ...Object.entries(apiService).reduce((acc, [key, func]) => {
    return {
      ...acc,
      [key]: (args) => func({ credentials, ...args })
    }
  }, {}),

  verifyCredentials: apiService.verifyCredentials
})

export default backendInteractorService
