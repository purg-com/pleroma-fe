<template>
  <div
    class="ComponentPreview"
    :class="{ '-shadow-controls': shadowControl }"
  >
    <!-- eslint-disable vue/no-v-html vue/no-v-text-v-html-on-component -->
    <component
      :is="'style'"
      v-html="previewCss"
    />
    <!-- eslint-enable vue/no-v-html vue/no-v-text-v-html-on-component -->
    <label
      v-show="shadowControl"
      role="heading"
      class="header"
      :class="{ faint: disabled }"
    >
      {{ $t('settings.style.shadows.offset') }}
    </label>
    <label
      v-show="shadowControl && !hideControls"
      class="x-shift-number"
    >
      {{ $t('settings.style.shadows.offset-x') }}
      <input
        :value="shadow?.x"
        :disabled="disabled"
        :class="{ disabled }"
        class="input input-number"
        type="number"
        @input="e => updateProperty('x', e.target.value)"
      >
    </label>
    <label
      class="y-shift-number"
      v-show="shadowControl && !hideControls"
    >
      {{ $t('settings.style.shadows.offset-y') }}
      <input
        :value="shadow?.y"
        :disabled="disabled"
        :class="{ disabled }"
        class="input input-number"
        type="number"
        @input="e => updateProperty('y', e.target.value)"
      >
    </label>
    <input
      v-show="shadowControl && !hideControls"
      :value="shadow?.x"
      :disabled="disabled"
      :class="{ disabled }"
      class="input input-range x-shift-slider"
      type="range"
      max="20"
      min="-20"
      @input="e => updateProperty('x', e.target.value)"
    >
    <input
      v-show="shadowControl && !hideControls"
      :value="shadow?.y"
      :disabled="disabled"
      :class="{ disabled }"
      class="input input-range y-shift-slider"
      type="range"
      max="20"
      min="-20"
      @input="e => updateProperty('y', e.target.value)"
    >
    <div
      class="preview-window"
      :class="{ '-light-grid': lightGrid }"
    >
      <div
        class="preview-block"
        :class="previewClass"
        :style="style"
      >
        {{ $t('settings.style.themes3.editor.test_string') }}
      </div>
      <div v-if="invalid" class="invalid-container">
        <div class="alert error invalid-label">
          {{ $t('settings.style.themes3.editor.invalid') }}
        </div>
      </div>
    </div>
    <div class="assists">
      <Checkbox
        v-model="lightGrid"
        name="lightGrid"
        class="input-light-grid"
      >
        {{ $t('settings.style.shadows.light_grid') }}
      </Checkbox>
      <div class="style-control">
        <label class="label">
          {{ $t('settings.style.shadows.zoom') }}
        </label>
        <input
          v-model="zoom"
          class="input input-number y-shift-number"
          type="number"
        >
      </div>
      <ColorInput
        v-if="!noColorControl"
        class="input-color-input"
        v-model="colorOverride"
        fallback="#606060"
        :label="$t('settings.style.shadows.color_override')"
      />
    </div>
  </div>
</template>

<script>
import Checkbox from 'src/components/checkbox/checkbox.vue'
import ColorInput from 'src/components/color_input/color_input.vue'

export default {
  components: {
    Checkbox,
    ColorInput
  },
  props: [
    'shadow',
    'shadowControl',
    'previewClass',
    'previewStyle',
    'previewCss',
    'disabled',
    'invalid',
    'noColorControl'
  ],
  emits: ['update:shadow'],
  data () {
    return {
      colorOverride: undefined,
      lightGrid: false,
      zoom: 100
    }
  },
  computed: {
    style () {
      const result = [
        this.previewStyle,
        `zoom: ${this.zoom / 100}`
      ]
      if (this.colorOverride) result.push(`--background: ${this.colorOverride}`)
      return result
    },
    hideControls () {
      return typeof this.shadow === 'string'
    }
  },
  methods: {
    updateProperty (axis, value) {
      this.$emit('update:shadow', { axis, value: Number(value) })
    }
  }
}
</script>
<style lang="scss">
.ComponentPreview {
  display: grid;
  grid-template-columns: 1em 1fr 1fr 1em;
  grid-template-rows: 2em 1fr 1fr 1fr 1em 2em max-content;
  grid-template-areas:
    "header     header     header     header "
    "preview    preview    preview    y-slide"
    "preview    preview    preview    y-slide"
    "preview    preview    preview    y-slide"
    "x-slide    x-slide    x-slide    .      "
    "x-num      x-num      y-num      y-num  "
    "assists    assists    assists    assists";
  grid-gap: 0.5em;

  &:not(.-shadow-controls) {
    grid-template-areas:
      "header     header     header     header "
      "preview    preview    preview    y-slide"
      "preview    preview    preview    y-slide"
      "preview    preview    preview    y-slide"
      "assists    assists    assists    assists";
    grid-template-rows: 2em 1fr 1fr 1fr max-content;
  }

  .header {
    grid-area: header;
    justify-self: center;
    align-self: baseline;
    line-height: 2;
  }

  .invalid-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: grid;
    align-items: center;
    justify-items: center;
    background-color: rgba(100 0 0 / 50%);

    .alert {
      padding: 0.5em 1em;
    }
  }

  .assists {
    grid-area: assists;
    display: grid;
    grid-auto-flow: rows;
    grid-auto-rows: 2em;
    grid-gap: 0.5em;
  }

  .input-light-grid {
    justify-self: center;
  }

  .input-number {
    min-width: 2em;
  }

  .x-shift-number {
    grid-area: x-num;
    justify-self: right;
  }

  .y-shift-number {
    grid-area: y-num;
    justify-self: left;
  }

  .x-shift-number,
  .y-shift-number {
    input {
      max-width: 4em;
    }
  }

  .x-shift-slider {
    grid-area: x-slide;
    height: auto;
    align-self: start;
    min-width: 10em;
  }

  .y-shift-slider {
    grid-area: y-slide;
    writing-mode: vertical-lr;
    justify-self: left;
    min-height: 10em;
  }

  .x-shift-slider,
  .y-shift-slider {
    padding: 0;
  }

  .preview-window {
    --__grid-color1: rgb(102 102 102);
    --__grid-color2: rgb(153 153 153);
    --__grid-color1-disabled: rgba(102 102 102 / 20%);
    --__grid-color2-disabled: rgba(153 153 153 / 20%);

    &.-light-grid {
      --__grid-color1: rgb(205 205 205);
      --__grid-color2: rgb(255 255 255);
      --__grid-color1-disabled: rgba(205 205 205 / 20%);
      --__grid-color2-disabled: rgba(255 255 255 / 20%);
    }

    position: relative;
    grid-area: preview;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 10em;
    min-height: 10em;
    background-color: var(--__grid-color2);
    background-image:
      linear-gradient(45deg, var(--__grid-color1) 25%, transparent 25%),
      linear-gradient(-45deg, var(--__grid-color1) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--__grid-color1) 75%),
      linear-gradient(-45deg, transparent 75%, var(--__grid-color1) 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0;
    border-radius: var(--roundness);

    &.disabled {
      background-color: var(--__grid-color2-disabled);
      background-image:
        linear-gradient(45deg, var(--__grid-color1-disabled) 25%, transparent 25%),
        linear-gradient(-45deg, var(--__grid-color1-disabled) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, var(--__grid-color1-disabled) 75%),
        linear-gradient(-45deg, transparent 75%, var(--__grid-color1-disabled) 75%);
    }

    .preview-block {
      background: var(--background, var(--bg));
      display: flex;
      justify-content: center;
      align-items: center;
      min-width: 33%;
      min-height: 33%;
      max-width: 80%;
      max-height: 80%;
      border-width: 0;
      border-style: solid;
      border-color: var(--border);
      border-radius: var(--roundness);
      box-shadow: var(--shadow);
    }
  }
}
</style>
