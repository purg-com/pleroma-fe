export default {
  name: 'ButtonUnstyled',
  selector: '.button-unstyled',
  notEditable: true,
  states: {
    toggled: '.toggled',
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
      component: 'Icon',
      parent: {
        component: 'ButtonUnstyled',
        state: ['toggled', 'hover']
      },
      directives: {
        textColor: '--parent--text'
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'ButtonUnstyled',
        state: ['toggled', 'focused']
      },
      directives: {
        textColor: '--parent--text'
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'ButtonUnstyled',
        state: ['toggled', 'focused', 'hover']
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
      component: 'Icon',
      parent: {
        component: 'ButtonUnstyled',
        state: ['disabled']
      },
      directives: {
        textOpacity: 0.25,
        textOpacityMode: 'blend'
      }
    }
  ]
}
