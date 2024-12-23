<template>
  <div class="AccountActions">
    <Popover
      trigger="click"
      placement="bottom"
      :bound-to="{ x: 'container' }"
      remove-padding
    >
      <template #content>
        <div class="dropdown-menu">
          <template v-if="relationship.following">
            <button
              v-if="relationship.showing_reblogs"
              class="dropdown-item menu-item"
              @click="hideRepeats"
            >
              {{ $t('user_card.hide_repeats') }}
            </button>
            <button
              v-if="!relationship.showing_reblogs"
              class="dropdown-item menu-item"
              @click="showRepeats"
            >
              {{ $t('user_card.show_repeats') }}
            </button>
            <div
              role="separator"
              class="dropdown-divider"
            />
          </template>
          <UserListMenu :user="user" />
          <button
            v-if="relationship.followed_by"
            class="dropdown-item menu-item"
            @click="removeUserFromFollowers"
          >
            {{ $t('user_card.remove_follower') }}
          </button>
          <button
            v-if="relationship.blocking"
            class="dropdown-item menu-item"
            @click="unblockUser"
          >
            {{ $t('user_card.unblock') }}
          </button>
          <button
            v-else
            class="dropdown-item menu-item"
            @click="blockUser"
          >
            {{ $t('user_card.block') }}
          </button>
          <button
            class="dropdown-item menu-item"
            @click="reportUser"
          >
            {{ $t('user_card.report') }}
          </button>
          <button
            v-if="pleromaChatMessagesAvailable"
            class="dropdown-item menu-item"
            @click="openChat"
          >
            {{ $t('user_card.message') }}
          </button>
        </div>
      </template>
      <template #trigger>
        <button class="button-unstyled ellipsis-button">
          <FAIcon
            class="icon"
            icon="ellipsis-v"
          />
        </button>
      </template>
    </Popover>
    <teleport to="#modal">
      <confirm-modal
        v-if="showingConfirmBlock"
        :title="$t('user_card.block_confirm_title')"
        :confirm-text="$t('user_card.block_confirm_accept_button')"
        :cancel-text="$t('user_card.block_confirm_cancel_button')"
        @accepted="doBlockUser"
        @cancelled="hideConfirmBlock"
      >
        <i18n-t
          keypath="user_card.block_confirm"
          tag="span"
          scope="global"
        >
          <template #user>
            <span
              v-text="user.screen_name_ui"
            />
          </template>
        </i18n-t>
      </confirm-modal>
    </teleport>
    <teleport to="#modal">
      <confirm-modal
        v-if="showingConfirmRemoveFollower"
        :title="$t('user_card.remove_follower_confirm_title')"
        :confirm-text="$t('user_card.remove_follower_confirm_accept_button')"
        :cancel-text="$t('user_card.remove_follower_confirm_cancel_button')"
        @accepted="doRemoveUserFromFollowers"
        @cancelled="hideConfirmRemoveUserFromFollowers"
      >
        <i18n-t
          keypath="user_card.remove_follower_confirm"
          tag="span"
          scope="global"
        >
          <template #user>
            <span
              v-text="user.screen_name_ui"
            />
          </template>
        </i18n-t>
      </confirm-modal>
    </teleport>
  </div>
</template>

<script src="./account_actions.js"></script>

<style lang="scss">
.AccountActions {
  .ellipsis-button {
    width: 2.5em;
    margin: -0.5em 0;
    padding: 0.5em 0;
    text-align: center;
  }
}
</style>
