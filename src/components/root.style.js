export default {
  name: 'Root',
  selector: ':root',
  validInnerComponents: [
    'Underlay',
    'Modals',
    'Popover',
    'TopBar',
    'Scrollbar',
    'ScrollbarElement',
    'MobileDrawer',
    'Alert',
    'Button' // mobile post button
  ],
  defaultRules: [
    {
      directives: {
        '--font': 'generic | sans-serif',
        '--monoFont': 'generic | monospace'
      }
    }
  ]
}
