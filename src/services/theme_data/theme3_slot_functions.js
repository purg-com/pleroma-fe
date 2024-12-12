import { convert, brightness } from 'chromatism'
import { alphaBlend, getTextColor, relativeLuminance } from '../color_convert/color_convert.js'

export const process = (text, functions, { findColor, findShadow }, { dynamicVars, staticVars }) => {
  const { funcName, argsString } = /\$(?<funcName>\w+)\((?<argsString>[#a-zA-Z0-9-,.'"\s]*)\)/.exec(text).groups
  const args = argsString.split(/ /g).map(a => a.trim())

  const func = functions[funcName]
  if (args.length < func.argsNeeded) {
    throw new Error(`$${funcName} requires at least ${func.argsNeeded} arguments, but ${args.length} were provided`)
  }
  return func.exec(args, { findColor, findShadow }, { dynamicVars, staticVars })
}

export const colorFunctions = {
  alpha: {
    argsNeeded: 2,
    documentation: 'Changes alpha value of the color only to be used for CSS variables',
    args: [
      'color: source color used',
      'amount: alpha value'
    ],
    exec: (args, { findColor }, { dynamicVars, staticVars }) => {
      const [color, amountArg] = args

      const colorArg = convert(findColor(color, { dynamicVars, staticVars })).rgb
      const amount = Number(amountArg)
      return { ...colorArg, a: amount }
    }
  },
  brightness: {
    argsNeeded: 2,
    document: 'Changes brightness/lightness of color in HSL colorspace',
    args: [
      'color: source color used',
      'amount: lightness value'
    ],
    exec: (args, { findColor }, { dynamicVars, staticVars }) => {
      const [color, amountArg] = args

      const colorArg = convert(findColor(color, { dynamicVars, staticVars })).hsl
      colorArg.l += Number(amountArg)
      return { ...convert(colorArg).rgb }
    }
  },
  textColor: {
    argsNeeded: 2,
    documentation: 'Get text color with adequate contrast for given background and intended text color. Same function is used internally',
    args: [
      'background: color of backdrop where text will be shown',
      'foreground: intended text color',
      `[preserve]: (optional) intended color preservation:
'preserve' - try to preserve the color
'no-preserve' - if can't get adequate color - fall back to black or white
'no-auto' - don't do anything (useless as a color function)`
    ],
    exec: (args, { findColor }, { dynamicVars, staticVars }) => {
      const [backgroundArg, foregroundArg, preserve = 'preserve'] = args

      const background = convert(findColor(backgroundArg, { dynamicVars, staticVars })).rgb
      const foreground = convert(findColor(foregroundArg, { dynamicVars, staticVars })).rgb

      return getTextColor(background, foreground, preserve === 'preserve')
    }
  },
  blend: {
    argsNeeded: 3,
    documentation: 'Alpha blending between two colors',
    args: [
      'background: bottom layer color',
      'amount: opacity of top layer',
      'foreground: upper layer color'
    ],
    exec: (args, { findColor }, { dynamicVars, staticVars }) => {
      const [backgroundArg, amountArg, foregroundArg] = args

      const background = convert(findColor(backgroundArg, { dynamicVars, staticVars })).rgb
      const foreground = convert(findColor(foregroundArg, { dynamicVars, staticVars })).rgb
      const amount = Number(amountArg)

      return alphaBlend(background, amount, foreground)
    }
  },
  mod: {
    argsNeeded: 2,
    documentation: 'Old function that increases or decreases brightness depending if color is dark or light. Advised against using it as it might give unexpected results.',
    args: [
      'color: source color',
      'amount: how much darken/brighten the color'
    ],
    exec: (args, { findColor }, { dynamicVars, staticVars }) => {
      const [colorArg, amountArg] = args

      const color = convert(findColor(colorArg, { dynamicVars, staticVars })).rgb
      const amount = Number(amountArg)

      const effectiveBackground = dynamicVars.lowerLevelBackground
      const isLightOnDark = relativeLuminance(convert(effectiveBackground).rgb) < 0.5
      const mod = isLightOnDark ? 1 : -1
      return brightness(amount * mod, color).rgb
    }
  }
}

export const shadowFunctions = {
  borderSide: {
    argsNeeded: 3,
    documentation: 'Simulate a border on a side with a shadow, best works on inset border',
    args: [
      'color: border color',
      'side: string indicating on which side border should be, takes either one word or two words joined by dash (i.e. "left" or "bottom-right")',
      '[alpha]: (Optional) border opacity, defaults to 1 (fully opaque)',
      '[inset]: (Optional) whether border should be on the inside or outside, defaults to inside'
    ],
    exec: (args, { findColor }) => {
      const [color, side, alpha = '1', widthArg = '1', inset = 'inset'] = args

      const width = Number(widthArg)
      const isInset = inset === 'inset'

      const targetShadow = {
        x: 0,
        y: 0,
        blur: 0,
        spread: 0,
        color,
        alpha: Number(alpha),
        inset: isInset
      }

      side.split('-').forEach((position) => {
        switch (position) {
          case 'left':
            targetShadow.x = width * (inset ? 1 : -1)
            break
          case 'right':
            targetShadow.x = -1 * width * (inset ? 1 : -1)
            break
          case 'top':
            targetShadow.y = width * (inset ? 1 : -1)
            break
          case 'bottom':
            targetShadow.y = -1 * width * (inset ? 1 : -1)
            break
        }
      })
      return [targetShadow]
    }
  }
}
