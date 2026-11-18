<script setup lang="ts">
import SuperButton from '@/components/SuperButton/index.vue';
import SuperThemeSwitcher from '@/components/SuperThemeSwitcher/index.vue';
import FormThemeFields from './FormThemeFields.vue';
import FormThemeContexts from './FormThemeContexts.vue';

const background = ref('theme');
const override = ref(false);
const backgrounds: Record<string, string> = {
  theme: 'var(--wt-surface-page)',
  light: '#fff',
  dark: '#1c2434',
  gradient: 'linear-gradient(120deg, #f8fafc, #bfdbfe 45%, #334155)',
};
</script>

<template>
  <div class="form-theme-demo" data-demo="form-theme">
    <SuperThemeSwitcher variant="inline" />
    <div class="form-theme-demo__toolbar">
      <label
        >控件背景
        <select v-model="background" aria-label="控件背景">
          <option value="theme">主题背景</option>
          <option value="light">浅色背景</option>
          <option value="dark">深色背景</option>
          <option value="gradient">渐变背景</option>
        </select>
      </label>
      <SuperButton @click="override = !override">{{
        override ? '恢复默认配色' : '验证变量覆盖'
      }}</SuperButton>
    </div>
    <div
      class="form-theme-demo__preview"
      :style="{
        background: backgrounds[background],
        '--wt-form-control-border-color': override ? '#7c3aed' : undefined,
        '--wt-form-control-active-bg': override ? '#7c3aed' : undefined,
        '--wt-form-control-active-border-color': override
          ? '#7c3aed'
          : undefined,
        '--wt-form-switch-bg': override ? '#7c3aed' : undefined,
        '--wt-form-control-disabled-border-color': override
          ? '#7c3aed'
          : undefined,
        '--wt-form-control-disabled-bg': override ? '#ede9fe' : undefined,
      }"
    >
      <FormThemeFields />
      <FormThemeContexts />
    </div>
  </div>
</template>

<style scoped>
.form-theme-demo {
  display: grid;
  gap: 16px;
}
.form-theme-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.form-theme-demo__toolbar select {
  border: 1px solid var(--wt-text-secondary);
  padding: 4px;
  border-radius: 4px;
}
.form-theme-demo__preview {
  min-width: 0;
  padding: 20px;
  border-radius: 8px;
}
</style>
