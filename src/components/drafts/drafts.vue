<template>
  <div class="Drafts">
    <div class="panel panel-default">
      <div class="panel-heading">
        <div class="title">
          {{ $t('drafts.drafts') }}
        </div>
      </div>
      <div class="panel-body">
        <List
          :items="drafts"
        >
          <template #item="{ item: draft }">
            <Draft
              :draft="draft"
            />
          </template>
        </List>
      </div>
    </div>
  </div>
</template>

<script src="./drafts.js"></script>
