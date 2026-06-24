# GitHub Packages 发布配置 + 代码质量 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `@yyitian/web-toolkit` 配置成可发布到 GitHub Packages 私有 registry 的规范状态,并收紧 TypeScript 类型。

**Architecture:** 双构建 —— 浏览器侧组件库(`lib/main.ts` → `dist/index.js`,external 掉 vue/element-plus)与 Node 侧 vite 插件(`vite.plugin.ts` → `dist/vite-plugin.js`)分别用两个 vite 配置构建;`vite-plugin-dts` 生成 `.d.ts`;`exports` 暴露组件、vite 插件、scss mixin 三个入口;依赖分层为 vue(必装 peer)、element-plus(可选 peer)、floating-ui/lucide(打进产物)。

**Tech Stack:** Vue 3, Vite 8, TypeScript, vite-plugin-dts, pnpm, GitHub Packages。

**Spec:** `docs/superpowers/specs/2026-06-17-publish-and-code-quality-design.md`

**领域说明(重要):** 本项目无单元测试框架(spec 明确排除),因此每个任务的「验证」是**运行构建/检查命令并核对输出**,而非单测。这是本计划的 TDD 等价物。当前 `pnpm lint` / `pnpm format:check` / `tsc` 均已通过,代码质量 A 层已达标,任务以「保持绿色」为验证门槛。

---

## 文件结构

| 文件                                      | 责任                                  | 动作 |
| ----------------------------------------- | ------------------------------------- | ---- |
| `package.json`                            | 包元信息、依赖分层、exports、scripts  | 修改 |
| `vite.config.ts`                          | 组件库构建 + dev + dts                | 修改 |
| `vite.config.plugin.ts`                   | Node 侧 vite 插件构建                 | 创建 |
| `.npmrc`                                  | scope registry + token 占位           | 创建 |
| `src/components/SuperIcon/icon-preset.ts` | icon 预设 + 精确类型                  | 修改 |
| `src/components/SuperIcon/index.vue`      | 用 defineComponent 包裹以产出干净声明 | 修改 |
| `README.md`                               | 安装/消费/发布说明                    | 创建 |
| `.gitignore`                              | 确认含 dist/node_modules              | 确认 |

---

## Task 1: 初始化 git 仓库并提交当前基线

**Files:**

- Confirm: `.gitignore`
- Repo: 当前目录尚非 git 仓库

- [ ] **Step 1: 确认 .gitignore 已忽略构建产物与依赖**

Run: `grep -E '^(dist|node_modules)$' .gitignore`
Expected: 两行都能匹配到(`dist` 和 `node_modules` 均已在 `.gitignore` 中)。

- [ ] **Step 2: 初始化仓库**

```bash
git init
git add -A
git status --short | head -30
```

Expected: 列出待提交文件,**不含** `dist/` 与 `node_modules/`。

- [ ] **Step 3: 首次提交**

```bash
git commit -m "chore: 初始化仓库与设计/计划文档

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

Expected: 提交成功。

---

## Task 2: 安装 vite-plugin-dts

**Files:**

- Modify: `package.json`(devDependencies,由 pnpm 自动写入)

- [ ] **Step 1: 安装类型声明生成插件**

Run: `pnpm add -D vite-plugin-dts`
Expected: 安装成功,`package.json` 的 `devDependencies` 新增 `vite-plugin-dts`。

- [ ] **Step 2: 确认安装**

Run: `ls node_modules/vite-plugin-dts/package.json`
Expected: 文件存在。

- [ ] **Step 3: 提交**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build: 添加 vite-plugin-dts 用于生成类型声明

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: 收紧 icon-preset.ts 的类型(代码质量 D)

**Files:**

- Modify: `src/components/SuperIcon/icon-preset.ts`

- [ ] **Step 1: 用精确签名替换 `Function` 宽类型**

将文件完整替换为:

```ts
import { h, Transition, type VNode } from 'vue';

/** icon 预设渲染函数:根据 active 状态返回叠加动画 VNode */
export type IconPreset = (active: boolean) => VNode;

const presets: Record<string, IconPreset> = {
  Pin: function (active: boolean) {
    return h(Transition, { name: 'super-icon-pin' }, () =>
      active
        ? h('path', {
            class: 'super-icon-active-path',
            d: 'M4.5 4.5 L19.5 19.5',
            'stroke-width': 2,
            'stroke-linecap': 'round',
            'stroke-dasharray': 22,
          })
        : null,
    );
  },
};

export function getIconPreset(iconName: string): IconPreset | undefined {
  return presets[iconName];
}
```

- [ ] **Step 2: 类型检查通过**

Run: `pnpm -s exec tsc --noEmit`
Expected: 退出码 0,无输出。

- [ ] **Step 3: lint 通过**

Run: `pnpm -s lint`
Expected: 退出码 0,无输出。

- [ ] **Step 4: 提交**

```bash
git add src/components/SuperIcon/icon-preset.ts
git commit -m "refactor: 收紧 icon-preset 类型,去除 Function 宽类型

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: 用 defineComponent 包裹 SuperIcon(为 dts 产出干净声明)

**Files:**

- Modify: `src/components/SuperIcon/index.vue:1-15`(`<script>` 段的导出)

**背景:** `SuperIcon` 当前是 `export default { props, setup(props) }` 的普通对象导出,`setup(props)` 的 `props` 是隐式 any。`vite-plugin-dts`(底层 vue-tsc)据此生成声明时类型会很松甚至报错。用 `defineComponent` 包裹即可让 props 被正确推导,**不改变运行时行为、不改变 Options API 风格**。

- [ ] **Step 1: 引入 defineComponent 并包裹导出**

把 `<script lang="ts">` 段开头的导入与导出改为:

```ts
import { defineComponent, h } from 'vue';
import * as LucideIcons from '@lucide/vue';
import { getIconPreset } from './icon-preset.ts';
import SuperPopover from '../SuperPopover/index.vue';

export default defineComponent({
  props: {
    name: { type: String, default: '' },
    lucide: { type: String, default: '' },
    title: { type: String, default: '' },
    size: { type: [String, Number], default: 20 },
    rotate: { type: Number, default: 0 },
    loading: { type: Boolean },
    active: { type: Boolean },
  },
  setup(props) {
```

并在 `<script>` 段末尾,把原来的对象闭合 `};` 改为 `});`(因为现在是 `defineComponent({...})`)。其余 `setup` 内部逻辑保持不变。

> 注意:`h` 在 SFC 中由 unplugin-auto-import 自动注入,但显式 `import` 不冲突;若 lint 报 `h` 重复定义,删掉这里的显式 `h` 导入,保留 `defineComponent`。

- [ ] **Step 2: 类型检查与 lint 通过**

Run: `pnpm -s exec tsc --noEmit && pnpm -s lint`
Expected: 两条命令均退出码 0,无报错。

- [ ] **Step 3: 提交**

```bash
git add src/components/SuperIcon/index.vue
git commit -m "refactor: 用 defineComponent 包裹 SuperIcon 以获得 props 类型推导

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: 改造 vite.config.ts —— external 依赖、重命名产物、接入 dts

**Files:**

- Modify: `vite.config.ts`

- [ ] **Step 1: 替换为新配置**

将 `vite.config.ts` 完整替换为:

```ts
import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import AutoImport from 'unplugin-auto-import/vite';
import ElementPlus from 'unplugin-element-plus/vite';

export default defineConfig({
  build: {
    lib: {
      entry: './lib/main.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      // vue、element-plus 由消费方提供,不打进产物
      external: ['vue', 'element-plus', /^element-plus\/.*/],
    },
  },
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use '@/styles/mixin' as *;`,
      },
    },
  },
  plugins: [
    vue(),
    ElementPlus(),
    AutoImport({
      imports: ['vue'],
      eslintrc: { enabled: false },
    }),
    dts({
      include: [
        'lib/**/*.ts',
        'src/components/**/*.ts',
        'src/components/**/*.vue',
      ],
      rollupTypes: true, // 聚合为单一 dist/index.d.ts
    }),
  ],
});
```

说明:

- `fileName: () => 'index.js'` 把产物从 `counter.js` 改为 `index.js`。
- `rollupOptions.external` 让 vue/element-plus 不被打包。
- `eslintrc.enabled` 设为 `false`,避免每次构建重写 `.eslintrc-auto-import.json`。
- `dts` 的 `include` 限定为组件库范围(不含 `vite.plugin.ts`,后者由 Task 6 单独处理)。

- [ ] **Step 2: 构建组件库**

Run: `pnpm -s exec vite build`
Expected: 构建成功,生成 `dist/index.js` 与 `dist/index.d.ts`。

- [ ] **Step 3: 验证 vue 未被打进产物**

Run: `grep -c "createApp\|reactive" dist/index.js || true`
Expected: 不应包含 Vue 运行时实现(理想为 0 或极少;`import ... from "vue"` 形式的外部引用是正确的)。

Run: `grep -E "from ?[\"']vue[\"']" dist/index.js | head -3`
Expected: 能看到 `from "vue"` 这类外部 import 语句,证明 vue 被 external 而非内联。

- [ ] **Step 4: 验证类型声明入口存在**

Run: `ls dist/index.d.ts && grep -E "SuperButton|SuperIcon|SuperPopover" dist/index.d.ts`
Expected: 文件存在且导出三个组件的声明。

- [ ] **Step 5: 提交**

```bash
git add vite.config.ts
git commit -m "build: external vue/element-plus、产物重命名为 index、接入 dts

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: 新建 vite.config.plugin.ts —— 构建 Node 侧 vite 插件

**Files:**

- Create: `vite.config.plugin.ts`

- [ ] **Step 1: 创建插件构建配置**

写入 `vite.config.plugin.ts`:

```ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    emptyOutDir: false, // 不清空 dist,保留组件库产物
    lib: {
      entry: './vite.plugin.ts',
      formats: ['es'],
      fileName: () => 'vite-plugin.js',
    },
    rollupOptions: {
      // Node 内置模块与 vite 不打进产物
      external: ['vite', 'fs', 'path', 'node:fs', 'node:path'],
    },
  },
  plugins: [
    dts({
      include: ['vite.plugin.ts'],
      rollupTypes: true,
      // 与组件库 dts 分开,避免覆盖 index.d.ts
      outDir: 'dist',
    }),
  ],
});
```

- [ ] **Step 2: 构建插件(在组件库构建之后运行,依赖 emptyOutDir:false)**

Run: `pnpm -s exec vite build && pnpm -s exec vite build --config vite.config.plugin.ts`
Expected: 先后两次构建成功;`dist/` 同时含 `index.js`、`index.d.ts`、`vite-plugin.js`、`vite-plugin.d.ts`。

- [ ] **Step 3: 验证插件产物导出**

Run: `grep -E "webToolkitPlugin" dist/vite-plugin.js && grep -E "webToolkitPlugin|WebToolkitPluginOptions" dist/vite-plugin.d.ts`
Expected: JS 与 d.ts 均导出 `webToolkitPlugin`。

- [ ] **Step 4: 提交**

```bash
git add vite.config.plugin.ts
git commit -m "build: 新增 Node 侧 vite 插件构建配置

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: 更新 package.json —— 元信息、依赖分层、exports、scripts

**Files:**

- Modify: `package.json`

- [ ] **Step 1: 替换 package.json 顶层字段**

将 `package.json` 完整替换为(`devDependencies` 以当前实际内容为准,保留 Task 2 新增的 `vite-plugin-dts`):

```jsonc
{
  "name": "@yyitian/web-toolkit",
  "version": "0.1.1",
  "description": "个人跨项目复用的 Vue 3 组件工具库(SuperIcon / SuperButton / SuperPopover + vite 插件 + scss mixin)",
  "license": "MIT",
  "type": "module",
  "repository": "github:yyitian/web-toolkit",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
  },
  "files": ["dist", "src/styles"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
    },
    "./vite-plugin": {
      "types": "./dist/vite-plugin.d.ts",
      "import": "./dist/vite-plugin.js",
    },
    "./styles/mixin": {
      "sass": "./src/styles/mixin/index.scss",
      "style": "./src/styles/mixin/index.scss",
      "default": "./src/styles/mixin/index.scss",
    },
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build && vite build --config vite.config.plugin.ts",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepublishOnly": "pnpm build",
  },
  "peerDependencies": {
    "vue": "^3.5.0",
    "element-plus": "^2.14.0",
  },
  "peerDependenciesMeta": {
    "element-plus": {
      "optional": true,
    },
  },
  "dependencies": {
    "@floating-ui/vue": "^2.0.0",
    "@lucide/vue": "^1.18.0",
  },
  "devDependencies": {
    "@types/node": "^25.9.3",
    "@vitejs/plugin-vue": "^6.0.7",
    "@vue/eslint-config-prettier": "^10.2.0",
    "@vue/eslint-config-typescript": "^14.8.0",
    "element-plus": "^2.14.2",
    "eslint": "^10.5.0",
    "eslint-plugin-vue": "^10.9.2",
    "globals": "^17.6.0",
    "prettier": "^3.8.4",
    "sass-embedded": "^1.100.0",
    "typescript": "~6.0.2",
    "typescript-eslint": "^8.61.1",
    "unplugin-auto-import": "^21.0.0",
    "unplugin-element-plus": "^0.11.2",
    "vite": "^8.0.3",
    "vite-plugin-dts": "^4.5.0",
    "vue": "^3.5.38",
  },
}
```

关键变化:

- `name` 加 scope;`version` 0.1.1;`license` MIT;补 `description`/`repository`。
- **移除 `private: true`**(否则 GitHub Packages 也无法 publish)与原 `types` 顶层字段。
- `vue`/`element-plus` 从 `dependencies` 移到 `peerDependencies`,`element-plus` 标 optional;`element-plus` 同时保留在 `devDependencies` 供本地构建/dev 用。
- `exports` 三入口;`files` 含 `dist` 与 `src/styles`。
- `build` 串联两次构建;新增 `prepublishOnly` 保证发布前必构建。

- [ ] **Step 2: 重装依赖以使 peer 分层生效**

Run: `pnpm install`
Expected: 安装成功,无致命错误(可能出现 element-plus 为可选 peer 的提示,属正常)。

- [ ] **Step 3: 全量构建验证**

Run: `pnpm -s build`
Expected: 两次构建成功,`dist/` 含 `index.js`/`index.d.ts`/`vite-plugin.js`/`vite-plugin.d.ts`。

- [ ] **Step 4: 校验 exports 指向的文件真实存在**

Run: `ls dist/index.js dist/index.d.ts dist/vite-plugin.js dist/vite-plugin.d.ts src/styles/mixin/index.scss`
Expected: 全部存在。

- [ ] **Step 5: 提交**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: 配置 GitHub Packages 发布元信息、依赖分层与 exports

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: 创建 .npmrc(发布认证,token 走环境变量)

**Files:**

- Create: `.npmrc`

- [ ] **Step 1: 写入 .npmrc**

写入 `.npmrc`:

```
@yyitian:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

- [ ] **Step 2: 确认未泄露真实 token**

Run: `grep -E "ghp_|github_pat_" .npmrc || echo "OK: 无明文 token"`
Expected: 输出 `OK: 无明文 token`。

- [ ] **Step 3: 提交**

```bash
git add .npmrc
git commit -m "build: 添加 .npmrc 指向 GitHub Packages,token 走环境变量

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: 编写 README(安装 / 消费 / 发布说明)

**Files:**

- Create: `README.md`

- [ ] **Step 1: 写入 README.md**

写入 `README.md`:

````markdown
# @yyitian/web-toolkit

个人跨项目复用的 Vue 3 组件工具库:`SuperIcon` / `SuperButton` / `SuperPopover`,附带 vite 插件(SVG sprite 注入 + scss mixin 自动注入)。私有发布于 GitHub Packages。

## 消费方安装

### 1. 配置 GitHub Packages 认证(每台机器一次)

在 `~/.npmrc` 添加(`<TOKEN>` 为具备 `read:packages` 权限的 GitHub PAT):

```
@yyitian:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<TOKEN>
```

### 2. 安装

```bash
pnpm add @yyitian/web-toolkit
# 若用到 SuperButton,需自行安装 element-plus(可选 peer)
pnpm add element-plus
```

> `vue` 为必需 peer;`element-plus` 为**可选** peer——不装也能用 `SuperIcon` / `SuperPopover`,仅 `SuperButton` 需要它。

## 用法

### 组件

```ts
import { SuperIcon, SuperButton, SuperPopover } from '@yyitian/web-toolkit';
```

### vite 插件(SVG sprite + 自动注入 mixin)

```ts
// vite.config.ts
import { webToolkitPlugin } from '@yyitian/web-toolkit/vite-plugin';

export default defineConfig({
  plugins: [vue(), webToolkitPlugin({ iconDirs: ['./src/icons'] })],
});
```

注册后,所有 `.vue` / `.scss` 中可直接使用 `flex()`、`font()` 等 mixin,**无需手写 `@use`**;`iconDirs` 下的 `.svg` 会被构建成 sprite 注入页面,经 `<SuperIcon name="文件名" />` 使用。

## 维护方发布

```bash
export NODE_AUTH_TOKEN=<具备 write:packages 的 PAT>
# 修改后先 bump 版本
npm version patch   # 或 minor / major
pnpm publish        # prepublishOnly 会自动先构建
```
````

- [ ] **Step 2: 提交**

```bash
git add README.md
git commit -m "docs: 添加安装/消费/发布说明

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: 端到端发布前验证

**Files:** 无(纯验证)

- [ ] **Step 1: 代码质量门槛全绿**

Run: `pnpm -s lint && pnpm -s format:check && pnpm -s exec tsc --noEmit`
Expected: 三条命令均退出码 0、无报错。

- [ ] **Step 2: 干净全量构建**

Run: `rm -rf dist && pnpm -s build`
Expected: 构建成功,`dist/` 含四个产物文件。

- [ ] **Step 3: 校验 npm pack 内容清单**

Run: `npm pack --dry-run 2>&1 | grep -E "dist/|src/styles/|package.json|README" | head -30`
Expected: 清单包含 `dist/index.js`、`dist/index.d.ts`、`dist/vite-plugin.js`、`dist/vite-plugin.d.ts`、`src/styles/mixin/index.scss`、`package.json`、`README.md`;**不含** `node_modules`、`docs`、demo 源码(`src/App.vue` 等)。

- [ ] **Step 4: 校验 sass 子路径可解析(关键风险项)**

创建临时验证文件 `/tmp/_mixin_check.scss`,内容:

```scss
@use '@yyitian/web-toolkit/styles/mixin' as *;
.x {
  @include flex(8px);
}
```

Run: `pnpm -s exec sass --load-path=node_modules /tmp/_mixin_check.scss 2>&1 | head -20; rm -f /tmp/_mixin_check.scss`
Expected: 编译出 `.x { display: flex; gap: 8px; }`。
若解析失败:回退方案——让消费方/插件改用完整路径 `@yyitian/web-toolkit/src/styles/mixin/index.scss`,并在 README 与 `vite.plugin.ts` 的 `additionalData` 中同步该路径。

- [ ] **Step 5: 最终提交(如有遗留改动)**

```bash
git add -A
git commit -m "chore: 发布前验证收尾" --allow-empty

git commit --amend --no-edit 2>/dev/null || true
```

Expected: 工作区干净;`git status` 无未提交改动。

---

## 自检结论(对照 spec)

- **spec §1 元信息/依赖分层** → Task 7 ✓
- **spec §2 exports 多入口** → Task 7 + sass 解析验证 Task 10/Step4 ✓
- **spec §3 构建改造(external/dts/插件双构建/styles 发布)** → Task 5、6、7 ✓
- **spec §4 仓库与认证** → Task 1(git init)、Task 8(.npmrc)、Task 9(消费方 PAT 说明)✓
- **代码质量 A(lint/format/tsc 绿)** → 已达标,Task 10/Step1 守门 ✓
- **代码质量 D(类型收紧)** → Task 3(icon-preset)、Task 4(SuperIcon defineComponent)✓
- **风险:sass 子路径解析** → Task 10/Step4 显式验证 + 回退方案 ✓
- **风险:dts 对 Vue SFC** → Task 4 用 defineComponent + Task 5/Step4 验证声明存在 ✓
- **风险:双构建产物覆盖** → Task 6 用 `emptyOutDir: false` 且构建有序 ✓
