<script setup lang="ts">
import { RefreshCw } from '@lucide/vue';

defineOptions({ dynamicIcon: true });
const props = defineProps<{ active?: boolean }>();
// Lucide 是函数式组件，模板 ref 指向其根 SVG 元素。
const icon = useTemplateRef<SVGSVGElement>('icon');
let animation: Animation | undefined;

function updateAnimation() {
  const element = icon.value;
  if (!element) return;

  // 先读取当前角度，再取消动画，保证停止和快速切换时都连续衔接。
  const angle =
    (Number.parseFloat(getComputedStyle(element).rotate) || 0) % 360;
  animation?.cancel();
  if (!props.active && angle === 0) return;

  // 取消时顺时针补完当前圈，并按剩余角度计算时长，保持每秒一圈的速度。
  animation = element.animate(
    [
      { rotate: `${angle}deg` },
      { rotate: `${props.active ? angle + 360 : 360}deg` },
    ],
    {
      duration: props.active ? 1000 : ((360 - angle) / 360) * 1000,
      iterations: props.active ? Infinity : 1,
      easing: 'linear',
    },
  );
}

onMounted(updateAnimation);
watch(() => props.active, updateAnimation, { flush: 'post' });
onBeforeUnmount(() => animation?.cancel());
</script>

<template>
  <component :is="RefreshCw" ref="icon" class="super-icon-refresh" />
</template>

<style scoped>
.super-icon-refresh {
  rotate: 0deg;
  transform-origin: center;
}
</style>
