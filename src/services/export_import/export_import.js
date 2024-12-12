import utf8 from 'utf8'

export const newExporter = ({
  filename = 'data',
  mime = 'application/json',
  extension = '.json',
  getExportedObject
}) => ({
  exportData () {
    let stringified
    if (mime === 'application/json') {
      stringified = utf8.encode(JSON.stringify(getExportedObject(), null, 2)) // Pretty-print and indent with 2 spaces
    } else {
      stringified = utf8.encode(getExportedObject()) // Pretty-print and indent with 2 spaces
    }

    // Create an invisible link with a data url and simulate a click
    const e = document.createElement('a')
    const realFilename = typeof filename === 'function' ? filename() : filename
    e.setAttribute('download', `${realFilename}.${extension}`)
    e.setAttribute('href', `data:${mime};base64, ${window.btoa(stringified)}`)
    e.style.display = 'none'

    document.body.appendChild(e)
    e.click()
    document.body.removeChild(e)
  }
})

export const newImporter = ({
  accept = '.json',
  parser = (string) => JSON.parse(string),
  onImport,
  onImportFailure,
  validator = () => true
}) => ({
  importData () {
    const filePicker = document.createElement('input')
    filePicker.setAttribute('type', 'file')
    filePicker.setAttribute('accept', accept)

    filePicker.addEventListener('change', event => {
      if (event.target.files[0]) {
        const filename = event.target.files[0].name
        // eslint-disable-next-line no-undef
        const reader = new FileReader()
        reader.onload = ({ target }) => {
          try {
            const parsed = parser(target.result, filename)
            const validationResult = validator(parsed, filename)
            if (validationResult === true) {
              onImport(parsed, filename)
            } else {
              onImportFailure({ validationResult })
            }
          } catch (error) {
            onImportFailure({ error })
          }
        }
        reader.readAsText(event.target.files[0])
      }
    })

    document.body.appendChild(filePicker)
    filePicker.click()
    document.body.removeChild(filePicker)
  }
})
