export default {
  name: 'Tab', // Name of the component
  selector: '.tab', // CSS selector/prefix
  states: {
    active: '.active',
    hover: ':hover:not(.disabled)',
    disabled: '.disabled'
  },
  validInnerComponents: [
    'Text',
    'Icon'
  ],
  defaultRules: [
    {
      directives: {
        background: '--fg',
        shadow: ['--defaultButtonShadow', '--defaultButtonBevel'],
        roundness: 3
      }
    },
    {
      state: ['hover'],
      directives: {
        shadow: ['--defaultButtonHoverGlow', '--defaultButtonBevel']
      }
    },
    {
      state: ['active'],
      directives: {
        opacity: 0
      }
    },
    {
      state: ['hover', 'active'],
      directives: {
        shadow: ['--defaultButtonShadow', '--defaultButtonBevel']
      }
    },
    {
      state: ['disabled'],
      directives: {
        background: '$blend(--inheritedBackground, 0.25, --parent)',
        shadow: ['--defaultButtonBevel']
      }
    },
    {
      component: 'Text',
      parent: {
        component: 'Tab',
        state: ['disabled']
      },
      directives: {
        textOpacity: 0.25,
        textOpacityMode: 'blend'
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'Tab',
        state: ['active']
      },
      directives: {
        textColor: '--text'
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'Tab',
        state: ['active', 'hover']
      },
      directives: {
        textColor: '--text'
      }
    }
  ]
}