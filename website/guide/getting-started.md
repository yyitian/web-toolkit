# 快速开始

`@yyitian/web-toolkit` 面向 Vue 3 和 Vite 项目，提供图标、按钮、浮层、弹窗及配置式表单。

## 安装依赖

```bash
pnpm add @yyitian/web-toolkit element-plus
```

项目需要 Vue 3.5 或更高版本。只有使用 Lucide 组件图标时才需要安装：

```bash
pnpm add @lucide/vue
```

## 引入样式

在应用入口引入组件库样式。这个步骤不能省略，否则 Popover 等组件的主题变量会缺失。

```ts
import { createApp } from 'vue';
import '@yyitian/web-toolkit/style.css';
import App from './App.vue';

createApp(App).mount('#app');
```

使用 Element Plus 组件时，还应按项目既有方式引入其样式。可以使用
`unplugin-element-plus` 按需加载，也可以引入完整样式：

```ts
import 'element-plus/dist/index.css';
```

## 使用组件

```vue
<script setup lang="ts">
import { Settings } from '@lucide/vue';
import { SuperButton } from '@yyitian/web-toolkit';
</script>

<template>
  <SuperButton type="primary" :icon="Settings">设置</SuperButton>
</template>
```

## 使用字符串图标

字符串图标依赖 SVG sprite。先在 Vite 配置中启用插件，再把 SVG 文件名作为 `icon`
传入。完整配置参阅[Vite 插件](/guide/vite-plugin)。

```vue
<script setup lang="ts">
import { SuperIcon } from '@yyitian/web-toolkit';
</script>

<template>
  <SuperIcon icon="logo" title="项目标志" />
</template>
```

插件会查找 `logo.svg` 并生成 `#icon-logo` symbol。

## 按需引入动态图标

动态图标使用独立子路径，避免无关图标进入主入口：

```vue
<script setup lang="ts">
import { SuperButton } from '@yyitian/web-toolkit';
import { DynamicPin } from '@yyitian/web-toolkit/dynamic-icons';

const active = ref(false);
</script>

<template>
  <SuperButton
    :icon="DynamicPin"
    :active="active"
    label="置顶"
    @click="active = !active"
  />
</template>
```
