export default {
  name: 'Alert',
  selector: '.alert',
  validInnerComponents: [
    'Text',
    'Icon',
    'Link',
    'Border',
    'ButtonUnstyled'
  ],
  variants: {
    normal: '.neutral',
    error: '.error',
    warning: '.warning',
    success: '.success'
  },
  editor: {
    border: 1,
    aspect: '3 / 1'
  },
  defaultRules: [
    {
      directives: {
        background: '--text',
        opacity: 0.5,
        blur: '9px'
      }
    },
    {
      parent: {
        component: 'Alert'
      },
      component: 'Border',
      directives: {
        textColor: '--parent'
      }
    },
    {
      variant: 'error',
      directives: {
        background: '--cRed'
      }
    },
    {
      variant: 'warning',
      directives: {
        background: '--cOrange'
      }
    },
    {
      variant: 'success',
      directives: {
        background: '--cGreen'
      }
    }
  ]
}
