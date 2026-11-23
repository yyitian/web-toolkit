<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperStatus from '@/components/SuperStatus/index.vue';
import type {
  SuperStatusOption,
  SuperStatusValue,
} from '@/components/SuperStatus/types.ts';

const value = ref<SuperStatusValue>(0);
const options: SuperStatusOption[] = [
  { value: 0, label: '排队中', type: 'warning' },
  { value: 1, label: '执行中', color: 'var(--wt-color-primary)' },
  { value: 'running', label: () => '正在运行' },
  { value: 'archived', label: '已归档' },
];
const choices: { value: SuperStatusValue; label: string }[] = [
  { value: 0, label: '数字 0' },
  { value: '0', label: '字符串 0' },
  { value: 1, label: '自定义颜色' },
  { value: 'running', label: '覆盖内置文案' },
  { value: 'archived', label: '自定义状态' },
];
</script>

<template>
  <DemoLayout>
    <template #controls>
      <SuperButton
        v-for="choice in choices"
        :key="`${typeof choice.value}:${choice.value}`"
        size="small"
        :type="value === choice.value ? 'primary' : 'default'"
        :aria-pressed="value === choice.value"
        @click="value = choice.value"
        >{{ choice.label }}</SuperButton
      >
    </template>
    <SuperStatus :value="value" :options="options" />
  </DemoLayout>
</template>
