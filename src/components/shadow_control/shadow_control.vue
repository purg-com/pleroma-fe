<template>
  <div
    class="ShadowControl label shadow-control"
    :class="{ disabled: disabled || !present, '-no-preview': noPreview, '-compact': compact }"
  >
    <ComponentPreview
      v-if="!noPreview"
      :invalid="invalid"
      class="shadow-preview"
      :shadow-control="true"
      :shadow="selected"
      :preview-style="style"
      :disabled="disabled || !present"
      @update:shadow="({ axis, value }) => updateProperty(axis, value)"
    />
    <div class="shadow-switcher">
      <Select
        id="shadow-list"
        v-model="selectedId"
        class="shadow-list"
        size="4"
        :disabled="disabled || shadowsAreNull"
      >
        <option
          v-for="(shadow, index) in cValue"
          :key="index"
          :value="index"
          :class="{ '-active': index === Number(selectedId) }"
        >
          {{ getSubshadowLabel(shadow, index) }}
        </option>
      </Select>
      <SelectMotion
        v-model="cValue"
        :selected-id="selectedId"
        :get-add-value="getNewSubshadow"
        :disabled="disabled"
        @update:selectedId="onSelectChange"
      />
    </div>
    <div class="shadow-tweak">
      <Select
        v-model="selectedType"
        :disabled="disabled || !present"
      >
        <option value="object">
          {{ $t('settings.style.shadows.raw') }}
        </option>
        <option value="string">
          {{ $t('settings.style.shadows.expression') }}
        </option>
      </Select>
      <template v-if="selectedType === 'string'">
        <textarea
          v-model="selected"
          class="input shadow-expression"
          :disabled="disabled || shadowsAreNull"
          :class="{disabled: disabled || shadowsAreNull}"
        />
      </template>
      <template v-else-if="selectedType === 'object'">
        <div
          :class="{ disabled: disabled || !present }"
          class="name-control style-control"
        >
          <label
            for="name"
            class="label"
            :class="{ faint: disabled || !present }"
          >
            {{ $t('settings.style.shadows.name') }}
          </label>
          <input
            id="name"
            :value="selected?.name"
            :disabled="disabled || !present"
            :class="{ disabled: disabled || !present }"
            name="name"
            class="input input-string"
            @input="e => updateProperty('name', e.target.value)"
          >
        </div>
        <div
          :disabled="disabled || !present"
          class="inset-control style-control"
        >
          <Checkbox
            id="inset"
            :value="selected?.inset"
            :disabled="disabled || !present"
            name="inset"
            class="input-inset input-boolean"
            @input="e => updateProperty('inset', e.target.checked)"
          >
            <template #before>
              {{ $t('settings.style.shadows.inset') }}
            </template>
          </Checkbox>
        </div>
        <div
          :disabled="disabled || !present"
          :class="{ disabled: disabled || !present }"
          class="blur-control style-control"
        >
          <label
            for="blur"
            class="label"
            :class="{ faint: disabled || !present }"
          >
            {{ $t('settings.style.shadows.blur') }}
          </label>
          <input
            id="blur"
            :value="selected?.blur"
            :disabled="disabled || !present"
            :class="{ disabled: disabled || !present }"
            name="blur"
            class="input input-range"
            type="range"
            max="20"
            min="0"
            @input="e => updateProperty('blur', e.target.value)"
          >
          <input
            :value="selected?.blur"
            class="input input-number -small"
            :disabled="disabled || !present"
            :class="{ disabled: disabled || !present }"
            type="number"
            min="0"
            @input="e => updateProperty('blur', e.target.value)"
          >
        </div>
        <div
          class="spread-control style-control"
          :class="{ disabled: disabled || !present || (separateInset && !selected?.inset) }"
        >
          <label
            for="spread"
            class="label"
            :class="{ faint: disabled || !present || (separateInset && !selected?.inset) }"
          >
            {{ $t('settings.style.shadows.spread') }}
          </label>
          <input
            id="spread"
            :value="selected?.spread"
            :class="{ disabled: disabled || !present || (separateInset && !selected?.inset) }"
            :disabled="disabled || !present || (separateInset && !selected?.inset)"
            name="spread"
            class="input input-range"
            type="range"
            max="20"
            min="-20"
            @input="e => updateProperty('spread', e.target.value)"
          >
          <input
            :value="selected?.spread"
            class="input input-number -small"
            :class="{ disabled: disabled || !present || (separateInset && !selected?.inset) }"
            :disabled="disabled || !present || (separateInset && !selected?.inset)"
            type="number"
            @input="e => updateProperty('spread', e.target.value)"
          >
        </div>
        <ColorInput
          :model-value="selected?.color"
          :disabled="disabled || !present"
          :label="$t('settings.style.common.color')"
          :fallback="getColorFallback"
          :show-optional-checkbox="false"
          name="shadow"
          @update:modelValue="e => updateProperty('color', e)"
        />
        <OpacityInput
          :model-value="selected?.alpha"
          :disabled="disabled || !present"
          @update:modelValue="e => updateProperty('alpha', e)"
        />
        <i18n-t
          scope="global"
          keypath="settings.style.shadows.hintV3"
          :class="{ faint: disabled || !present }"
          tag="p"
        >
          <code>--variable,mod</code>
        </i18n-t>
        <Popover
          v-if="separateInset"
          trigger="hover"
        >
          <template #trigger>
            <div
              class="inset-alert alert warning"
            >
              <FAIcon icon="exclamation-triangle" />
              &nbsp;
              {{ $t('settings.style.shadows.filter_hint.avatar_inset_short') }}
            </div>
          </template>
          <template #content>
            <div class="inset-tooltip tooltip">
              <i18n-t
                scope="global"
                keypath="settings.style.shadows.filter_hint.always_drop_shadow"
                tag="p"
              >
                <code>filter: drop-shadow()</code>
              </i18n-t>
              <p>{{ $t('settings.style.shadows.filter_hint.avatar_inset') }}</p>
              <i18n-t
                scope="global"
                keypath="settings.style.shadows.filter_hint.drop_shadow_syntax"
                tag="p"
              >
                <code>drop-shadow</code>
                <code>spread-radius</code>
                <code>inset</code>
              </i18n-t>
              <i18n-t
                scope="global"
                keypath="settings.style.shadows.filter_hint.inset_classic"
                tag="p"
              >
                <code>box-shadow</code>
              </i18n-t>
              <p>{{ $t('settings.style.shadows.filter_hint.spread_zero') }}</p>
            </div>
          </template>
        </Popover>
      </template>
    </div>
  </div>
</template>

<script src="./shadow_control.js"></script>

<style src="./shadow_control.scss" lang="scss"></style>
