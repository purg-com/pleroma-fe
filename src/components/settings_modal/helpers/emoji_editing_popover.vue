<template>
  <Popover
    ref="emojiPopover"
    trigger="click"
    :placement="placement"
    bound-to-selector=".emoji-list"
    popover-class="emoji-tab-edit-popover popover-default"
    :bound-to="{ x: 'container' }"
    :offset="{ y: 5 }"
    :disabled="disabled"
    :class="{'emoji-unsaved': isEdited}"
  >
    <template #trigger>
      <slot name="trigger" />
    </template>
    <template #content>
      <h3>
        {{ title }}
      </h3>

      <StillImage
        v-if="emojiPreview"
        class="emoji"
        :src="emojiPreview"
      />
      <div
        v-else
        class="emoji"
      />

      <div
        v-if="newUpload"
        class="emoji-tab-popover-input"
      >
        <input
          type="file"
          accept="image/*"
          class="emoji-tab-popover-file input"
          @change="uploadFile = $event.target.files"
        >
      </div>
      <div>
        <div class="emoji-tab-popover-input">
          <label>
            {{ $t('admin_dash.emoji.shortcode') }}
            <input
              v-model="editedShortcode"
              class="emoji-data-input input"
              :placeholder="$t('admin_dash.emoji.new_shortcode')"
            >
          </label>
        </div>

        <div class="emoji-tab-popover-input">
          <label>
            {{ $t('admin_dash.emoji.filename') }}

            <input
              v-model="editedFile"
              class="emoji-data-input input"
              :placeholder="$t('admin_dash.emoji.new_filename')"
            >
          </label>
        </div>

        <button
          class="button button-default btn"
          type="button"
          :disabled="newUpload ? uploadFile.length == 0 : !isEdited"
          @click="newUpload ? uploadEmoji() : saveEditedEmoji()"
        >
          {{ $t('admin_dash.emoji.save') }}
        </button>

        <template v-if="!newUpload">
          <button
            class="button button-default btn emoji-tab-popover-button"
            type="button"
            @click="deleteModalVisible = true"
          >
            {{ $t('admin_dash.emoji.delete') }}
          </button>
          <button
            class="button button-default btn emoji-tab-popover-button"
            type="button"
            @click="revertEmoji"
          >
            {{ $t('admin_dash.emoji.revert') }}
          </button>
          <ConfirmModal
            v-if="deleteModalVisible"
            :title="$t('admin_dash.emoji.delete_title')"
            :cancel-text="$t('status.delete_confirm_cancel_button')"
            :confirm-text="$t('status.delete_confirm_accept_button')"
            @cancelled="deleteModalVisible = false"
            @accepted="deleteEmoji"
          >
            {{ $t('admin_dash.emoji.delete_confirm', [shortcode]) }}
          </ConfirmModal>
        </template>
      </div>
    </template>
  </Popover>
</template>

<script>
import Popover from 'components/popover/popover.vue'
import ConfirmModal from 'components/confirm_modal/confirm_modal.vue'
import StillImage from 'components/still-image/still-image.vue'

export default {
  components: { Popover, ConfirmModal, StillImage },
  inject: ['emojiAddr'],
  props: {
    placement: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    },

    newUpload: Boolean,

    title: {
      type: String,
      required: true
    },
    packName: {
      type: String,
      required: true
    },
    shortcode: {
      type: String,
      // Only exists when this is not a new upload
      default: ''
    },
    file: {
      type: String,
      // Only exists when this is not a new upload
      default: ''
    }
  },
  emits: ['updatePackFiles', 'displayError'],
  data () {
    return {
      uploadFile: [],
      editedShortcode: this.shortcode,
      editedFile: this.file,
      deleteModalVisible: false
    }
  },
  computed: {
    emojiPreview () {
      if (this.newUpload && this.uploadFile.length > 0) {
        return URL.createObjectURL(this.uploadFile[0])
      } else if (!this.newUpload) {
        return this.emojiAddr(this.file)
      }

      return null
    },
    isEdited () {
      return !this.newUpload && (this.editedShortcode !== this.shortcode || this.editedFile !== this.file)
    }
  },
  methods: {
    saveEditedEmoji () {
      if (!this.isEdited) return

      this.$store.state.api.backendInteractor.updateEmojiFile(
        { packName: this.packName, shortcode: this.shortcode, newShortcode: this.editedShortcode, newFilename: this.editedFile, force: false }
      ).then(resp => {
        if (resp.error !== undefined) {
          this.$emit('displayError', resp.error)
          return Promise.reject(resp.error)
        }

        return resp.json()
      }).then(resp => this.$emit('updatePackFiles', resp))
    },
    uploadEmoji () {
      this.$store.state.api.backendInteractor.addNewEmojiFile({
        packName: this.packName,
        file: this.uploadFile[0],
        shortcode: this.editedShortcode,
        filename: this.editedFile
      }).then(resp => resp.json()).then(resp => {
        if (resp.error !== undefined) {
          this.$emit('displayError', resp.error)
          return
        }

        this.$emit('updatePackFiles', resp)
        this.$refs.emojiPopover.hidePopover()

        this.editedFile = ''
        this.editedShortcode = ''
        this.uploadFile = []
      })
    },
    revertEmoji () {
      this.editedFile = this.file
      this.editedShortcode = this.shortcode
    },
    deleteEmoji () {
      this.deleteModalVisible = false

      this.$store.state.api.backendInteractor.deleteEmojiFile(
        { packName: this.packName, shortcode: this.shortcode }
      ).then(resp => resp.json()).then(resp => {
        if (resp.error !== undefined) {
          this.$emit('displayError', resp.error)
          return
        }

        this.$emit('updatePackFiles', resp)
      })
    }
  }
}
</script>

<style lang="scss">
  .emoji-tab-edit-popover {
    padding-left: 0.5em;
    padding-right: 0.5em;
    padding-bottom: 0.5em;

    .emoji {
      width: 32px;
      height: 32px;
    }
  }
</style>
