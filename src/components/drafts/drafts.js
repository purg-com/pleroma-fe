import Draft from 'src/components/draft/draft.vue'
import List from 'src/components/list/list.vue'

const Drafts = {
  components: {
    Draft,
    List
  },
  computed: {
    drafts () {
      return this.$store.getters.draftsArray
    }
  }
}

export default Drafts
