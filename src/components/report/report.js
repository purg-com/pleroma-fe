import { useReportsStore } from '../../stores/reports'
import Select from '../select/select.vue'
import StatusContent from '../status_content/status_content.vue'
import Timeago from '../timeago/timeago.vue'
import generateProfileLink from 'src/services/user_profile_link_generator/user_profile_link_generator'

const Report = {
  props: [
    'reportId'
  ],
  components: {
    Select,
    StatusContent,
    Timeago
  },
  computed: {
    report () {
      return useReportsStore().reports[this.reportId] || {}
    },
    state: {
      get: function () { return this.report.state },
      set: function (val) { this.setReportState(val) }
    }
  },
  methods: {
    generateUserProfileLink (user) {
      return generateProfileLink(user.id, user.screen_name, this.$store.state.instance.restrictedNicknames)
    },
    setReportState (state) {
      return useReportsStore().setReportState({ id: this.report.id, state })
    }
  }
}

export default Report
