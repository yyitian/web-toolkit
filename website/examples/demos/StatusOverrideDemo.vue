<script setup lang="ts">
import SuperStatus from '@/components/SuperStatus/index.vue';
import type { SuperStatusOption } from '@/components/SuperStatus/types.ts';

const options: SuperStatusOption[] = [
  {
    value: 'success',
    label: '自定义完成文案',
    color: 'var(--wt-color-warning)',
  },
];
</script>

<template>
  <SuperStatus
    value="success"
    :options="options"
    label="已完成归档"
    color="var(--wt-color-success)"
  />
</template>
