import { convert } from 'chromatism'

import { hex2rgb, rgba2css } from '../color_convert/color_convert.js'

export const getCssColorString = (color, alpha = 1) => rgba2css({ ...convert(color).rgb, a: alpha })

export const getCssShadow = (input, usesDropShadow) => {
  if (input.length === 0) {
    return 'none'
  }

  return input
    .filter(_ => usesDropShadow ? _.inset : _)
    .map((shad) => [
      shad.x,
      shad.y,
      shad.blur,
      shad.spread
    ].map(_ => _ + 'px ').concat([
      getCssColorString(shad.color, shad.alpha),
      shad.inset ? 'inset' : ''
    ]).join(' ')).join(', ')
}

export const getCssShadowFilter = (input) => {
  if (input.length === 0) {
    return 'none'
  }

  return input
  // drop-shadow doesn't support inset or spread
    .filter((shad) => !shad.inset && Number(shad.spread) === 0)
    .map((shad) => [
      shad.x,
      shad.y,
      // drop-shadow's blur is twice as strong compared to box-shadow
      shad.blur / 2
    ].map(_ => _ + 'px').concat([
      getCssColorString(shad.color, shad.alpha)
    ]).join(' '))
    .map(_ => `drop-shadow(${_})`)
    .join(' ')
}

// `debug` changes what backgrounds are used to "stacked" solid colors so you can see
// what theme engine "thinks" is actual background color is for purposes of text color
// generation and for when --stacked variable is used
export const getCssRules = (rules, debug) => rules.map(rule => {
  let selector = rule.selector
  if (!selector) {
    selector = 'html'
  }
  const header = selector + ' {'
  const footer = '}'

  const virtualDirectives = Object.entries(rule.virtualDirectives || {}).map(([k, v]) => {
    return '  ' + k + ': ' + v
  }).join(';\n')

  const directives = Object.entries(rule.directives).map(([k, v]) => {
    switch (k) {
      case 'roundness': {
        return '  ' + [
          '--roundness: ' + v + 'px'
        ].join(';\n  ')
      }
      case 'shadow': {
        if (!rule.dynamicVars.shadow) {
          return ''
        }
        return '  ' + [
          '--shadow: ' + getCssShadow(rule.dynamicVars.shadow),
          '--shadowFilter: ' + getCssShadowFilter(rule.dynamicVars.shadow),
          '--shadowInset: ' + getCssShadow(rule.dynamicVars.shadow, true)
        ].join(';\n  ')
      }
      case 'background': {
        if (debug) {
          return `
            --background: ${getCssColorString(rule.dynamicVars.stacked)};
            background-color: ${getCssColorString(rule.dynamicVars.stacked)};
          `
        }
        if (v === 'transparent') {
          if (rule.component === 'Root') return null
          return [
            rule.directives.backgroundNoCssColor !== 'yes' ? ('background-color: ' + v) : '',
            '  --background: ' + v
          ].filter(x => x).join(';\n')
        }
        const color = getCssColorString(rule.dynamicVars.background, rule.directives.opacity)
        const cssDirectives = ['--background: ' + color]
        if (rule.directives.backgroundNoCssColor !== 'yes') {
          cssDirectives.push('background-color: ' + color)
        }
        return cssDirectives.filter(x => x).join(';\n')
      }
      case 'blur': {
        const cssDirectives = []
        if (rule.directives.opacity < 1) {
          cssDirectives.push(`--backdrop-filter: blur(${v}) `)
          if (rule.directives.backgroundNoCssColor !== 'yes') {
            cssDirectives.push(`backdrop-filter: blur(${v}) `)
          }
        }
        return cssDirectives.join(';\n')
      }
      case 'font': {
        return 'font-family: ' + v
      }
      case 'textColor': {
        if (rule.directives.textNoCssColor === 'yes') { return '' }
        return 'color: ' + v
      }
      default:
        if (k.startsWith('--')) {
          const [type, value] = v.split('|').map(x => x.trim())
          switch (type) {
            case 'color': {
              const color = rule.dynamicVars[k]
              if (typeof color === 'string') {
                return k + ': ' + rgba2css(hex2rgb(color))
              } else {
                return k + ': ' + rgba2css(color)
              }
            }
            case 'generic':
              return k + ': ' + value
            default:
              return null
          }
        }
        return null
    }
  }).filter(x => x).map(x => '  ' + x + ';').join('\n')

  return [
    header,
    directives,
    (rule.component === 'Text' && rule.state.indexOf('faint') < 0 && rule.directives.textNoCssColor !== 'yes') ? '  color: var(--text);' : '',
    virtualDirectives,
    footer
  ].filter(x => x).join('\n')
}).filter(x => x)

export const getScopedVersion = (rules, newScope) => {
  return rules.map(x => {
    if (x.startsWith('html')) {
      return x.replace('html', newScope)
    } else if (x.startsWith('#content')) {
      return x.replace('#content', newScope)
    } else {
      return newScope + ' > ' + x
    }
  })
}
