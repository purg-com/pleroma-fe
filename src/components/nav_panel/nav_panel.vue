<template>
  <div class="NavPanel">
    <div class="panel panel-default">
      <div
        v-if="!forceExpand"
        class="panel-heading nav-panel-heading"
      >
        <NavigationPins :limit="6" />
        <div class="spacer" />
        <button
          class="button-unstyled"
          @click="toggleCollapse"
        >
          <FAIcon
            class="navigation-chevron"
            fixed-width
            :icon="collapsed ? 'chevron-down' : 'chevron-up'"
          />
        </button>
      </div>
      <ul
        v-if="!collapsed || forceExpand"
        class="panel-body"
      >
        <NavigationEntry
          v-if="currentUser || !privateMode"
          :show-pin="false"
          :item="{ icon: 'stream', label: 'nav.timelines' }"
          :aria-expanded="showTimelines ? 'true' : 'false'"
          @click="toggleTimelines"
        >
          <FAIcon
            class="timelines-chevron"
            fixed-width
            :icon="showTimelines ? 'chevron-up' : 'chevron-down'"
          />
        </NavigationEntry>
        <div
          v-show="showTimelines"
          class="timelines-background menu-item-collapsible"
          :class="{ '-expanded': showTimelines }"
        >
          <div class="timelines">
            <NavigationEntry
              v-for="item in timelinesItems"
              :key="item.name"
              :show-pin="editMode || forceEditMode"
              :item="item"
            />
          </div>
        </div>
        <NavigationEntry
          v-if="currentUser"
          :show-pin="false"
          :item="{ icon: 'list', label: 'nav.lists' }"
          :aria-expanded="showLists ? 'true' : 'false'"
          @click="toggleLists"
        >
          <router-link
            :title="$t('lists.manage_lists')"
            class="button-unstyled extra-button"
            :to="{ name: 'lists' }"
            @click.stop
          >
            <FAIcon
              fixed-width
              icon="wrench"
            />
          </router-link>
          <FAIcon
            class="timelines-chevron"
            fixed-width
            :icon="showLists ? 'chevron-up' : 'chevron-down'"
          />
        </NavigationEntry>
        <div
          v-show="showLists"
          class="timelines-background menu-item-collapsible"
          :class="{ '-expanded': showLists }"
        >
          <ListsMenuContent
            :show-pin="editMode || forceEditMode"
            class="timelines"
          />
        </div>
        <NavigationEntry
          v-if="currentUser && bookmarkFolders"
          :show-pin="false"
          :item="{ icon: 'bookmark', label: 'nav.bookmarks' }"
          :aria-expanded="showBookmarkFolders ? 'true' : 'false'"
          @click="toggleBookmarkFolders"
        >
          <router-link
            :title="$t('bookmarks.manage_bookmark_folders')"
            class="button-unstyled extra-button"
            :to="{ name: 'bookmark-folders' }"
            @click.stop
          >
            <FAIcon
              fixed-width
              icon="wrench"
            />
          </router-link>
          <FAIcon
            class="timelines-chevron"
            fixed-width
            :icon="showBookmarkFolders ? 'chevron-up' : 'chevron-down'"
          />
        </NavigationEntry>
        <div
          v-show="showBookmarkFolders"
          class="timelines-background menu-item-collapsible"
          :class="{ '-expanded': showBookmarkFolders }"
        >
          <BookmarkFoldersMenuContent
            class="timelines"
          />
        </div>
        <NavigationEntry
          v-for="item in rootItems"
          :key="item.name"
          :show-pin="editMode || forceEditMode"
          :item="item"
        />
        <NavigationEntry
          v-if="!forceEditMode && currentUser"
          :show-pin="false"
          :item="{ labelRaw: editMode ? $t('nav.edit_finish') : $t('nav.edit_pinned'), icon: editMode ? 'check' : 'wrench' }"
          @click="toggleEditMode"
        />
      </ul>
    </div>
  </div>
</template>

<script src="./nav_panel.js"></script>

<style lang="scss">
.NavPanel {
  .panel {
    overflow: hidden;
    box-shadow: var(--shadow);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .navigation-chevron {
    margin-left: 0.8em;
    margin-right: 0.8em;
    font-size: 1.1em;
  }

  .timelines-chevron {
    margin-left: 0.8em;
    font-size: 1.1em;
  }

  .timelines-background {
    padding: 0 0 0 0.6em;
  }

  .nav-panel-heading {
    // breaks without a unit
    // stylelint-disable-next-line length-zero-no-unit
    --panel-heading-height-padding: 0px;
  }
}
</style>
