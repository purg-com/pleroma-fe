import PostStatusForm from '../post_status_form/post_status_form.vue'
import statusPosterService from '../../services/status_poster/status_poster.service.js'

const EditStatusForm = {
  components: {
    PostStatusForm
  },
  props: {
    params: {
      type: Object,
      required: true
    }
  },
  methods: {
    requestClose () {
      this.$refs.postStatusForm.requestClose()
    },
    doEditStatus ({ status, spoilerText, sensitive, media, contentType, poll }) {
      const params = {
        store: this.$store,
        statusId: this.params.statusId,
        status,
        spoilerText,
        sensitive,
        poll,
        media,
        contentType
      }

      return statusPosterService.editStatus(params)
        .then((data) => {
          return data
        })
        .catch((err) => {
          console.error('Error editing status', err)
          return {
            error: err.message
          }
        })
    }
  }
}

export default EditStatusForm
