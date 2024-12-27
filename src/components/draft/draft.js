import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'
import EditStatusForm from 'src/components/edit_status_form/edit_status_form.vue'
import ConfirmModal from 'src/components/confirm_modal/confirm_modal.vue'
import StatusContent from 'src/components/status_content/status_content.vue'

const Draft = {
  components: {
    PostStatusForm,
    EditStatusForm,
    ConfirmModal,
    StatusContent
  },
  props: {
    draft: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      editing: false,
      showingConfirmDialog: false
    }
  },
  computed: {
    relAttrs () {
      if (this.draft.type === 'edit') {
        return { statusId: this.draft.refId }
      } else if (this.draft.type === 'reply') {
        return { replyTo: this.draft.refId }
      } else {
        return {}
      }
    },
    postStatusFormProps () {
      return {
        draftId: this.draft.id,
        ...this.relAttrs
      }
    },
    refStatus () {
      return this.draft.refId ? this.$store.state.statuses.allStatusesObject[this.draft.refId] : undefined
    }
  },
  methods: {
    toggleEditing () {
      this.editing = !this.editing
    },
    abandon () {
      this.showingConfirmDialog = true
    },
    doAbandon () {
      this.$store.dispatch('abandonDraft', { id: this.draft.id })
        .then(() => {
          this.hideConfirmDialog()
        })
    },
    hideConfirmDialog () {
      this.showingConfirmDialog = false
    }
  }
}

export default Draft
