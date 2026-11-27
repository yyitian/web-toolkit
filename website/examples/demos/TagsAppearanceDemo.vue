<script setup lang="ts">
import SuperTags from '@/components/SuperTags/index.vue';
import type { SuperTagValue } from '@/components/SuperTags/types.ts';

const tags: SuperTagValue[] = [
  '公共外观',
  { label: '单项覆盖颜色', props: { type: 'warning' } },
  { label: '单项覆盖尺寸', props: { size: 'large' } },
];
</script>

<template>
  <SuperTags
    :tags="tags"
    limit="all"
    :props="{ type: 'success', size: 'small' }"
    data-demo="tags-appearance"
  />
</template>
