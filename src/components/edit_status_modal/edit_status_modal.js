import EditStatusForm from '../edit_status_form/edit_status_form.vue'
import Modal from '../modal/modal.vue'
import get from 'lodash/get'

const EditStatusModal = {
  components: {
    EditStatusForm,
    Modal
  },
  data () {
    return {
      resettingForm: false
    }
  },
  computed: {
    isLoggedIn () {
      return !!this.$store.state.users.currentUser
    },
    modalActivated () {
      return this.$store.state.editStatus.modalActivated
    },
    isFormVisible () {
      return this.isLoggedIn && !this.resettingForm && this.modalActivated
    },
    params () {
      return this.$store.state.editStatus.params || {}
    }
  },
  watch: {
    params (newVal, oldVal) {
      if (get(newVal, 'statusId') !== get(oldVal, 'statusId')) {
        this.resettingForm = true
        this.$nextTick(() => {
          this.resettingForm = false
        })
      }
    },
    isFormVisible (val) {
      if (val) {
        this.$nextTick(() => this.$el && this.$el.querySelector('textarea').focus())
      }
    }
  },
  methods: {
    closeModal () {
      this.$refs.editStatusForm.requestClose()
    },
    doCloseModal () {
      this.$store.dispatch('closeEditStatusModal')
    }
  }
}

export default EditStatusModal
