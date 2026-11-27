<script setup lang="ts">
const colors = [
  { name: 'primary', label: '主色' },
  { name: 'success', label: '成功' },
  { name: 'warning', label: '警告' },
  { name: 'danger', label: '危险' },
  { name: 'info', label: '信息' },
];
const surfaces = [
  { name: 'base', label: '基础背景' },
  { name: 'raised', label: '抬高背景' },
  { name: 'overlay', label: '浮层背景' },
];
const textRoles = [
  { name: 'title', label: '任务设置' },
  { name: 'label', label: '字段标签' },
  { name: 'emphasis', label: '重点信息' },
  { name: 'body', label: '正文内容保持清晰易读。' },
  { name: 'caption', label: '说明、时间与数量使用辅助文字。' },
];
const textStates = [
  { name: 'placeholder', label: '占位文字' },
  { name: 'disabled', label: '禁用文字' },
  { name: 'inverse', label: '反色文字' },
];
</script>

<template>
  <section
    class="theme-effects"
    data-demo="theme-effects"
    aria-label="公共样式主题效果"
  >
    <div class="theme-effects__colors">
      <div
        v-for="color in colors"
        :key="color.name"
        class="theme-effects__color"
      >
        <span
          class="theme-effects__swatch"
          :style="{ background: `var(--wt-color-${color.name})` }"
        />
        <span class="wt-text-body">{{ color.label }}</span>
        <span class="wt-text-caption">{{ color.name }}</span>
      </div>
    </div>
    <div class="theme-effects__surfaces">
      <article
        v-for="surface in surfaces"
        :key="surface.name"
        class="theme-effects__surface"
        :data-surface="surface.name"
        :style="{ background: `var(--wt-surface-${surface.name})` }"
      >
        <span class="wt-text-label">{{ surface.label }}</span>
        <span class="wt-text-body">边框、阴影与材质随主题切换。</span>
      </article>
    </div>
    <div class="theme-effects__text">
      <span
        v-for="role in textRoles"
        :key="role.name"
        :class="`wt-text-${role.name}`"
        >{{ role.label }}</span
      >
      <div class="theme-effects__states wt-text-body">
        <span
          v-for="state in textStates"
          :key="state.name"
          :class="[
            `wt-text-${state.name}`,
            { 'theme-effects__inverse': state.name === 'inverse' },
          ]"
          >{{ state.label }}</span
        >
      </div>
    </div>
  </section>
</template>

<style scoped>
.theme-effects {
  display: grid;
  gap: 20px;
  min-width: 0;
}
.theme-effects__colors {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
}
.theme-effects__color {
  display: grid;
  justify-items: start;
  gap: 4px;
}
.theme-effects__swatch {
  width: 100%;
  height: 28px;
  border-radius: var(--wt-radius-base);
}
.theme-effects__surfaces {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
  gap: 12px;
}
.theme-effects__surface {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--wt-border-color);
  border-radius: var(--wt-radius-large);
  box-shadow: var(--wt-shadow-base);
  backdrop-filter: var(--wt-backdrop-filter);
}
.theme-effects__text {
  display: grid;
  gap: 8px;
}
.theme-effects__states {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.theme-effects__inverse {
  padding: 0 6px;
  border-radius: var(--wt-radius-base);
  background: #141b2b;
}
</style>
