<script setup lang="ts">
import { Pin } from '@lucide/vue';

defineOptions({ dynamicIcon: true });
// 只声明 active(声明后被吃掉、不漏到 svg);size 等其余 attrs 默认透传到根组件 Pin
defineProps<{ active?: boolean }>();
</script>

<template>
  <component :is="Pin">
    <Transition name="super-icon-pin">
      <path
        v-if="active"
        class="super-icon-active-path"
        d="M4.5 4.5 L19.5 19.5"
        stroke-width="2"
        stroke-linecap="round"
        stroke-dasharray="22"
      />
    </Transition>
  </component>
</template>

<style scoped>
.super-icon-pin-enter-active {
  animation: super-icon-pin-draw 0.4s ease forwards;
}

.super-icon-pin-leave-active {
  animation: super-icon-pin-erase 0.4s ease forwards;
}

@keyframes super-icon-pin-draw {
  from {
    stroke-dashoffset: 22;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes super-icon-pin-erase {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -22;
  }
}
</style>
