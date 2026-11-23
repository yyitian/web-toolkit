<script setup lang="ts">
import SuperTags from '@/components/SuperTags/index.vue';
</script>

<template>
  <SuperTags :tags="['研发', '运维', '审计', '安全']" :limit="1">
    <template #tag="{ label, index, overflow }">
      {{ index + 1 }} · {{ label }}{{ overflow ? '（其余）' : '' }}
    </template>
  </SuperTags>
</template>
