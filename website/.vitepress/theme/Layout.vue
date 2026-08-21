<script setup lang="ts">
import { useData } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import SuperThemeSwitcher from '../../../src/components/SuperThemeSwitcher/index.vue';
import { useWtTheme } from '../../../src/theme/index.ts';

defineOptions({ name: 'WtVitePressLayout' });

const { isDark } = useData();
const { scheme } = useWtTheme();

watch(
  scheme,
  (value) => {
    const nextIsDark = value === 'dark';
    isDark.value = nextIsDark;
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', nextIsDark);
    }
  },
  { immediate: true, flush: 'sync' },
);
</script>

<template>
  <DefaultTheme.Layout>
    <template #nav-bar-content-after>
      <div class="wt-vp-theme-switcher wt-vp-theme-switcher--nav">
        <SuperThemeSwitcher />
      </div>
    </template>

    <template #nav-screen-content-after>
      <div class="wt-vp-theme-switcher wt-vp-theme-switcher--screen">
        <SuperThemeSwitcher variant="inline" />
      </div>
    </template>
  </DefaultTheme.Layout>
</template>
