<script setup lang="ts">
import { formatLabel } from '../SuperForm/config.ts';
import DynamicRunning from '../SuperIcon/dynamic-icons/DynamicRunning.vue';
import { resolveStatus } from './config.ts';
import type { SuperStatusProps } from './types.ts';

const props = defineProps<SuperStatusProps>();
const status = computed(() => resolveStatus(props));
</script>

<template>
  <span
    class="super-status"
    :title="String(formatLabel(status.label))"
    :style="{
      '--_status-color': status.color ?? `var(--wt-color-${status.type})`,
    }"
  >
    <DynamicRunning
      v-if="value === 'pending'"
      class="super-status__icon"
      size="1em"
      active
      aria-hidden="true"
    />
    <span v-else class="super-status__dot" aria-hidden="true" />
    <span class="super-status__label">{{ formatLabel(status.label) }}</span>
  </span>
</template>

<style scoped lang="scss">
@use '../../styles/typography' as typography;
.super-status {
  @include typography.text(
    caption,
    var(--wt-status-text-color, var(--wt-text-regular))
  );
  display: inline-flex;
  align-items: center;
  gap: var(--wt-status-gap, 6px);
  min-width: 0;
}
.super-status__dot {
  flex: none;
  width: var(--wt-status-dot-size, 6px);
  height: var(--wt-status-dot-size, 6px);
  border-radius: 50%;
  background: var(--wt-status-color, var(--_status-color));
}
.super-status__icon {
  flex: none;
  color: var(--wt-status-color, var(--_status-color));
}
@media (prefers-reduced-motion: reduce) {
  .super-status .super-status__icon.active {
    animation: none;
  }
}
.super-status__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
