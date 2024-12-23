<template>
  <div
    class="PaletteEditor"
    :class="{ '-compact': compact, '-apply': apply }"
  >
    <ColorInput
      v-for="key in paletteKeys"
      :key="key"
      :name="key"
      :model-value="props.modelValue[key]"
      :fallback="fallback(key)"
      :label="$t('settings.style.themes3.palette.' + key)"
      @update:modelValue="value => updatePalette(key, value)"
    />
    <button
      class="btn button-default palette-import-button"
      @click="importPalette"
    >
      <FAIcon icon="file-import" />
      {{ $t('settings.style.themes3.palette.import') }}
    </button>
    <button
      class="btn button-default palette-export-button"
      @click="exportPalette"
    >
      <FAIcon icon="file-export" />
      {{ $t('settings.style.themes3.palette.export') }}
    </button>
    <button
      v-if="apply"
      class="btn button-default palette-apply-button"
      @click="applyPalette"
    >
      {{ $t('settings.style.themes3.palette.apply') }}
    </button>
  </div>
</template>

<script setup>
import ColorInput from 'src/components/color_input/color_input.vue'
import {
  newImporter,
  newExporter
} from 'src/services/export_import/export_import.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faFileImport,
  faFileExport
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faFileImport,
  faFileExport
)

const paletteKeys = [
  'bg',
  'fg',
  'text',
  'link',
  'accent',
  'cRed',
  'cBlue',
  'cGreen',
  'cOrange',
  'wallpaper'
]

const props = defineProps(['modelValue', 'compact', 'apply'])
const emit = defineEmits(['update:modelValue', 'applyPalette'])
const getExportedObject = () => paletteKeys.reduce((acc, key) => {
  const value = props.modelValue[key]
  if (value == null) {
    return acc
  } else {
    return { ...acc, [key]: props.modelValue[key] }
  }
}, {})

const paletteExporter = newExporter({
  filename: 'pleroma_palette',
  extension: 'json',
  getExportedObject
})
const paletteImporter = newImporter({
  accept: '.json',
  onImport (parsed, filename) {
    emit('update:modelValue', parsed)
  }
})

const exportPalette = () => {
  paletteExporter.exportData()
}

const importPalette = () => {
  paletteImporter.importData()
}

const applyPalette = (data) => {
  emit('applyPalette', getExportedObject())
}

const fallback = (key) => {
  if (key === 'accent') {
    return props.modelValue.link
  }
  if (key === 'link') {
    return props.modelValue.accent
  }
  if (key.startsWith('extra')) {
    return '#FF00FF'
  }
  if (key.startsWith('wallpaper')) {
    return '#008080'
  }
}

const updatePalette = (paletteKey, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [paletteKey]: value
  })
}
</script>

<style lang="scss">
.PaletteEditor {
  display: grid;
  justify-content: space-around;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(5, 1fr) auto;
  grid-gap: 0.5em;
  align-items: baseline;

  .palette-import-button {
    grid-column: 1 / span 2;
  }

  .palette-export-button {
    grid-column: 3 / span 2;
  }

  .palette-apply-button {
    grid-column: 1 / span 2;
  }

  .color-input.style-control {
    margin: 0;
  }

  &.-compact {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(5, 1fr) auto;

    .palette-import-button {
      grid-column: 1;
    }

    .palette-export-button {
      grid-column: 2;
    }

    &.-apply {
      grid-template-rows: repeat(5, 1fr) auto auto;

      .palette-apply-button {
        grid-column: 1 / span 2;
      }
    }

    .-mobile & {
      grid-template-columns: 1fr;
      grid-template-rows: repeat(10, 1fr) auto;

      .palette-import-button {
        grid-column: 1;
      }

      .palette-export-button {
        grid-column: 1;
      }

      &.-apply {
        .palette-apply-button {
          grid-column: 1;
        }
      }
    }
  }
}
</style>
