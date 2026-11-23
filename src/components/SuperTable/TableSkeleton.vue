<script setup lang="ts">
withDefaults(
  defineProps<{
    view?: 'table' | 'card';
    columns?: { key: string; width: number; type?: string }[];
    count?: number;
  }>(),
  { view: 'table', columns: () => [], count: 10 },
);
</script>

<template>
  <div class="super-table-skeleton" :class="`is-${view}`" aria-hidden="true">
    <template v-if="view === 'table'">
      <div v-for="row in count" :key="row" class="super-table-skeleton__row">
        <div
          v-for="column in columns"
          :key="column.key"
          class="super-table-skeleton__cell"
          :style="{ width: `${column.width}px` }"
        >
          <span
            class="super-table-skeleton__bar"
            :class="{
              'is-square': ['selection', 'index', 'expand'].includes(
                column.type ?? '',
              ),
            }"
            :style="{
              width: ['selection', 'index', 'expand'].includes(
                column.type ?? '',
              )
                ? '16px'
                : `${60 + (row % 3) * 10}%`,
            }"
          />
        </div>
      </div>
    </template>
    <div
      v-for="index in view === 'card' ? count : 0"
      :key="index"
      class="super-table-skeleton__card"
    >
      <div class="super-table-skeleton__picture super-table-skeleton__bar" />
      <div class="super-table-skeleton__info">
        <span class="super-table-skeleton__bar is-title" />
        <span class="super-table-skeleton__bar" />
        <span class="super-table-skeleton__bar is-caption" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.super-table-skeleton {
  width: 100%;
  pointer-events: none;
}
.super-table-skeleton.is-card {
  display: contents;
}
.super-table-skeleton__row {
  display: flex;
  width: max-content;
  min-width: 100%;
  height: var(--wt-table-skeleton-row-height, 40px);
  border-bottom: 1px solid
    var(--wt-table-border-color, var(--wt-border-color-light));
  box-sizing: border-box;
}
.super-table-skeleton__cell {
  display: flex;
  align-items: center;
  flex: none;
  box-sizing: border-box;
  padding: 0 12px;
  min-width: 0;
}
.super-table-skeleton__bar {
  display: block;
  border-radius: var(--wt-radius-base, 4px);
  height: 12px;
  width: 90%;
  background: linear-gradient(
      100deg,
      transparent 20%,
      color-mix(in srgb, var(--wt-text-secondary) 10%, transparent) 45%,
      transparent 70%
    )
    color-mix(in srgb, var(--wt-text-secondary) 10%, transparent);
  background-size: 220% 100%;
  animation: table-skeleton 1.4s ease-in-out infinite;
}
.super-table-skeleton__bar.is-square {
  height: 16px;
}
.super-table-skeleton__card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid
    var(--wt-table-card-border-color, var(--wt-border-color-light));
  border-radius: var(--wt-table-card-radius, var(--wt-radius-large));
  background: var(--wt-table-card-bg, var(--wt-surface-base));
}
.super-table-skeleton__picture {
  width: 100%;
  height: auto;
  aspect-ratio: var(--wt-table-card-image-ratio, 16 / 9);
  border-radius: 0;
}
.super-table-skeleton__info {
  display: grid;
  gap: var(--wt-table-card-content-gap, 8px);
  padding: var(--wt-table-card-padding, 12px);
}
.super-table-skeleton__bar.is-title {
  height: 20px;
  width: 70%;
}
.super-table-skeleton__bar.is-caption {
  width: 45%;
}
@keyframes table-skeleton {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -100% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .super-table-skeleton__bar {
    animation: none;
  }
}
</style>
