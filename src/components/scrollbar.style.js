export default {
  name: 'Scrollbar',
  selector: ['::-webkit-scrollbar-button', '::-webkit-scrollbar-thumb', '::-webkit-resizer'],
  notEditable: true, // for now
  defaultRules: [
    {
      directives: {
        background: '--wallpaper'
      }
    }
  ]
}
