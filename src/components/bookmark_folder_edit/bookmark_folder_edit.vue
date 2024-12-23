<template>
  <div class="panel-default panel BookmarkFolderEdit">
    <div
      ref="header"
      class="panel-heading folder-edit-heading"
    >
      <button
        class="button-unstyled go-back-button"
        @click="$router.back"
      >
        <FAIcon
          size="lg"
          icon="chevron-left"
        />
      </button>
      <h1 class="title">
        <i18n-t
          v-if="id"
          keypath="bookmark_folders.editing_folder"
          scope="global"
        >
          <template #folderName>
            {{ name }}
          </template>
        </i18n-t>
        <i18n-t
          v-else
          keypath="bookmark_folders.creating_folder"
          scope="global"
        />
      </h1>
    </div>
    <div class="panel-body">
      <div class="input-wrap">
        <label for="folder-edit-title">{{ $t('bookmark_folders.emoji') }}</label>
        <button
          class="input input-emoji"
          :title="$t('bookmark_folder.emoji_pick')"
          @click="showEmojiPicker"
        >
          <img
            v-if="emojiUrlDraft"
            class="iconEmoji iconEmoji-image"
            :src="emojiUrlDraft"
            :alt="emojiDraft"
            :title="emojiDraft"
          >
          <span
            v-else-if="emojiDraft"
            class="iconEmoji"
          >
            <span>
              {{ emojiDraft }}
            </span>
          </span>
        </button>
        <EmojiPicker
          ref="picker"
          class="emoji-picker-panel"
          @emoji="selectEmoji"
          @show="onShowPicker"
          @close="onClosePicker"
        />
      </div>
      <div class="input-wrap">
        <label for="folder-edit-title">{{ $t('bookmark_folders.name') }}</label>
        <input
          id="folder-edit-title"
          ref="name"
          v-model="nameDraft"
          class="input"
        >
      </div>
    </div>
    <div class="panel-footer">
      <span class="spacer" />
      <button
        v-if="!id"
        class="btn button-default footer-button"
        @click="createFolder"
      >
        {{ $t('bookmark_folders.create') }}
      </button>
      <button
        v-else-if="!reallyDelete"
        class="btn button-default footer-button"
        @click="reallyDelete = true"
      >
        {{ $t('bookmark_folders.delete') }}
      </button>
      <template v-else>
        {{ $t('bookmark_folders.really_delete') }}
        <button
          class="btn button-default footer-button"
          @click="deleteFolder"
        >
          {{ $t('general.yes') }}
        </button>
        <button
          class="btn button-default footer-button"
          @click="reallyDelete = false"
        >
          {{ $t('general.no') }}
        </button>
      </template>
      <div
        v-if="id && !reallyDelete"
      >
        <button
          class="btn button-default follow-button"
          @click="updateFolder"
        >
          {{ $t('bookmark_folders.update_folder') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script src="./bookmark_folder_edit.js"></script>

<style lang="scss">
.BookmarkFolderEdit {
  --panel-body-padding: 0.5em;

  overflow: hidden;
  display: flex;
  flex-direction: column;

  .folder-edit-heading {
    grid-template-columns: auto minmax(50%, 1fr);
  }

  .panel-body {
    display: flex;
    gap: 0.5em;
  }

  .emoji-picker-panel {
    position: absolute;
    z-index: 20;
    margin-top: 2px;

    &.hide {
      display: none;
    }
  }

  .input-emoji {
    height: 2.5em;
    width: 2.5em;
    padding: 0;

    .iconEmoji {
      display: inline-block;
      text-align: center;
      object-fit: contain;
      vertical-align: middle;
      height: 2.5em;
      width: 2.5em;

      > span {
        font-size: 1.5rem;
        line-height: 2.5rem;
      }
    }

    img.iconEmoji {
      padding: 0.25em;
      box-sizing: border-box;
    }
  }

  .input-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }

  .go-back-button {
    text-align: center;
    line-height: 1;
    height: 100%;
    align-self: start;
    width: var(--__panel-heading-height-inner);
  }

  .btn {
    margin: 0 0.5em;
  }

  .panel-footer {
    grid-template-columns: minmax(10%, 1fr);

    .footer-button {
      min-width: 9em;
    }
  }
}
</style>
