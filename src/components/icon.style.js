export default {
  name: 'Icon',
  virtual: true,
  selector: '.svg-inline--fa',
  defaultRules: [
    {
      component: 'Icon',
      directives: {
        textColor: '$blend(--stack 0.5 --parent--text)',
        textAuto: 'no-auto'
      }
    }
  ]
}
