# @yyitian/web-toolkit

面向 Vue 3 的组件工具库，提供图标、按钮、浮层、配置式表单、弹窗与主题能力，以及 SVG sprite 和 SCSS mixin 集成能力。

完整使用说明、组件示例与 API 请访问：[wt.yyitian.top](https://wt.yyitian.top/)。

## 安装

```bash
pnpm add @yyitian/web-toolkit
```

`vue` 是必需的 peer dependency。使用表单、弹窗或按钮组件时需要安装 `element-plus`；使用 Lucide 图标或动态图标时需要安装 `@lucide/vue`。

```bash
pnpm add element-plus @lucide/vue
```

## 基础接入

在应用入口引入组件库样式：

```ts
import '@yyitian/web-toolkit/style.css';
```

通过插件初始化主题，再按需导入组件：

```ts
import { createApp } from 'vue';
import { createWtTheme } from '@yyitian/web-toolkit';
import App from './App.vue';

createApp(App)
  .use(createWtTheme({ scheme: 'light', material: 'solid', storage: true }))
  .mount('#app');
```

组件内可以使用现成切换器，也可以通过组合式函数自定义切换界面：

```vue
<script setup lang="ts">
import { SuperThemeSwitcher, useWtTheme } from '@yyitian/web-toolkit';

const { setTheme } = useWtTheme();
</script>

<template>
  <SuperThemeSwitcher />
  <button @click="setTheme('dark', 'glass')">暗色毛玻璃</button>
</template>
```

Vite 插件、主题定制、各组件用法及完整 API 均以[在线文档](https://wt.yyitian.top/)为准。

## 相关链接

- [在线文档](https://wt.yyitian.top/)
- [npm](https://www.npmjs.com/package/@yyitian/web-toolkit)
- [GitHub](https://github.com/yyitian/web-toolkit)

## License

[MIT](./LICENSE)
