<script setup lang="ts">
import { AudioLines } from '@lucide/vue';

defineOptions({ dynamicIcon: true });
// 只声明 active，避免它透传到 svg；size 等其余 attrs 默认透传到根组件 AudioLines
defineProps<{ active?: boolean }>();
</script>

<template>
  <component :is="AudioLines" :class="{ active }" />
</template>

<style scoped lang="scss">
svg.active :deep(path) {
  transform-box: fill-box;
  transform-origin: center;

  &:nth-of-type(1),
  &:nth-of-type(6) {
    animation: super-icon-audio-lines-wave 0.78s ease-in-out infinite;
  }

  &:nth-of-type(2),
  &:nth-of-type(5) {
    animation: super-icon-audio-lines-wave 0.78s ease-in-out 0.14s infinite;
  }

  &:nth-of-type(3),
  &:nth-of-type(4) {
    animation: super-icon-audio-lines-wave 0.78s ease-in-out 0.28s infinite;
  }
}

@keyframes super-icon-audio-lines-wave {

  0%,
  100% {
    transform: scaleY(0.58);
    opacity: 0.45;
  }

  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>
