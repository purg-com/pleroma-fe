import { flattenDeep } from 'lodash'

export const deserializeShadow = string => {
  const modes = ['_full', 'inset', 'x', 'y', 'blur', 'spread', 'color', 'alpha', 'name']
  const regexPrep = [
    // inset keyword (optional)
    '^',
    '(?:(inset)\\s+)?',
    // x
    '(?:(-?[0-9]+(?:\\.[0-9]+)?)\\s+)',
    // y
    '(?:(-?[0-9]+(?:\\.[0-9]+)?)\\s+)',
    // blur (optional)
    '(?:(-?[0-9]+(?:\\.[0-9]+)?)\\s+)?',
    // spread (optional)
    '(?:(-?[0-9]+(?:\\.[0-9]+)?)\\s+)?',
    // either hex, variable or function
    '(#[0-9a-f]{6}|--[a-z0-9\\-_]+|\\$[a-z0-9\\-()_ ]+)',
    // opacity (optional)
    '(?:\\s+\\/\\s+([0-9]+(?:\\.[0-9]+)?)\\s*)?',
    // name
    '(?:\\s+#(\\w+)\\s*)?',
    '$'
  ].join('')
  const regex = new RegExp(regexPrep, 'gis') // global, (stable) indices, single-string
  const result = regex.exec(string)
  if (result == null) {
    if (string.startsWith('$') || string.startsWith('--')) {
      return string
    } else {
      throw new Error(`Invalid shadow definition: '${string}'`)
    }
  } else {
    const numeric = new Set(['x', 'y', 'blur', 'spread', 'alpha'])
    const { x, y, blur, spread, alpha, inset, color, name } = Object.fromEntries(modes.map((mode, i) => {
      if (numeric.has(mode)) {
        const number = Number(result[i])
        if (Number.isNaN(number)) {
          if (mode === 'alpha') return [mode, 1]
          return [mode, 0]
        }
        return [mode, number]
      } else if (mode === 'inset') {
        return [mode, !!result[i]]
      } else {
        return [mode, result[i]]
      }
    }).filter(([k, v]) => v !== false).slice(1))

    return { x, y, blur, spread, color, alpha, inset, name }
  }
}
// this works nearly the same as HTML tree converter
const parseIss = (input) => {
  const buffer = [{ selector: null, content: [] }]
  let textBuffer = ''

  const getCurrentBuffer = () => {
    let current = buffer[buffer.length - 1]
    if (current == null) {
      current = { selector: null, content: [] }
    }
    return current
  }

  // Processes current line buffer, adds it to output buffer and clears line buffer
  const flushText = (kind) => {
    if (textBuffer === '') return
    if (kind === 'content') {
      getCurrentBuffer().content.push(textBuffer.trim())
    } else {
      getCurrentBuffer().selector = textBuffer.trim()
    }
    textBuffer = ''
  }

  for (let i = 0; i < input.length; i++) {
    const char = input[i]

    if (char === ';') {
      flushText('content')
    } else if (char === '{') {
      flushText('header')
    } else if (char === '}') {
      flushText('content')
      buffer.push({ selector: null, content: [] })
      textBuffer = ''
    } else {
      textBuffer += char
    }
  }

  return buffer
}
export const deserialize = (input) => {
  const ast = parseIss(input)
  const finalResult = ast.filter(i => i.selector != null).map(item => {
    const { selector, content } = item
    let stateCount = 0
    const selectors = selector.split(/,/g)
    const result = selectors.map(selector => {
      const output = { component: '' }
      let currentDepth = null

      selector.split(/ /g).reverse().forEach((fragment, index, arr) => {
        const fragmentObject = { component: '' }

        let mode = 'component'
        for (let i = 0; i < fragment.length; i++) {
          const char = fragment[i]
          switch (char) {
            case '.': {
              mode = 'variant'
              fragmentObject.variant = ''
              break
            }
            case ':': {
              mode = 'state'
              fragmentObject.state = fragmentObject.state || []
              stateCount++
              break
            }
            default: {
              if (mode === 'state') {
                const currentState = fragmentObject.state[stateCount - 1]
                if (currentState == null) {
                  fragmentObject.state.push('')
                }
                fragmentObject.state[stateCount - 1] += char
              } else {
                fragmentObject[mode] += char
              }
            }
          }
        }
        if (currentDepth !== null) {
          currentDepth.parent = { ...fragmentObject }
          currentDepth = currentDepth.parent
        } else {
          Object.keys(fragmentObject).forEach(key => {
            output[key] = fragmentObject[key]
          })
          if (index !== (arr.length - 1)) {
            output.parent = { component: '' }
          }
          currentDepth = output
        }
      })

      output.directives = Object.fromEntries(content.map(d => {
        const [property, value] = d.split(':')
        let realValue = (value || '').trim()
        if (property === 'shadow') {
          if (realValue === 'none') {
            realValue = []
          } else {
            realValue = value.split(',').map(v => deserializeShadow(v.trim()))
          }
        } if (!Number.isNaN(Number(value))) {
          realValue = Number(value)
        }
        return [property, realValue]
      }))

      return output
    })
    return result
  })
  return flattenDeep(finalResult)
}
