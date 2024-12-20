<template>
  <div>
    <div class="panel panel-default base01-background">
      <div class="panel-heading timeline-heading base02-background">
        <div class="panel-body">
          <div class="title">
            {{ $t('tos_panel.title') }}
          </div>
        </div>
      </div>
      <!-- eslint-disable vue/no-v-html -->
      <div
        class="tos-content"
        v-html="content"
      />
      <!-- eslint-enable vue/no-v-html -->
    </div>
  </div>
</template>

<script src="./terms_of_service_panel.js"></script>

<style lang="scss">
.tos-content {
  margin: 1em;
}
</style>
