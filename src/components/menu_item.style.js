export default {
  name: 'MenuItem',
  selector: '.menu-item',
  validInnerComponents: [
    'Text',
    'Icon',
    'Input',
    'Border',
    'ButtonUnstyled',
    'Badge',
    'Avatar'
  ],
  states: {
    hover: ':hover',
    active: '.-active'
  },
  defaultRules: [
    {
      directives: {
        background: '--bg',
        opacity: 0
      }
    },
    {
      state: ['hover'],
      directives: {
        background: '$mod(--bg 5)',
        opacity: 1
      }
    },
    {
      state: ['active'],
      directives: {
        background: '$mod(--bg 10)',
        opacity: 1
      }
    },
    {
      state: ['active', 'hover'],
      directives: {
        background: '$mod(--bg 15)',
        opacity: 1
      }
    },
    {
      component: 'Text',
      parent: {
        component: 'MenuItem',
        state: ['hover']
      },
      directives: {
        textColor: '--link',
        textAuto: 'no-preserve'
      }
    },
    {
      component: 'Text',
      parent: {
        component: 'MenuItem',
        state: ['active']
      },
      directives: {
        textColor: '--link',
        textAuto: 'no-preserve'
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'MenuItem',
        state: ['active']
      },
      directives: {
        textColor: '--link',
        textAuto: 'no-preserve'
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'MenuItem',
        state: ['hover']
      },
      directives: {
        textColor: '--link',
        textAuto: 'no-preserve'
      }
    }
  ]
}
