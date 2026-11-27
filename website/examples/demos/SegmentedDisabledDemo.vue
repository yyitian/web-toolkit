<script setup lang="ts">
import SuperSegmented from '@/components/SuperSegmented/index.vue';
const value = ref('daily');
const options = [
  { label: '每日', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly', disabled: true },
];
</script>

<template>
  <div class="segmented-disabled">
    <SuperSegmented v-model="value" :options="options" aria-label="统计周期" />
    <SuperSegmented
      :model-value="value"
      :options="options"
      disabled
      aria-label="只读统计周期"
    />
  </div>
</template>

<style scoped>
.segmented-disabled {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
</style>
