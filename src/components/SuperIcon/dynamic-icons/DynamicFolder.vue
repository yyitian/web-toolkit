<script setup lang="ts">
import { createLucideIcon } from '@lucide/vue';

defineOptions({ dynamicIcon: true });
defineProps<{ active?: boolean }>();
const FolderIcon = createLucideIcon('folder', []);
</script>

<template>
  <component :is="FolderIcon" class="super-icon-folder" :class="{ active }">
    <!-- 沿用 Lucide FolderOpen / FolderClosed 路径，共用根 SVG 和尺寸。 -->
    <Transition name="super-icon-folder">
      <g v-if="active" key="open" data-state="open">
        <path
          d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"
        />
      </g>
      <g v-else key="closed" data-state="closed">
        <path
          d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        />
        <path d="M2 10h20" />
      </g>
    </Transition>
  </component>
</template>

<style scoped>
.super-icon-folder-enter-active,
.super-icon-folder-leave-active {
  transition: opacity 0.18s ease;
}

.super-icon-folder-enter-from,
.super-icon-folder-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .super-icon-folder-enter-active,
  .super-icon-folder-leave-active {
    transition: none;
  }
}
</style>
