# Vite 插件

`webToolkitPlugin` 提供 SVG sprite 注入和 SCSS mixin 接入，从
`@yyitian/web-toolkit/vite-plugin` 导入。

## 基础配置

```ts
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { webToolkitPlugin } from '@yyitian/web-toolkit/vite-plugin';

export default defineConfig({
  plugins: [
    vue(),
    webToolkitPlugin({
      iconDirs: [resolve(__dirname, 'src/assets/icons')],
    }),
  ],
});
```

假设图标目录中存在 `settings.svg`，插件会在 HTML 的 `<body>` 开头注入
`#icon-settings`，组件中可以直接使用：

```vue
<SuperIcon icon="settings" />
```

## 配置项

| 配置          | 类型       | 默认值 | 说明                                |
| ------------- | ---------- | ------ | ----------------------------------- |
| `iconDirs`    | `string[]` | `[]`   | 扫描其中的 `.svg` 文件并生成 sprite |
| `injectMixin` | `boolean`  | `true` | 为消费方 SCSS 注入工具库 mixin      |

## SCSS mixin 注入

默认情况下，插件向 Vite 的 SCSS `additionalData` 注入：

```scss
@use '@yyitian/web-toolkit/styles/mixin' as *;
```

因此项目的 SCSS 中可以直接使用 `flex()`、`font()` 和 `flex-align-center` 等 mixin。
如果项目已经自行配置同一入口，可以关闭重复注入：

```ts
webToolkitPlugin({ injectMixin: false });
```

## 注意事项

- `iconDirs` 必须是构建机器上可读取的绝对路径。
- symbol 名称取 SVG 文件名，不包含 `.svg`，请避免目录间同名。
- 插件在构建时读取 SVG；新增或修改文件后需要重新构建。
- SVG 内应使用 `currentColor`，以便图标继承组件文字颜色。
