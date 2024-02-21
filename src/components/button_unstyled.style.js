export default {
  name: 'ButtonUnstyled',
  selector: '.button-unstyled',
  states: {
    disabled: ':disabled',
    hover: ':hover:not(:disabled)',
    focused: ':focus-within'
  },
  validInnerComponents: [
    'Text',
    'Icon',
    'Badge'
  ],
  defaultRules: [
    {
      directives: {
        background: '#ffffff',
        opacity: 0,
        shadow: []
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'ButtonUnstyled',
        state: ['hover']
      },
      directives: {
        textColor: '--parent--text'
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'ButtonUnstyled',
        state: ['toggled']
      },
      directives: {
        textColor: '--parent--text'
      }
    },
    {
      component: 'Text',
      parent: {
        component: 'ButtonUnstyled',
        state: ['disabled']
      },
      directives: {
        textOpacity: 0.25,
        textOpacityMode: 'blend'
      }
    },
    {
      component: 'Text',
      parent: {
        component: 'ButtonUnstyled',
        state: ['disabled', 'hover']
      },
      directives: {
        textOpacity: 0.25,
        textOpacityMode: 'blend'
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'ButtonUnstyled',
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
        component: 'ButtonUnstyled',
        state: ['disabled', 'hover']
      },
      directives: {
        textOpacity: 0.25,
        textOpacityMode: 'blend'
      }
    }
  ]
}
