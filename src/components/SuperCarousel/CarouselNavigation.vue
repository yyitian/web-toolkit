<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
} from '@lucide/vue';
import SuperButton from '../SuperButton/index.vue';
import type {
  SuperCarouselNavigationScope,
  SuperCarouselProps,
} from './types.ts';
defineProps<{
  scope: SuperCarouselNavigationScope;
  config: SuperCarouselProps;
  paused: boolean;
}>();
</script>
<template>
  <div class="super-carousel__navigation">
    <SuperButton
      v-if="config.arrow !== 'never'"
      class="super-carousel__arrow"
      :icon="config.direction === 'vertical' ? ChevronUp : ChevronLeft"
      label="上一项"
      :disabled="!scope.canPrev"
      @click="scope.prev"
    />
    <span
      v-if="config.indicatorPosition !== 'none'"
      class="super-carousel__count"
      aria-live="off"
      >{{ scope.activeIndex + 1 }} / {{ scope.total }}</span
    >
    <SuperButton
      v-if="config.arrow !== 'never'"
      class="super-carousel__arrow"
      :icon="config.direction === 'vertical' ? ChevronDown : ChevronRight"
      label="下一项"
      :disabled="!scope.canNext"
      @click="scope.next"
    />
    <SuperButton
      v-if="config.autoplay"
      :icon="paused ? Play : Pause"
      :label="paused ? '播放' : '暂停'"
      :disabled="config.disabled || scope.total < 2"
      :aria-pressed="!paused"
      @click="scope.togglePlay"
    />
  </div>
</template>
