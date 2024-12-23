<template>
  <div class="ExtraNotifications">
    <div
      v-if="shouldShowChats"
      class="notification unseen"
    >
      <div class="notification-overlay" />
      <router-link
        class="button-unstyled -link extra-notification"
        :to="{ name: 'chats', params: { username: currentUser.screen_name } }"
      >
        <FAIcon
          fixed-width
          class="fa-scale-110 icon"
          icon="comments"
        />
        {{ $tc('notifications.unread_chats', unreadChatCount, { num: unreadChatCount }) }}
      </router-link>
    </div>
    <div
      v-if="shouldShowAnnouncements"
      class="notification unseen"
    >
      <div class="notification-overlay" />
      <router-link
        class="button-unstyled -link extra-notification"
        :to="{ name: 'announcements' }"
      >
        <FAIcon
          fixed-width
          class="fa-scale-110 icon"
          icon="bullhorn"
        />
        {{ $tc('notifications.unread_announcements', unreadAnnouncementCount, { num: unreadAnnouncementCount }) }}
      </router-link>
    </div>
    <div
      v-if="shouldShowFollowRequests"
      class="notification unseen"
    >
      <div class="notification-overlay" />
      <router-link
        class="button-unstyled -link extra-notification"
        :to="{ name: 'friend-requests' }"
      >
        <FAIcon
          fixed-width
          class="fa-scale-110 icon"
          icon="user-plus"
        />
        {{ $tc('notifications.unread_follow_requests', followRequestCount, { num: followRequestCount }) }}
      </router-link>
    </div>
    <i18n-t
      v-if="shouldShowCustomizationTip"
      tag="span"
      class="notification tip extra-notification"
      keypath="notifications.configuration_tip"
      scope="global"
    >
      <template #theSettings>
        <button
          class="button-unstyled -link"
          @click="openNotificationSettings"
        >
          {{ $t('notifications.configuration_tip_settings') }}
        </button>
      </template>
      <template #dismiss>
        <button
          class="button-unstyled -link"
          @click="dismissConfigurationTip"
        >
          {{ $t('notifications.configuration_tip_dismiss') }}
        </button>
      </template>
    </i18n-t>
  </div>
</template>

<script src="./extra_notifications.js" />

<style lang="scss">
.ExtraNotifications {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;

  .notification {
    width: 100%;
    border-bottom: 1px solid;
    border-color: var(--border);
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .extra-notification {
    padding: 1em;
  }

  .icon {
    margin-right: 0.5em;
  }

  .tip {
    display: inline;
  }
}
</style>
