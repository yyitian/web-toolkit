<script lang="ts">
import type { StyleValue } from 'vue';

type PopoverTrigger = 'hover' | 'click' | 'manual';
type PopoverDelay = number | { open?: number; close?: number };
type TeleportTarget = string | HTMLElement | false;

const DEFAULT_DELAY = { open: 0, close: 120 } as const;
</script>

<script setup lang="ts">
import {
  useFloating,
  autoUpdate,
  offset as useOffset,
  flip as useFlip,
  shift as useShift,
  arrow as useArrow,
} from '@floating-ui/vue';
import type { Placement } from '@floating-ui/vue';
import { placementMap } from './config';

const visible = defineModel({ type: Boolean });
const props = withDefaults(
  defineProps<{
    placement?: Placement;
    offset?: number;
    effect?: 'dark' | 'light';
    title?: string;
    teleportTo?: TeleportTarget;
    trigger?: PopoverTrigger;
    disabled?: boolean;
    arrow?: boolean;
    delay?: PopoverDelay;
    closeOnClickOutside?: boolean;
    popperClass?: unknown;
    popperStyle?: StyleValue;
  }>(),
  {
    placement: 'top',
    title: '',
    offset: 12,
    effect: 'dark',
    teleportTo: 'body',
    trigger: 'hover',
    disabled: false,
    arrow: true,
    delay: () => ({ ...DEFAULT_DELAY }),
    closeOnClickOutside: true,
    popperClass: undefined,
    popperStyle: undefined,
  },
);

const { placement } = toRefs(props);

const reference = ref<HTMLElement | null>(null);
const floating = ref<HTMLElement | null>(null);
const floatingArrow = ref<HTMLElement | null>(null);

const normalizedDelay = computed(() => {
  if (typeof props.delay === 'number') {
    return {
      open: props.delay,
      close: props.delay,
    };
  }

  return {
    open: props.delay.open ?? DEFAULT_DELAY.open,
    close: props.delay.close ?? DEFAULT_DELAY.close,
  };
});

const isOpen = computed(() => Boolean(visible.value) && !props.disabled);

const middleware = computed(() => {
  const middlewares = [useOffset(props.offset), useFlip(), useShift()];

  if (props.arrow) {
    middlewares.push(useArrow({ element: floatingArrow }));
  }

  return middlewares;
});

const {
  floatingStyles,
  middlewareData,
  placement: usePlacement,
} = useFloating(reference, floating, {
  placement,
  middleware,
  strategy: 'fixed',
  // 打开期间滚动/缩放自动重新定位
  whileElementsMounted: autoUpdate,
});

let openTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

function clearOpenTimer() {
  if (openTimer != null) {
    clearTimeout(openTimer);
    openTimer = undefined;
  }
}

function clearCloseTimer() {
  if (closeTimer != null) {
    clearTimeout(closeTimer);
    closeTimer = undefined;
  }
}

function clearTimers() {
  clearOpenTimer();
  clearCloseTimer();
}

function setOpen(nextVisible: boolean) {
  if (props.disabled) {
    visible.value = false;
    return;
  }

  visible.value = nextVisible;
}

function closeImmediately() {
  clearTimers();
  visible.value = false;
}

function scheduleOpen() {
  if (props.trigger !== 'hover' || props.disabled) {
    return;
  }

  clearCloseTimer();
  clearOpenTimer();

  if (normalizedDelay.value.open <= 0) {
    setOpen(true);
    return;
  }

  openTimer = setTimeout(() => {
    if (props.trigger === 'hover') {
      setOpen(true);
    }
  }, normalizedDelay.value.open);
}

function scheduleClose() {
  if (props.trigger !== 'hover') {
    return;
  }

  clearOpenTimer();
  clearCloseTimer();

  if (normalizedDelay.value.close <= 0) {
    setOpen(false);
    return;
  }

  closeTimer = setTimeout(() => {
    if (props.trigger === 'hover') {
      setOpen(false);
    }
  }, normalizedDelay.value.close);
}

function handleReferenceMouseenter() {
  scheduleOpen();
}

function handleReferenceMouseleave() {
  scheduleClose();
}

function handleFloatingMouseenter() {
  if (props.trigger !== 'hover') {
    return;
  }

  clearCloseTimer();
}

function handleFloatingMouseleave() {
  scheduleClose();
}

function handleReferenceClick() {
  if (props.trigger !== 'click' || props.disabled) {
    return;
  }

  setOpen(!isOpen.value);
}

const clickOutsideListenerOptions = true;

const shouldBindClickOutside = computed(() => {
  return (
    isOpen.value &&
    props.closeOnClickOutside &&
    (props.trigger === 'click' || props.trigger === 'manual')
  );
});

function handleDocumentPointerdown(event: PointerEvent) {
  if (!(event.target instanceof Node)) {
    return;
  }

  if (
    reference.value?.contains(event.target) ||
    floating.value?.contains(event.target)
  ) {
    return;
  }

  closeImmediately();
}

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      closeImmediately();
    }
  },
  { immediate: true },
);

watch(visible, (nextVisible) => {
  if (props.disabled && nextVisible) {
    visible.value = false;
  }
});

watch(
  () => props.trigger,
  () => {
    clearTimers();
  },
);

watch(
  shouldBindClickOutside,
  (shouldBind) => {
    if (shouldBind) {
      document.addEventListener(
        'pointerdown',
        handleDocumentPointerdown,
        clickOutsideListenerOptions,
      );
      return;
    }

    document.removeEventListener(
      'pointerdown',
      handleDocumentPointerdown,
      clickOutsideListenerOptions,
    );
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearTimers();
  document.removeEventListener(
    'pointerdown',
    handleDocumentPointerdown,
    clickOutsideListenerOptions,
  );
});

const staticSide = computed(() => {
  return placementMap[usePlacement.value.split('-')[0]];
});

// 箭头(旋转 45° 的方块)朝向 floating 内侧的两条边随 staticSide 变化,
// 隐藏这两条边的边框,只留外侧两边形成三角描边,避免设了可见 border-color 时内侧露接缝
const arrowInnerBorderHidden = computed<Record<string, string>>(() => {
  if (!props.arrow) {
    return {};
  }

  const map: Record<string, Record<string, string>> = {
    bottom: { borderTopWidth: '0', borderLeftWidth: '0' },
    top: { borderBottomWidth: '0', borderRightWidth: '0' },
    left: { borderTopWidth: '0', borderRightWidth: '0' },
    right: { borderBottomWidth: '0', borderLeftWidth: '0' },
  };
  return map[staticSide.value] ?? {};
});

const floatingClass = computed(() => [
  'super-popover-floating',
  { 'super-popover-floating--light': props.effect === 'light' },
  props.popperClass,
]);

const mergedFloatingStyle = computed<StyleValue>(() => [
  floatingStyles.value,
  props.popperStyle,
]);
</script>

<template>
  <div class="super-popover">
    <div
      ref="reference"
      class="super-popover-reference"
      @mouseenter="handleReferenceMouseenter"
      @mouseleave="handleReferenceMouseleave"
      @click="handleReferenceClick"
    >
      <slot><span>hover</span></slot>
    </div>
    <Teleport v-if="teleportTo !== false" :to="teleportTo">
      <div
        v-if="isOpen"
        ref="floating"
        :class="floatingClass"
        :style="mergedFloatingStyle"
        @mouseenter="handleFloatingMouseenter"
        @mouseleave="handleFloatingMouseleave"
      >
        <slot name="content">
          <span>{{ title }}</span>
        </slot>
        <div
          v-if="arrow"
          ref="floatingArrow"
          class="super-popover-arrow"
          :style="{
            left:
              middlewareData.arrow?.x != null
                ? `${middlewareData.arrow.x}px`
                : '',
            top:
              middlewareData.arrow?.y != null
                ? `${middlewareData.arrow.y}px`
                : '',
            [staticSide]: '-4px',
            ...arrowInnerBorderHidden,
          }"
        ></div>
      </div>
    </Teleport>
    <div
      v-else-if="isOpen"
      ref="floating"
      :class="floatingClass"
      :style="mergedFloatingStyle"
      @mouseenter="handleFloatingMouseenter"
      @mouseleave="handleFloatingMouseleave"
    >
      <slot name="content">
        <span>{{ title }}</span>
      </slot>
      <div
        v-if="arrow"
        ref="floatingArrow"
        class="super-popover-arrow"
        :style="{
          left:
            middlewareData.arrow?.x != null
              ? `${middlewareData.arrow.x}px`
              : '',
          top:
            middlewareData.arrow?.y != null
              ? `${middlewareData.arrow.y}px`
              : '',
          [staticSide]: '-4px',
          ...arrowInnerBorderHidden,
        }"
      ></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.super-popover {
  display: contents;
}

.super-popover-reference {
  display: inline-block;
}

:global(:where(.super-popover-floating)) {
  --wt-popover-bg: var(--wt-color-bg-inverse);
  --wt-popover-color: var(--wt-color-text-inverse);
  --wt-popover-border-color: var(--wt-popover-bg);
  --wt-popover-radius: var(--wt-radius);
  --wt-popover-padding: 4px 6px;
  --wt-popover-shadow: none;
  --wt-popover-z-index: 2000;
  --wt-popover-max-width: 400px;
}

.super-popover-floating {
  @include font(12px, $color: var(--wt-popover-color));

  z-index: var(--wt-popover-z-index);
  max-width: var(--wt-popover-max-width);
  background: var(--wt-popover-bg);
  border: 1px solid var(--wt-popover-border-color);
  border-radius: var(--wt-popover-radius);
  padding: var(--wt-popover-padding);
  box-shadow: var(--wt-popover-shadow);
}

:global(:where(.super-popover-floating--light)) {
  --wt-popover-bg: var(--wt-color-bg);
  --wt-popover-color: var(--wt-color-text);
  --wt-popover-shadow: 0 2px 8px rgb(0 0 0 / 12%);
}

.super-popover-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--wt-popover-bg);
  border: 1px solid var(--wt-popover-border-color);
  transform: rotate(45deg);
}
</style>
