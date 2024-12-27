<template>
  <teleport to="#modal">
    <dialog-modal
      v-if="showing"
      v-body-scroll-lock="true"
      class="confirm-modal"
      :on-cancel="cancel"
    >
      <template #header>
        <span>
          {{ $t('post_status.close_confirm_title') }}
        </span>
      </template>

      {{ $t('post_status.close_confirm') }}

      <template #footer>
        <button
          class="btn button-default"
          @click.prevent="save"
        >
          {{ $t('post_status.close_confirm_save_button') }}
        </button>

        <button
          class="btn button-default"
          @click.prevent="discard"
        >
          {{ $t('post_status.close_confirm_discard_button') }}
        </button>

        <button
          class="btn button-default"
          @click.prevent="cancel"
        >
          {{ $t('post_status.close_confirm_continue_composing_button') }}
        </button>
      </template>
    </dialog-modal>
  </teleport>
</template>

<script src="./draft_closer.js"></script>
