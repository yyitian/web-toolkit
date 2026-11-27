<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperCarousel from '@/components/SuperCarousel/index.vue';
import SuperForm from '@/components/SuperForm/index.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import type { SuperFormColumn } from '@/components/SuperForm/types.ts';
import type { SuperCarouselId } from '@/components/SuperCarousel/types.ts';
import { carouselItems } from './carousel-data.ts';

const preview = ref(false);
const selectable = ref(true);
const selectedIds = ref<SuperCarouselId[]>(['alpine']);
const selectedLabels = computed(() =>
  carouselItems
    .filter((item) => selectedIds.value.includes(item.id))
    .map((item) => item.label)
    .join('、'),
);
const columns: SuperFormColumn[] = [
  {
    prop: 'preview',
    label: '图片预览',
    formType: 'switch',
    defaultValue: false,
    change: (_, value) => {
      preview.value = value === true;
    },
  },
  {
    prop: 'selectable',
    label: '启用勾选',
    formType: 'switch',
    defaultValue: true,
    change: (_, value) => {
      selectable.value = value === true;
    },
  },
];
</script>

<template>
  <DemoLayout data-demo="carousel-selection">
    <template #controls
      ><SuperForm :columns="columns" inline label-position="top"
    /></template>
    <SuperCarousel
      v-model:selected-ids="selectedIds"
      :items="carouselItems"
      :preview="preview"
      :selectable="selectable"
      :image-props="{
        showProgress: true,
        hideOnClickModal: true,
        minScale: 0.5,
        maxScale: 4,
      }"
    />
    <template #output>
      <div class="carousel-selection-result">
        <span>已选：{{ selectedLabels || '无' }}</span>
        <SuperButton
          size="small"
          :disabled="!selectedIds.length"
          @click="selectedIds = []"
          >清空选择</SuperButton
        >
      </div>
    </template>
  </DemoLayout>
</template>

<style scoped>
.carousel-selection-result {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
</style>
