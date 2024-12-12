export default {
  name: 'Root',
  selector: ':root',
  notEditable: true,
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
  validInnerComponentsLite: [
    'Underlay',
    'Scrollbar',
    'ScrollbarElement'
  ],
  defaultRules: [
    {
      directives: {
        // These are here just to establish order,
        // themes should override those
        '--bg': 'color | #121a24',
        '--fg': 'color | #182230',
        '--text': 'color | #b9b9ba',
        '--link': 'color | #d8a070',
        '--accent': 'color | #d8a070',
        '--cRed': 'color | #FF0000',
        '--cBlue': 'color | #0095ff',
        '--cGreen': 'color | #0fa00f',
        '--cOrange': 'color | #ffa500',

        // Fonts
        '--font': 'generic | sans-serif',
        '--monoFont': 'generic | monospace',

        // Fallback no-background-image color
        // (also useful in some other places like scrollbars)
        '--wallpaper': 'color | --bg, -2',

        // Selection colors
        '--selectionBackground': 'color | --accent',
        '--selectionText': 'color | $textColor(--accent --text no-preserve)'
      }
    }
  ]
}
