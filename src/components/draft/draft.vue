<template>
  <article class="Draft">
    <div class="actions">
      <button
        class="btn button-default"
        :class="{ toggled: editing }"
        :aria-expanded="editing"
        @click.prevent.stop="toggleEditing"
      >
        {{ $t('drafts.continue') }}
      </button>
      <button
        class="btn button-default"
        @click.prevent.stop="abandon"
      >
        {{ $t('drafts.abandon') }}
      </button>
    </div>
    <div
      v-if="!editing"
      class="status-content"
    >
      <div>
        <i18n-t
          v-if="draft.type === 'reply' || draft.type === 'edit'"
          tag="span"
          :keypath="draft.type === 'reply' ? 'drafts.replying' : 'drafts.editing'"
        >
          <template #statusLink>
            <router-link
              class="faint-link"
              :to="{ name: 'conversation', params: { id: draft.refId } }"
            >
              {{ refStatus ? refStatus.external_url : $t('drafts.unavailable') }}
            </router-link>
          </template>
        </i18n-t>
        <StatusContent
          v-if="draft.refId && refStatus"
          class="status-content"
          :status="refStatus"
          :compact="true"
        />
      </div>
      <p>{{ draft.status }}</p>
    </div>
    <div v-if="editing">
      <PostStatusForm
        v-if="draft.type !== 'edit'"
        v-bind="postStatusFormProps"
      />
      <EditStatusForm
        v-else
        :params="postStatusFormProps"
      />
    </div>
    <teleport to="#modal">
      <confirm-modal
        v-if="showingConfirmDialog"
        :title="$t('drafts.abandon_confirm_title')"
        :confirm-text="$t('drafts.abandon_confirm_accept_button')"
        :cancel-text="$t('drafts.abandon_confirm_cancel_button')"
        @accepted="doAbandon"
        @cancelled="hideConfirmDialog"
      >
        {{ $t('drafts.abandon_confirm') }}
      </confirm-modal>
    </teleport>
  </article>
</template>

<script src="./draft.js"></script>

<style lang="scss">
.Draft {
  margin: 1em;

  .status-content {
    border: 1px solid;
    border-color: var(--faint);
    border-radius: var(--inputRadius);
    color: var(--text);
    padding: 0.5em;
    margin: 0.5em 0;
  }

  .actions {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;

    .btn {
      flex: 1;
      margin-left: 1em;
      margin-right: 1em;
      max-width: 10em;
    }
  }
}
</style>
