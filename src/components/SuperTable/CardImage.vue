<script setup lang="ts">
import { useCardImage } from './useCardImage.ts';
const props = withDefaults(
  defineProps<{
    src?: string | null;
    fit?: 'cover' | 'contain';
    alt: string;
  }>(),
  { src: undefined, fit: 'cover' },
);
const slots = useSlots();
const image = ref<HTMLImageElement>();
const { phase, skeleton, loaded, failed } = useCardImage(
  toRef(props, 'src'),
  image,
);
</script>

<template>
  <div
    class="super-table-card__image"
    :aria-busy="!slots.default && phase === 'loading'"
  >
    <slot>
      <img
        v-if="src && phase !== 'error'"
        :key="src"
        ref="image"
        :src="src"
        :alt="alt"
        loading="lazy"
        :class="{ 'is-ready': phase === 'ready' }"
        :style="{ objectFit: fit }"
        @load="loaded"
        @error="failed"
      />
      <div v-else class="super-table-card__image-placeholder">
        <slot name="fallback" :src="src">
          <svg viewBox="0 0 120 80" width="96" height="64" aria-hidden="true">
            <rect
              x="2"
              y="2"
              width="116"
              height="76"
              rx="10"
              fill="currentColor"
              opacity=".08"
            />
            <circle cx="85" cy="25" r="9" fill="currentColor" opacity=".3" />
            <path
              d="m12 65 28-31 22 22 14-14 32 23Z"
              fill="currentColor"
              opacity=".25"
            />
          </svg>
          <span>暂无图片</span>
        </slot>
      </div>
      <div
        v-if="skeleton"
        class="super-table-card__image-skeleton"
        aria-hidden="true"
      />
    </slot>
    <div class="super-table-card__image-controls"><slot name="controls" /></div>
    <slot name="actions" />
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/typography' as typography;
.super-table-card__image {
  position: relative;
  flex: none;
  aspect-ratio: var(--wt-table-card-image-ratio, 16 / 9);
  border-radius: inherit;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  overflow: hidden;
  background: var(--wt-surface-raised);
}
img,
.super-table-card__image-placeholder {
  @include typography.text(caption);
  width: 100%;
  height: 100%;
}
img {
  position: absolute;
  inset: 0;
  display: block;
  opacity: 0;
  transform: scale(1);
  transition:
    opacity 160ms ease-out,
    transform 240ms ease-out;
  &.is-ready {
    opacity: 1;
  }
}
@media (hover: hover) {
  .super-table-card:not(.is-blocked):hover img.is-ready {
    transform: scale(1.04);
  }
}
.super-table-card:not(.is-blocked):focus-within img.is-ready {
  transform: scale(1.04);
}
.super-table-card__image-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: linear-gradient(
    135deg,
    var(--wt-surface-raised),
    var(--wt-surface-base)
  );
}
.super-table-card__image-skeleton {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
      100deg,
      transparent 20%,
      color-mix(in srgb, var(--wt-text-secondary) 9%, transparent) 45%,
      transparent 70%
    )
    var(--wt-surface-raised);
  background-size: 220% 100%;
  animation: card-image-skeleton 1.4s ease-in-out infinite;
}
@keyframes card-image-skeleton {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -100% 0;
  }
}
.super-table-card__image-controls {
  position: absolute;
  inset: 12px 12px auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  pointer-events: none;
}
.super-table-card__image-controls :deep(> *) {
  pointer-events: auto;
}
@media (prefers-reduced-motion: reduce) {
  img {
    transition: none;
    transform: none !important;
  }
  .super-table-card__image-skeleton {
    animation: none;
  }
}
</style>
