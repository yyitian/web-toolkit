<script setup lang="ts">
import SuperIcon from '../SuperIcon/index.vue';
import { useTableLoading } from './useTableLoading.ts';

const props = defineProps<{ loading: boolean }>();
const visible = useTableLoading(toRef(props, 'loading'));
</script>

<template>
  <div class="super-table__loading" :class="{ 'is-blocking': loading }">
    <Transition name="table-loading">
      <div
        v-if="visible"
        class="super-table__loading-mask"
        role="status"
        aria-live="polite"
      >
        <div class="super-table__loading-indicator">
          <SuperIcon loading :size="28" aria-hidden="true" />
          <span>加载中…</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.super-table__loading {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  &.is-blocking {
    pointer-events: auto;
    cursor: progress;
  }
}
.super-table__loading-mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--wt-table-loading-color, var(--wt-color-primary));
  background: var(
    --wt-table-loading-bg,
    color-mix(
      in srgb,
      var(--wt-table-bg, var(--wt-surface-base)) 28%,
      transparent
    )
  );
}
.super-table__loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: var(--wt-radius-large);
  background: var(--wt-surface-overlay);
  box-shadow: var(--wt-shadow-base);
  backdrop-filter: var(--wt-backdrop-filter, none);
  font-size: 12px;
  line-height: 1.5;
}
.table-loading-enter-active,
.table-loading-leave-active {
  transition: opacity 120ms ease;
}
.table-loading-enter-from,
.table-loading-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .table-loading-enter-active,
  .table-loading-leave-active {
    transition: none;
  }
  .super-table__loading-indicator :deep(.super-icon.loading) {
    animation: none;
  }
}
</style>
