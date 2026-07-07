<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue';

defineOptions({ dynamicIcon: true });
// 只声明 active，避免它透传到 svg；size 等其余 attrs 默认透传到根组件 ChevronLeft
defineProps<{ active?: boolean }>();
</script>

<template>
  <component :is="ChevronLeft" class="super-icon-chevron-left" :class="{ active }" />
</template>

<style scoped>
.super-icon-chevron-left {
  transition: transform 0.2s ease;
  transform-origin: center;
}

.super-icon-chevron-left.active {
  transform: rotate(-90deg);
}
</style>
