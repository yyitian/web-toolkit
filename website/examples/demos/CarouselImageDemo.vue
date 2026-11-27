<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperCarousel from '../../../src/components/SuperCarousel/index.vue';
import SuperButton from '../../../src/components/SuperButton/index.vue';
import { carouselItems } from './carousel-data.ts';
const failedSrc = 'data:image/png;base64,aW52YWxpZA==';
const restored = ref(false);
const items = computed(() => [
  {
    id: 'retry',
    src: restored.value ? carouselItems[0].src : failedSrc,
    alt: '可恢复的图片示例',
  },
  carouselItems[1],
]);
</script>
<template>
  <DemoLayout data-demo="carousel-image">
    <template #controls
      ><SuperButton size="small" @click="restored = false"
        >重现加载失败</SuperButton
      ></template
    >
    <SuperCarousel :items="items">
      <template #error
        ><div class="carousel-error-demo">
          <span>图片加载失败</span
          ><SuperButton @click.stop="restored = true">替换图片</SuperButton>
        </div></template
      >
    </SuperCarousel>
  </DemoLayout>
</template>
<style scoped>
.carousel-error-demo {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  height: 100%;
  color: var(--wt-text-secondary);
}
</style>
