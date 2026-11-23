<script setup lang="ts">
defineProps<{ loading: boolean; visible: boolean }>();
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
        <span class="super-table__loading-label">加载中…</span>
        <div class="super-table__loading-progress" aria-hidden="true" />
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
  overflow: hidden;
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
.super-table__loading-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.super-table__loading-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  width: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    currentColor 45%,
    transparent 75%
  );
  background-size: 200% 100%;
  animation: table-progress 1.2s linear infinite;
}
@keyframes table-progress {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -100% 0;
  }
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
  .super-table__loading-progress {
    animation: none;
    background: currentColor;
  }
}
</style>
