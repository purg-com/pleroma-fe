import ColorInput from 'src/components/color_input/color_input.vue'
import OpacityInput from 'src/components/opacity_input/opacity_input.vue'
import Select from 'src/components/select/select.vue'
import SelectMotion from 'src/components/select/select_motion.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import Popover from 'src/components/popover/popover.vue'
import ComponentPreview from 'src/components/component_preview/component_preview.vue'
import { rgb2hex } from 'src/services/color_convert/color_convert.js'
import { serializeShadow } from 'src/services/theme_data/iss_serializer.js'
import { deserializeShadow } from 'src/services/theme_data/iss_deserializer.js'
import { getCssShadow, getCssShadowFilter } from 'src/services/theme_data/css_utils.js'
import { findShadow, findColor } from 'src/services/theme_data/theme_data_3.service.js'
import { library } from '@fortawesome/fontawesome-svg-core'
import { throttle, flattenDeep } from 'lodash'
import {
  faTimes,
  faChevronDown,
  faChevronUp,
  faPlus
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faChevronDown,
  faChevronUp,
  faTimes,
  faPlus
)

const toModel = (input) => {
  if (typeof input === 'object') {
    return {
      x: 0,
      y: 0,
      blur: 0,
      spread: 0,
      inset: false,
      color: '#000000',
      alpha: 1,
      ...input
    }
  } else if (typeof input === 'string') {
    return input
  }
}

export default {
  props: [
    'modelValue',
    'fallback',
    'separateInset',
    'noPreview',
    'disabled',
    'staticVars',
    'compact'
  ],
  emits: ['update:modelValue', 'subShadowSelected'],
  data () {
    return {
      selectedId: 0,
      invalid: false
    }
  },
  components: {
    ColorInput,
    OpacityInput,
    Select,
    SelectMotion,
    Checkbox,
    Popover,
    ComponentPreview
  },
  computed: {
    cValue: {
      get () {
        return (this.modelValue ?? this.fallback ?? []).map(toModel)
      },
      set (newVal) {
        this.$emit('update:modelValue', newVal)
      }
    },
    selectedType: {
      get () {
        return typeof this.selected
      },
      set (newType) {
        this.selected = toModel(newType === 'object' ? {} : '')
      }
    },
    selected: {
      get () {
        const selected = this.cValue[this.selectedId]
        if (selected && typeof selected === 'object') {
          return { ...selected }
        } else if (typeof selected === 'string') {
          return selected
        }
        return null
      },
      set (value) {
        this.cValue[this.selectedId] = toModel(value)
        this.$emit('update:modelValue', this.cValue)
      }
    },
    present () {
      return this.selected != null && this.modelValue != null
    },
    shadowsAreNull () {
      return this.modelValue == null
    },
    currentFallback () {
      return this.fallback?.[this.selectedId]
    },
    getColorFallback () {
      if (this.staticVars && this.selected?.color) {
        try {
          const computedColor = findColor(this.selected.color, { dynamicVars: {}, staticVars: this.staticVars }, true)
          if (computedColor) return rgb2hex(computedColor)
          return null
        } catch (e) {
          console.warn(e)
          return null
        }
      } else {
        return this.currentFallback?.color
      }
    },
    style () {
      try {
        let result
        const serialized = this.cValue.map(x => serializeShadow(x)).join(',')
        serialized.split(/,/).map(deserializeShadow) // validate
        const expandedShadow = flattenDeep(findShadow(this.cValue, { dynamicVars: {}, staticVars: this.staticVars }))
        const fixedShadows = expandedShadow.map(x => ({ ...x, color: console.log(x) || rgb2hex(x.color) }))

        if (this.separateInset) {
          result = {
            filter: getCssShadowFilter(fixedShadows),
            boxShadow: getCssShadow(fixedShadows, true)
          }
        } else {
          result = {
            boxShadow: getCssShadow(fixedShadows)
          }
        }
        this.invalid = false
        return result
      } catch (e) {
        console.error('Invalid shadow', e)
        this.invalid = true
      }
    }
  },
  watch: {
    selected (value) {
      this.$emit('subShadowSelected', this.selectedId)
    }
  },
  methods: {
    getNewSubshadow () {
      return toModel(this.selected)
    },
    onSelectChange (id) {
      this.selectedId = id
    },
    getSubshadowLabel (shadow, index) {
      if (typeof shadow === 'object') {
        return shadow?.name ?? this.$t('settings.style.shadows.shadow_id', { value: index })
      } else if (typeof shadow === 'string') {
        return shadow || this.$t('settings.style.shadows.empty_expression')
      }
    },
    updateProperty: throttle(function (prop, value) {
      this.cValue[this.selectedId][prop] = value
      if (prop === 'inset' && value === false && this.separateInset) {
        this.cValue[this.selectedId].spread = 0
      }
      this.$emit('update:modelValue', this.cValue)
    }, 100)
  }
}
