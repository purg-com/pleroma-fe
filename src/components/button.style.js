export default {
  name: 'Button', // Name of the component
  selector: '.button-default', // CSS selector/prefix
  // outOfTreeSelector: '' // out-of-tree selector is used when other components are laid over it but it's not part of the tree, see Underlay component
  // States, system witll calculate ALL possible combinations of those and prepend "normal" to them + standalone "normal" state
  states: {
    // States are a bit expensive - the amount of combinations generated is about (1/6)n^3+n, so adding more state increased number of combination by an order of magnitude!
    // All states inherit from "normal" state, there is no other inheirtance, i.e. hover+disabled only inherits from "normal", not from hover nor disabled.
    // However, cascading still works, so resulting state will be result of merging of all relevant states/variants
    // normal: '' // normal state is implicitly added, it is always included
    toggled: '.toggled',
    focused: ':focus-visible',
    pressed: ':focus:active',
    hover: ':hover:not(:disabled)',
    disabled: ':disabled'
  },
  // Variants are mutually exclusive, each component implicitly has "normal" variant, and all other variants inherit from it.
  variants: {
    // Variants save on computation time since adding new variant just adds one more "set".
    // normal: '', // you can override normal variant, it will be appenended to the main class
    danger: '.danger'
    // Overall the compuation difficulty is N*((1/6)M^3+M) where M is number of distinct states and N is number of variants.
    // This (currently) is further multipled by number of places where component can exist.
  },
  editor: {
    aspect: '2 / 1'
  },
  // This lists all other components that can possibly exist within one. Recursion is currently not supported (and probably won't be supported ever).
  validInnerComponents: [
    'Text',
    'Icon'
  ],
  // Default rules, used as "default theme", essentially.
  defaultRules: [
    {
      component: 'Root',
      directives: {
        '--buttonDefaultHoverGlow': 'shadow | 0 0 4 --text / 0.5',
        '--buttonDefaultFocusGlow': 'shadow | 0 0 4 4 --link / 0.5',
        '--buttonDefaultShadow': 'shadow | 0 0 2 #000000',
        '--buttonDefaultBevel': 'shadow | $borderSide(#FFFFFF top 0.2 2), $borderSide(#000000 bottom 0.2 2)',
        '--buttonPressedBevel': 'shadow | $borderSide(#FFFFFF bottom 0.2 2), $borderSide(#000000 top 0.2 2)'
      }
    },
    {
      // component: 'Button', // no need to specify components every time unless you're specifying how other component should look
      // like within it
      directives: {
        background: '--fg',
        shadow: ['--buttonDefaultShadow', '--buttonDefaultBevel'],
        roundness: 3
      }
    },
    {
      state: ['hover'],
      directives: {
        shadow: ['--buttonDefaultHoverGlow', '--buttonDefaultBevel']
      }
    },
    {
      state: ['focused'],
      directives: {
        shadow: ['--buttonDefaultFocusGlow', '--buttonDefaultBevel']
      }
    },
    {
      state: ['pressed'],
      directives: {
        shadow: ['--buttonDefaultShadow', '--buttonPressedBevel']
      }
    },
    {
      state: ['pressed', 'hover'],
      directives: {
        shadow: ['--buttonPressedBevel', '--buttonDefaultHoverGlow']
      }
    },
    {
      state: ['toggled'],
      directives: {
        background: '--inheritedBackground,-14.2',
        shadow: ['--buttonDefaultShadow', '--buttonPressedBevel']
      }
    },
    {
      state: ['toggled', 'hover'],
      directives: {
        background: '--inheritedBackground,-14.2',
        shadow: ['--buttonDefaultHoverGlow', '--buttonPressedBevel']
      }
    },
    {
      state: ['toggled', 'disabled'],
      directives: {
        background: '$blend(--inheritedBackground 0.25 --parent)',
        shadow: ['--buttonPressedBevel']
      }
    },
    {
      state: ['disabled'],
      directives: {
        background: '$blend(--inheritedBackground 0.25 --parent)',
        shadow: ['--buttonDefaultBevel']
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
    },
    {
      component: 'Icon',
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
