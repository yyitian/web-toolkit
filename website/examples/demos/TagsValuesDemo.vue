<script setup lang="ts">
import SuperTags from '@/components/SuperTags/index.vue';
import type { SuperTagValue } from '@/components/SuperTags/types.ts';

const tags: SuperTagValue[] = [
  '字符串',
  0,
  false,
  '重复',
  '重复',
  { key: 'custom', label: () => '动态文案', props: { type: 'success' } },
];
</script>

<template>
  <SuperTags :tags="tags" limit="all" data-demo="tags-values" />
</template>
