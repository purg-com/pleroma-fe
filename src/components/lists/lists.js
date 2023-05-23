import { useListsStore } from '../../stores/lists'
import ListsCard from '../lists_card/lists_card.vue'

const Lists = {
  data () {
    return {
      isNew: false
    }
  },
  components: {
    ListsCard
  },
  computed: {
    lists () {
      return useListsStore().allLists
    }
  },
  methods: {
    cancelNewList () {
      this.isNew = false
    },
    newList () {
      this.isNew = true
    }
  }
}

export default Lists
