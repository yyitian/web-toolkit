<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperForm from '@/components/SuperForm/index.vue';
import type { SuperFormColumn } from '@/components/SuperForm/types.ts';
import SuperThemeSwitcher from '@/components/SuperThemeSwitcher/index.vue';
import TypographyComponentsDemo from './TypographyComponentsDemo.vue';

const override = ref(false);
const instanceOverride = ref(false);
const background = ref('theme');
const backgrounds: Record<string, string> = {
  theme: 'transparent',
  light: '#ffffff',
  dark: '#1c2434',
  gradient: 'linear-gradient(120deg, #f8fafc, #bfdbfe 45%, #334155)',
};
const semanticStyle = computed(
  (): Record<string, string> =>
    override.value
      ? {
          '--wt-text-title': '#7c3aed',
          '--wt-text-regular': '#7c3aed',
          '--wt-text-secondary': '#7c3aed',
          '--wt-font-size-title': '18px',
          '--wt-line-height-title': '26px',
          '--wt-font-size-body': '15px',
          '--wt-line-height-body': '24px',
          '--wt-font-size-caption': '13px',
          '--wt-line-height-caption': '22px',
          '--wt-font-weight-regular': '500',
          '--wt-font-weight-semibold': '650',
          '--wt-font-weight-bold': '800',
        }
      : {},
);
const roles = [
  { role: 'title', label: '标题 Title', spec: '16 / 24px · 700' },
  { role: 'label', label: '字段标签 Label', spec: '14 / 22px · 700' },
  { role: 'emphasis', label: '重点文字 Emphasis', spec: '14 / 22px · 600' },
  {
    role: 'body',
    label: '正文 Body：让信息清晰易读。',
    spec: '14 / 22px · 400',
  },
  {
    role: 'caption',
    label: '说明与元信息 Caption · 更新于 2026-11-20',
    spec: '12 / 20px · 400',
  },
];
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
    prop: 'semantic',
    label: '自定义语义样式',
    formType: 'switch',
    change: (_, value) => {
      override.value = value === true;
    },
  },
  {
    prop: 'instance',
    label: '自定义组件颜色',
    formType: 'switch',
    change: (_, value) => {
      instanceOverride.value = value === true;
    },
  },
];
</script>

<template>
  <DemoLayout class="typography-demo" data-demo="typography">
    <template #controls>
      <SuperThemeSwitcher variant="inline" />
      <SuperForm :columns="settings" inline label-position="top" />
      <span class="wt-text-caption"
        >默认跟随主题；对照背景仅用于比较文字效果。</span
      >
    </template>
    <div
      class="typography-demo__backdrop"
      :style="{ background: backgrounds[background] }"
    >
      <div class="typography-demo__surface" :style="semanticStyle">
        <div class="typography-demo__specimens">
          <div
            v-for="item in roles"
            :key="item.role"
            class="typography-demo__specimen"
          >
            <span :class="`wt-text-${item.role}`" :data-role="item.role">{{
              item.label
            }}</span>
            <span class="wt-text-caption">{{ item.spec }}</span>
          </div>
          <div class="wt-text-body typography-demo__states">
            <span class="wt-text-placeholder">占位文字 Placeholder</span>
            <span class="wt-text-disabled">禁用文字 Disabled</span>
            <span class="wt-text-inverse typography-demo__inverse"
              >反色文字 Inverse</span
            >
          </div>
        </div>
        <TypographyComponentsDemo
          :semantic-style="semanticStyle"
          :instance-override="instanceOverride"
        />
      </div>
    </div>
  </DemoLayout>
</template>

<style scoped>
.typography-demo {
  display: grid;
  gap: 16px;
}
.typography-demo__backdrop {
  min-width: 0;
  padding: 16px;
  border-radius: 8px;
}
.typography-demo__surface {
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--wt-border-color-light);
  border-radius: 8px;
  background: var(--wt-surface-base);
  backdrop-filter: var(--wt-backdrop-filter, none);
}
.typography-demo__specimens {
  display: grid;
  gap: 12px;
  margin-bottom: 24px;
}
.typography-demo__specimen {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 12px;
}
.typography-demo__inverse {
  padding: 2px 6px;
  background: #141b2b;
  border-radius: 4px;
}
</style>
