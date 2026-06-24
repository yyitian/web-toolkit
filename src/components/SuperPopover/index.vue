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
  }>(),
  {
    placement: 'top',
    title: '',
    offset: 12,
    effect: 'dark',
  },
);

const { placement } = toRefs(props);

const reference = ref(null);
const floating = ref(null);
const floatingArrow = ref(null);

const middleware = computed(() => [
  useOffset(props.offset),
  useFlip(),
  useShift(),
  useArrow({ element: floatingArrow }),
]);

const {
  floatingStyles,
  middlewareData,
  placement: usePlacement,
} = useFloating(reference, floating, {
  placement,
  middleware,
  // fixed 让浮层相对视口定位,逃出多数 overflow:hidden 祖先的裁剪;
  // 不用 <Teleport>,以保留浮层作为根节点 DOM 后代、继承 --wt-popover-* 变量的能力
  strategy: 'fixed',
  // 打开期间滚动/缩放自动重新定位
  whileElementsMounted: autoUpdate,
});

// open/close 延迟:关闭留 120ms,使鼠标可从 reference 移入浮层(含 #content 可交互内容)而不闪烁
let closeTimer: ReturnType<typeof setTimeout> | undefined;
function open() {
  clearTimeout(closeTimer);
  visible.value = true;
}
function scheduleClose() {
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    visible.value = false;
  }, 120);
}
onBeforeUnmount(() => clearTimeout(closeTimer));

const staticSide = computed(() => {
  return placementMap[usePlacement.value.split('-')[0]];
});

// 箭头(旋转 45° 的方块)朝向 floating 内侧的两条边随 staticSide 变化,
// 隐藏这两条边的边框,只留外侧两边形成三角描边,避免设了可见 border-color 时内侧露接缝
const arrowInnerBorderHidden = computed<Record<string, string>>(() => {
  const map: Record<string, Record<string, string>> = {
    bottom: { borderTopWidth: '0', borderLeftWidth: '0' },
    top: { borderBottomWidth: '0', borderRightWidth: '0' },
    left: { borderTopWidth: '0', borderRightWidth: '0' },
    right: { borderBottomWidth: '0', borderLeftWidth: '0' },
  };
  return map[staticSide.value] ?? {};
});
</script>

<template>
  <div
    class="super-popover"
    :class="{ 'super-popover--light': effect === 'light' }"
  >
    <div ref="reference" @mouseenter="open" @mouseleave="scheduleClose">
      <slot><span>hover</span></slot>
    </div>
    <div
      v-if="visible"
      ref="floating"
      :style="floatingStyles"
      class="super-popover-floating"
      @mouseenter="open"
      @mouseleave="scheduleClose"
    >
      <slot name="content">
        <span>{{ title }}</span>
      </slot>
      <div
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
// 单根:display:contents 不生成盒子、保持原 sibling 布局,仅用于承载变量与消费方 class 透传
.super-popover {
  display: contents;
}

// 预设变量挂根节点。:global(:where()) 让权重归零(:where 防 scoped [data-v-x] 抬权重,
// :global 防作用域属性外挂),消费方任意一个 class 叠到根节点即可一次性覆盖全部变量。
:global(:where(.super-popover)) {
  --wt-popover-bg: var(--wt-color-bg-inverse);
  --wt-popover-color: var(--wt-color-text-inverse);
  // 默认与背景同色 → 边框隐形;二次开发直接设此变量即可显形
  --wt-popover-border-color: var(--wt-popover-bg);
  --wt-popover-radius: var(--wt-radius);
  --wt-popover-padding: 4px 6px;
  --wt-popover-shadow: none;
}

:global(:where(.super-popover--light)) {
  --wt-popover-bg: var(--wt-color-bg);
  --wt-popover-color: var(--wt-color-text);
  --wt-popover-shadow: 0 2px 8px rgb(0 0 0 / 12%);
}

.super-popover-floating {
  @include font(12px, $color: var(--wt-popover-color));
  background: var(--wt-popover-bg);
  border: 1px solid var(--wt-popover-border-color);
  border-radius: var(--wt-popover-radius);
  padding: var(--wt-popover-padding);
  box-shadow: var(--wt-popover-shadow);
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
