<template>
  <div
    class="appearance-tab"
    :label="$t('settings.general')"
  >
    <div class="setting-item">
      <h2>{{ $t('settings.theme') }}</h2>
      <ul
        ref="themeList"
        class="theme-list"
      >
        <button
          class="button-default theme-preview"
          data-theme-key="stock"
          :class="{ toggled: isStyleActive('stock') }"
          @click="resetTheming"
        >
          <!-- eslint-disable vue/no-v-text-v-html-on-component -->
          <component
            :is="'style'"
            v-html="previewTheme('stock', 'v3')"
          />
          <!-- eslint-enable vue/no-v-text-v-html-on-component -->
          <preview id="theme-preview-stock" />
          <h4 class="theme-name">
            {{ $t('settings.style.stock_theme_used') }}
            <span class="alert neutral version">v3</span>
          </h4>
        </button>
        <button
          v-if="isCustomThemeUsed"
          disabled
          class="button-default theme-preview toggled"
        >
          <preview />
          <h4 class="theme-name">
            {{ $t('settings.style.custom_theme_used') }}
            <span class="alert neutral version">v2</span>
          </h4>
        </button>
        <button
          v-if="isCustomStyleUsed"
          disabled
          class="button-default theme-preview toggled"
        >
          <preview />
          <h4 class="theme-name">
            {{ $t('settings.style.custom_style_used') }}
            <span class="alert neutral version">v3</span>
          </h4>
        </button>
        <button
          v-for="style in availableStyles"
          :key="style.key"
          :data-theme-key="style.key"
          class="button-default theme-preview"
          :class="{ toggled: isStyleActive(style.key) }"
          @click="style.version === 'v2' ? setTheme(style.key) : setStyle(style.key)"
        >
          <!-- eslint-disable vue/no-v-text-v-html-on-component -->
          <div v-if="style.ready || noIntersectionObserver">
            <component
              :is="'style'"
              v-html="previewTheme(style.key, style.version, style.data)"
            />
          </div>
          <!-- eslint-enable vue/no-v-text-v-html-on-component -->
          <preview :id="'theme-preview-' + style.key" />
          <h4 class="theme-name">
            {{ style.name }}
            <span class="alert neutral version">{{ style.version }}</span>
          </h4>
        </button>
      </ul>
      <div class="import-file-container">
      <button
        class="btn button-default"
        @click="importFile"
      >
        <FAIcon icon="folder-open" />
        {{ $t('settings.style.themes3.editor.load_style') }}
      </button>
      </div>
      <div class="setting-item">
        <h2>{{ $t('settings.style.themes3.palette.label') }}</h2>
        <div class="palettes">
          <template v-if="customThemeVersion === 'v3'">
            <h4>{{ $t('settings.style.themes3.palette.bundled') }}</h4>
            <button
              v-for="p in bundledPalettes"
              :key="p.name"
              class="btn button-default palette-entry"
              :class="{ toggled: isPaletteActive(p.key) }"
              @click="() => setPalette(p.key, p)"
            >
              <div class="palette-label">
                <label>
                  {{ p.name }}
                </label>
              </div>
              <div class="palette-preview">
                <span
                  v-for="c in palettesKeys"
                  :key="c"
                  class="palette-square"
                  :style="{ backgroundColor: p[c], border: '1px solid ' + (p[c] ?? 'var(--text)') }"
                />
              </div>
            </button>
            <h4 v-if="stylePalettes?.length > 0">
              {{ $t('settings.style.themes3.palette.style') }}
            </h4>
            <button
              v-for="p in stylePalettes || []"
              :key="p.name"
              class="btn button-default palette-entry"
              :class="{ toggled: isPaletteActive(p.key) }"
              @click="() => setPalette(p.key, p)"
            >
              <div class="palette-label">
                <label>
                  {{ p.name ?? $t('settings.style.themes3.palette.user') }}
                </label>
              </div>
              <div class="palette-preview">
                <span
                  v-for="c in palettesKeys"
                  :key="c"
                  class="palette-square"
                  :style="{ backgroundColor: p[c], border: '1px solid ' + (p[c] ?? 'var(--text)') }"
                />
              </div>
            </button>
            <h4 v-if="expertLevel > 0">
              {{ $t('settings.style.themes3.palette.user') }}
            </h4>
            <PaletteEditor
              v-if="expertLevel > 0"
              class="userPalette"
              v-model="userPalette"
              :compact="true"
              :apply="true"
              @applyPalette="data => setPaletteCustom(data)"
            />
          </template>
          <template v-else-if="customThemeVersion === 'v2'">
            <div class="alert neutral theme-notice unsupported-theme-v2">
              {{ $t('settings.style.themes3.palette.v2_unsupported') }}
            </div>
          </template>
        </div>
      </div>
    </div>
    <div class="setting-item">
      <h2>{{ $t('settings.scale_and_layout') }}</h2>
      <div class="alert neutral theme-notice">
        {{ $t("settings.style.appearance_tab_note") }}
      </div>
      <ul class="setting-list">
        <li>
          <UnitSetting
            path="textSize"
            step="0.1"
            :units="['px', 'rem']"
            :reset-default="{ 'px': 14, 'rem': 1 }"
            timed-apply-mode
          >
            {{ $t('settings.text_size') }}
          </UnitSetting>
          <div>
            <small>
              <i18n-t
                scope="global"
                keypath="settings.text_size_tip"
                tag="span"
              >
                <code>px</code>
                <code>rem</code>
              </i18n-t>
              <br>
              <i18n-t
                scope="global"
                keypath="settings.text_size_tip2"
                tag="span"
              >
                <code>14px</code>
              </i18n-t>
            </small>
          </div>
        </li>
        <li>
          <h3>{{ $t('settings.style.interface_font_user_override') }}</h3>
          <ul class="setting-list">
            <li>
              <FontControl
                :model-value="mergedConfig.theme3hacks.fonts.interface"
                name="ui"
                :label="$t('settings.style.fonts.components.interface')"
                :fallback="{ family: 'sans-serif' }"
                no-inherit="1"
                @update:modelValue="v => updateFont('interface', v)"
              />
            </li>
            <li>
              <FontControl
                v-if="expertLevel > 0"
                :model-value="mergedConfig.theme3hacks.fonts.input"
                name="input"
                :fallback="{ family: 'inherit' }"
                :label="$t('settings.style.fonts.components.input')"
                @update:modelValue="v => updateFont('input', v)"
              />
            </li>
            <li>
              <FontControl
                v-if="expertLevel > 0"
                :model-value="mergedConfig.theme3hacks.fonts.post"
                name="post"
                :fallback="{ family: 'inherit' }"
                :label="$t('settings.style.fonts.components.post')"
                @update:modelValue="v => updateFont('post', v)"
              />
            </li>
            <li>
              <FontControl
                v-if="expertLevel > 0"
                :model-value="mergedConfig.theme3hacks.fonts.monospace"
                name="postCode"
                :fallback="{ family: 'monospace' }"
                :label="$t('settings.style.fonts.components.monospace')"
                @update:modelValue="v => updateFont('monospace', v)"
              />
            </li>
          </ul>
        </li>
        <li>
          <UnitSetting
            path="emojiSize"
            step="0.1"
            :units="['px', 'rem']"
            :reset-default="{ 'px': 32, 'rem': 2.2 }"
          >
            {{ $t('settings.emoji_size') }}
          </UnitSetting>
          <ul
            class="setting-list suboptions"
          >
            <li>
              <FloatSetting
                v-if="user"
                path="emojiReactionsScale"
                expert="1"
              >
                {{ $t('settings.emoji_reactions_scale') }}
              </FloatSetting>
            </li>
          </ul>
        </li>
        <li>
          <UnitSetting
            path="navbarSize"
            step="0.1"
            :units="['px', 'rem']"
            :reset-default="{ 'px': 55, 'rem': 3.5 }"
          >
            {{ $t('settings.navbar_size') }}
          </UnitSetting>
        </li>
        <h3>{{ $t('settings.columns') }}</h3>
        <li>
          <UnitSetting
            path="panelHeaderSize"
            step="0.1"
            :units="['px', 'rem']"
            :reset-default="{ 'px': 52, 'rem': 3.2 }"
            timed-apply-mode
          >
            {{ $t('settings.panel_header_size') }}
          </UnitSetting>
        </li>
        <li>
          <BooleanSetting path="sidebarRight">
            {{ $t('settings.right_sidebar') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="navbarColumnStretch">
            {{ $t('settings.navbar_column_stretch') }}
          </BooleanSetting>
        </li>
        <li>
          <ChoiceSetting
            v-if="user"
            id="thirdColumnMode"
            path="thirdColumnMode"
            :options="thirdColumnModeOptions"
          >
            {{ $t('settings.third_column_mode') }}
          </ChoiceSetting>
        </li>
        <li v-if="expertLevel > 0">
          {{ $t('settings.column_sizes') }}
          <div class="column-settings">
            <UnitSetting
              v-for="column in columns"
              :key="column"
              :path="column + 'ColumnWidth'"
              :units="horizontalUnits"
              expert="1"
            >
              {{ $t('settings.column_sizes_' + column) }}
            </UnitSetting>
          </div>
        </li>
        <li>
          <BooleanSetting path="disableStickyHeaders">
            {{ $t('settings.disable_sticky_headers') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="showScrollbars">
            {{ $t('settings.show_scrollbars') }}
          </BooleanSetting>
        </li>
      </ul>
    </div>
    <div class="setting-item">
      <h2>{{ $t('settings.visual_tweaks') }}</h2>
      <ul class="setting-list">
        <li>
          <ChoiceSetting
            id="forcedRoundness"
            path="forcedRoundness"
            :options="forcedRoundnessOptions"
          >
            {{ $t('settings.style.themes3.hacks.force_interface_roundness') }}
          </ChoiceSetting>
        </li>
        <li>
          <ChoiceSetting
            id="underlayOverride"
            path="theme3hacks.underlay"
            :options="underlayOverrideModes"
          >
            {{ $t('settings.style.themes3.hacks.underlay_overrides') }}
          </ChoiceSetting>
        </li>
        <li v-if="instanceWallpaperUsed">
          <BooleanSetting path="hideInstanceWallpaper">
            {{ $t('settings.hide_wallpaper') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            path="forceThemeRecompilation"
            :expert="1"
          >
            {{ $t('settings.force_theme_recompilation_debug') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            path="themeDebug"
            :expert="1"
          >
            {{ $t('settings.theme_debug') }}
          </BooleanSetting>
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./appearance_tab.js"></script>

<style lang="scss" src="./appearance_tab.scss"></style>
