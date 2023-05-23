import { mapState } from 'vuex'
import { mapState as mapPiniaState } from 'pinia'
import NavigationEntry from 'src/components/navigation/navigation_entry.vue'
import { getListEntries } from 'src/components/navigation/filter.js'
import { useListsStore } from '../../stores/lists'

export const ListsMenuContent = {
  props: [
    'showPin'
  ],
  components: {
    NavigationEntry
  },
  computed: {
    ...mapPiniaState(useListsStore, {
      lists: getListEntries
    }),
    ...mapState({
      currentUser: state => state.users.currentUser,
      privateMode: state => state.instance.private,
      federating: state => state.instance.federating
    })
  }
}

export default ListsMenuContent
