<script src="./virtual_directives_tab.js"></script>

<template>
  <div class="setting-item list-editor variables-editor">
    <label
      class="list-select-label"
      for="variables-selector"
    >
      {{ $t('settings.style.themes3.editor.variables.label') }}
      {{ ' ' }}
    </label>
    <Select
      id="variables-selector"
      v-model="selectedVirtualDirectiveId"
      class="list-select"
      size="20"
    >
      <option
        v-for="(p, index) in modelValue"
        :key="p.name"
        :value="index"
      >
        {{ p.name }}
      </option>
    </Select>
    <SelectMotion
      class="list-select-movement"
      :model-value="modelValue"
      :selected-id="selectedVirtualDirectiveId"
      :get-add-value="getNewVirtualDirective"
      @update:modelValue="e => emit('update:modelValue', e)"
      @update:selectedId="e => selectedVirtualDirectiveId = e"
    />
    <div class="list-edit-area">
      <div class="variable-selector">
        <label
          class="variable-name-label"
          for="variables-selector"
        >
          {{ $t('settings.style.themes3.editor.variables.name_label') }}
          {{ ' ' }}
        </label>
        <input
          v-model="selectedVirtualDirective.name"
          class="input"
        >
        <label
          class="variable-type-label"
          for="variables-selector"
        >
          {{ $t('settings.style.themes3.editor.variables.type_label') }}
          {{ ' ' }}
        </label>
        <Select
          v-model="selectedVirtualDirectiveValType"
        >
          <option value="shadow">
            {{ $t('settings.style.themes3.editor.variables.type_shadow') }}
          </option>
          <option value="color">
            {{ $t('settings.style.themes3.editor.variables.type_color') }}
          </option>
          <option value="generic">
            {{ $t('settings.style.themes3.editor.variables.type_generic') }}
          </option>
        </Select>
      </div>
      <ShadowControl
        v-if="selectedVirtualDirectiveValType === 'shadow'"
        v-model="draftVirtualDirective"
        :static-vars="staticVars"
        :compact="true"
      />
      <ColorInput
        v-if="selectedVirtualDirectiveValType === 'color'"
        v-model="draftVirtualDirective"
        name="virtual-directive-color"
        :fallback="computeColor(draftVirtualDirective)"
        :label="$t('settings.style.themes3.editor.variables.virtual_color')"
        :hide-optional-checkbox="true"
      />
    </div>
  </div>
</template>
