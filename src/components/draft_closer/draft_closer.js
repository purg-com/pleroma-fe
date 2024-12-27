import DialogModal from 'src/components/dialog_modal/dialog_modal.vue'

const DraftCloser = {
  data () {
    return {
      showing: false
    }
  },
  components: {
    DialogModal
  },
  emits: [
    'save',
    'discard'
  ],
  computed: {
    action () {
      if (this.$store.getters.mergedConfig.autoSaveDraft) {
        return 'save'
      } else {
        return this.$store.getters.mergedConfig.unsavedPostAction
      }
    },
    shouldConfirm () {
      return this.action === 'confirm'
    }
  },
  methods: {
    requestClose () {
      if (this.shouldConfirm) {
        this.showing = true
      } else if (this.action === 'save') {
        this.save()
      } else {
        this.discard()
      }
    },
    save () {
      this.$emit('save')
      this.showing = false
    },
    discard () {
      this.$emit('discard')
      this.showing = false
    },
    cancel () {
      this.showing = false
    }
  }
}

export default DraftCloser
