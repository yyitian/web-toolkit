# @yyitian/web-toolkit

面向 Vue 3 的组件工具库，提供图标、按钮、浮层、配置式表单与弹窗组件，以及 SVG sprite 和 SCSS mixin 集成能力。

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

随后按需导入组件：

```ts
import { SuperButton, SuperIcon } from '@yyitian/web-toolkit';
```

Vite 插件、主题定制、各组件用法及完整 API 均以[在线文档](https://wt.yyitian.top/)为准。

## 相关链接

- [在线文档](https://wt.yyitian.top/)
- [npm](https://www.npmjs.com/package/@yyitian/web-toolkit)
- [GitHub](https://github.com/yyitian/web-toolkit)

## License

[MIT](./LICENSE)
