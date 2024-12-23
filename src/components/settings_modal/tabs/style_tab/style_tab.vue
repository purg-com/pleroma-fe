<script src="./style_tab.js">
</script>

<template>
  <div class="StyleTab">
    <div class="setting-item heading">
      <h2> {{ $t('settings.style.themes3.editor.title') }} </h2>
      <div class="meta-preview">
        <!-- eslint-disable vue/no-v-text-v-html-on-component -->
        <!-- eslint-disable vue/no-v-html -->
        <component
          :is="'style'"
          v-html="overallPreviewCssRules"
        />
        <!-- eslint-enable vue/no-v-html -->
        <!-- eslint-enable vue/no-v-text-v-html-on-component -->
        <Preview id="edited-style-preview" />
        <teleport
          v-if="isActive"
          to="#unscrolled-content"
        >
          <div class="style-actions-container">
            <div class="style-actions">
              <button
                class="btn button-default button-new"
                @click="clearStyle"
              >
                <FAIcon icon="arrows-rotate" />
                {{ $t('settings.style.themes3.editor.reset_style') }}
              </button>
              <button
                class="btn button-default button-load"
                @click="importStyle"
              >
                <FAIcon icon="folder-open" />
                {{ $t('settings.style.themes3.editor.load_style') }}
              </button>
              <button
                class="btn button-default button-save"
                @click="exportStyle"
              >
                <FAIcon icon="floppy-disk" />
                {{ $t('settings.style.themes3.editor.save_style') }}
              </button>
              <button
                class="btn button-default button-apply"
                @click="applyStyle"
              >
                <FAIcon icon="check" />
                {{ $t('settings.style.themes3.editor.apply_preview') }}
              </button>
            </div>
          </div>
        </teleport>
        <ul class="setting-list style-metadata">
          <li>
            <StringSetting
              v-model="name"
              class="meta-field"
            >
              {{ $t('settings.style.themes3.editor.style_name') }}
            </StringSetting>
          </li>
          <li>
            <StringSetting
              v-model="author"
              class="meta-field"
            >
              {{ $t('settings.style.themes3.editor.style_author') }}
            </StringSetting>
          </li>
          <li>
            <StringSetting
              v-model="license"
              class="meta-field"
            >
              {{ $t('settings.style.themes3.editor.style_license') }}
            </StringSetting>
          </li>
          <li>
            <StringSetting
              v-model="website"
              class="meta-field"
            >
              {{ $t('settings.style.themes3.editor.style_website') }}
            </StringSetting>
          </li>
        </ul>
      </div>
    </div>
    <tab-switcher>
      <div
        key="component"
        class="setting-item component-editor"
        :label="$t('settings.style.themes3.editor.component_tab')"
      >
        <div class="component-selector">
          <label for="component-selector">
            {{ $t('settings.style.themes3.editor.component_selector') }}
            {{ ' ' }}
          </label>
          <Select
            id="component-selector"
            v-model="selectedComponentKey"
          >
            <option
              v-for="key in componentKeys"
              :key="'component-' + key"
              :value="key"
            >
              {{ componentsMap.get(key).name }}
            </option>
          </Select>
        </div>
        <div
          v-if="selectedComponentVariants.length > 1"
          class="variant-selector"
        >
          <label for="variant-selector">
            {{ $t('settings.style.themes3.editor.variant_selector') }}
          </label>
          <Select
            v-model="selectedVariant"
          >
            <option
              v-for="variant in selectedComponentVariants"
              :key="'component-variant-' + variant"
              :value="variant"
            >
              {{ variant }}
            </option>
          </Select>
        </div>
        <div
          v-if="selectedComponentStates.length > 0"
          class="state-selector"
        >
          <label>
            {{ $t('settings.style.themes3.editor.states_selector') }}
          </label>
          <ul
            class="state-selector-list"
          >
            <li
              v-for="state in selectedComponentStates"
              :key="'component-state-' + state"
            >
              <Checkbox
                :value="selectedState.has(state)"
                @update:modelValue="(v) => updateSelectedStates(state, v)"
              >
                {{ state }}
              </Checkbox>
            </li>
          </ul>
        </div>
        <div class="preview-container">
          <!-- eslint-disable vue/no-v-html vue/no-v-text-v-html-on-component -->
          <component
            :is="'style'"
            v-html="previewCss"
          />
          <!-- eslint-enable vue/no-v-html vue/no-v-text-v-html-on-component -->
          <ComponentPreview
            class="component-preview"
            :show-text="componentHas('Text')"
            :shadow-control="isShadowTabOpen"
            :preview-class="previewClass"
            :preview-style="editorHintStyle"
            :preview-css="previewCss"
            :disabled="!editedSubShadow && typeof editedShadow !== 'string'"
            :shadow="editedSubShadow"
            :no-color-control="true"
            @update:shadow="({ axis, value }) => updateSubShadow(axis, value)"
          />
        </div>
        <tab-switcher
          ref="tabSwitcher"
          class="component-settings"
          :on-switch="onTabSwitch"
        >
          <div
            key="main"
            class="editor-tab"
            :label="$t('settings.style.themes3.editor.main_tab')"
          >
            <ColorInput
              v-model="editedBackgroundColor"
              name="component-background-color"
              :fallback="computeColor(editedBackgroundColor) ?? previewColors.background"
              :disabled="!isBackgroundColorPresent"
              :label="$t('settings.style.themes3.editor.background')"
              :hide-optional-checkbox="true"
            />
            <Tooltip :text="$t('settings.style.themes3.editor.include_in_rule')">
              <Checkbox v-model="isBackgroundColorPresent" />
            </Tooltip>
            <ColorInput
              v-if="componentHas('Text')"
              v-model="editedTextColor"
              name="component-text-color"
              :fallback="computeColor(editedTextColor) ?? previewColors.text"
              :label="$t('settings.style.themes3.editor.text_color')"
              :disabled="!isTextColorPresent"
              :hide-optional-checkbox="true"
            />
            <Tooltip
              v-if="componentHas('Text')"
              :text="$t('settings.style.themes3.editor.include_in_rule')"
            >
              <Checkbox v-model="isTextColorPresent" />
            </Tooltip>
            <div
              v-if="componentHas('Text')"
              class="style-control suboption"
            >
              <label
                for="textAuto"
                class="label"
                :class="{ faint: !isTextAutoPresent }"
              >
                {{ $t('settings.style.themes3.editor.text_auto.label') }}
              </label>
              <Select
                id="textAuto"
                v-model="editedTextAuto"
                :disabled="!isTextAutoPresent"
              >
                <option value="no-preserve">
                  {{ $t('settings.style.themes3.editor.text_auto.no-preserve') }}
                </option>
                <option value="no-auto">
                  {{ $t('settings.style.themes3.editor.text_auto.no-auto') }}
                </option>
                <option value="preserve">
                  {{ $t('settings.style.themes3.editor.text_auto.preserve') }}
                </option>
              </Select>
            </div>
            <Tooltip
              v-if="componentHas('Text')"
              :text="$t('settings.style.themes3.editor.include_in_rule')"
            >
              <Checkbox v-model="isTextAutoPresent" />
            </Tooltip>
            <div
              v-if="componentHas('Text')"
              class="style-control suboption"
            >
              <label class="label">
                {{ $t('settings.style.themes3.editor.contrast') }}
              </label>
              <ContrastRatio
                :show-ratio="true"
                :contrast="contrast"
              />
            </div>
            <div v-if="componentHas('Text')" />
            <ColorInput
              v-if="componentHas('Link')"
              v-model="editedLinkColor"
              name="component-link-color"
              :fallback="computeColor(editedLinkColor) ?? previewColors.link"
              :label="$t('settings.style.themes3.editor.link_color')"
              :disabled="!isLinkColorPresent"
              :hide-optional-checkbox="true"
            />
            <Tooltip
              v-if="componentHas('Link')"
              :text="$t('settings.style.themes3.editor.include_in_rule')"
            >
              <Checkbox v-model="isLinkColorPresent" />
            </Tooltip>
            <ColorInput
              v-if="componentHas('Icon')"
              v-model="editedIconColor"
              name="component-icon-color"
              :fallback="computeColor(editedIconColor) ?? previewColors.icon"
              :label="$t('settings.style.themes3.editor.icon_color')"
              :disabled="!isIconColorPresent"
              :hide-optional-checkbox="true"
            />
            <Tooltip
              v-if="componentHas('Icon')"
              :text="$t('settings.style.themes3.editor.include_in_rule')"
            >
              <Checkbox v-model="isIconColorPresent" />
            </Tooltip>
            <ColorInput
              v-if="componentHas('Border')"
              v-model="editedBorderColor"
              name="component-border-color"
              :fallback="computeColor(editedBorderColor) ?? previewColors.border"
              :label="$t('settings.style.themes3.editor.border_color')"
              :disabled="!isBorderColorPresent"
              :hide-optional-checkbox="true"
            />
            <Tooltip
              v-if="componentHas('Border')"
              :text="$t('settings.style.themes3.editor.include_in_rule')"
            >
              <Checkbox v-model="isBorderColorPresent" />
            </Tooltip>
            <OpacityInput
              v-model="editedOpacity"
              name="component-opacity"
              :disabled="!isOpacityPresent"
              :label="$t('settings.style.themes3.editor.opacity')"
            />
            <Tooltip :text="$t('settings.style.themes3.editor.include_in_rule')">
              <Checkbox v-model="isOpacityPresent" />
            </Tooltip>
            <RoundnessInput
              v-model="editedRoundness"
              name="component-roundness"
              :disabled="!isRoundnessPresent"
              :label="$t('settings.style.themes3.editor.roundness')"
            />
            <Tooltip :text="$t('settings.style.themes3.editor.include_in_rule')">
              <Checkbox v-model="isRoundnessPresent" />
            </Tooltip>
          </div>
          <div
            key="shadow"
            class="editor-tab shadow-tab"
            :label="$t('settings.style.themes3.editor.shadows_tab')"
          >
            <Checkbox
              v-model="isShadowPresent"
              class="style-control"
            >
              {{ $t('settings.style.themes3.editor.include_in_rule') }}
            </checkbox>
            <ShadowControl
              v-model="editedShadow"
              :disabled="!isShadowPresent"
              :no-preview="true"
              :compact="true"
              :static-vars="staticVars"
              @subShadowSelected="onSubShadow"
            />
          </div>
        </tab-switcher>
      </div>
      <div
        key="palette"
        :label="$t('settings.style.themes3.editor.palette_tab')"
        class="setting-item list-editor palette-editor"
      >
        <label
          class="list-select-label"
          for="palette-selector"
        >
          {{ $t('settings.style.themes3.palette.label') }}
          {{ ' ' }}
        </label>
        <Select
          id="palette-selector"
          v-model="selectedPaletteId"
          class="list-select"
          size="4"
        >
          <option
            v-for="(p, index) in palettes"
            :key="p.name"
            :value="index"
          >
            {{ p.name }}
          </option>
        </Select>
        <SelectMotion
          class="list-select-movement"
          :model-value="palettes"
          :selected-id="selectedPaletteId"
          :get-add-value="getNewPalette"
          @update:modelValue="onPalettesUpdate"
          @update:selectedId="e => selectedPaletteId = e"
        />
        <div class="list-edit-area">
          <StringSetting
            v-model="selectedPalette.name"
            class="palette-name-input"
          >
            {{ $t('settings.style.themes3.palette.name_label') }}
          </StringSetting>
          <PaletteEditor
            v-model="selectedPalette"
            class="palette-editor-single"
          />
        </div>
      </div>
      <VirtualDirectivesTab
        key="variables"
        :label="$t('settings.style.themes3.editor.variables_tab')"
        :model-value="virtualDirectives"
        @update:modelValue="updateVirtualDirectives"
      />
    </tab-switcher>
  </div>
</template>

<style src="./style_tab.scss" lang="scss"></style>
