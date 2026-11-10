# 主题定制

主题系统用 `scheme` 表达明暗色系，用 `material` 表达实体或毛玻璃材质。消费方仍只需
引入一个发布样式入口：

```ts
import '@yyitian/web-toolkit/style.css';
```

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
import { useWtTheme } from '@yyitian/web-toolkit';

const { setTheme } = useWtTheme();
</script>

<template>
  <button @click="setTheme('dark', 'glass')">暗色毛玻璃</button>
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
  --wt-text-primary: #303133;
  --wt-text-regular: #606266;
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

内置默认变量使用零优先级选择器。消费方可以在全局主题或具体组件上覆盖：

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

## 组件变量

各组件在实际 CSS 属性处按“组件变量 → 状态/Element Plus 变量 → 全局语义变量 → 字面量”
解析。常用变量包括：

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

安装主题插件后，工具库会桥接实际使用范围内的 Element Plus 文字、表面、边框、状态色、
阴影与遮罩变量。工具库内 Dialog、Popover、Form、Table 以及 Select/DatePicker/Cascader 浮层会
补充玻璃滤镜；消费方直接使用的 Element Plus 控件只获得全局配色，不会被强制增加滤镜。

## 通用交互动效

发布样式包含所有现有工具类和 `.wt-interactive`。SCSS 中也可使用插件注入的 mixin：

```scss
.card {
  @include interactive();
}
```

该能力会接管元素的 `transform`，不应与同一节点的其他 transform 效果同时使用；在
`prefers-reduced-motion: reduce` 下会自动移除位移、缩放和滤镜。
