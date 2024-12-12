import { convert, brightness } from 'chromatism'
import sum from 'hash-sum'
import { flattenDeep, sortBy } from 'lodash'
import {
  alphaBlend,
  getTextColor,
  rgba2css,
  mixrgb,
  relativeLuminance
} from '../color_convert/color_convert.js'

import {
  colorFunctions,
  shadowFunctions,
  process
} from './theme3_slot_functions.js'

import {
  unroll,
  getAllPossibleCombinations,
  genericRuleToSelector,
  normalizeCombination,
  findRules
} from './iss_utils.js'
import { deserializeShadow } from './iss_deserializer.js'

// Ensuring the order of components
const components = {
  Root: null,
  Text: null,
  FunText: null,
  Link: null,
  Icon: null,
  Border: null,
  Panel: null,
  Chat: null,
  ChatMessage: null
}

export const findShadow = (shadows, { dynamicVars, staticVars }) => {
  return (shadows || []).map(shadow => {
    let targetShadow
    if (typeof shadow === 'string') {
      if (shadow.startsWith('$')) {
        targetShadow = process(shadow, shadowFunctions, { findColor, findShadow }, { dynamicVars, staticVars })
      } else if (shadow.startsWith('--')) {
        // modifiers are completely unsupported here
        const variableSlot = shadow.substring(2)
        return findShadow(staticVars[variableSlot], { dynamicVars, staticVars })
      } else {
        targetShadow = deserializeShadow(shadow)
      }
    } else {
      targetShadow = shadow
    }

    const shadowArray = Array.isArray(targetShadow) ? targetShadow : [targetShadow]
    return shadowArray.map(s => ({
      ...s,
      color: findColor(s.color, { dynamicVars, staticVars })
    }))
  })
}

export const findColor = (color, { dynamicVars, staticVars }) => {
  try {
    if (typeof color !== 'string' || (!color.startsWith('--') && !color.startsWith('$'))) return color
    let targetColor = null
    if (color.startsWith('--')) {
      // Modifier support is pretty much for v2 themes only
      const [variable, modifier] = color.split(/,/g).map(str => str.trim())
      const variableSlot = variable.substring(2)
      if (variableSlot === 'stack') {
        const { r, g, b } = dynamicVars.stacked
        targetColor = { r, g, b }
      } else if (variableSlot.startsWith('parent')) {
        if (variableSlot === 'parent') {
          const { r, g, b } = dynamicVars.lowerLevelBackground
          targetColor = { r, g, b }
        } else {
          const virtualSlot = variableSlot.replace(/^parent/, '')
          targetColor = convert(dynamicVars.lowerLevelVirtualDirectivesRaw[virtualSlot]).rgb
        }
      } else {
        switch (variableSlot) {
          case 'inheritedBackground':
            targetColor = convert(dynamicVars.inheritedBackground).rgb
            break
          case 'background':
            targetColor = convert(dynamicVars.background).rgb
            break
          default:
            targetColor = convert(staticVars[variableSlot]).rgb
        }
      }

      if (modifier) {
        const effectiveBackground = dynamicVars.lowerLevelBackground ?? targetColor
        const isLightOnDark = relativeLuminance(convert(effectiveBackground).rgb) < 0.5
        const mod = isLightOnDark ? 1 : -1
        targetColor = brightness(Number.parseFloat(modifier) * mod, targetColor).rgb
      }
    }

    if (color.startsWith('$')) {
      try {
        targetColor = process(color, colorFunctions, { findColor }, { dynamicVars, staticVars })
      } catch (e) {
        console.error('Failure executing color function', e)
        targetColor = '#FF00FF'
      }
    }
    // Color references other color
    return targetColor
  } catch (e) {
    throw new Error(`Couldn't find color "${color}", variables are:
Static:
${JSON.stringify(staticVars, null, 2)}
Dynamic:
${JSON.stringify(dynamicVars, null, 2)}`)
  }
}

const getTextColorAlpha = (directives, intendedTextColor, dynamicVars, staticVars) => {
  const opacity = directives.textOpacity
  const backgroundColor = convert(dynamicVars.lowerLevelBackground).rgb
  const textColor = convert(findColor(intendedTextColor, { dynamicVars, staticVars })).rgb
  if (opacity === null || opacity === undefined || opacity >= 1) {
    return convert(textColor).hex
  }
  if (opacity === 0) {
    return convert(backgroundColor).hex
  }
  const opacityMode = directives.textOpacityMode
  switch (opacityMode) {
    case 'fake':
      return convert(alphaBlend(textColor, opacity, backgroundColor)).hex
    case 'mixrgb':
      return convert(mixrgb(backgroundColor, textColor)).hex
    default:
      return rgba2css({ a: opacity, ...textColor })
  }
}

// Loading all style.js[on] files dynamically
const componentsContext = require.context('src', true, /\.style.js(on)?$/)
componentsContext.keys().forEach(key => {
  const component = componentsContext(key).default
  if (components[component.name] != null) {
    console.warn(`Component in file ${key} is trying to override existing component ${component.name}! You have collisions/duplicates!`)
  }
  components[component.name] = component
})

const engineChecksum = sum(components)

const ruleToSelector = genericRuleToSelector(components)

export const getEngineChecksum = () => engineChecksum

/**
 * Initializes and compiles the theme according to the ruleset
 *
 * @param {Object[]} inputRuleset - set of rules to compile theme against. Acts as an override to
 *   component default rulesets
 * @param {string} ultimateBackgroundColor - Color that will be the "final" background for
 *   calculating contrast ratios and making text automatically accessible. Really used for cases when
 *   stuff is transparent.
 * @param {boolean} debug - print out debug information in console, mostly just performance stuff
 * @param {boolean} liteMode - use validInnerComponentsLite instead of validInnerComponents, meant to
 *   generatate theme previews and such that need to be compiled faster and don't require a lot of other
 *   components present in "normal" mode
 * @param {boolean} onlyNormalState - only use components 'normal' states, meant for generating theme
 *   previews since states are the biggest factor for compilation time and are completely unnecessary
 *   when previewing multiple themes at same time
 */
export const init = ({
  inputRuleset,
  ultimateBackgroundColor,
  debug = false,
  liteMode = false,
  editMode = false,
  onlyNormalState = false,
  initialStaticVars = {}
}) => {
  const rootComponentName = 'Root'
  if (!inputRuleset) throw new Error('Ruleset is null or undefined!')
  const staticVars = { ...initialStaticVars }
  const stacked = {}
  const computed = {}

  const rulesetUnsorted = [
    ...Object.values(components)
      .map(c => (c.defaultRules || []).map(r => ({ source: 'Built-in', component: c.name, ...r })))
      .reduce((acc, arr) => [...acc, ...arr], []),
    ...inputRuleset
  ].map(rule => {
    normalizeCombination(rule)
    let currentParent = rule.parent
    while (currentParent) {
      normalizeCombination(currentParent)
      currentParent = currentParent.parent
    }

    return rule
  })

  const ruleset = rulesetUnsorted
    .map((data, index) => ({ data, index }))
    .toSorted(({ data: a, index: ai }, { data: b, index: bi }) => {
      const parentsA = unroll(a).length
      const parentsB = unroll(b).length

      let aScore = 0
      let bScore = 0

      aScore += parentsA * 1000
      bScore += parentsB * 1000

      aScore += a.variant !== 'normal' ? 100 : 0
      bScore += b.variant !== 'normal' ? 100 : 0

      aScore += a.state.filter(x => x !== 'normal').length * 1000
      bScore += b.state.filter(x => x !== 'normal').length * 1000

      aScore += a.component === 'Text' ? 1 : 0
      bScore += b.component === 'Text' ? 1 : 0

      // Debug
      a._specificityScore = aScore
      b._specificityScore = bScore

      if (aScore === bScore) {
        return ai - bi
      }
      return aScore - bScore
    })
    .map(({ data }) => data)

  if (!ultimateBackgroundColor) {
    console.warn('No ultimate background color provided, falling back to panel color')
    const rootRule = ruleset.findLast((x) => (x.component === 'Root' && x.directives?.['--bg']))
    ultimateBackgroundColor = rootRule.directives['--bg'].split('|')[1].trim()
  }

  const virtualComponents = new Set(Object.values(components).filter(c => c.virtual).map(c => c.name))
  const nonEditableComponents = new Set(Object.values(components).filter(c => c.notEditable).map(c => c.name))

  const processCombination = (combination) => {
    try {
      const selector = ruleToSelector(combination, true)
      const cssSelector = ruleToSelector(combination)

      const parentSelector = selector.split(/ /g).slice(0, -1).join(' ')
      const soloSelector = selector.split(/ /g).slice(-1)[0]

      const lowerLevelSelector = parentSelector
      let lowerLevelBackground = computed[lowerLevelSelector]?.background
      if (editMode && !lowerLevelBackground) {
        // FIXME hack for editor until it supports handling component backgrounds
        lowerLevelBackground = '#00FFFF'
      }
      const lowerLevelVirtualDirectives = computed[lowerLevelSelector]?.virtualDirectives
      const lowerLevelVirtualDirectivesRaw = computed[lowerLevelSelector]?.virtualDirectivesRaw

      const dynamicVars = computed[selector] || {
        lowerLevelBackground,
        lowerLevelVirtualDirectives,
        lowerLevelVirtualDirectivesRaw
      }

      // Inheriting all of the applicable rules
      const existingRules = ruleset.filter(findRules(combination))
      const computedDirectives =
            existingRules
              .map(r => r.directives)
              .reduce((acc, directives) => ({ ...acc, ...directives }), {})
      const computedRule = {
        ...combination,
        directives: computedDirectives
      }

      computed[selector] = computed[selector] || {}
      computed[selector].computedRule = computedRule
      computed[selector].dynamicVars = dynamicVars

      if (virtualComponents.has(combination.component)) {
        const virtualName = [
          '--',
          combination.component.toLowerCase(),
          combination.variant === 'normal'
            ? ''
            : combination.variant[0].toUpperCase() + combination.variant.slice(1).toLowerCase(),
          ...sortBy(combination.state.filter(x => x !== 'normal')).map(state => state[0].toUpperCase() + state.slice(1).toLowerCase())
        ].join('')

        let inheritedTextColor = computedDirectives.textColor
        let inheritedTextAuto = computedDirectives.textAuto
        let inheritedTextOpacity = computedDirectives.textOpacity
        let inheritedTextOpacityMode = computedDirectives.textOpacityMode
        const lowerLevelTextSelector = [...selector.split(/ /g).slice(0, -1), soloSelector].join(' ')
        const lowerLevelTextRule = computed[lowerLevelTextSelector]

        if (inheritedTextColor == null || inheritedTextOpacity == null || inheritedTextOpacityMode == null) {
          inheritedTextColor = computedDirectives.textColor ?? lowerLevelTextRule.textColor
          inheritedTextAuto = computedDirectives.textAuto ?? lowerLevelTextRule.textAuto
          inheritedTextOpacity = computedDirectives.textOpacity ?? lowerLevelTextRule.textOpacity
          inheritedTextOpacityMode = computedDirectives.textOpacityMode ?? lowerLevelTextRule.textOpacityMode
        }

        const newTextRule = {
          ...computedRule,
          directives: {
            ...computedRule.directives,
            textColor: inheritedTextColor,
            textAuto: inheritedTextAuto ?? 'preserve',
            textOpacity: inheritedTextOpacity,
            textOpacityMode: inheritedTextOpacityMode
          }
        }

        dynamicVars.inheritedBackground = lowerLevelBackground
        dynamicVars.stacked = convert(stacked[lowerLevelSelector]).rgb

        const intendedTextColor = convert(findColor(inheritedTextColor, { dynamicVars, staticVars })).rgb
        const textColor = newTextRule.directives.textAuto === 'no-auto'
          ? intendedTextColor
          : getTextColor(
            convert(stacked[lowerLevelSelector]).rgb,
            intendedTextColor,
            newTextRule.directives.textAuto === 'preserve'
          )
        const virtualDirectives = computed[lowerLevelSelector].virtualDirectives || {}
        const virtualDirectivesRaw = computed[lowerLevelSelector].virtualDirectivesRaw || {}

        // Storing color data in lower layer to use as custom css properties
        virtualDirectives[virtualName] = getTextColorAlpha(newTextRule.directives, textColor, dynamicVars)
        virtualDirectivesRaw[virtualName] = textColor

        computed[lowerLevelSelector].virtualDirectives = virtualDirectives
        computed[lowerLevelSelector].virtualDirectivesRaw = virtualDirectivesRaw

        return {
          dynamicVars,
          selector: cssSelector.split(/ /g).slice(0, -1).join(' '),
          ...combination,
          directives: {},
          virtualDirectives: {
            [virtualName]: getTextColorAlpha(newTextRule.directives, textColor, dynamicVars)
          },
          virtualDirectivesRaw: {
            [virtualName]: textColor
          }
        }
      } else {
        computed[selector] = computed[selector] || {}

        // TODO: DEFAULT TEXT COLOR
        const lowerLevelStackedBackground = stacked[lowerLevelSelector] || convert(ultimateBackgroundColor).rgb

        if (computedDirectives.background) {
          let inheritRule = null
          const variantRules = ruleset.filter(
            findRules({
              component: combination.component,
              variant: combination.variant,
              parent: combination.parent
            })
          )
          const lastVariantRule = variantRules[variantRules.length - 1]
          if (lastVariantRule) {
            inheritRule = lastVariantRule
          } else {
            const normalRules = ruleset.filter(findRules({
              component: combination.component,
              parent: combination.parent
            }))
            const lastNormalRule = normalRules[normalRules.length - 1]
            inheritRule = lastNormalRule
          }

          const inheritSelector = ruleToSelector({ ...inheritRule, parent: combination.parent }, true)
          const inheritedBackground = computed[inheritSelector].background

          dynamicVars.inheritedBackground = inheritedBackground

          const rgb = convert(findColor(computedDirectives.background, { dynamicVars, staticVars })).rgb

          if (!stacked[selector]) {
            let blend
            const alpha = computedDirectives.opacity ?? 1
            if (alpha >= 1) {
              blend = rgb
            } else if (alpha <= 0) {
              blend = lowerLevelStackedBackground
            } else {
              blend = alphaBlend(rgb, computedDirectives.opacity, lowerLevelStackedBackground)
            }
            stacked[selector] = blend
            computed[selector].background = { ...rgb, a: computedDirectives.opacity ?? 1 }
          }
        }

        if (computedDirectives.shadow) {
          dynamicVars.shadow = flattenDeep(findShadow(flattenDeep(computedDirectives.shadow), { dynamicVars, staticVars }))
        }

        if (!stacked[selector]) {
          computedDirectives.background = 'transparent'
          computedDirectives.opacity = 0
          stacked[selector] = lowerLevelStackedBackground
          computed[selector].background = { ...lowerLevelStackedBackground, a: 0 }
        }

        dynamicVars.stacked = stacked[selector]
        dynamicVars.background = computed[selector].background

        const dynamicSlots = Object.entries(computedDirectives).filter(([k, v]) => k.startsWith('--'))

        dynamicSlots.forEach(([k, v]) => {
          const [type, value] = v.split('|').map(x => x.trim()) // woah, Extreme!
          switch (type) {
            case 'color': {
              const color = findColor(value, { dynamicVars, staticVars })
              dynamicVars[k] = color
              if (combination.component === rootComponentName) {
                staticVars[k.substring(2)] = color
              }
              break
            }
            case 'shadow': {
              const shadow = value.split(/,/g).map(s => s.trim()).filter(x => x)
              dynamicVars[k] = shadow
              if (combination.component === rootComponentName) {
                staticVars[k.substring(2)] = shadow
              }
              break
            }
            case 'generic': {
              dynamicVars[k] = value
              if (combination.component === rootComponentName) {
                staticVars[k.substring(2)] = value
              }
              break
            }
          }
        })

        const rule = {
          dynamicVars,
          selector: cssSelector,
          ...combination,
          directives: computedDirectives
        }

        return rule
      }
    } catch (e) {
      const { component, variant, state } = combination
      throw new Error(`Error processing combination ${component}.${variant}:${state.join(':')}: ${e}`)
    }
  }

  const processInnerComponent = (component, parent) => {
    const combinations = []
    const {
      states: originalStates = {},
      variants: originalVariants = {}
    } = component

    let validInnerComponents
    if (editMode) {
      const temp = (component.validInnerComponentsLite || component.validInnerComponents || [])
      validInnerComponents = temp.filter(c => virtualComponents.has(c) && !nonEditableComponents.has(c))
    } else if (liteMode) {
      validInnerComponents = (component.validInnerComponentsLite || component.validInnerComponents || [])
    } else {
      validInnerComponents = component.validInnerComponents || []
    }

    // Normalizing states and variants to always include "normal"
    const states = { normal: '', ...originalStates }
    const variants = { normal: '', ...originalVariants }
    const innerComponents = (validInnerComponents).map(name => {
      const result = components[name]
      if (result === undefined) console.error(`Component ${component.name} references a component ${name} which does not exist!`)
      return result
    })

    // Optimization: we only really need combinations without "normal" because all states implicitly have it
    const permutationStateKeys = Object.keys(states).filter(s => s !== 'normal')
    const stateCombinations = onlyNormalState
      ? [
          ['normal']
        ]
      : [
          ['normal'],
          ...getAllPossibleCombinations(permutationStateKeys)
            .map(combination => ['normal', ...combination])
            .filter(combo => {
              // Optimization: filter out some hard-coded combinations that don't make sense
              if (combo.indexOf('disabled') >= 0) {
                return !(
                  combo.indexOf('hover') >= 0 ||
                    combo.indexOf('focused') >= 0 ||
                    combo.indexOf('pressed') >= 0
                )
              }
              return true
            })
        ]

    const stateVariantCombination = Object.keys(variants).map(variant => {
      return stateCombinations.map(state => ({ variant, state }))
    }).reduce((acc, x) => [...acc, ...x], [])

    stateVariantCombination.forEach(combination => {
      combination.component = component.name
      combination.lazy = component.lazy || parent?.lazy
      combination.parent = parent
      if (!liteMode && combination.state.indexOf('hover') >= 0) {
        combination.lazy = true
      }

      combinations.push(combination)

      innerComponents.forEach(innerComponent => {
        combinations.push(...processInnerComponent(innerComponent, combination))
      })
    })

    return combinations
  }

  const t0 = performance.now()
  const combinations = processInnerComponent(components[rootComponentName] ?? components.Root)
  const t1 = performance.now()
  if (debug) {
    console.debug('Tree traveral took ' + (t1 - t0) + ' ms')
  }

  const result = combinations.map((combination) => {
    if (combination.lazy) {
      return async () => processCombination(combination)
    } else {
      return processCombination(combination)
    }
  }).filter(x => x)
  const t2 = performance.now()
  if (debug) {
    console.debug('Eager processing took ' + (t2 - t1) + ' ms')
  }

  // optimization to traverse big-ass array only once instead of twice
  const eager = []
  const lazy = []

  result.forEach(x => {
    if (typeof x === 'function') {
      lazy.push(x)
    } else {
      eager.push(x)
    }
  })

  return {
    lazy,
    eager,
    staticVars,
    engineChecksum,
    themeChecksum: sum([lazy, eager])
  }
}
