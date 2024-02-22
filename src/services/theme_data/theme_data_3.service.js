import { convert, brightness } from 'chromatism'
import { flattenDeep } from 'lodash'
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
import { parseCssShadow } from './css_utils.js'

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

const findShadow = (shadows, { dynamicVars, staticVars }) => {
  return (shadows || []).map(shadow => {
    let targetShadow
    if (typeof shadow === 'string') {
      if (shadow.startsWith('$')) {
        targetShadow = process(shadow, shadowFunctions, { findColor, findShadow }, { dynamicVars, staticVars })
      } else if (shadow.startsWith('--')) {
        const [variable] = shadow.split(/,/g).map(str => str.trim()) // discarding modifier since it's not supported
        const variableSlot = variable.substring(2)
        return findShadow(staticVars[variableSlot], { dynamicVars, staticVars })
      } else {
        targetShadow = parseCssShadow(shadow)
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

const findColor = (color, { dynamicVars, staticVars }) => {
  if (typeof color !== 'string' || (!color.startsWith('--') && !color.startsWith('$'))) return color
  let targetColor = null
  if (color.startsWith('--')) {
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

const ruleToSelector = genericRuleToSelector(components)

export const init = (extraRuleset, ultimateBackgroundColor) => {
  const staticVars = {}
  const stacked = {}
  const computed = {}

  const eagerRules = []
  const lazyRules = []

  const rulesetUnsorted = [
    ...Object.values(components)
      .map(c => (c.defaultRules || []).map(r => ({ component: c.name, ...r })))
      .reduce((acc, arr) => [...acc, ...arr], []),
    ...extraRuleset
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
    .sort(({ data: a, index: ai }, { data: b, index: bi }) => {
      const parentsA = unroll(a).length
      const parentsB = unroll(b).length

      if (parentsA === parentsB) {
        if (a.component === 'Text') return -1
        if (b.component === 'Text') return 1
        return ai - bi
      }
      if (parentsA === 0 && parentsB !== 0) return -1
      if (parentsB === 0 && parentsA !== 0) return 1
      return parentsA - parentsB
    })
    .map(({ data }) => data)

  const virtualComponents = new Set(Object.values(components).filter(c => c.virtual).map(c => c.name))

  let counter = 0
  const promises = []
  const processInnerComponent = (component, rules, parent) => {
    const addRule = (rule) => {
      rules.push(rule)
    }

    const parentSelector = ruleToSelector(parent, true)
    // const parentList = parent ? unroll(parent).reverse().map(c => c.component) : []
    // if (!component.virtual) {
    //   const path = [...parentList, component.name].join(' > ')
    //   console.log('Component ' + path + ' process starting')
    // }
    // const t0 = performance.now()
    const {
      validInnerComponents = [],
      states: originalStates = {},
      variants: originalVariants = {},
      name
    } = component

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
    const stateCombinations = [
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
      counter++
      // const tt0 = performance.now()

      combination.component = component.name
      const soloSelector = ruleToSelector(combination, true)
      const soloCssSelector = ruleToSelector(combination)
      const selector = [parentSelector, soloSelector].filter(x => x).join(' ')
      const cssSelector = [parentSelector, soloCssSelector].filter(x => x).join(' ')

      const lowerLevelSelector = parentSelector
      const lowerLevelBackground = computed[lowerLevelSelector]?.background
      const lowerLevelVirtualDirectives = computed[lowerLevelSelector]?.virtualDirectives
      const lowerLevelVirtualDirectivesRaw = computed[lowerLevelSelector]?.virtualDirectivesRaw

      const dynamicVars = computed[selector] || {
        lowerLevelBackground,
        lowerLevelVirtualDirectives,
        lowerLevelVirtualDirectivesRaw
      }

      // Inheriting all of the applicable rules
      const existingRules = ruleset.filter(findRules({ component: component.name, ...combination, parent }))
      const computedDirectives = existingRules.map(r => r.directives).reduce((acc, directives) => ({ ...acc, ...directives }), {})
      const computedRule = {
        component: component.name,
        ...combination,
        parent,
        directives: computedDirectives
      }

      computed[selector] = computed[selector] || {}
      computed[selector].computedRule = computedRule
      computed[selector].dynamicVars = dynamicVars

      if (virtualComponents.has(component.name)) {
        const virtualName = [
          '--',
          component.name.toLowerCase(),
          combination.variant === 'normal'
            ? ''
            : combination.variant[0].toUpperCase() + combination.variant.slice(1).toLowerCase(),
          ...combination.state.filter(x => x !== 'normal').toSorted().map(state => state[0].toUpperCase() + state.slice(1).toLowerCase())
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

        // Updating previously added rule
        const earlyLowerLevelRules = rules.filter(findRules(parent, true))
        const earlyLowerLevelRule = earlyLowerLevelRules.slice(-1)[0]

        const virtualDirectives = earlyLowerLevelRule.virtualDirectives || {}
        const virtualDirectivesRaw = earlyLowerLevelRule.virtualDirectivesRaw || {}

        // Storing color data in lower layer to use as custom css properties
        virtualDirectives[virtualName] = getTextColorAlpha(newTextRule.directives, textColor, dynamicVars)
        virtualDirectivesRaw[virtualName] = textColor
        earlyLowerLevelRule.virtualDirectives = virtualDirectives
        earlyLowerLevelRule.virtualDirectivesRaw = virtualDirectivesRaw
        computed[lowerLevelSelector].virtualDirectives = virtualDirectives
        computed[lowerLevelSelector].virtualDirectivesRaw = virtualDirectivesRaw
      } else {
        computed[selector] = computed[selector] || {}

        // TODO: DEFAULT TEXT COLOR
        const lowerLevelStackedBackground = stacked[lowerLevelSelector] || convert(ultimateBackgroundColor).rgb

        if (computedDirectives.background) {
          let inheritRule = null
          const variantRules = ruleset.filter(findRules({ component: component.name, variant: combination.variant, parent }))
          const lastVariantRule = variantRules[variantRules.length - 1]
          if (lastVariantRule) {
            inheritRule = lastVariantRule
          } else {
            const normalRules = ruleset.filter(findRules({ component: component.name, parent }))
            const lastNormalRule = normalRules[normalRules.length - 1]
            inheritRule = lastNormalRule
          }

          const inheritSelector = ruleToSelector({ ...inheritRule, parent }, true)
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
          const [type, ...value] = v.split('|').map(x => x.trim()) // woah, Extreme!
          switch (type) {
            case 'color': {
              const color = findColor(value[0], { dynamicVars, staticVars })
              dynamicVars[k] = color
              if (component.name === 'Root') {
                staticVars[k.substring(2)] = color
              }
              break
            }
            case 'shadow': {
              const shadow = value
              dynamicVars[k] = shadow
              if (component.name === 'Root') {
                staticVars[k.substring(2)] = shadow
              }
              break
            }
          }
        })

        addRule({
          dynamicVars,
          selector: cssSelector,
          component: component.name,
          ...combination,
          parent,
          directives: computedDirectives
        })
      }

      innerComponents.forEach(innerComponent => {
        if (innerComponent.lazy) {
          promises.push(new Promise((resolve, reject) => {
            setTimeout(() => {
              try {
                processInnerComponent(innerComponent, lazyRules, { parent, component: name, ...combination })
                resolve()
              } catch (e) {
                reject(e)
              }
            }, 0)
          }))
        } else {
          processInnerComponent(innerComponent, rules, { parent, component: name, ...combination })
        }
      })
      // const tt1 = performance.now()
      // if (!component.virtual) {
      //   console.log('State-variant ' + combination.variant + ' : ' + combination.state.join('+') + ' procession time: ' + (tt1 - tt0) + 'ms')
      // }
    })

    // const t1 = performance.now()
    // if (!component.virtual) {
    //   const path = [...parentList, component.name].join(' > ')
    //   console.log('Component ' + path + ' procession time: ' + (t1 - t0) + 'ms')
    // }
  }

  processInnerComponent(components.Root, eagerRules)
  console.log('TOTAL COMBOS: ' + counter)
  const lazyExec = Promise.all(promises).then(() => {
    console.log('TOTAL COMBOS: ' + counter)
  }).then(() => lazyRules)

  return {
    lazy: lazyExec,
    eager: eagerRules,
    staticVars
  }
}
