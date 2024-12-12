export default {
  name: 'Border',
  selector: '/*border*/',
  virtual: true,
  defaultRules: [
    {
      directives: {
        textColor: '$mod(--parent 10)',
        textAuto: 'no-auto'
      }
    }
  ]
}
