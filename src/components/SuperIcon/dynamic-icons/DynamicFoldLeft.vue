<script setup lang="ts">
import { SquareChevronRight } from '@lucide/vue';

defineOptions({ dynamicIcon: true });
defineProps<{ active?: boolean }>();
</script>

<template>
  <component
    :is="SquareChevronRight"
    class="super-icon-fold-left"
    :class="{ active }"
  />
</template>

<style scoped>
.super-icon-fold-left :deep(path) {
  transform-box: view-box;
  transform-origin: center;
  transform: rotate(0deg);
  transition: transform 0.2s ease;
}

.super-icon-fold-left.active :deep(path) {
  transform: rotate(180deg);
}
</style>
