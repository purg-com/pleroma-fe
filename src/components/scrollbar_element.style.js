const border = (top, shadow) => ({
  x: 0,
  y: top ? 1 : -1,
  blur: 0,
  spread: 0,
  color: shadow ? '#000000' : '#FFFFFF',
  alpha: 0.2,
  inset: true
})

const buttonInsetFakeBorders = [border(true, false), border(false, true)]
const inputInsetFakeBorders = [border(true, true), border(false, false)]
const buttonOuterShadow = {
  x: 0,
  y: 0,
  blur: 2,
  spread: 0,
  color: '#000000',
  alpha: 1
}

const hoverGlow = {
  x: 0,
  y: 0,
  blur: 4,
  spread: 0,
  color: '--text',
  alpha: 1
}

export default {
  name: 'ScrollbarElement',
  selector: '::-webkit-scrollbar-button',
  notEditable: true, // for now
  states: {
    pressed: ':active',
    hover: ':hover:not(:disabled)',
    disabled: ':disabled'
  },
  validInnerComponents: [
    'Text'
  ],
  defaultRules: [
    {
      directives: {
        background: '--fg',
        shadow: [buttonOuterShadow, ...buttonInsetFakeBorders],
        roundness: 3
      }
    },
    {
      state: ['hover'],
      directives: {
        shadow: [hoverGlow, ...buttonInsetFakeBorders]
      }
    },
    {
      state: ['pressed'],
      directives: {
        shadow: [buttonOuterShadow, ...inputInsetFakeBorders]
      }
    },
    {
      state: ['hover', 'pressed'],
      directives: {
        shadow: [hoverGlow, ...inputInsetFakeBorders]
      }
    },
    {
      state: ['toggled'],
      directives: {
        background: '--accent,-24.2',
        shadow: [buttonOuterShadow, ...inputInsetFakeBorders]
      }
    },
    {
      state: ['toggled', 'hover'],
      directives: {
        background: '--accent,-24.2',
        shadow: [hoverGlow, ...inputInsetFakeBorders]
      }
    },
    {
      state: ['disabled'],
      directives: {
        background: '$blend(--inheritedBackground 0.25 --parent)',
        shadow: [...buttonInsetFakeBorders]
      }
    },
    {
      component: 'Text',
      parent: {
        component: 'Button',
        state: ['disabled']
      },
      directives: {
        textOpacity: 0.25,
        textOpacityMode: 'blend'
      }
    }
  ]
}
