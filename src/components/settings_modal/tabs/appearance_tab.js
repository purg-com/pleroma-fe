import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import FloatSetting from '../helpers/float_setting.vue'
import UnitSetting, { defaultHorizontalUnits } from '../helpers/unit_setting.vue'
import PaletteEditor from 'src/components/palette_editor/palette_editor.vue'

import FontControl from 'src/components/font_control/font_control.vue'

import { normalizeThemeData } from 'src/modules/interface'

import { newImporter } from 'src/services/export_import/export_import.js'
import { convertTheme2To3 } from 'src/services/theme_data/theme2_to_theme3.js'
import { init } from 'src/services/theme_data/theme_data_3.service.js'
import {
  getCssRules,
  getScopedVersion
} from 'src/services/theme_data/css_utils.js'
import { deserialize } from 'src/services/theme_data/iss_deserializer.js'

import SharedComputedObject from '../helpers/shared_computed_object.js'
import ProfileSettingIndicator from '../helpers/profile_setting_indicator.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faGlobe
} from '@fortawesome/free-solid-svg-icons'

import Preview from './theme_tab/theme_preview.vue'

// helper for debugging
// eslint-disable-next-line no-unused-vars
const toValue = (x) => JSON.parse(JSON.stringify(x === undefined ? 'null' : x))

library.add(
  faGlobe
)

const AppearanceTab = {
  data () {
    return {
      availableThemesV3: [],
      availableThemesV2: [],
      bundledPalettes: [],
      compilationCache: {},
      fileImporter: newImporter({
        accept: '.json, .piss',
        validator: this.importValidator,
        onImport: this.onImport,
        parser: this.importParser,
        onImportFailure: this.onImportFailure
      }),
      palettesKeys: [
        'bg',
        'fg',
        'link',
        'text',
        'cRed',
        'cGreen',
        'cBlue',
        'cOrange'
      ],
      userPalette: {},
      intersectionObserver: null,
      thirdColumnModeOptions: ['none', 'notifications', 'postform'].map(mode => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.third_column_mode_${mode}`)
      })),
      forcedRoundnessOptions: ['disabled', 'sharp', 'nonsharp', 'round'].map((mode, i) => ({
        key: mode,
        value: i - 1,
        label: this.$t(`settings.style.themes3.hacks.forced_roundness_mode_${mode}`)
      })),
      underlayOverrideModes: ['none', 'opaque', 'transparent'].map((mode, i) => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.style.themes3.hacks.underlay_override_mode_${mode}`)
      }))
    }
  },
  components: {
    BooleanSetting,
    ChoiceSetting,
    IntegerSetting,
    FloatSetting,
    UnitSetting,
    ProfileSettingIndicator,
    FontControl,
    Preview,
    PaletteEditor
  },
  mounted () {
    this.$store.dispatch('getThemeData')

    const updateIndex = (resource) => {
      const capitalizedResource = resource[0].toUpperCase() + resource.slice(1)
      const currentIndex = this.$store.state.instance[`${resource}sIndex`]

      let promise
      if (currentIndex) {
        promise = Promise.resolve(currentIndex)
      } else {
        promise = this.$store.dispatch(`fetch${capitalizedResource}sIndex`)
      }

      return promise.then(index => {
        return Object
          .entries(index)
          .map(([k, func]) => [k, func()])
      })
    }

    updateIndex('style').then(styles => {
      styles.forEach(([key, stylePromise]) => stylePromise.then(data => {
        const meta = data.find(x => x.component === '@meta')
        this.availableThemesV3.push({ key, data, name: meta.directives.name, version: 'v3' })
      }))
    })

    updateIndex('theme').then(themes => {
      themes.forEach(([key, themePromise]) => themePromise.then(data => {
        if (!data) {
          console.warn(`Theme with key ${key} is empty or malformed`)
        } else if (Array.isArray(data)) {
          console.warn(`Theme with key ${key} is a v1 theme and should be moved to static/palettes/index.json`)
        } else if (!data.source && !data.theme) {
          console.warn(`Theme with key ${key} is malformed`)
        } else {
          this.availableThemesV2.push({ key, data, name: data.name, version: 'v2' })
        }
      }))
    })

    this.userPalette = this.$store.state.interface.paletteDataUsed || {}

    updateIndex('palette').then(bundledPalettes => {
      bundledPalettes.forEach(([key, palettePromise]) => palettePromise.then(v => {
        let palette
        if (Array.isArray(v)) {
          const [
            name,
            bg,
            fg,
            text,
            link,
            cRed = '#FF0000',
            cGreen = '#00FF00',
            cBlue = '#0000FF',
            cOrange = '#E3FF00'
          ] = v
          palette = { key, name, bg, fg, text, link, cRed, cBlue, cGreen, cOrange }
        } else {
          palette = { key, ...v }
        }
        if (!palette.key.startsWith('style.')) {
          this.bundledPalettes.push(palette)
        }
      }))
    })

    if (window.IntersectionObserver) {
      this.intersectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return
          const theme = this.availableStyles.find(x => x.key === target.dataset.themeKey)
          this.$nextTick(() => {
            if (theme) theme.ready = true
          })
          observer.unobserve(target)
        })
      }, {
        root: this.$refs.themeList
      })
    }
  },
  updated () {
    this.$nextTick(() => {
      this.$refs.themeList.querySelectorAll('.theme-preview').forEach(node => {
        this.intersectionObserver.observe(node)
      })
    })
  },
  watch: {
    paletteDataUsed () {
      this.userPalette = this.paletteDataUsed || {}
    }
  },
  computed: {
    paletteDataUsed () {
      return this.$store.state.interface.paletteDataUsed
    },
    availableStyles () {
      return [
        ...this.availableThemesV3,
        ...this.availableThemesV2
      ]
    },
    availablePalettes () {
      return [
        ...this.bundledPalettes,
        ...this.stylePalettes
      ]
    },
    stylePalettes () {
      const ruleset = this.$store.state.interface.styleDataUsed || []
      if (!ruleset && ruleset.length === 0) return
      const meta = ruleset.find(x => x.component === '@meta')
      const result = ruleset.filter(x => x.component.startsWith('@palette'))
        .map(x => {
          const { variant, directives } = x
          const {
            bg,
            fg,
            text,
            link,
            accent,
            cRed,
            cBlue,
            cGreen,
            cOrange,
            wallpaper
          } = directives

          const result = {
            name: `${meta.directives.name || this.$t('settings.style.themes3.palette.imported')}: ${variant}`,
            key: `style.${variant.toLowerCase().replace(/ /g, '_')}`,
            bg,
            fg,
            text,
            link,
            accent,
            cRed,
            cBlue,
            cGreen,
            cOrange,
            wallpaper
          }
          return Object.fromEntries(Object.entries(result).filter(([k, v]) => v))
        })
      return result
    },
    noIntersectionObserver () {
      return !window.IntersectionObserver
    },
    horizontalUnits () {
      return defaultHorizontalUnits
    },
    fontsOverride () {
      return this.$store.getters.mergedConfig.fontsOverride
    },
    columns () {
      const mode = this.$store.getters.mergedConfig.thirdColumnMode

      const notif = mode === 'none' ? [] : ['notifs']

      if (this.$store.getters.mergedConfig.sidebarRight || mode === 'postform') {
        return [...notif, 'content', 'sidebar']
      } else {
        return ['sidebar', 'content', ...notif]
      }
    },
    instanceWallpaperUsed () {
      return this.$store.state.instance.background &&
        !this.$store.state.users.currentUser.background_image
    },
    language: {
      get: function () { return this.$store.getters.mergedConfig.interfaceLanguage },
      set: function (val) {
        this.$store.dispatch('setOption', { name: 'interfaceLanguage', value: val })
      }
    },
    customThemeVersion () {
      const { themeVersion } = this.$store.state.interface
      return themeVersion
    },
    isCustomThemeUsed () {
      const { customTheme, customThemeSource } = this.mergedConfig
      return customTheme != null || customThemeSource != null
    },
    isCustomStyleUsed (name) {
      const { styleCustomData } = this.mergedConfig
      return styleCustomData != null
    },
    ...SharedComputedObject()
  },
  methods: {
    updateFont (key, value) {
      this.$store.dispatch('setOption', {
        name: 'theme3hacks',
        value: {
          ...this.mergedConfig.theme3hacks,
          fonts: {
            ...this.mergedConfig.theme3hacks.fonts,
            [key]: value
          }
        }
      })
    },
    importFile () {
      this.fileImporter.importData()
    },
    importParser (file, filename) {
      if (filename.endsWith('.json')) {
        return JSON.parse(file)
      } else if (filename.endsWith('.piss')) {
        return deserialize(file)
      }
    },
    onImport (parsed, filename) {
      if (filename.endsWith('.json')) {
        this.$store.dispatch('setThemeCustom', parsed.source || parsed.theme)
      } else if (filename.endsWith('.piss')) {
        this.$store.dispatch('setStyleCustom', parsed)
      }
    },
    onImportFailure (result) {
      console.error('Failure importing theme:', result)
      this.$store.dispatch('pushGlobalNotice', { messageKey: 'settings.invalid_theme_imported', level: 'error' })
    },
    importValidator (parsed, filename) {
      if (filename.endsWith('.json')) {
        const version = parsed._pleroma_theme_version
        return version >= 1 || version <= 2
      } else if (filename.endsWith('.piss')) {
        if (!Array.isArray(parsed)) return false
        if (parsed.length < 1) return false
        if (parsed.find(x => x.component === '@meta') == null) return false
        return true
      }
    },
    isThemeActive (key) {
      return key === (this.mergedConfig.theme || this.$store.state.instance.theme)
    },
    isStyleActive (key) {
      return key === (this.mergedConfig.style || this.$store.state.instance.style)
    },
    isPaletteActive (key) {
      return key === (this.mergedConfig.palette || this.$store.state.instance.palette)
    },
    setStyle (name) {
      this.$store.dispatch('setStyle', name)
    },
    setTheme (name) {
      this.$store.dispatch('setTheme', name)
    },
    setPalette (name, data) {
      this.$store.dispatch('setPalette', name)
      this.userPalette = data
    },
    setPaletteCustom (data) {
      this.$store.dispatch('setPaletteCustom', data)
      this.userPalette = data
    },
    resetTheming (name) {
      this.$store.dispatch('setStyle', 'stock')
    },
    previewTheme (key, version, input) {
      let theme3
      if (this.compilationCache[key]) {
        theme3 = this.compilationCache[key]
      } else if (input) {
        if (version === 'v2') {
          const style = normalizeThemeData(input)
          const theme2 = convertTheme2To3(style)
          theme3 = init({
            inputRuleset: theme2,
            ultimateBackgroundColor: '#000000',
            liteMode: true,
            debug: true,
            onlyNormalState: true
          })
        } else if (version === 'v3') {
          const palette = input.find(x => x.component === '@palette')
          let paletteRule
          if (palette) {
            const { directives } = palette
            directives.link = directives.link || directives.accent
            directives.accent = directives.accent || directives.link
            paletteRule = {
              component: 'Root',
              directives: Object.fromEntries(
                Object
                  .entries(directives)
                  .filter(([k, v]) => k && k !== 'name')
                  .map(([k, v]) => ['--' + k, 'color | ' + v])
              )
            }
          } else {
            paletteRule = null
          }

          theme3 = init({
            inputRuleset: [...input, paletteRule].filter(x => x),
            ultimateBackgroundColor: '#000000',
            liteMode: true,
            debug: true,
            onlyNormalState: true
          })
        }
      } else {
        theme3 = init({
          inputRuleset: [],
          ultimateBackgroundColor: '#000000',
          liteMode: true,
          debug: true,
          onlyNormalState: true
        })
      }

      if (!this.compilationCache[key]) {
        this.compilationCache[key] = theme3
      }

      return getScopedVersion(
        getCssRules(theme3.eager),
        '#theme-preview-' + key
      ).join('\n')
    }
  }
}

export default AppearanceTab
