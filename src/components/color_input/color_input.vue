<template>
  <div
    class="color-input style-control"
    :class="{ disabled: !present || disabled }"
  >
    <label
      :for="name"
      class="label"
      :class="{ faint: !present || disabled }"
    >
      {{ label }}
    </label>
    <Checkbox
      v-if="typeof fallback !== 'undefined' && showOptionalCheckbox && !hideOptionalCheckbox"
      :model-value="present"
      :disabled="disabled"
      class="opt"
      @update:modelValue="updateValue(typeof modelValue === 'undefined' ? fallback : undefined)"
    />
    <div
      class="input color-input-field"
      :class="{ disabled: !present || disabled }"
    >
      <input
        :id="name + '-t'"
        class="textColor unstyled"
        :class="{ disabled: !present || disabled }"
        type="text"
        :value="modelValue || fallback"
        :disabled="!present || disabled"
        @input="updateValue($event.target.value)"
      >
      <div
        v-if="validColor"
        class="validIndicator"
        :style="{backgroundColor: modelValue || fallback}"
      />
      <div
        v-else-if="transparentColor"
        class="transparentIndicator"
      />
      <div
        v-else-if="computedColor"
        class="computedIndicator"
        :style="{backgroundColor: fallback}"
      />
      <div
        v-else
        class="invalidIndicator"
      />
      <label class="nativeColor">
        <FAIcon icon="eye-dropper" />
        <input
          :id="name"
          class="unstyled"
          type="color"
          :value="modelValue || fallback"
          :disabled="!present || disabled"
          :class="{ disabled: !present || disabled }"
          @input="updateValue($event.target.value)"
        >
      </label>
    </div>
  </div>
</template>
<script>
import Checkbox from '../checkbox/checkbox.vue'
import { hex2rgb } from '../../services/color_convert/color_convert.js'
import { throttle } from 'lodash'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faEyeDropper
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faEyeDropper
)

export default {
  components: {
    Checkbox
  },
  props: {
    // Name of color, used for identifying
    name: {
      required: true,
      type: String
    },
    // Readable label
    label: {
      required: true,
      type: String
    },
    // Color value, should be required but vue cannot tell the difference
    // between "property missing" and "property set to undefined"
    modelValue: {
      required: false,
      type: String,
      default: undefined
    },
    // Color fallback to use when value is not defeind
    fallback: {
      required: false,
      type: String,
      default: undefined
    },
    // Disable the control
    disabled: {
      required: false,
      type: Boolean,
      default: false
    },
    // Show "optional" tickbox, for when value might become mandatory
    showOptionalCheckbox: {
      required: false,
      type: Boolean,
      default: true
    },
    // Force "optional" tickbox to hide
    hideOptionalCheckbox: {
      required: false,
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  computed: {
    present () {
      return typeof this.modelValue !== 'undefined'
    },
    validColor () {
      return hex2rgb(this.modelValue || this.fallback)
    },
    transparentColor () {
      return this.modelValue === 'transparent'
    },
    computedColor () {
      return this.modelValue && (this.modelValue.startsWith('--') || this.modelValue.startsWith('$'))
    }
  },
  methods: {
    updateValue: throttle(function (value) {
      this.$emit('update:modelValue', value)
    }, 100)
  }
}
</script>
<style lang="scss" src="./color_input.scss"></style>
