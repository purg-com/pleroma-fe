import allKeys from './theme2_keys'

// keys that are meant to be used globally, i.e. what's the rest of the theme is based upon.
export const basePaletteKeys = new Set([
  'bg',
  'fg',
  'text',
  'link',
  'accent',

  'cBlue',
  'cRed',
  'cGreen',
  'cOrange'
])

export const shadowsKeys = new Set([
  'panel',
  'topBar',
  'popup',
  'avatar',
  'avatarStatus',
  'panelHeader',
  'button',
  'buttonHover',
  'buttonPressed',
  'input'
])

export const radiiKeys = new Set([
  'btn',
  'input',
  // 'checkbox',
  'panel',
  'avatar',
  'avatarAlt',
  'tooltip',
  'attachment',
  'chatMessage'
])

// Keys that are not available in editor and never meant to be edited
export const hiddenKeys = new Set([
  'profileBg',
  'profileTint'
])

export const extendedBasePrefixes = [
  'border',
  'icon',
  'highlight',
  'lightText',

  'popover',

  'panel',
  'topBar',
  // 'tab', // TODO: not implemented yet
  'btn',
  'input',
  'selectedMenu',

  'alert',
  'alertPopup',
  'badge',

  'post',
  'selectedPost', // wrong nomenclature
  'poll',

  'chatBg',
  'chatMessage'
]
export const nonComponentPrefixes = new Set([
  'border',
  'icon',
  'highlight',
  'lightText',
  'chatBg'
])

export const extendedBaseKeys = Object.fromEntries(
  extendedBasePrefixes.map(prefix => [
    prefix,
    allKeys.filter(k => {
      if (prefix === 'alert') {
        return k.startsWith(prefix) && !k.startsWith('alertPopup')
      }
      return k.startsWith(prefix)
    })
  ])
)

// Keysets that are only really used intermideately, i.e. to generate other colors
export const temporary = new Set([
  '',
  'highlight'
])

export const temporaryColors = {}

export const convertTheme2To3 = (data) => {
  const generateRoot = () => {
    const directives = {}
    basePaletteKeys.forEach(key => { directives['--' + key] = 'color | ' + data.colors[key] })
    return {
      component: 'Root',
      directives
    }
  }

  const convertRadii = () => {
    const newRules = []
    radiiKeys.forEach(key => {
      const originalRadius = data.radii[key]
      const rule = {}

      switch (key) {
        case 'btn':
          rule.component = 'Button'
          break
        case 'input':
          rule.component = 'Input'
          break
        // TODO: missing feature?
        // case 'checkbox':
        //   rule.component = 'Input'
        //   break
        case 'panel':
          rule.component = 'Panel'
          break
        case 'avatar':
          rule.component = 'Avatar'
          break
        case 'avatarAlt':
          rule.component = 'Avatar'
          rule.variant = 'compact'
          break
        case 'tooltip':
          rule.component = 'Popover'
          break
        case 'attachment':
          rule.component = 'Attachment'
          break
        case 'ChatMessage':
          rule.component = 'Button'
          break
      }
      rule.directives = {
        roundness: originalRadius
      }
      newRules.push(rule)
    })
    return newRules
  }

  const convertShadows = () => {
    const newRules = []
    shadowsKeys.forEach(key => {
      const originalShadow = data.shadows[key]
      const rule = {}

      switch (key) {
        case 'panel':
          rule.component = 'Panel'
          break
        case 'topBar':
          rule.component = 'TopBar'
          break
        case 'popup':
          rule.component = 'Popover'
          break
        case 'avatar':
          rule.component = 'Avatar'
          break
        case 'avatarStatus':
          rule.component = 'Avatar'
          rule.parent = { component: 'Post' }
          break
        case 'panelHeader':
          rule.component = 'PanelHeader'
          break
        case 'button':
          rule.component = 'Button'
          break
        case 'buttonHover':
          rule.component = 'Button'
          rule.state = ['hover']
          break
        case 'buttonPressed':
          rule.component = 'Button'
          rule.state = ['pressed']
          break
        case 'input':
          rule.component = 'Input'
          break
      }
      rule.directives = {
        shadow: originalShadow
      }
      newRules.push(rule)
    })
    return newRules
  }

  const extendedRules = Object.entries(extendedBaseKeys).map(([prefix, keys]) => {
    if (nonComponentPrefixes.has(prefix)) return null
    const rule = {}
    if (prefix === 'alertPopup') {
      rule.component = 'Alert'
      rule.parent = { component: 'Popover' }
    } else if (prefix === 'selectedPost') {
      rule.component = 'Post'
      rule.state = ['selected']
    } else if (prefix === 'selectedMenu') {
      rule.component = 'MenuItem'
      rule.state = ['hover']
    } else if (prefix === 'chatMessageIncoming') {
      rule.component = 'ChatMessage'
    } else if (prefix === 'chatMessageOutgoing') {
      rule.component = 'ChatMessage'
      rule.variant = 'outgoing'
    } else if (prefix === 'panel') {
      rule.component = 'PanelHeader'
    } else if (prefix === 'topbar') {
      rule.component = 'TopBar'
    } else if (prefix === 'chatMessage') {
      rule.component = 'ChatMessage'
    } else if (prefix === 'poll') {
      rule.component = 'PollGraph'
    } else {
      rule.component = prefix[0].toUpperCase() + prefix.slice(1).toLowerCase()
    }
    return keys.map((key) => {
      const leftoverKey = key.replace(prefix, '')
      const parts = (leftoverKey || 'Bg').match(/[A-Z][a-z]*/g)
      const last = parts.slice(-1)[0]
      let newRule = { directives: {} }
      let variantArray = []

      switch (last) {
        case 'Text':
        case 'Faint': // typo
        case 'Link':
        case 'Icon':
        case 'Greentext':
        case 'Cyantext':
        case 'Border':
          newRule.parent = rule
          newRule.directives.textColor = data.colors[key]
          variantArray = parts.slice(0, -1)
          break
        default:
          newRule = { ...rule, directives: {} }
          newRule.directives.background = data.colors[key]
          variantArray = parts
          break
      }

      if (last === 'Text' || last === 'Link') {
        const secondLast = parts.slice(-2)[0]
        if (secondLast === 'Light') {
          return null // unsupported
        } else if (secondLast === 'Faint') {
          newRule.state = ['faint']
          variantArray = parts.slice(0, -2)
        }
      }

      switch (last) {
        case 'Text':
        case 'Link':
        case 'Icon':
        case 'Border':
          newRule.component = last
          break
        case 'Greentext':
        case 'Cyantext':
          newRule.component = 'FunText'
          newRule.variant = last.toLowerCase()
          break
        case 'Faint':
          newRule.component = 'Text'
          newRule.state = ['faint']
          break
      }

      variantArray = variantArray.filter(x => x !== 'Bg')

      if (last === 'Link' && prefix === 'selectedPost') {
        // selectedPost has typo - duplicate 'Post'
        variantArray = variantArray.filter(x => x !== 'Post')
      }

      if (prefix === 'popover' && variantArray[0] === 'Post') {
        newRule.component = 'Post'
        newRule.parent = { component: 'Popover' }
        variantArray = variantArray.filter(x => x !== 'Post')
      }

      if (prefix === 'selectedMenu' && variantArray[0] === 'Popover') {
        newRule.parent = { component: 'Popover' }
        variantArray = variantArray.filter(x => x !== 'Popover')
      }

      switch (prefix) {
        case 'btn':
        case 'input':
        case 'alert': {
          const hasPanel = variantArray.find(x => x === 'Panel')
          if (hasPanel) {
            rule.parent = { component: 'PanelHeader' }
            variantArray = variantArray.filter(x => x !== 'Panel')
          }
          const hasTop = variantArray.find(x => x === 'Top') // TopBar
          if (hasTop) {
            rule.parent = { component: 'TopBar' }
            variantArray = variantArray.filter(x => x !== 'Top' && x !== 'Bar')
          }
          break
        }
      }

      if (variantArray.length > 0) {
        if (prefix === 'btn') {
          newRule.state = variantArray.map(x => x.toLowerCase())
        } else {
          newRule.variant = variantArray[0].toLowerCase()
        }
      }
      console.log(key, newRule)
      return newRule
    })
  })

  const flatExtRules = extendedRules.filter(x => x).reduce((acc, x) => [...acc, ...x], []).filter(x => x)

  return [generateRoot(), ...convertShadows(), ...convertRadii(), ...flatExtRules]
}
