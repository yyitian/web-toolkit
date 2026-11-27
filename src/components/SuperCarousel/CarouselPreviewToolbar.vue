<script setup lang="ts">
import { ZoomOut, ZoomIn, Scan, RotateCcw, RotateCw } from '@lucide/vue';
import SuperButton from '../SuperButton/index.vue';
import CarouselCheckbox from './CarouselCheckbox.vue';
import type { SuperCarouselToolbarScope } from './types.ts';
defineProps<{
  scope: SuperCarouselToolbarScope;
  selectable?: boolean;
  checked?: boolean;
  disabled?: boolean;
}>();
const emit = defineEmits<{ select: [checked: boolean] }>();
</script>
<template>
  <div
    class="super-carousel__preview-toolbar"
    @pointerdown.stop
    @click.stop
    @keydown.space.stop
  >
    <div class="super-carousel__preview-tools">
      <slot v-bind="scope">
        <SuperButton
          :icon="ZoomOut"
          label="缩小"
          @click="scope.actions('zoomOut')"
        />
        <SuperButton
          :icon="ZoomIn"
          label="放大"
          @click="scope.actions('zoomIn')"
        />
        <SuperButton :icon="Scan" label="切换显示比例" @click="scope.reset" />
        <SuperButton
          :icon="RotateCcw"
          label="向左旋转"
          @click="scope.actions('anticlockwise')"
        />
        <SuperButton
          :icon="RotateCw"
          label="向右旋转"
          @click="scope.actions('clockwise')"
        />
      </slot>
    </div>
    <template v-if="selectable">
      <span class="super-carousel__preview-divider" aria-hidden="true" />
      <CarouselCheckbox
        :checked="Boolean(checked)"
        :disabled="disabled"
        label="勾选当前项"
        @change="emit('select', $event)"
      />
    </template>
  </div>
</template>
<style lang="scss">
.super-carousel__preview-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  .super-button {
    --wt-button-color: #fff;
    --wt-button-hover-color: #fff;
    --wt-button-active-color: #fff;
    flex: none;
  }
  .super-carousel__checkbox {
    --_wt-choice-border: rgba(255, 255, 255, 0.8);
    justify-content: center;
    flex: none;
    min-width: 24px;
    height: 24px;
  }
}
.super-carousel__preview-tools {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}
.super-carousel__preview-divider {
  flex: none;
  width: 1px;
  height: 16px;
  background: currentColor;
  opacity: 0.35;
}

// 原生操作栏以正文色填充背景，暗色主题下需改用面板色以承载白色图标。
:where(:root[data-wt-scheme='dark'])
  .el-image-viewer__actions:has(.super-carousel__preview-toolbar) {
  border: 1px solid var(--wt-border-color-strong);
  background: var(--wt-surface-overlay);
  backdrop-filter: var(--wt-backdrop-filter);
}
</style>
