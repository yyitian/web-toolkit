<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperTags from '@/components/SuperTags/index.vue';
import type { SuperTagsLimit } from '@/components/SuperTags/types.ts';

const limit = ref<SuperTagsLimit>(2);
const options: { value: SuperTagsLimit; label: string }[] = [
  { value: 1, label: '显示 1 个' },
  { value: 2, label: '显示 2 个' },
  { value: 0, label: '仅计数' },
  { value: 'all', label: '全部展示' },
];
</script>

<template>
  <DemoLayout>
    <template #controls>
      <SuperButton
        v-for="option in options"
        :key="option.value"
        size="small"
        :type="limit === option.value ? 'primary' : 'default'"
        :aria-pressed="limit === option.value"
        @click="limit = option.value"
        >{{ option.label }}</SuperButton
      >
    </template>
    <SuperTags :tags="['研发', '运维', '审计', '安全']" :limit="limit" />
  </DemoLayout>
</template>
