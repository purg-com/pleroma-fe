import { ref, reactive, computed, watch, watchEffect, provide, getCurrentInstance } from 'vue'
import { useStore } from 'vuex'
import { get, set, unset, throttle } from 'lodash'

import Select from 'src/components/select/select.vue'
import SelectMotion from 'src/components/select/select_motion.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import ComponentPreview from 'src/components/component_preview/component_preview.vue'
import StringSetting from '../../helpers/string_setting.vue'
import ShadowControl from 'src/components/shadow_control/shadow_control.vue'
import ColorInput from 'src/components/color_input/color_input.vue'
import PaletteEditor from 'src/components/palette_editor/palette_editor.vue'
import OpacityInput from 'src/components/opacity_input/opacity_input.vue'
import RoundnessInput from 'src/components/roundness_input/roundness_input.vue'
import TabSwitcher from 'src/components/tab_switcher/tab_switcher.jsx'
import Tooltip from 'src/components/tooltip/tooltip.vue'
import ContrastRatio from 'src/components/contrast_ratio/contrast_ratio.vue'
import Preview from '../theme_tab/theme_preview.vue'

import VirtualDirectivesTab from './virtual_directives_tab.vue'

import { init, findColor } from 'src/services/theme_data/theme_data_3.service.js'
import {
  getCssRules,
  getScopedVersion
} from 'src/services/theme_data/css_utils.js'
import { serialize } from 'src/services/theme_data/iss_serializer.js'
import { deserializeShadow, deserialize } from 'src/services/theme_data/iss_deserializer.js'
import {
  rgb2hex,
  hex2rgb,
  getContrastRatio
} from 'src/services/color_convert/color_convert.js'
import {
  newImporter,
  newExporter
} from 'src/services/export_import/export_import.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faFloppyDisk,
  faFolderOpen,
  faFile,
  faArrowsRotate,
  faCheck
} from '@fortawesome/free-solid-svg-icons'

// helper for debugging
// eslint-disable-next-line no-unused-vars
const toValue = (x) => JSON.parse(JSON.stringify(x === undefined ? 'null' : x))

// helper to make states comparable
const normalizeStates = (states) => ['normal', ...(states?.filter(x => x !== 'normal') || [])].join(':')

library.add(
  faFile,
  faFloppyDisk,
  faFolderOpen,
  faArrowsRotate,
  faCheck
)

export default {
  components: {
    Select,
    SelectMotion,
    Checkbox,
    Tooltip,
    StringSetting,
    ComponentPreview,
    TabSwitcher,
    ShadowControl,
    ColorInput,
    PaletteEditor,
    OpacityInput,
    RoundnessInput,
    ContrastRatio,
    Preview,
    VirtualDirectivesTab
  },
  setup (props, context) {
    const exports = {}
    const store = useStore()
    // All rules that are made by editor
    const allEditedRules = ref(store.state.interface.styleDataUsed || {})
    const styleDataUsed = computed(() => store.state.interface.styleDataUsed)

    watch([styleDataUsed], (value) => {
      onImport(store.state.interface.styleDataUsed)
    }, { once: true })

    exports.isActive = computed(() => {
      const tabSwitcher = getCurrentInstance().parent.ctx
      return tabSwitcher ? tabSwitcher.isActive('style') : false
    })

    // ## Meta stuff
    exports.name = ref('')
    exports.author = ref('')
    exports.license = ref('')
    exports.website = ref('')

    const metaOut = computed(() => {
      return [
        '@meta {',
        `  name: ${exports.name.value};`,
        `  author: ${exports.author.value};`,
        `  license: ${exports.license.value};`,
        `  website: ${exports.website.value};`,
        '}'
      ].join('\n')
    })

    const metaRule = computed(() => ({
      component: '@meta',
      directives: {
        name: exports.name.value,
        author: exports.author.value,
        license: exports.license.value,
        website: exports.website.value
      }
    }))

    // ## Palette stuff
    const palettes = reactive([
      {
        name: 'default',
        bg: '#121a24',
        fg: '#182230',
        text: '#b9b9ba',
        link: '#d8a070',
        accent: '#d8a070',
        cRed: '#FF0000',
        cBlue: '#0095ff',
        cGreen: '#0fa00f',
        cOrange: '#ffa500'
      },
      {
        name: 'light',
        bg: '#f2f6f9',
        fg: '#d6dfed',
        text: '#304055',
        underlay: '#5d6086',
        accent: '#f55b1b',
        cBlue: '#0095ff',
        cRed: '#d31014',
        cGreen: '#0fa00f',
        cOrange: '#ffa500',
        border: '#d8e6f9'
      }
    ])
    exports.palettes = palettes

    // This is kinda dumb but you cannot "replace" reactive() object
    // and so v-model simply fails when you try to chage (increase only?)
    // length of the array. Since linter complains about mutating modelValue
    // inside SelectMotion, the next best thing is to just wipe existing array
    // and replace it with new one.

    const onPalettesUpdate = (e) => {
      palettes.splice(0, palettes.length)
      palettes.push(...e)
    }
    exports.onPalettesUpdate = onPalettesUpdate

    const selectedPaletteId = ref(0)
    const selectedPalette = computed({
      get () {
        return palettes[selectedPaletteId.value]
      },
      set (newPalette) {
        palettes[selectedPaletteId.value] = newPalette
      }
    })
    exports.selectedPaletteId = selectedPaletteId
    exports.selectedPalette = selectedPalette
    provide('selectedPalette', selectedPalette)

    watch([selectedPalette], () => updateOverallPreview())

    exports.getNewPalette = () => ({
      name: 'new palette',
      bg: '#121a24',
      fg: '#182230',
      text: '#b9b9ba',
      link: '#d8a070',
      accent: '#d8a070',
      cRed: '#FF0000',
      cBlue: '#0095ff',
      cGreen: '#0fa00f',
      cOrange: '#ffa500'
    })

    // Raw format
    const palettesRule = computed(() => {
      return palettes.map(palette => {
        const { name, ...rest } = palette
        return {
          component: '@palette',
          variant: name,
          directives: Object
            .entries(rest)
            .filter(([k, v]) => v && k)
            .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
        }
      })
    })

    // Text format
    const palettesOut = computed(() => {
      return palettes.map(({ name, ...palette }) => {
        const entries = Object
          .entries(palette)
          .filter(([k, v]) => v && k)
          .map(([slot, data]) => `  ${slot}: ${data};`)
          .join('\n')

        return `@palette.${name} {\n${entries}\n}`
      }).join('\n\n')
    })

    // ## Components stuff
    // Getting existing components
    const componentsContext = require.context('src', true, /\.style.js(on)?$/)
    const componentKeysAll = componentsContext.keys()
    const componentsMap = new Map(
      componentKeysAll
        .map(
          key => [key, componentsContext(key).default]
        ).filter(([key, component]) => !component.virtual && !component.notEditable)
    )
    exports.componentsMap = componentsMap
    const componentKeys = [...componentsMap.keys()]
    exports.componentKeys = componentKeys

    // Component list and selection
    const selectedComponentKey = ref(componentsMap.keys().next().value)
    exports.selectedComponentKey = selectedComponentKey

    const selectedComponent = computed(() => componentsMap.get(selectedComponentKey.value))
    const selectedComponentName = computed(() => selectedComponent.value.name)

    // Selection basis
    exports.selectedComponentVariants = computed(() => {
      return Object.keys({ normal: null, ...(selectedComponent.value.variants || {}) })
    })
    exports.selectedComponentStates = computed(() => {
      const all = Object.keys({ normal: null, ...(selectedComponent.value.states || {}) })
      return all.filter(x => x !== 'normal')
    })

    // selection
    const selectedVariant = ref('normal')
    exports.selectedVariant = selectedVariant
    const selectedState = reactive(new Set())
    exports.selectedState = selectedState
    exports.updateSelectedStates = (state, v) => {
      if (v) {
        selectedState.add(state)
      } else {
        selectedState.delete(state)
      }
    }

    // Reset variant and state on component change
    const updateSelectedComponent = () => {
      selectedVariant.value = 'normal'
      selectedState.clear()
    }

    watch(
      selectedComponentName,
      updateSelectedComponent
    )

    // ### Rules stuff aka meat and potatoes
    // The native structure of separate rules and the child -> parent
    // relation isn't very convenient for editor, we replace the array
    // and child -> parent structure with map and parent -> child structure
    const rulesToEditorFriendly = (rules, root = {}) => rules.reduce((acc, rule) => {
      const { parent: rParent, component: rComponent } = rule
      const parent = rParent ?? rule
      const hasChildren = !!rParent
      const child = hasChildren ? rule : null

      const {
        component: pComponent,
        variant: pVariant = 'normal',
        state: pState = [] // no relation to Intel CPUs whatsoever
      } = parent

      const pPath = `${hasChildren ? pComponent : rComponent}.${pVariant}.${normalizeStates(pState)}`

      let output = get(acc, pPath)
      if (!output) {
        set(acc, pPath, {})
        output = get(acc, pPath)
      }

      if (hasChildren) {
        output._children = output._children ?? {}
        const {
          component: cComponent,
          variant: cVariant = 'normal',
          state: cState = [],
          directives
        } = child

        const cPath = `${cComponent}.${cVariant}.${normalizeStates(cState)}`
        set(output._children, cPath, { directives })
      } else {
        output.directives = parent.directives
      }
      return acc
    }, root)

    const editorFriendlyFallbackStructure = computed(() => {
      const root = {}

      componentKeys.forEach((componentKey) => {
        const componentValue = componentsMap.get(componentKey)
        const { defaultRules, name } = componentValue
        rulesToEditorFriendly(
          defaultRules.map((rule) => ({ ...rule, component: name })),
          root
        )
      })

      return root
    })

    // Checking whether component can support some "directives" which
    // are actually virtual subcomponents, i.e. Text, Link etc
    exports.componentHas = (subComponent) => {
      return !!selectedComponent.value.validInnerComponents?.find(x => x === subComponent)
    }

    // Path for lodash's get and set
    const getPath = (component, directive) => {
      const pathSuffix = component ? `._children.${component}.normal.normal` : ''
      const path = `${selectedComponentName.value}.${selectedVariant.value}.${normalizeStates([...selectedState])}${pathSuffix}.directives.${directive}`
      return path
    }

    // Templates for directives
    const isElementPresent = (component, directive, defaultValue = '') => computed({
      get () {
        return get(allEditedRules.value, getPath(component, directive)) != null
      },
      set (value) {
        if (value) {
          const fallback = get(
            editorFriendlyFallbackStructure.value,
            getPath(component, directive)
          )
          set(allEditedRules.value, getPath(component, directive), fallback ?? defaultValue)
        } else {
          unset(allEditedRules.value, getPath(component, directive))
        }
        exports.updateOverallPreview()
      }
    })

    const getEditedElement = (component, directive, postProcess = x => x) => computed({
      get () {
        let usedRule
        const fallback = editorFriendlyFallbackStructure.value
        const real = allEditedRules.value
        const path = getPath(component, directive)

        usedRule = get(real, path) // get real
        if (!usedRule) {
          usedRule = get(fallback, path)
        }

        return postProcess(usedRule)
      },
      set (value) {
        if (value) {
          set(allEditedRules.value, getPath(component, directive), value)
        } else {
          unset(allEditedRules.value, getPath(component, directive))
        }
        exports.updateOverallPreview()
      }
    })

    // All the editable stuff for the component
    exports.editedBackgroundColor = getEditedElement(null, 'background')
    exports.isBackgroundColorPresent = isElementPresent(null, 'background', '#FFFFFF')
    exports.editedOpacity = getEditedElement(null, 'opacity')
    exports.isOpacityPresent = isElementPresent(null, 'opacity', 1)
    exports.editedRoundness = getEditedElement(null, 'roundness')
    exports.isRoundnessPresent = isElementPresent(null, 'roundness', '0')
    exports.editedTextColor = getEditedElement('Text', 'textColor')
    exports.isTextColorPresent = isElementPresent('Text', 'textColor', '#000000')
    exports.editedTextAuto = getEditedElement('Text', 'textAuto')
    exports.isTextAutoPresent = isElementPresent('Text', 'textAuto', '#000000')
    exports.editedLinkColor = getEditedElement('Link', 'textColor')
    exports.isLinkColorPresent = isElementPresent('Link', 'textColor', '#000080')
    exports.editedIconColor = getEditedElement('Icon', 'textColor')
    exports.isIconColorPresent = isElementPresent('Icon', 'textColor', '#909090')
    exports.editedBorderColor = getEditedElement('Border', 'textColor')
    exports.isBorderColorPresent = isElementPresent('Border', 'textColor', '#909090')

    const getContrast = (bg, text) => {
      try {
        const bgRgb = hex2rgb(bg)
        const textRgb = hex2rgb(text)

        const ratio = getContrastRatio(bgRgb, textRgb)
        return {
          // TODO this ideally should be part of <ContractRatio />
          ratio,
          text: ratio.toPrecision(3) + ':1',
          // AA level, AAA level
          aa: ratio >= 4.5,
          aaa: ratio >= 7,
          // same but for 18pt+ texts
          laa: ratio >= 3,
          laaa: ratio >= 4.5
        }
      } catch (e) {
        console.warn('Failure computing contrast', e)
        return { error: e }
      }
    }

    const normalizeShadows = (shadows) => {
      return shadows?.map(shadow => {
        if (typeof shadow === 'object') {
          return shadow
        }
        if (typeof shadow === 'string') {
          try {
            return deserializeShadow(shadow)
          } catch (e) {
            console.warn(e)
            return shadow
          }
        }
        return null
      })
    }
    provide('normalizeShadows', normalizeShadows)

    // Shadow is partially edited outside the ShadowControl
    // for better space utilization
    const editedShadow = getEditedElement(null, 'shadow', normalizeShadows)
    exports.editedShadow = editedShadow
    const editedSubShadowId = ref(null)
    exports.editedSubShadowId = editedSubShadowId
    const editedSubShadow = computed(() => {
      if (editedShadow.value == null || editedSubShadowId.value == null) return null
      return editedShadow.value[editedSubShadowId.value]
    })
    exports.editedSubShadow = editedSubShadow
    exports.isShadowPresent = isElementPresent(null, 'shadow', [])
    exports.onSubShadow = (id) => {
      if (id != null) {
        editedSubShadowId.value = id
      } else {
        editedSubShadow.value = null
      }
    }
    exports.updateSubShadow = (axis, value) => {
      if (!editedSubShadow.value || editedSubShadowId.value == null) return
      const newEditedShadow = [...editedShadow.value]

      newEditedShadow[editedSubShadowId.value] = {
        ...newEditedShadow[editedSubShadowId.value],
        [axis]: value
      }

      editedShadow.value = newEditedShadow
    }
    exports.isShadowTabOpen = ref(false)
    exports.onTabSwitch = (tab) => {
      exports.isShadowTabOpen.value = tab === 'shadow'
    }

    // component preview
    exports.editorHintStyle = computed(() => {
      const editorHint = selectedComponent.value.editor
      const styles = []
      if (editorHint && Object.keys(editorHint).length > 0) {
        if (editorHint.aspect != null) {
          styles.push(`aspect-ratio: ${editorHint.aspect} !important;`)
        }
        if (editorHint.border != null) {
          styles.push(`border-width: ${editorHint.border}px !important;`)
        }
      }
      return styles.join('; ')
    })

    const editorFriendlyToOriginal = computed(() => {
      const resultRules = []

      const convert = (component, data = {}, parent) => {
        const variants = Object.entries(data || {})

        variants.forEach(([variant, variantData]) => {
          const states = Object.entries(variantData)

          states.forEach(([jointState, stateData]) => {
            const state = jointState.split(/:/g)
            const result = {
              component,
              variant,
              state,
              directives: stateData.directives || {}
            }

            if (parent) {
              result.parent = {
                component: parent
              }
            }

            resultRules.push(result)

            // Currently we only support single depth for simplicity's sake
            if (!parent) {
              Object.entries(stateData._children || {}).forEach(([cName, child]) => convert(cName, child, component))
            }
          })
        })
      }

      [...componentsMap.values()].forEach(({ name }) => {
        convert(name, allEditedRules.value[name])
      })

      return resultRules
    })

    const allCustomVirtualDirectives = [...componentsMap.values()]
      .map(c => {
        return c
          .defaultRules
          .filter(c => c.component === 'Root')
          .map(x => Object.entries(x.directives))
          .flat()
      })
      .filter(x => x)
      .flat()
      .map(([name, value]) => {
        const [valType, valVal] = value.split('|')
        return {
          name: name.substring(2),
          valType: valType?.trim(),
          value: valVal?.trim()
        }
      })

    const virtualDirectives = ref(allCustomVirtualDirectives)
    exports.virtualDirectives = virtualDirectives
    exports.updateVirtualDirectives = (value) => {
      virtualDirectives.value = value
    }

    // Raw format
    const virtualDirectivesRule = computed(() => ({
      component: 'Root',
      directives: Object.fromEntries(
        virtualDirectives.value.map(vd => [`--${vd.name}`, `${vd.valType} | ${vd.value}`])
      )
    }))

    // Text format
    const virtualDirectivesOut = computed(() => {
      return [
        'Root {',
        ...virtualDirectives.value
          .filter(vd => vd.name && vd.valType && vd.value)
          .map(vd => `  --${vd.name}: ${vd.valType} | ${vd.value};`),
        '}'
      ].join('\n')
    })

    exports.computeColor = (color) => {
      let computedColor
      try {
        computedColor = findColor(color, { dynamicVars: dynamicVars.value, staticVars: staticVars.value })
        if (computedColor) {
          return rgb2hex(computedColor)
        }
      } catch (e) {
        console.warn(e)
      }
      return null
    }
    provide('computeColor', exports.computeColor)

    exports.contrast = computed(() => {
      return getContrast(
        exports.computeColor(previewColors.value.background),
        exports.computeColor(previewColors.value.text)
      )
    })

    // ## Export and Import
    const styleExporter = newExporter({
      filename: () => exports.name.value ?? 'pleroma_theme',
      mime: 'text/plain',
      extension: 'piss',
      getExportedObject: () => exportStyleData.value
    })

    const onImport = parsed => {
      const editorComponents = parsed.filter(x => x.component.startsWith('@'))
      const rootComponent = parsed.find(x => x.component === 'Root')
      const rules = parsed.filter(x => !x.component.startsWith('@') && x.component !== 'Root')
      const metaIn = editorComponents.find(x => x.component === '@meta').directives
      const palettesIn = editorComponents.filter(x => x.component === '@palette')

      exports.name.value = metaIn.name
      exports.license.value = metaIn.license
      exports.author.value = metaIn.author
      exports.website.value = metaIn.website

      const newVirtualDirectives = Object
        .entries(rootComponent.directives)
        .map(([name, value]) => {
          const [valType, valVal] = value.split('|').map(x => x.trim())
          return { name: name.substring(2), valType, value: valVal }
        })
      virtualDirectives.value = newVirtualDirectives

      onPalettesUpdate(palettesIn.map(x => ({ name: x.variant, ...x.directives })))

      allEditedRules.value = rulesToEditorFriendly(rules)

      exports.updateOverallPreview()
    }

    const styleImporter = newImporter({
      accept: '.piss',
      parser (string) { return deserialize(string) },
      onImportFailure (result) {
        console.error('Failure importing style:', result)
        this.$store.dispatch('pushGlobalNotice', { messageKey: 'settings.invalid_theme_imported', level: 'error' })
      },
      onImport
    })

    // Raw format
    const exportRules = computed(() => [
      metaRule.value,
      ...palettesRule.value,
      virtualDirectivesRule.value,
      ...editorFriendlyToOriginal.value
    ])

    // Text format
    const exportStyleData = computed(() => {
      return [
        metaOut.value,
        palettesOut.value,
        virtualDirectivesOut.value,
        serialize(editorFriendlyToOriginal.value)
      ].join('\n\n')
    })

    exports.clearStyle = () => {
      onImport(store.state.interface.styleDataUsed)
    }

    exports.exportStyle = () => {
      styleExporter.exportData()
    }

    exports.importStyle = () => {
      styleImporter.importData()
    }

    exports.applyStyle = () => {
      store.dispatch('setStyleCustom', exportRules.value)
    }

    const overallPreviewRules = ref([])
    exports.overallPreviewRules = overallPreviewRules

    const overallPreviewCssRules = ref([])
    watchEffect(throttle(() => {
      try {
        overallPreviewCssRules.value = getScopedVersion(
          getCssRules(overallPreviewRules.value),
          '#edited-style-preview'
        ).join('\n')
      } catch (e) {
        console.error(e)
      }
    }, 500))

    exports.overallPreviewCssRules = overallPreviewCssRules

    const updateOverallPreview = throttle(() => {
      try {
        overallPreviewRules.value = init({
          inputRuleset: [
            ...exportRules.value,
            {
              component: 'Root',
              directives: Object.fromEntries(
                Object
                  .entries(selectedPalette.value)
                  .filter(([k, v]) => k && v && k !== 'name')
                  .map(([k, v]) => [`--${k}`, `color | ${v}`])
              )
            }
          ],
          ultimateBackgroundColor: '#000000',
          debug: true
        }).eager
      } catch (e) {
        console.error('Could not compile preview theme', e)
        return null
      }
    }, 5000)
    //
    // Apart from "hover" we can't really show how component looks like in
    // certain states, so we have to fake them.
    const simulatePseudoSelectors = (css, prefix) => css
      .replace(prefix, '.component-preview .preview-block')
      .replace(':active', '.preview-active')
      .replace(':hover', '.preview-hover')
      .replace(':active', '.preview-active')
      .replace(':focus', '.preview-focus')
      .replace(':focus-within', '.preview-focus-within')
      .replace(':disabled', '.preview-disabled')

    const previewRules = computed(() => {
      const filtered = overallPreviewRules.value.filter(r => {
        const componentMatch = r.component === selectedComponentName.value
        const parentComponentMatch = r.parent?.component === selectedComponentName.value
        if (!componentMatch && !parentComponentMatch) return false
        const rule = parentComponentMatch ? r.parent : r
        if (rule.component !== selectedComponentName.value) return false
        if (rule.variant !== selectedVariant.value) return false
        const ruleState = new Set(rule.state.filter(x => x !== 'normal'))
        const differenceA = [...ruleState].filter(x => !selectedState.has(x))
        const differenceB = [...selectedState].filter(x => !ruleState.has(x))
        return (differenceA.length + differenceB.length) === 0
      })
      const sorted = [...filtered]
        .filter(x => x.component === selectedComponentName.value)
        .sort((a, b) => {
          const aSelectorLength = a.selector.split(/ /g).length
          const bSelectorLength = b.selector.split(/ /g).length
          return aSelectorLength - bSelectorLength
        })

      const prefix = sorted[0].selector

      return filtered.filter(x => x.selector.startsWith(prefix))
    })

    exports.previewClass = computed(() => {
      const selectors = []
      if (!!selectedComponent.value.variants?.normal || selectedVariant.value !== 'normal') {
        selectors.push(selectedComponent.value.variants[selectedVariant.value])
      }
      if (selectedState.size > 0) {
        selectedState.forEach(state => {
          const original = selectedComponent.value.states[state]
          selectors.push(simulatePseudoSelectors(original))
        })
      }
      return selectors.map(x => x.substring(1)).join('')
    })

    exports.previewCss = computed(() => {
      try {
        const prefix = previewRules.value[0].selector
        const scoped = getCssRules(previewRules.value).map(x => simulatePseudoSelectors(x, prefix))
        return scoped.join('\n')
      } catch (e) {
        console.error('Invalid ruleset', e)
        return null
      }
    })

    const dynamicVars = computed(() => {
      return previewRules.value[0].dynamicVars
    })

    const staticVars = computed(() => {
      const rootComponent = overallPreviewRules.value.find(r => {
        return r.component === 'Root'
      })
      const rootDirectivesEntries = Object.entries(rootComponent.directives)
      const directives = {}
      rootDirectivesEntries
        .filter(([k, v]) => k.startsWith('--') && v.startsWith('color | '))
        .map(([k, v]) => [k.substring(2), v.substring('color | '.length)])
        .forEach(([k, v]) => {
          directives[k] = findColor(v, { dynamicVars: {}, staticVars: directives })
        })
      return directives
    })
    provide('staticVars', staticVars)
    exports.staticVars = staticVars

    const previewColors = computed(() => {
      const stacked = dynamicVars.value.stacked
      const background = typeof stacked === 'string' ? stacked : rgb2hex(stacked)
      return {
        text: previewRules.value.find(r => r.component === 'Text')?.virtualDirectives['--text'],
        link: previewRules.value.find(r => r.component === 'Link')?.virtualDirectives['--link'],
        border: previewRules.value.find(r => r.component === 'Border')?.virtualDirectives['--border'],
        icon: previewRules.value.find(r => r.component === 'Icon')?.virtualDirectives['--icon'],
        background
      }
    })
    exports.previewColors = previewColors
    exports.updateOverallPreview = updateOverallPreview

    updateOverallPreview()

    watch(
      [
        allEditedRules.value,
        palettes,
        selectedPalette,
        selectedState,
        selectedVariant
      ],
      updateOverallPreview
    )

    return exports
  }
}
