# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目性质

这是一个 Vue 3 组件库，最终以 ES 模块库形式发布为 `@yyitian/web-toolkit`。仓库同时承担两个角色：

- `src/` —— 本地开发与演示应用（`src/App.vue` 是组件展示页），用于开发时预览组件。
- `lib/main.ts` —— **库的真正导出入口**，Vite 的 `build.lib.entry`。新增对外组件必须在这里 export，否则不会被打包发布。

包管理器是 **pnpm**。

## 常用命令

```bash
pnpm dev            # 启动 Vite 开发服务器，预览 src/App.vue
pnpm build          # vue-tsc 类型检查 + 两段 vite build，产出 dist/index.js、dist/dynamic-icons.js、dist/vite-plugin.js、dist/style.css
pnpm lint           # eslint .
pnpm lint:fix       # eslint . --fix
pnpm format         # prettier --write .
pnpm format:check   # prettier --check .
```

仓库**没有配置测试框架**，不存在 test 脚本。

## 关键约定（容易踩坑）

- **Vue API 自动导入**：通过 `unplugin-auto-import` 自动注入 `ref`、`computed`、`h`、`toRefs` 等 Vue API，**不要手动 `import { ref } from 'vue'`**。全局类型见 `auto-imports.d.ts`，ESLint 全局变量见 `.eslintrc-auto-import.json`（由插件生成）。`vite.config.ts` 中 `AutoImport` 的 `eslintrc.enabled` 注释提示：生成后应注释掉以避免重复生成。
- **SCSS mixin 全局可用**：`vite.config.ts` 通过 `additionalData: @use '@/styles/mixin' as *` 把 `src/styles/mixin/` 下所有 mixin 注入每个 `<style lang="scss">`，组件内**无需 import 即可直接用** `flex()`、`font()`、`flex-align-center` 等。
- **TS 模块语法严格**：`tsconfig.json` 开启 `verbatimModuleSyntax` + `allowImportingTsExtensions` + `erasableSyntaxOnly`。相对导入 `.ts` 文件**必须带扩展名**（见 `lib/main.ts` 中 `import '@/styles/theme.css'` 等），类型导入必须用 `import type`。
- 路径别名 `@` → `src/`。

## 架构要点

### 图标系统（单一 icon prop）

`SuperIcon` 是核心组件，只有一个 `icon` prop（`string | Component`），按类型分两条渲染路径：

1. **Component 图标**：传入任意 Vue 组件（lucide 函数式组件、SFC 等），渲染 `h(icon, { size })`。运行时校验类型须含 `Function`（lucide 是函数式组件），否则消费端报 prop 警告。
2. **SVG Sprite 图标**：传字符串 `icon="xxx"`，渲染 `<use href="#icon-xxx">`，引用 vite 插件注入页面的 sprite symbol。

**Dynamic Icon（叠加动画）**：成品图标放在 `src/components/SuperIcon/dynamic-icons/`（如 `DynamicPin.vue`），用 `defineOptions({ dynamicIcon: true })` 标记；`SuperIcon` 检测到该标记会把 `active` 透传进去，由图标内部用 `<Transition>` 做描边动画。经 `lib/dynamic-icons.ts` 子路径导出。`loading` 状态渲染**内联 SVG spinner**（`SuperIcon` 不再依赖 lucide `Loader`），配 `.loading` 旋转动画。带 `title` 时自动用 `SuperPopover` 包裹做 tooltip。

### 面向使用方的 Vite 插件

`vite.plugin.ts` 导出 `webToolkitPlugin`，是**给库使用方集成的插件**（非本仓库构建用）：

- `transformIndexHtml`：扫描 `iconDirs` 中的 `.svg` 文件，构建 `<symbol id="icon-名称">` 组成的 sprite，注入到 `<body>` 开头 —— 这是上面 Sprite 图标方案的数据来源。
- `config`：向使用方项目注入 `@use '@yyitian/web-toolkit/styles/mixin'`，让 mixin 在使用方也全局可用。

### 样式工具类的元编程生成

`src/styles/class/index.scss` 不是手写工具类，而是用 `sass:meta` 的 `module-mixins` / `apply` **程序化批量生成**：

- 遍历 `$gaps`（设计规范间距集合）× `$flex-containers` 生成带 gap 变体的 flex 容器类（如 `.flex-align-center-8`）。
- 遍历字号生成 `.font-12` / `.font-12-bold` 等。
- 最后 `filter-mixins()` 把未被上述规则覆盖的 mixin 自动生成同名工具类。

新增 mixin 时，它会被自动纳入工具类生成，注意命名冲突。所有工具类包在 `@layer style.utilities` 内。

### 组件组合关系

`SuperButton`（包 `ElButton`）→ 内部用 `SuperIcon`；`SuperIcon`（带 title 时）→ 内部用 `SuperPopover`。`SuperButton` 直接把 `icon: string | Component` 透传给 `SuperIcon`，无前缀/无来源区分逻辑。

`SuperPopover` 基于 `@floating-ui/vue` 实现 hover tooltip：`config.ts` 的 `placementMap` 用于箭头反向定位（`arrowInnerBorderHidden` 据此隐藏箭头内侧两边、避免设了可见 border 时露接缝）；用 `strategy: 'fixed'` + `whileElementsMounted: autoUpdate` 定位（**刻意不 Teleport**，以保留浮层作为单根 `.super-popover` 的 DOM 后代、继承 `--wt-popover-*` 变量）；带 120ms 关闭延迟以支持鼠标移入浮层。

**Popover 主题与二开**：单根 `.super-popover`（`display:contents`）承载 `--wt-popover-*` 预设变量，预设用 `:global(:where(...))` 把权重归零，消费方给 `<SuperPopover>` 叠加任意 class 覆盖变量即可二次开发（背景支持渐变；边框默认与背景同色隐形，设 `--wt-popover-border-color` 才显形）。变量靠 DOM 继承生效，故消费端务必引入 `style.css`（`--wt-*` 默认值在内），否则浮层透明且无报错。
