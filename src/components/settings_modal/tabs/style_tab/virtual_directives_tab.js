import { ref, computed, watch, inject } from 'vue'

import Select from 'src/components/select/select.vue'
import SelectMotion from 'src/components/select/select_motion.vue'
import ShadowControl from 'src/components/shadow_control/shadow_control.vue'
import ColorInput from 'src/components/color_input/color_input.vue'

import { serializeShadow } from 'src/services/theme_data/iss_serializer.js'

// helper for debugging
// eslint-disable-next-line no-unused-vars
const toValue = (x) => JSON.parse(JSON.stringify(x === undefined ? 'null' : x))

export default {
  components: {
    Select,
    SelectMotion,
    ShadowControl,
    ColorInput
  },
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup (props, context) {
    const exports = {}
    const emit = context.emit

    exports.emit = emit
    exports.computeColor = inject('computeColor')
    exports.staticVars = inject('staticVars')

    const selectedVirtualDirectiveId = ref(0)
    exports.selectedVirtualDirectiveId = selectedVirtualDirectiveId

    const selectedVirtualDirective = computed({
      get () {
        return props.modelValue[selectedVirtualDirectiveId.value]
      },
      set (value) {
        const newVD = [...props.modelValue]
        newVD[selectedVirtualDirectiveId.value] = value

        emit('update:modelValue', newVD)
      }
    })
    exports.selectedVirtualDirective = selectedVirtualDirective

    exports.selectedVirtualDirectiveValType = computed({
      get () {
        return props.modelValue[selectedVirtualDirectiveId.value].valType
      },
      set (value) {
        const newValType = value
        let newValue
        switch (value) {
          case 'shadow':
            newValue = '0 0 0 #000000 / 1'
            break
          case 'color':
            newValue = '#000000'
            break
          default:
            newValue = 'none'
        }
        const newName = props.modelValue[selectedVirtualDirectiveId.value].name
        props.modelValue[selectedVirtualDirectiveId.value] = {
          name: newName,
          value: newValue,
          valType: newValType
        }
      }
    })

    const draftVirtualDirectiveValid = ref(true)
    const draftVirtualDirective = ref({})
    exports.draftVirtualDirective = draftVirtualDirective
    const normalizeShadows = inject('normalizeShadows')

    watch(
      selectedVirtualDirective,
      (directive) => {
        switch (directive.valType) {
          case 'shadow': {
            if (Array.isArray(directive.value)) {
              draftVirtualDirective.value = normalizeShadows(directive.value)
            } else {
              const splitShadow = directive.value.split(/,/g).map(x => x.trim())
              draftVirtualDirective.value = normalizeShadows(splitShadow)
            }
            break
          }
          case 'color':
            draftVirtualDirective.value = directive.value
            break
          default:
            draftVirtualDirective.value = directive.value
            break
        }
      },
      { immediate: true }
    )

    watch(
      draftVirtualDirective,
      (directive) => {
        try {
          switch (selectedVirtualDirective.value.valType) {
            case 'shadow': {
              props.modelValue[selectedVirtualDirectiveId.value].value =
                directive.map(x => serializeShadow(x)).join(', ')
              break
            }
            default:
              props.modelValue[selectedVirtualDirectiveId.value].value = directive
          }
          draftVirtualDirectiveValid.value = true
        } catch (e) {
          console.error('Invalid virtual directive value', e)
          draftVirtualDirectiveValid.value = false
        }
      },
      { immediate: true }
    )

    exports.getNewVirtualDirective = () => ({
      name: 'newDirective',
      valType: 'generic',
      value: 'foobar'
    })

    return exports
  }
}
