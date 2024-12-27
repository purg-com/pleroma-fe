<template>
  <PostStatusForm
    ref="postStatusForm"
    v-bind="params"
    :post-handler="doEditStatus"
    :disable-polls="true"
    :disable-visibility-selector="true"
  />
</template>

<script src="./edit_status_form.js"></script>
