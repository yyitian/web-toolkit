<script setup>
import ThemeEffectsDemo from '../examples/demos/ThemeEffectsDemo.vue';
</script>

# 主题定制

主题系统用 `scheme` 表达明暗色系，用 `material` 表达实体或毛玻璃材质。
使用前完成[依赖安装与样式引入](/guide/getting-started#引入样式)。

## 初始化

```ts
import { createApp } from 'vue';
import { createWtTheme } from '@yyitian/web-toolkit';
import App from './App.vue';

createApp(App)
  .use(
    createWtTheme({
      scheme: 'light',
      material: 'solid',
      storage: true,
    }),
  )
  .mount('#app');
```

主题共有四种内置组合：

| `scheme` | `material` | `theme`       |
| -------- | ---------- | ------------- |
| `light`  | `solid`    | `light`       |
| `dark`   | `solid`    | `dark`        |
| `light`  | `glass`    | `glass-light` |
| `dark`   | `glass`    | `glass-dark`  |

`storage` 默认为 `false`。开启后使用固定 key `wt-theme` 保存完整主题状态。非法或不完整
数据会整份忽略，不与初始化配置合并。

## 切换主题

使用 [SuperThemeSwitcher](/components/super-theme-switcher) 切换明暗与材质。

自定义界面使用 `useWtTheme()`：

```vue
<script setup lang="ts">
import { SuperButton, useWtTheme } from '@yyitian/web-toolkit';

const { setTheme } = useWtTheme();
</script>

<template>
  <SuperButton @click="setTheme('dark', 'glass')">暗色毛玻璃</SuperButton>
</template>
```

`theme`、`scheme` 和 `material` 为只读响应式状态。`setTheme(scheme, material)` 同时
更新两个维度；`setScheme()`、`setMaterial()` 可单独切换一个维度。
未安装主题插件时调用 `useWtTheme()` 会明确报错。

## 主题效果

语义色、背景层级、边框、阴影与文字集中展示如下，使用文档站主题入口切换明暗和材质。组件效果直接查看各组件页面中的示例。

<ClientOnly><DemoBlock><ThemeEffectsDemo /></DemoBlock></ClientOnly>

::: details 查看代码

使用前引入[库样式](./getting-started.md#引入样式)并完成上方主题初始化。

```vue
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
  <section class="theme-effects" aria-label="公共样式主题效果">
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
```

:::

## 全局语义变量

按用途选择语义变量，让页面与组件随主题切换：

| 变量                   | 用途                        |
| ---------------------- | --------------------------- |
| `--wt-color-*`         | [主题色](#主题色)           |
| `--wt-text-*`          | [文字颜色](#文字层级与排版) |
| `--wt-surface-page`    | 页面背景                    |
| `--wt-surface-base`    | 组件基础背景                |
| `--wt-surface-raised`  | 抬高区域背景                |
| `--wt-surface-overlay` | 浮层背景                    |
| `--wt-border-color`    | 边框                        |
| `--wt-shadow-overlay`  | 浮层阴影                    |
| `--wt-radius-base`     | 基础圆角，默认 `4px`        |
| `--wt-motion-base`     | 基础过渡时间，默认 `200ms`  |

全局配色在根节点设置；单个组件的外观通过其专用变量定制。自定义全局样式放在库样式之后：

```css
:root[data-wt-scheme='dark'] {
  --wt-radius-base: 8px;
  --wt-surface-page: #111827;
}
```

## 主题色

工具库与 Element Plus 组件共用五种语义色；Element Plus 的 `error` 对应 `danger`。

| 语义           | 浅色      | 暗色      |
| -------------- | --------- | --------- |
| 主色 `primary` | `#3156FF` | `#5D75FF` |
| 成功 `success` | `#00C853` | `#00DE87` |
| 警告 `warning` | `#FFAB00` | `#FFBC24` |
| 危险 `danger`  | `#FF2448` | `#FF4B69` |
| 信息 `info`    | `#5B7DB8` | `#7799D2` |

### 颜色变量

在根节点覆盖 `--wt-color-{type}`，其中 `{type}` 为上表的语义名称；Element Plus 的对应色阶与交互色会同步更新。浅色和暗色可分别设置：

```css
:root[data-wt-scheme='light'] {
  --wt-color-primary: #6d28d9;
}

:root[data-wt-scheme='dark'] {
  --wt-color-primary: #a78bfa;
}
```

局部设置 `--wt-color-*` 不会重新计算根节点上的 Element Plus 色阶。单实例定制请使用组件专用变量或公开属性，参见下方[组件变量](#组件变量)。

## 文字层级与排版

标题、正文和辅助信息分别使用 16px、14px、12px，字体继承所在应用。

| 工具类              | 用途                      | 字号 / 行高 | 字重 | 颜色变量              |
| ------------------- | ------------------------- | ----------- | ---- | --------------------- |
| `.wt-text-title`    | 弹窗、表格、卡片标题      | 16 / 24px   | 700  | `--wt-text-title`     |
| `.wt-text-label`    | 表单标签、表头            | 14 / 22px   | 700  | `--wt-text-title`     |
| `.wt-text-emphasis` | 重点名称与信息            | 14 / 22px   | 600  | `--wt-text-primary`   |
| `.wt-text-body`     | 正文与内容                | 14 / 22px   | 400  | `--wt-text-regular`   |
| `.wt-text-caption`  | 说明、时间、数量、tooltip | 12 / 20px   | 400  | `--wt-text-secondary` |

`.wt-text-placeholder`、`.wt-text-disabled`、`.wt-text-inverse` 仅设置对应颜色，不改变字号和行高。
控件尺寸仍通过各组件的 `size` 配置。

<span id="super-组件适配范围"></span>

<span id="组件中的文字"></span>

### 普通内容快速使用

引入[库样式](/guide/getting-started#引入样式)后，可直接为普通内容添加以下 class；初始化主题后随主题切换。

```html
<section>
  <h2 class="wt-text-title">任务设置</h2>
  <p class="wt-text-label">任务名称</p>
  <p class="wt-text-body">每日巡检</p>
  <p class="wt-text-body">
    任务将在指定时间执行，<strong class="wt-text-emphasis"
      >请确认执行范围</strong
    >。
  </p>
  <p class="wt-text-caption">支持每天或每周执行。</p>
  <time class="wt-text-caption">更新于 2026-11-20</time>
  <div class="wt-text-body">
    <span class="wt-text-placeholder">尚未填写</span>
    <span class="wt-text-disabled">当前不可用</span>
  </div>
</section>
```

颜色修饰类可与排版类组合，例如 `class="wt-text-body wt-text-disabled"`。禁用色不包含禁用行为，`.wt-text-inverse` 需配合深色背景。

| 文字变量                | 浅色      | 暗色      |
| ----------------------- | --------- | --------- |
| `--wt-text-title`       | `#141b2b` | `#e5eaf3` |
| `--wt-text-primary`     | `#303133` | `#e5eaf3` |
| `--wt-text-regular`     | `#475569` | `#cfd3dc` |
| `--wt-text-secondary`   | `#5f6b7c` | `#a3a6ad` |
| `--wt-text-placeholder` | `#626f82` | `#8d9095` |
| `--wt-text-disabled`    | `#c0c4cc` | `#6c6e72` |
| `--wt-text-inverse`     | `#ffffff` | `#ffffff` |

玻璃后的背景会影响文字对比度；承载密集文字的区域可使用以下不透明底色，禁用文字不用于必要信息：

```css
.reading-panel {
  background: var(--wt-palette-mix-surface);
}
```

字号、行高和字重也可单独覆盖：

```css
:root {
  --wt-font-size-title: 16px;
  --wt-font-size-body: 14px;
  --wt-font-size-caption: 12px;
  --wt-line-height-title: 24px;
  --wt-line-height-body: 22px;
  --wt-line-height-caption: 20px;
  --wt-font-weight-regular: 400;
  --wt-font-weight-semibold: 600;
  --wt-font-weight-bold: 700;
}

.project-section {
  --wt-text-title: #7c3aed;
}

.project-form {
  --wt-form-label-color: #b45309; /* 组件变量优先于标题语义色 */
}
```

<span id="提示与反馈"></span>
<span id="表单控件主题检查"></span>
<span id="表单控件配色"></span>

## 组件变量

组件在各自文档的正常示例中响应站点主题。通过组件变量定制单个实例；省略时使用当前主题：

- [SuperIcon](/components/super-icon)：`--wt-icon-color`、`--wt-icon-loading-color`。
- [SuperButton](/components/super-button)：`--wt-button-bg`、`--wt-button-color`、各交互状态变量、圆角、阴影与滤镜；
  纯图标形态可用 `--wt-button-icon-only-bg`、`--wt-button-icon-only-hover-bg`、
  `--wt-button-icon-only-backdrop-filter` 独立控制。
- [SuperPopover](/components/super-popover#teleport-与样式)：`--wt-popover-bg`、文字、边框、圆角、阴影、滤镜、间距及层级。
- [SuperDialog](/components/super-dialog)：`--wt-dialog-bg`、文字、边框、圆角、阴影、滤镜及 Header/Body/Footer 颜色。
- [SuperForm](/components/super-form#样式与主题)：`--wt-form-label-color` 与 `--wt-form-control-*` 控件基础、悬停、聚焦、选中状态变量；
  Switch 关闭轨道可用 `--wt-form-switch-bg`、`--wt-form-switch-border-color` 独立控制。
- [SuperForm Upload](/components/super-form#upload-使用教程)：`--wt-upload-trigger-*`、`--wt-upload-file-hover-bg`、图片描边、遮罩和删除按钮变量。
- [SuperTable](/components/super-table#样式定制)：`--wt-table-bg`、`--wt-table-color`、表头、边框、悬停和固定列背景，以及间距；
  完整列表参阅 [SuperTable 样式定制](/components/super-table#样式定制)。

`SuperPopover` 默认 Teleport 到 `body`。根节点变量可以正常继承；单实例变量需要通过
`popperClass` 或 `popperStyle` 应用到浮层自身。
用法参阅 [SuperPopover 的 Teleport 与样式](/components/super-popover#teleport-与样式)。

## 毛玻璃与 Element Plus

毛玻璃依赖组件背后存在可模糊的图片、渐变或内容；工具库不会接管页面背景。可以通过
`--wt-glass-blur`、`--wt-glass-saturation` 调整强度，或设置
`--wt-backdrop-filter: none` 关闭滤镜。

安装主题插件后，组件与选择器、日期及级联浮层跟随当前主题。直接使用 Element Plus
控件时会获得主题配色；需要玻璃滤镜的独立业务容器应自行配置。

## 通用交互动效

发布样式包含所有现有工具类和 `.wt-interactive`。SCSS 中也可使用插件注入的 mixin：

```scss
.card {
  @include interactive();
}
```

该能力会接管元素的 `transform`，不应与同一节点的其他 transform 效果同时使用；在
`prefers-reduced-motion: reduce` 下会自动移除位移、缩放和滤镜。
