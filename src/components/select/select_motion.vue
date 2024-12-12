<template>
  <div
    class="SelectMotion btn-group"
  >
    <button
      class="btn button-default"
      :disabled="disabled"
      @click="add"
    >
      <FAIcon
        fixed-width
        icon="plus"
      />
    </button>
    <button
      class="btn button-default"
      :disabled="disabled || !moveUpValid"
      :class="{ disabled: disabled || !moveUpValid }"
      @click="moveUp"
    >
      <FAIcon
        fixed-width
        icon="chevron-up"
      />
    </button>
    <button
      class="btn button-default"
      :disabled="disabled || !moveDnValid"
      :class="{ disabled: disabled || !moveDnValid }"
      @click="moveDn"
    >
      <FAIcon
        fixed-width
        icon="chevron-down"
      />
    </button>
    <button
      class="btn button-default"
      :disabled="disabled || !present"
      :class="{ disabled: disabled || !present }"
      @click="del"
    >
      <FAIcon
        fixed-width
        icon="times"
      />
    </button>
  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  selectedId: {
    type: Number,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  getAddValue: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'update:selectedId'])

const moveUpValid = computed(() => {
  return props.selectedId > 0
})

const present = computed(() => props.modelValue[props.selectedId] != null)

const moveUp = async () => {
  const newModel = [...props.modelValue]
  const movable = newModel.splice(props.selectedId, 1)[0]
  newModel.splice(props.selectedId - 1, 0, movable)

  emit('update:modelValue', newModel)
  await nextTick()
  emit('update:selectedId', props.selectedId - 1)
}

const moveDnValid = computed(() => {
  return props.selectedId < props.modelValue.length - 1
})

const moveDn = async () => {
  const newModel = [...props.modelValue]
  const movable = newModel.splice(props.selectedId.value, 1)[0]
  newModel.splice(props.selectedId + 1, 0, movable)

  emit('update:modelValue', newModel)
  await nextTick()
  emit('update:selectedId', props.selectedId + 1)
}

const add = async () => {
  const newModel = [...props.modelValue, props.getAddValue()]

  emit('update:modelValue', newModel)
  await nextTick()
  emit('update:selectedId', Math.max(newModel.length - 1, 0))
}

const del = async () => {
  const newModel = [...props.modelValue]
  newModel.splice(props.selectedId, 1)

  emit('update:modelValue', newModel)
  await nextTick()
  emit('update:selectedId', newModel.length === 0 ? undefined : Math.max(props.selectedId - 1, 0))
}
</script>

<style lang="scss">
.SelectMotion {
  flex: 0 0 auto;
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  margin-top: 0.25em;

  .button-default {
    margin: 0;
    padding: 0;
  }
}
</style>
