# 设计文档:代码质量优化 + GitHub Packages 私有发布配置

日期:2026-06-17
状态:已确认,待转入实现计划

## 背景与目标

`@yyitian/web-toolkit` 是一个 Vue 3 组件库,用途是**作者个人项目间的跨项目组件复用**(不对外开放)。改用 npm 包分发的目的是替代「每个新项目手动复制粘贴」的维护方式,做到「装一次、跨项目复用、省心」。

当前 phase 1 开发已完成,但 `package.json` 等配置是从模板复制而来、存在多处遗留错误,且仓库尚未初始化为 git。本次工作覆盖两条线:

1. **发布配置修复**:把项目配置成可发布到 GitHub Packages 私有 registry 的规范状态。
2. **代码质量**:建立干净的发布基线 + 收紧 TypeScript 类型。

## 范围

### 包含

- 发布到 **GitHub Packages**(scope `@yyitian`,用户名 `yyitian`)所需的全套配置。
- 代码质量 A 层:`pnpm lint` / `pnpm format` / `tsc` 全部跑通无错、无警告。
- 代码质量 D 层:TypeScript 类型规范化(收紧宽类型,消除隐式 any),边界问题点状处理。

### 不包含(明确排除)

- 单元测试 / 测试框架(以后再说)。
- 强制统一组件 API 风格(`<script setup>` 与 Options API 并存可接受)。
- 把 `SuperButton` 重写为零 element-plus 依赖(以后再说)。
- 真正执行 `npm publish` 推送(本设计只负责把配置做对;是否推送由作者手动决定)。

## 关键决策(已确认)

| 决策项                             | 结论                                           |
| ---------------------------------- | ---------------------------------------------- |
| 分发方式                           | GitHub Packages 私有包                         |
| 包名                               | `@yyitian/web-toolkit`                         |
| 版本                               | `0.1.1`(起始)                                  |
| license                            | `MIT`                                          |
| `vue`                              | 必装 `peerDependencies`(`^3.5.0`)              |
| `element-plus`                     | **可选** peer(`peerDependenciesMeta.optional`) |
| `@floating-ui/vue` / `@lucide/vue` | 留在 `dependencies`,打进产物                   |
| 构建 external                      | external 掉 `vue` 与 `element-plus`            |
| 类型声明                           | 用 `vite-plugin-dts` 生成                      |
| mixin 注入                         | 由 `webToolkitPlugin` 自动注入,消费方零 `@use` |

### element-plus 可选 peer 的行为说明

- 仅 `SuperButton` 依赖 element-plus(内部包 `ElButton`)。
- 消费方**未装** element-plus 时:`SuperIcon`、`SuperPopover` 正常工作;`SuperButton` 不可用(预期行为,文档注明)。
- 标记为 optional 后,未装 element-plus 的项目不会产生安装告警。

## 架构设计

### 1. package.json 元信息与依赖分层

```jsonc
{
  "name": "@yyitian/web-toolkit",
  "version": "0.1.1",
  "description": "<一句话描述,实现时补>",
  "license": "MIT",
  "type": "module",
  "repository": "github:yyitian/web-toolkit",
  "publishConfig": { "registry": "https://npm.pkg.github.com" },
  "files": ["dist", "styles"],
  "peerDependencies": {
    "vue": "^3.5.0",
    "element-plus": "^2.14.0",
  },
  "peerDependenciesMeta": {
    "element-plus": { "optional": true },
  },
  "dependencies": {
    "@floating-ui/vue": "^2.0.0",
    "@lucide/vue": "^1.18.0",
  },
}
```

- 移除原 `exports` 中指向不存在的 `./index.d.ts`、模板残留的 `./dist/counter.js`。
- `private: true` 需移除(否则无法 publish)。

### 2. exports 多入口

```jsonc
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  },
  "./vite-plugin": {
    "types": "./dist/vite-plugin.d.ts",
    "import": "./dist/vite-plugin.js"
  },
  "./styles/mixin": {
    "sass": "./styles/mixin/index.scss",
    "style": "./styles/mixin/index.scss",
    "default": "./styles/mixin/index.scss"
  }
}
```

消费方用法:

```ts
import { SuperButton, SuperIcon, SuperPopover } from '@yyitian/web-toolkit';
import { webToolkitPlugin } from '@yyitian/web-toolkit/vite-plugin';
```

```ts
// vite.config.ts —— 注册一次,mixin 自动注入,无需手写 @use
plugins: [vue(), webToolkitPlugin({ iconDirs: ['./src/icons'] })];
```

> 实现时需验证 sass 能通过包子路径解析到 `./styles/mixin/index.scss`(`sass`/`style` 条件键 + vite sass 的 node_modules 解析)。若 `sass` 条件不生效,回退方案是让插件注入的路径直接指向 `@yyitian/web-toolkit/styles/mixin/index.scss`。

### 3. 构建改造(vite.config.ts + 第二构建入口)

**组件库构建(浏览器侧)**

- 入口 `lib/main.ts`,产物 `dist/index.js`(ES;`fileName` 从 `counter` 改为 `index`)。
- `build.rollupOptions.external` 加入 `vue`、`element-plus` 及其子路径(用正则匹配 `element-plus/...`)。
- 接入 `vite-plugin-dts`,从 `.vue` / `.ts` 生成声明,聚合入口类型到 `dist/index.d.ts`。

**vite 插件构建(Node 侧)**

- 单独构建 `vite.plugin.ts` → `dist/vite-plugin.js` + `dist/vite-plugin.d.ts`。
- external 掉 `vite` 及 Node 内置模块(`fs`、`path`)。
- 与组件库构建是两个不同 target(浏览器 vs Node),不能合并到同一次 lib 构建。实现时用独立的 vite 配置/构建步骤或多入口区分,`build` 脚本串联两步。

**样式源码**

- `src/styles` 作为 scss 源码拷贝/发布到包内 `styles/`,纳入 `files`。
- `webToolkitPlugin` 的 `config()` 钩子(`injectMixin` 默认 `true`)通过 vite `additionalData` 注入 `@use '@yyitian/web-toolkit/styles/mixin' as *`,消费方零 `@use`。

### 4. 仓库与认证

- **`git init`** + `.gitignore`(已存在,确认含 `dist`、`node_modules`)+ 首次提交。
- 项目级 **`.npmrc`**:
  ```
  @yyitian:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
  ```
  token 走环境变量,**不写死**进文件。
- 交付一份「消费方机器 `~/.npmrc` 如何配置只读 PAT(`read:packages` 权限)」的说明(写入 README 或单独文档)。

## 代码质量改动

### A 层:干净基线

- `pnpm lint`(eslint)无错、无警告。
- `pnpm format`(prettier)全量统一。
- `tsc` 类型检查通过(`build` 脚本已含 `tsc`)。

### D 层:TypeScript 类型规范

- `src/components/SuperIcon/icon-preset.ts`:`Record<string, Function>` 收紧为精确的预设函数签名(如 `(active: boolean) => VNode | null`),`getIconPreset` 返回类型相应收紧。
- 排查并消除其余宽类型 / 隐式 any(如组件内 `ref(null)` 的元素引用类型、`setup(props)` 的 props 类型)。
- 边界问题(如 props 缺省、空值)视情况点状处理,不做大范围健壮性改造。

> 注意:三个组件文件近期已被 lint/格式化改动过(`SuperButton` 移除了 `inheritAttrs`/`$attrs`、各组件 props 补了默认值),实现时以当前磁盘内容为准,不回退这些改动。

## 验证标准

1. `pnpm build` 成功,产出 `dist/index.js`、`dist/index.d.ts`、`dist/vite-plugin.js`、`dist/vite-plugin.d.ts`。
2. 产物中**不含**打包进去的 Vue / element-plus 代码(external 生效)。
3. `npm pack --dry-run` 的文件清单正确(含 `dist`、`styles`,不含多余源码),`exports` 三个入口路径均真实存在。
4. `pnpm lint` 与 `pnpm format:check` 零报错。
5. `tsc` 零类型错误。
6. (人工)在一个本地消费项目中验证:`SuperIcon`/`SuperPopover` 可在无 element-plus 环境渲染;注册 `webToolkitPlugin` 后 mixin 自动可用、icon sprite 注入正常。

## 风险与待验证项

- **sass 包子路径解析**:`@use '@yyitian/web-toolkit/styles/mixin'` 能否被 sass-embedded 经 exports 条件解析,需实测;有回退方案(见 §2)。
- **vite-plugin-dts 对 Vue SFC**:需确认能正确从 `.vue` 的 `defineProps` 生成可用声明。
- **双构建协调**:浏览器侧与 Node 侧两次构建的产物不互相覆盖、`dts` 只对组件库入口生成。
