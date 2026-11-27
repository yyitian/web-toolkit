<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperSegmented from '@/components/SuperSegmented/index.vue';
const value = ref('全部分类');
const options = [
  '全部分类',
  '自然风景',
  '建筑与城市',
  '插画与艺术',
  '星空与宇宙',
  '动物与植物',
];
</script>

<template>
  <DemoLayout data-demo="segmented-overflow">
    <template #controls>
      <SuperButton
        @click="value = value === options.at(-1) ? options[0] : options.at(-1)!"
        >切换首尾选项</SuperButton
      >
    </template>
    <div class="segmented-overflow__viewport">
      <SuperSegmented
        v-model="value"
        :options="options"
        block
        aria-label="图片分类"
      />
    </div>
  </DemoLayout>
</template>

<style scoped>
.segmented-overflow__viewport {
  width: 320px;
  max-width: 100%;
  min-width: 0;
}
</style>
