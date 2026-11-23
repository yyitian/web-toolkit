<script setup lang="ts">
import SuperTags from '@/components/SuperTags/index.vue';
import type { SuperTagValue } from '@/components/SuperTags/types.ts';

const tones = [
  { label: '主要', props: { type: 'primary' } },
  { label: '成功', props: { type: 'success' } },
  { label: '信息', props: { type: 'info' } },
  { label: '警告', props: { type: 'warning' } },
  { label: '危险', props: { type: 'danger' } },
] satisfies SuperTagValue[];
const effects = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'plain', label: '描边' },
] as const;
const sizes: SuperTagValue[] = [
  { label: '小尺寸', props: { size: 'small' } },
  { label: '默认尺寸' },
  { label: '大尺寸', props: { size: 'large' } },
  { label: '圆角', props: { round: true } },
];
</script>

<template>
  <div class="tags-appearance" data-demo="tags-appearance">
    <div
      v-for="effect in effects"
      :key="effect.value"
      class="tags-appearance__row"
    >
      <span class="wt-text-caption">{{ effect.label }}</span>
      <SuperTags :tags="tones" limit="all" :props="{ effect: effect.value }" />
    </div>
    <div class="tags-appearance__row">
      <span class="wt-text-caption">尺寸与圆角</span>
      <SuperTags :tags="sizes" limit="all" />
    </div>
  </div>
</template>

<style scoped>
.tags-appearance {
  display: grid;
  gap: 16px;
}
.tags-appearance__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.tags-appearance__row > span {
  width: 72px;
}
</style>
