<script setup lang="ts">
import { Loader } from '@lucide/vue';

defineOptions({ dynamicIcon: true });
defineProps<{ active?: boolean }>();
</script>

<template>
  <component :is="Loader" class="super-icon-running" :class="{ active }" />
</template>

<style scoped>
.super-icon-running {
  transform: rotate(0deg);
  transform-origin: center;
}

.super-icon-running.active {
  animation: super-icon-running-spin var(--wt-icon-loading-duration, 1.2s)
    linear infinite;
}

@keyframes super-icon-running-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
