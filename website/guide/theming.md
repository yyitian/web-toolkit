<script setup>
import FormControlThemeDemo from '../examples/demos/FormControlThemeDemo.vue';
import TypographyDemo from '../examples/demos/TypographyDemo.vue';
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

开箱即用的 `SuperThemeSwitcher` 提供 Popover 和行内两种形态：

```vue
<SuperThemeSwitcher />
<SuperThemeSwitcher variant="inline" />
```

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

## 全局语义变量

样式入口提供以下变量，并默认采用浅色实体值：

```css
:root {
  --wt-color-primary: #409eff;
  --wt-text-title: #141b2b;
  --wt-text-primary: #303133;
  --wt-text-regular: #475569;
  --wt-surface-page: #f2f3f5;
  --wt-surface-base: #fff;
  --wt-surface-raised: #fafafa;
  --wt-surface-overlay: #fff;
  --wt-border-color: #dcdfe6;
  --wt-shadow-overlay:
    0 12px 32px 4px rgb(0 0 0 / 4%), 0 8px 20px rgb(0 0 0 / 8%);
  --wt-radius-base: 4px;
  --wt-motion-base: 200ms;
}
```

可以在全局主题或具体组件上覆盖变量：

```css
:root[data-wt-scheme='dark'] {
  --wt-color-primary: #8b5cf6;
  --wt-radius-base: 8px;
}

.project-dialog {
  --wt-dialog-bg: rgb(17 24 39 / 82%);
  --wt-dialog-radius: 16px;
}
```

## 文字层级与排版

标题、正文和辅助信息分别使用 16px、14px、12px。组件默认继承消费方字体，不加载字体文件，
也不重置消费方的 `body`、标题或段落。

| 工具类              | 用途                      | 字号 / 行高 | 字重 | 颜色变量              |
| ------------------- | ------------------------- | ----------- | ---- | --------------------- |
| `.wt-text-title`    | 弹窗、表格、卡片标题      | 16 / 24px   | 700  | `--wt-text-title`     |
| `.wt-text-label`    | 表单标签、表头            | 14 / 22px   | 700  | `--wt-text-title`     |
| `.wt-text-emphasis` | 重点名称与信息            | 14 / 22px   | 600  | `--wt-text-primary`   |
| `.wt-text-body`     | 正文与内容                | 14 / 22px   | 400  | `--wt-text-regular`   |
| `.wt-text-caption`  | 说明、时间、数量、tooltip | 12 / 20px   | 400  | `--wt-text-secondary` |

`.wt-text-placeholder`、`.wt-text-disabled`、`.wt-text-inverse` 仅设置对应颜色，不改变字号和行高。
原有 `.font-*` 工具类及 `font()` mixin 保持原有用法。按钮、标签、状态及 Element Plus 控件的尺寸配置继续有效。

<span id="super-组件适配范围"></span>

### 组件中的文字

按钮、表单和表格的内容使用正文档位，提示、计数和状态使用辅助档位。通过下方示例
比较默认样式与自定义变量；调整文字不会替代组件的 `size` 配置，业务色和禁用、校验色仍各自生效。

### 普通内容快速使用

这些 class 不依赖 Vue 组件或主题插件，导入 `style.css` 后即可用于普通 HTML。
未初始化主题时采用浅色默认值；安装主题插件后自动响应四种主题。

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

说明、备注、时间和数量共用 `.wt-text-caption`。颜色修饰类只改变颜色，例如
`class="wt-text-body wt-text-disabled"` 保持正文 14px，仅使用禁用色；`.wt-text-inverse`
需要配合深色底色。class 不添加外边距、不强制换行或截断，也不自动赋予禁用行为。
业务样式可以继续覆盖这些工具类。

| 文字变量                | 浅色      | 暗色      |
| ----------------------- | --------- | --------- |
| `--wt-text-title`       | `#141b2b` | `#e5eaf3` |
| `--wt-text-primary`     | `#303133` | `#e5eaf3` |
| `--wt-text-regular`     | `#475569` | `#cfd3dc` |
| `--wt-text-secondary`   | `#5f6b7c` | `#a3a6ad` |
| `--wt-text-placeholder` | `#626f82` | `#8d9095` |
| `--wt-text-disabled`    | `#c0c4cc` | `#6c6e72` |
| `--wt-text-inverse`     | `#ffffff` | `#ffffff` |

文字颜色在实体和毛玻璃材质下共用，不对文字整体设置透明度。玻璃后的内容会影响实际对比度，
消费方应检查自己的背景；禁用文字不用于承载必需信息。品牌强调色和状态色不随文字规范改变。

例如浅色玻璃放在深色背景、暗色玻璃放在白色背景时，透明表面可能使辅助文字对比度不足。
承载密集说明的区域可使用不透明阅读底色，文字仍保持当前主题层级：

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

组件专用颜色变量优先于语义默认值。Teleport 浮层继承根节点变量；局部覆盖需传给浮层本身，
例如弹窗的 `style` 或 popover 的 `popperStyle`，不会自动读取原位置祖先上的局部变量。
下方设置仅作用于展示内容。可切换自定义语义样式与组件颜色，并展开弹窗或浮层观察效果。

<ClientOnly><DemoBlock><TypographyDemo /></DemoBlock></ClientOnly>

## 组件变量

通过组件变量定制单个实例；省略时使用当前主题。常用变量包括：

- Icon：`--wt-icon-color`、`--wt-icon-loading-color`。
- Button：`--wt-button-bg`、`--wt-button-color`、各交互状态变量、圆角、阴影与滤镜；
  纯图标形态可用 `--wt-button-icon-only-bg`、`--wt-button-icon-only-hover-bg`、
  `--wt-button-icon-only-backdrop-filter` 独立控制。
- Popover：`--wt-popover-bg`、文字、边框、圆角、阴影、滤镜、间距及层级。
- Dialog：`--wt-dialog-bg`、文字、边框、圆角、阴影、滤镜及 Header/Body/Footer 颜色。
- Form：`--wt-form-label-color` 与 `--wt-form-control-*` 控件基础、悬停、聚焦、选中状态变量；
  Switch 关闭轨道可用 `--wt-form-switch-bg`、`--wt-form-switch-border-color` 独立控制。
- Upload：`--wt-upload-trigger-*`、`--wt-upload-file-hover-bg`、图片描边、遮罩和删除按钮变量。
- Table：`--wt-table-bg`、`--wt-table-color`、表头、边框、悬停和固定列背景，以及间距；
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

<span id="表单控件主题检查"></span>

## 表单控件配色

通过 `SuperForm` 的字段配置使用选择框、开关等控件。自定义字段及插槽中的控件也可
使用表单主题变量；可用配置参阅 [SuperForm 样式与主题](/components/super-form#样式与主题)。

下例展示选中、未选中、半选、禁用和校验状态。默认背景跟随主题；浅色、深色和渐变
属于显式对照条件，可用于观察玻璃材质。切换“自定义控件颜色”可比较变量覆盖效果。

<ClientOnly><DemoBlock><FormControlThemeDemo /></DemoBlock></ClientOnly>

## 通用交互动效

发布样式包含所有现有工具类和 `.wt-interactive`。SCSS 中也可使用插件注入的 mixin：

```scss
.card {
  @include interactive();
}
```

该能力会接管元素的 `transform`，不应与同一节点的其他 transform 效果同时使用；在
`prefers-reduced-motion: reduce` 下会自动移除位移、缩放和滤镜。
