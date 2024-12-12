import { unroll } from './iss_utils.js'
import { deserializeShadow } from './iss_deserializer.js'

export const serializeShadow = (s, throwOnInvalid) => {
  if (typeof s === 'object') {
    const inset = s.inset ? 'inset ' : ''
    const name = s.name ? ` #${s.name} ` : ''
    const result = `${inset}${s.x} ${s.y} ${s.blur} ${s.spread} ${s.color} / ${s.alpha}${name}`
    deserializeShadow(result) // Verify that output is valid and parseable
    return result
  } else {
    return s
  }
}

export const serialize = (ruleset) => {
  return ruleset.map((rule) => {
    if (Object.keys(rule.directives || {}).length === 0) return false

    const header = unroll(rule).reverse().map(rule => {
      const { component } = rule
      const newVariant = (rule.variant == null || rule.variant === 'normal') ? '' : ('.' + rule.variant)
      const newState = (rule.state || []).filter(st => st !== 'normal')

      return `${component}${newVariant}${newState.map(st => ':' + st).join('')}`
    }).join(' ')

    const content = Object.entries(rule.directives).map(([directive, value]) => {
      if (directive.startsWith('--')) {
        const [valType, newValue] = value.split('|') // only first one! intentional!
        switch (valType) {
          case 'shadow':
            return `  ${directive}: ${valType.trim()} | ${newValue.map(serializeShadow).map(s => s.trim()).join(', ')}`
          default:
            return `  ${directive}: ${valType.trim()} | ${newValue.trim()}`
        }
      } else {
        switch (directive) {
          case 'shadow':
            if (value.length > 0) {
              return `  ${directive}: ${value.map(serializeShadow).join(', ')}`
            } else {
              return `  ${directive}: none`
            }
          default:
            return `  ${directive}: ${value}`
        }
      }
    })

    return `${header} {\n${content.join(';\n')}\n}`
  }).filter(x => x).join('\n\n')
}
