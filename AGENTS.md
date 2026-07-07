# AGENTS.md

本文件给在本仓库工作的编码代理使用。所有对话、文档写入和面向用户的说明始终使用简体中文。

## 项目概览

这是一个 Vue 3 组件工具库，发布包名为 `@yyitian/web-toolkit`，以 ES 模块库形式产出。仓库同时包含本地演示应用和库发布入口：

- `src/`：本地开发与演示应用，`src/App.vue` 是组件展示页。
- `lib/main.ts`：库的真正导出入口，也是 Vite `build.lib.entry`。新增对外组件必须在这里导出，否则不会进入发布包。
- `lib/dynamic-icons.ts`：动态图标子路径导出入口。
- `vite.plugin.ts`：提供给消费方项目使用的 Vite 插件。

包管理器使用 `pnpm`。

## 常用命令

```bash
pnpm dev            # 启动 Vite 开发服务器，预览 src/App.vue
pnpm build          # vue-tsc 类型检查 + 两段 vite build
pnpm lint           # eslint .
pnpm lint:fix       # eslint . --fix
pnpm format         # prettier --write .
pnpm format:check   # prettier --check .
```

仓库没有配置测试框架，也没有 `test` 脚本。变更后优先运行 `pnpm lint` 和 `pnpm build`。

## 技术栈与结构

- Vue 3.5、TypeScript、Vite。
- 样式使用 SCSS、CSS 变量和工具类。
- `SuperPopover` 基于 `@floating-ui/vue`。
- `SuperButton` 包装 Element Plus 的 `ElButton`，用到时消费方需要安装 `element-plus`。
- `SuperIcon` 支持字符串 sprite 图标和 Vue 组件图标，传 lucide 组件时消费方需要安装 `@lucide/vue`。

主要文件：

- `src/components/SuperIcon/index.vue`：核心图标组件。
- `src/components/SuperIcon/dynamic-icons/`：带状态和过渡动画的成品动态图标。
- `src/components/SuperButton/index.vue`：按钮组件，内部使用 `SuperIcon`。
- `src/components/SuperPopover/index.vue`：hover tooltip / popover。
- `src/components/SuperPopover/config.ts`：popover placement 和箭头定位配置。
- `src/styles/theme.css`：`--wt-*` 主题变量默认值。
- `src/styles/mixin/`：全局 SCSS mixin。
- `src/styles/class/index.scss`：程序化生成的工具类。

## 关键约定

### Vue API 自动导入

项目通过 `unplugin-auto-import` 自动注入 `ref`、`computed`、`h`、`toRefs` 等 Vue API。组件内不要手动写：

```ts
import { ref } from 'vue';
```

全局类型来自 `auto-imports.d.ts`，ESLint 全局变量来自 `.eslintrc-auto-import.json`。

### SCSS mixin 全局可用

`vite.config.ts` 通过 `additionalData: @use '@/styles/mixin' as *` 注入 `src/styles/mixin/` 下的 mixin。组件的 `<style lang="scss">` 中可以直接使用 `flex()`、`font()`、`flex-align-center` 等，无需额外 `@use`。

消费方若使用 `webToolkitPlugin`，插件也会为其项目注入：

```scss
@use '@yyitian/web-toolkit/styles/mixin' as *;
```

### TypeScript 模块语法

`tsconfig.json` 开启了 `verbatimModuleSyntax`、`allowImportingTsExtensions` 和 `erasableSyntaxOnly`：

- 类型导入必须使用 `import type`。
- 相对导入 `.ts` 文件时必须带扩展名。
- 路径别名 `@` 指向 `src/`。

### 样式与主题

消费方必须引入：

```ts
import '@yyitian/web-toolkit/style.css';
```

`style.css` 提供 `--wt-*` 主题变量默认值。漏引不会报错，但会导致例如 `SuperPopover` 背景透明、边框和颜色异常。

`SuperPopover` 支持通过给组件根节点追加 class 并覆盖 `--wt-popover-*` 变量二次开发。由于组件刻意不 Teleport，变量依赖 DOM 继承生效。

## 组件设计要点

### SuperIcon

`SuperIcon` 只有一个 `icon` prop，类型为 `string | Component`：

- 传字符串时渲染 SVG sprite：`<use href="#icon-xxx">`。
- 传 Vue 组件时通过 `h(icon, { size })` 渲染。
- `loading` 状态使用内联 SVG spinner，不依赖 lucide 的 `Loader`。
- 带 `title` 时自动用 `SuperPopover` 包裹作为 tooltip。

动态图标放在 `src/components/SuperIcon/dynamic-icons/`，使用：

```ts
defineOptions({ dynamicIcon: true });
```

`SuperIcon` 检测到该标记后会把 `active` 透传给图标，由图标内部负责 `<Transition>` 动画。对外成品动态图标从 `lib/dynamic-icons.ts` 导出。

### SuperButton

`SuperButton` 内部使用 `SuperIcon`，直接把 `icon: string | Component` 透传给 `SuperIcon`。不要增加前缀判断或来源区分逻辑。

### SuperPopover

`SuperPopover` 使用 `@floating-ui/vue`：

- `strategy: 'fixed'`。
- `whileElementsMounted: autoUpdate`。
- 带 120ms 关闭延迟，支持鼠标移入浮层。
- 不使用 Teleport，以保留单根 `.super-popover` DOM 后代和 CSS 变量继承。
- `config.ts` 的 `placementMap` 用于箭头反向定位和隐藏内侧边框接缝。

## Vite 插件

`vite.plugin.ts` 导出 `webToolkitPlugin`，是给库使用方集成的插件，不是本仓库构建本身的插件。插件职责：

- `transformIndexHtml`：扫描 `iconDirs` 中的 `.svg` 文件，生成 `<symbol id="icon-名称">` sprite 并注入到 `<body>` 开头。
- `config`：给消费方项目注入 `@use '@yyitian/web-toolkit/styles/mixin'`。

## 工具类生成

`src/styles/class/index.scss` 使用 `sass:meta` 的 `module-mixins` 和 `apply` 批量生成工具类：

- 遍历 `$gaps` 和 `$flex-containers` 生成带 gap 变体的 flex 类。
- 遍历字号生成 `.font-12`、`.font-12-bold` 等。
- `filter-mixins()` 会把未被覆盖的 mixin 自动生成同名工具类。

新增 mixin 会被纳入工具类生成，注意命名冲突。所有工具类包在 `@layer style.utilities` 内。

## 修改守则

- 新增对外组件时，同时更新 `lib/main.ts` 和必要文档。
- 新增动态图标时，同时更新 `lib/dynamic-icons.ts`。
- 不要移除消费方必须手动引入 `style.css` 的说明。
- 不要把 `SuperPopover` 改成 Teleport，除非同步重新设计 CSS 变量继承方案。
- 保持库代码与演示代码边界清晰：`src/App.vue` 只用于本地预览，不是发布入口。
- 变更完成后，优先运行 `pnpm lint` 和 `pnpm build` 验证。
