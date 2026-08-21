<script setup lang="ts">
import SuperButton from '@/components/SuperButton/index.vue';
import SuperThemeSwitcher from '@/components/SuperThemeSwitcher/index.vue';
import { useWtTheme } from '@/theme/index.ts';

const { theme, setTheme } = useWtTheme();
</script>

<template>
  <div class="theme-demo">
    <SuperThemeSwitcher variant="inline" />
    <div class="demo-row">
      <SuperButton @click="setTheme('light', 'solid')">浅色实体</SuperButton>
      <SuperButton @click="setTheme('dark', 'glass')">暗色毛玻璃</SuperButton>
      <span>当前：{{ theme }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.theme-demo {
  @include flex-column(16px);
}
</style>
