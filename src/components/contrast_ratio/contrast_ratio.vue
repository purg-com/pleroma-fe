<template>
  <span
    v-if="contrast"
    class="contrast-ratio"
  >
    <span v-if="showRatio">
      {{ contrast.text }}
    </span>
    <Tooltip
      :text="hint"
      class="rating"
    >
      <span v-if="contrast.aaa">
        <FAIcon icon="thumbs-up" :size="showRatio ? 'lg' : ''" />
      </span>
      <span v-if="!contrast.aaa && contrast.aa">
        <FAIcon icon="adjust" :size="showRatio ? 'lg' : ''" />
      </span>
      <span v-if="!contrast.aaa && !contrast.aa">
        <FAIcon icon="exclamation-triangle" :size="showRatio ? 'lg' : ''" />
      </span>
    </Tooltip>
    <Tooltip
      v-if="contrast && large"
      :text="hint_18pt"
      class="rating"
    >
      <span v-if="contrast.laaa">
        <FAIcon icon="thumbs-up" :size="showRatio ? 'large' : ''" />
      </span>
      <span v-if="!contrast.laaa && contrast.laa">
        <FAIcon icon="adjust" :size="showRatio ? 'lg' : ''" />
      </span>
      <span v-if="!contrast.laaa && !contrast.laa">
        <FAIcon icon="exclamation-triangle" :size="showRatio ? 'lg' : ''" />
      </span>
    </Tooltip>
  </span>
</template>

<script>
import Tooltip from 'src/components/tooltip/tooltip.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faAdjust,
  faExclamationTriangle,
  faThumbsUp
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faAdjust,
  faExclamationTriangle,
  faThumbsUp
)

export default {
  props: {
    large: {
      required: false,
      type: Boolean,
      default: false
    },
    // TODO: Make theme switcher compute theme initially so that contrast
    // component won't be called without contrast data
    contrast: {
      required: false,
      type: Object,
      default: () => ({})
    },
    showRatio: {
      required: false,
      type: Boolean,
      default: false
    }
  },
  components: {
    Tooltip
  },
  computed: {
    hint () {
      const levelVal = this.contrast.aaa ? 'aaa' : (this.contrast.aa ? 'aa' : 'bad')
      const level = this.$t(`settings.style.common.contrast.level.${levelVal}`)
      const context = this.$t('settings.style.common.contrast.context.text')
      const ratio = this.contrast.text
      return this.$t('settings.style.common.contrast.hint', { level, context, ratio })
    },
    hint_18pt () {
      const levelVal = this.contrast.laaa ? 'aaa' : (this.contrast.laa ? 'aa' : 'bad')
      const level = this.$t(`settings.style.common.contrast.level.${levelVal}`)
      const context = this.$t('settings.style.common.contrast.context.18pt')
      const ratio = this.contrast.text
      return this.$t('settings.style.common.contrast.hint', { level, context, ratio })
    }
  }
}
</script>

<style lang="scss">
.contrast-ratio {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;

  .label {
    margin-right: 1em;
  }

  .rating {
    display: inline-block;
    margin-left: 0.5em;
  }
}
</style>
