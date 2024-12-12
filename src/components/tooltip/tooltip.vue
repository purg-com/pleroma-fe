<template>
  <Popover trigger="hover">
    <template #trigger>
      <slot />
    </template>
    <template #content>
      <div class="tooltip">
        {{ props.text }}
      </div>
    </template>
  </Popover>
</template>

<script setup>
import Popover from 'src/components/popover/popover.vue'

const props = defineProps(['text'])
</script>

<style lang="scss">
.tooltip {
  margin: 0.5em 1em;
}
</style>
