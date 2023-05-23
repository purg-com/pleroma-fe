import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faTimes
} from '@fortawesome/free-solid-svg-icons'
import { useInterfaceStore } from '../../stores/interface'

library.add(
  faTimes
)

const GlobalNoticeList = {
  computed: {
    notices () {
      return useInterfaceStore().globalNotices
    }
  },
  methods: {
    closeNotice (notice) {
      useInterfaceStore().removeGlobalNotice(notice)
    }
  }
}

export default GlobalNoticeList
