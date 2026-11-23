<script setup lang="ts">
import SuperTags from '@/components/SuperTags/index.vue';

const tags = Array.from({ length: 20 }, (_, index) =>
  index === 0
    ? '较长标签会在浮层内换行，更多标签可通过内部滚动查看。'
    : `标签 ${index + 1}`,
);
</script>

<template>
  <SuperTags
    :tags="tags"
    :limit="0"
    :popover="{
      placement: 'bottom-start',
      popperStyle: {
        '--wt-popover-max-width': 'min(320px, calc(100vw - 24px))',
        '--wt-tags-popover-max-height': '160px',
        '--wt-tags-gap': '8px',
      },
    }"
  />
</template>
