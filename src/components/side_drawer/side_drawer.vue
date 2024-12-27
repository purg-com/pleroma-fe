<template>
  <div
    class="side-drawer-container mobile-drawer"
    :class="{ 'side-drawer-container-closed': closed, 'side-drawer-container-open': !closed }"
  >
    <div
      class="side-drawer-darken"
      :class="{ 'side-drawer-darken-closed': closed}"
    />
    <div
      class="side-drawer"
      :class="{'side-drawer-closed': closed}"
      @touchstart="touchStart"
      @touchmove="touchMove"
    >
      <div
        class="side-drawer-heading"
        @click="toggleDrawer"
      >
        <UserCard
          v-if="currentUser"
          :user-id="currentUser.id"
          :hide-bio="true"
        />
        <div
          v-else
          class="side-drawer-logo-wrapper"
        >
          <img :src="logo">
          <span v-if="!hideSitename">{{ sitename }}</span>
        </div>
      </div>
      <ul>
        <li
          v-if="!currentUser"
          @click="toggleDrawer"
        >
          <router-link
            :to="{ name: 'login' }"
            class="menu-item"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="sign-in-alt"
            /> {{ $t("login.login") }}
          </router-link>
        </li>
        <li
          v-if="currentUser || !privateMode"
          @click="toggleDrawer"
        >
          <router-link
            :to="timelinesRoute"
            class="menu-item"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="home"
            /> {{ $t("nav.timelines") }}
          </router-link>
        </li>
        <li
          v-if="currentUser"
          @click="toggleDrawer"
        >
          <router-link
            :to="{ name: 'lists' }"
            class="menu-item"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="list"
            /> {{ $t("nav.lists") }}
          </router-link>
        </li>
        <li
          v-if="currentUser"
          @click="toggleDrawer"
        >
          <router-link
            :to="{ name: 'bookmarks' }"
            class="menu-item"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="bookmark"
            /> {{ $t("nav.bookmarks") }}
          </router-link>
        </li>
        <li
          v-if="currentUser && pleromaChatMessagesAvailable"
          @click="toggleDrawer"
        >
          <router-link
            :to="{ name: 'chats', params: { username: currentUser.screen_name } }"
            style="position: relative;"
            class="menu-item"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="comments"
            /> {{ $t("nav.chats") }}
            <span
              v-if="unreadChatCount"
              class="badge -notification"
            >
              {{ unreadChatCount }}
            </span>
          </router-link>
        </li>
      </ul>
      <ul v-if="currentUser">
        <li @click="toggleDrawer">
          <router-link
            :to="{ name: 'interactions', params: { username: currentUser.screen_name } }"
            class="menu-item"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="bell"
            /> {{ $t("nav.interactions") }}
          </router-link>
        </li>
        <li
          v-if="currentUser.locked"
          @click="toggleDrawer"
        >
          <router-link
            to="/friend-requests"
            class="menu-item"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="user-plus"
            /> {{ $t("nav.friend_requests") }}
            <span
              v-if="followRequestCount > 0"
              class="badge -notification"
            >
              {{ followRequestCount }}
            </span>
          </router-link>
        </li>
        <li
          v-if="shout"
          @click="toggleDrawer"
        >
          <router-link
            :to="{ name: 'shout-panel' }"
            class="menu-item"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="bullhorn"
            /> {{ $t("shoutbox.title") }}
          </router-link>
        </li>
      </ul>
      <ul>
        <li
          v-if="currentUser || !privateMode"
          @click="toggleDrawer"
        >
          <router-link
            :to="{ name: 'search' }"
            class="menu-item"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="search"
            /> {{ $t("nav.search") }}
          </router-link>
        </li>
        <li
          v-if="currentUser && suggestionsEnabled"
          @click="toggleDrawer"
        >
          <router-link
            :to="{ name: 'who-to-follow' }"
            class="menu-item"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="user-plus"
            /> {{ $t("nav.who_to_follow") }}
          </router-link>
        </li>
        <li @click="toggleDrawer">
          <button
            class="menu-item"
            @click="openSettingsModal"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="cog"
            /> {{ $t("settings.settings") }}
          </button>
        </li>
        <li @click="toggleDrawer">
          <router-link
            :to="{ name: 'about'}"
            class="menu-item"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="info-circle"
            /> {{ $t("nav.about") }}
          </router-link>
        </li>
        <li
          v-if="currentUser && currentUser.role === 'admin'"
          @click="toggleDrawer"
        >
          <button
            class="menu-item"
            @click.stop="openAdminModal"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="tachometer-alt"
            /> {{ $t("nav.administration") }}
          </button>
        </li>
        <li
          v-if="currentUser && supportsAnnouncements"
          @click="toggleDrawer"
        >
          <router-link
            :to="{ name: 'announcements' }"
            class="menu-item"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="bullhorn"
            /> {{ $t("nav.announcements") }}
            <span
              v-if="unreadAnnouncementCount"
              class="badge -notification"
            >
              {{ unreadAnnouncementCount }}
            </span>
          </router-link>
        </li>
        <li
          v-if="currentUser"
          @click="toggleDrawer"
        >
          <router-link
            :to="{ name: 'drafts' }"
            class="menu-item"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="file-pen"
            /> {{ $t('nav.drafts') }}
            <span
              v-if="draftCount"
              class="badge -neutral"
            >
              {{ draftCount }}
            </span>
          </router-link>
        </li>
        <li
          v-if="currentUser"
          @click="toggleDrawer"
        >
          <router-link
            :to="{ name: 'edit-navigation' }"
            class="menu-item"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="compass"
            /> {{ $t("nav.edit_nav_mobile") }}
          </router-link>
        </li>
        <li
          v-if="currentUser"
          @click="toggleDrawer"
        >
          <button
            class="menu-item"
            @click="doLogout"
          >
            <FAIcon
              fixed-width
              class="fa-scale-110 fa-old-padding"
              icon="sign-out-alt"
            /> {{ $t("login.logout") }}
          </button>
        </li>
      </ul>
    </div>
    <div
      class="side-drawer-click-outside"
      :class="{'side-drawer-click-outside-closed': closed}"
      @click.stop.prevent="toggleDrawer"
    />
  </div>
</template>

<script src="./side_drawer.js"></script>

<style lang="scss">
.side-drawer-container {
  position: fixed;
  z-index: var(--ZI_navbar);
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
  transition-duration: 0s;
  transition-property: transform;
}

.side-drawer-container-open {
  transform: translate(0%);
}

.side-drawer-container-closed {
  transition-delay: 0.35s;
  transform: translate(-100%);
}

.side-drawer-darken {
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  position: fixed;
  z-index: -1;
  transition: 0.35s;
  transition-property: background-color;
  background-color: rgb(0 0 0 / 50%);
}

.side-drawer-darken-closed {
  background-color: rgb(0 0 0 / 0%);
}

.side-drawer-click-outside {
  flex: 1 1 100%;
}

.side-drawer {
  overflow-x: hidden;
  transition: 0.35s;
  transition-timing-function: cubic-bezier(0, 1, 0.5, 1);
  transition-property: transform;
  margin: 0 0 0 -100px;
  padding: 0 0 1em 100px;
  width: 80%;
  max-width: 20em;
  flex: 0 0 80%;
  box-shadow: var(--shadow);
  background-color: var(--background);

  .badge {
    margin-left: 10px;
  }
}

.side-drawer-logo-wrapper {
  display: flex;
  align-items: center;
  padding: 0.85em;

  img {
    flex: none;
    height: 50px;
    margin-right: 0.85em;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.side-drawer-click-outside-closed {
  flex: 0 0 0;
}

.side-drawer-closed {
  transform: translate(-100%);
}

.side-drawer-heading {
  background: transparent;
  flex-direction: column;
  align-items: stretch;
  display: flex;
  padding: 0;
  margin: 0;
}

.side-drawer ul {
  list-style: none;
  margin: 0;
  padding: 0;
  border-bottom: 1px solid;
  border-color: var(--border);
}

.side-drawer ul:last-child {
  border: 0;
}

.side-drawer li {
  padding: 0;

  a,
  button {
    box-sizing: border-box;
    display: block;
    height: 3em;
    line-height: 3em;
    padding: 0 0.7em;
  }
}
</style>
