<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperForm from '@/components/SuperForm/index.vue';
import type { SuperFormColumn } from '@/components/SuperForm/types.ts';
import SuperThemeSwitcher from '@/components/SuperThemeSwitcher/index.vue';
import FormThemeFields from './FormThemeFields.vue';
import FormThemeContexts from './FormThemeContexts.vue';

const background = ref('theme');
const override = ref(false);
const backgrounds: Record<string, string> = {
  theme: 'transparent',
  light: '#fff',
  dark: '#1c2434',
  gradient: 'linear-gradient(120deg, #f8fafc, #bfdbfe 45%, #334155)',
};
const settings: SuperFormColumn[] = [
  {
    prop: 'background',
    label: '对照背景',
    formType: 'select',
    defaultValue: 'theme',
    props: {
      options: [
        { label: '跟随主题', value: 'theme' },
        { label: '浅色对照', value: 'light' },
        { label: '深色对照', value: 'dark' },
        { label: '渐变对照', value: 'gradient' },
      ],
    },
    change: (_, value) => {
      background.value = String(value);
    },
  },
  {
    prop: 'override',
    label: '自定义控件颜色',
    formType: 'switch',
    change: (_, value) => {
      override.value = value === true;
    },
  },
];
</script>

<template>
  <DemoLayout class="form-theme-demo" data-demo="form-theme">
    <template #controls>
      <SuperThemeSwitcher variant="inline" />
      <SuperForm :columns="settings" inline label-position="top" />
      <span class="wt-text-caption"
        >对照背景用于观察玻璃材质，默认跟随主题。</span
      >
    </template>
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
  </DemoLayout>
</template>

<style scoped>
.form-theme-demo {
  display: grid;
  gap: 16px;
}
.form-theme-demo__preview {
  min-width: 0;
  padding: 20px;
  border-radius: 8px;
}
</style>
