export default {
  name: 'Alert',
  selector: '.alert',
  validInnerComponents: [
    'Text',
    'Icon',
    'Link',
    'Border'
  ],
  variants: {
    normal: '.neutral',
    error: '.error',
    warning: '.warning',
    success: '.success'
  },
  defaultRules: [
    {
      directives: {
        background: '--text',
        opacity: 0.5
      }
    },
    {
      parent: {
        component: 'Alert'
      },
      component: 'Border',
      textColor: '--parent'
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
