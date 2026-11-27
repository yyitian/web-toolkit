<script setup lang="ts">
import { ElImage } from 'element-plus';
import type { SuperCarouselImageProps, SuperCarouselItem } from './types.ts';
defineProps<{
  item: SuperCarouselItem;
  imageProps?: SuperCarouselImageProps;
}>();
const emit = defineEmits<{ load: [event: Event]; error: [event: Event] }>();
</script>
<template>
  <ElImage
    class="super-carousel__image"
    fit="cover"
    v-bind="imageProps"
    :src="item.src || ''"
    :alt="item.alt ?? imageProps?.alt ?? ''"
    :preview-src-list="[]"
    :initial-index="0"
    @load="emit('load', $event)"
    @error="emit('error', $event)"
  >
    <template #placeholder
      ><slot name="placeholder"
        ><div class="super-carousel__placeholder" aria-label="图片加载中">
          <span class="super-carousel__skeleton" /></div></slot
    ></template>
    <template #error
      ><slot name="error"
        ><div class="super-carousel__placeholder">图片加载失败</div></slot
      ></template
    >
  </ElImage>
</template>
