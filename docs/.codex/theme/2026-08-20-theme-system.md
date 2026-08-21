# Web Toolkit 主题系统设计方案

## 1. 文档状态

- 状态：第一版已实现，静态检查、生命周期脚本与核心浏览器路径已验证。
- 目标版本：主题功能第一版。
- 本文同时作为第一版实现契约，完整视觉仍以人工浏览器验收结果为准。
- 本文不包含版本发布、npm 发布和 Git 提交安排。

## 2. 背景

当前 `@yyitian/web-toolkit` 只在 `src/styles/theme.css` 中提供少量全局
`--wt-*` 变量。`SuperPopover` 已有独立外观变量，但 `SuperButton`、
`SuperDialog`、`SuperForm` 和 `SuperFormUpload` 等组件仍较多依赖 Element Plus
默认变量或局部硬编码样式。

本次希望增加完整主题能力：

1. 内置白色、黑色、浅色毛玻璃、暗色毛玻璃四种效果。
2. 为工具库组件建立可由消费方覆盖的 CSS 变量。
3. 通过 Vue 插件初始化应用级主题状态。
4. 通过组合式函数向消费方开放自定义切换能力。
5. 提供开箱即用的主题切换组件。
6. 将参考样式中的交互动效整理成通用开放能力，并只在适合的工具库组件中小范围使用。

参考视觉来自：

```text
~/Projects/yyitian/sites-cloudflare/web/src/styles/interactive.scss
```

参考文件只用于提取毛玻璃和交互动效的视觉规律，不直接决定本工具库的组件边界、
命名方式和默认行为。

## 3. 设计目标

### 3.1 功能目标

- 同时表达明暗色系和实体/玻璃材质。
- 工具库组件和其内部使用的 Element Plus 控件保持一致外观。
- Dialog、Popover、Select、DatePicker 等 Teleport 内容仍能获得正确主题。
- 消费方可以使用现成主题切换组件，也可以自行制作切换 UI。
- 消费方可以通过 CSS 变量调整内置主题，不需要复制组件内部选择器。
- 主题状态可以按配置选择是否持久化。
- 每次插件初始化创建独立状态，避免 SSR 请求间共享可写主题状态。
- 尊重 `prefers-reduced-motion`，避免主题动效影响无障碍体验。

### 3.2 非目标

第一版不包含：

- 局部容器级 ThemeProvider。
- 任意名称主题的运行时注册和删除。
- 在线主题编辑器或 CSS 变量可视化配置器。
- 自动分析页面背景并选择玻璃明暗模式。
- 为 Element Plus 全量组件重新实现一套独立主题。
- 自动给所有组件增加悬浮位移、缩放或滤镜效果。

## 4. 核心模型

主题由两个独立维度组成：

```ts
export type WtColorScheme = 'light' | 'dark';
export type WtMaterial = 'solid' | 'glass';
```

两个维度形成四种内置组合：

| `scheme` | `material` | 派生主题名    | 中文名称   |
| -------- | ---------- | ------------- | ---------- |
| `light`  | `solid`    | `light`       | 白色       |
| `dark`   | `solid`    | `dark`        | 黑色       |
| `light`  | `glass`    | `glass-light` | 浅色毛玻璃 |
| `dark`   | `glass`    | `glass-dark`  | 暗色毛玻璃 |

`scheme` 和 `material` 是主题状态的真实来源；`theme` 只是方便展示、选择器匹配和
调试的派生结果，不单独存储。

```ts
export type WtBuiltinTheme = 'light' | 'dark' | 'glass-light' | 'glass-dark';
```

派生规则：

```ts
function resolveTheme(
  scheme: WtColorScheme,
  material: WtMaterial,
): WtBuiltinTheme {
  if (material === 'glass') {
    return scheme === 'dark' ? 'glass-dark' : 'glass-light';
  }

  return scheme;
}
```

## 5. DOM 主题协议

插件在浏览器端把当前主题写到 `document.documentElement`：

```html
<html
  data-wt-theme="glass-dark"
  data-wt-scheme="dark"
  data-wt-material="glass"
></html>
```

三个 `data-*` 属性分别服务于：

- `data-wt-theme`：匹配某个完整内置组合。
- `data-wt-scheme`：复用明暗配色规则。
- `data-wt-material`：复用实体或玻璃材质规则。

根节点是第一版唯一支持的应用目标。这样 Teleport 到 `body` 的 Dialog、Popover、
Select 下拉层和 DatePicker 面板可以继承同一套全局主题变量。

主题响应式状态由每个 Vue 应用独立创建，但浏览器中的视觉效果作用于整个 document。
插件不检测同一 document 中是否存在其他 WT 主题控制器，也不提供控制器所有权管理；
同时安装多个主题插件实例时，根节点最终主题由各实例的实际写入顺序决定。

插件不读取、添加或删除根节点 `.dark` class。Element Plus 联动由带
`data-wt-scheme` 的变量桥接完成；消费方因其他系统使用的 `.dark` 完全由消费方管理。

## 6. 主题样式分层

现有 `src/styles/theme.css` 调整为主题目录入口：

```text
src/styles/theme/
├── index.scss
├── light.scss
├── dark.scss
├── solid.scss
└── glass.scss
```

`index.scss` 统一加载四个维度文件：

```scss
@use './light';
@use './dark';
@use './solid';
@use './glass';
```

四个维度文件采用“色系候选值 → 材质映射 → 最终公开语义变量”的单向关系：

| 文件         | 职责                                                         |
| ------------ | ------------------------------------------------------------ |
| `index.scss` | 状态色、圆角、动效、组件规则和 Element Plus 变量桥接         |
| `light.scss` | 浅色文字，以及浅色下的实体和玻璃候选值                       |
| `dark.scss`  | 暗色文字，以及暗色下的实体和玻璃候选值                       |
| `solid.scss` | 把当前色系的实体候选值映射到最终公开语义变量                 |
| `glass.scss` | 在玻璃材质下把玻璃候选值映射到最终公开语义变量并增加滤镜规则 |

色系文件和材质文件不写入同一层变量，避免零优先级规则受加载顺序影响。暗色玻璃值直接
来自 `dark.scss` 的玻璃候选值，不复制四套完整组合样式。根级 `src/styles/index.scss`
统一加载主题与工具类：

```scss
@use './theme';
@use './class';
```

`reset.css` 不进入该入口，也不进入发布样式；本地演示确有需要时单独引入。

`lib/main.ts` 和本地演示的 `src/main.ts` 均引入 `src/styles/index.scss`。本地 Vite 配置
通过 `webToolkitPlugin()` 注入 mixin，与消费方保持同一集成方式；现有手工维护的 Sass
`additionalData` 不再重复保留。`webToolkitPlugin()` 在没有有效 SVG symbol 时不向 HTML
注入空 sprite。构建后的消费方入口仍为
`@yyitian/web-toolkit/style.css`，不改变已发布的引入方式。

主题变量分为三层。

### 6.1 基础语义令牌

基础令牌表达整个工具库共享的视觉语义：

```css
--wt-color-primary
--wt-color-success
--wt-color-warning
--wt-color-danger
--wt-color-info

--wt-text-primary
--wt-text-regular
--wt-text-secondary
--wt-text-placeholder
--wt-text-disabled
--wt-text-inverse

--wt-surface-page
--wt-surface-base
--wt-surface-raised
--wt-surface-overlay
--wt-surface-mask

--wt-border-color
--wt-border-color-light
--wt-border-color-strong

--wt-shadow-base
--wt-shadow-raised
--wt-shadow-overlay

--wt-radius-base
--wt-radius-small
--wt-radius-large

--wt-backdrop-filter
--wt-motion-fast
--wt-motion-base

--wt-palette-mix-surface
--wt-palette-contrast
```

现有 `--wt-color-text`、`--wt-color-bg`、`--wt-color-border`、`--wt-radius` 等旧变量
直接删除，不提供兼容别名。组件、mixin、文档和演示统一迁移到新的语义变量与组件变量。

### 6.2 色系令牌

共享状态色沿用当前 Element Plus 基准：

| 变量                 | 值        |
| -------------------- | --------- |
| `--wt-color-primary` | `#409eff` |
| `--wt-color-success` | `#67c23a` |
| `--wt-color-warning` | `#e6a23c` |
| `--wt-color-danger`  | `#f56c6c` |
| `--wt-color-info`    | `#909399` |

`scheme` 决定文字及各材质候选值：

| 类别       | Light                                                         | Dark                                                            |
| ---------- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| 主文字     | `#303133`                                                     | `#e5eaf3`                                                       |
| 常规文字   | `#606266`                                                     | `#cfd3dc`                                                       |
| 次要文字   | `#909399`                                                     | `#a3a6ad`                                                       |
| 占位文字   | `#a8abb2`                                                     | `#8d9095`                                                       |
| 禁用文字   | `#c0c4cc`                                                     | `#6c6e72`                                                       |
| 反色文字   | `#ffffff`                                                     | `#ffffff`                                                       |
| 页面       | `#f2f3f5`                                                     | `#0a0a0a`                                                       |
| 基础表面   | `#ffffff`                                                     | `#141414`                                                       |
| 抬升表面   | `#fafafa`                                                     | `#18191a`                                                       |
| 浮层表面   | `#ffffff`                                                     | `#1d1e1f`                                                       |
| 基础边框   | `#dcdfe6`                                                     | `#4c4d4f`                                                       |
| 弱边框     | `#e4e7ed`                                                     | `#414243`                                                       |
| 强边框     | `#cdd0d6`                                                     | `#636466`                                                       |
| 实体遮罩   | `rgb(0 0 0 / 50%)`                                            | `rgb(0 0 0 / 80%)`                                              |
| 状态混合面 | `#ffffff`                                                     | `#141414`                                                       |
| 状态对比色 | `#000000`                                                     | `#ffffff`                                                       |
| 基础阴影   | `0 0 6px #0000001f`                                           | `0 0 6px #000000b8`                                             |
| 抬升阴影   | `0 0 12px #0000001f`                                          | `0 0 12px #000000b8`                                            |
| 浮层阴影   | `0 12px 32px 4px rgb(0 0 0 / 4%), 0 8px 20px rgb(0 0 0 / 8%)` | `0 12px 32px 4px rgb(0 0 0 / 36%), 0 8px 20px rgb(0 0 0 / 72%)` |

基础几何和动效值固定为：

```css
--wt-radius-small: 2px;
--wt-radius-base: 4px;
--wt-radius-large: 8px;
--wt-motion-fast: 120ms;
--wt-motion-base: 200ms;
```

选择器结构：

```css
/* 默认值就是 light + solid */
:where(:root) {
  color-scheme: light;
  /* 浅色色系值和实体、玻璃候选值 */
}

/* dark.scss */
:where(:root[data-wt-scheme='dark']) {
  color-scheme: dark;
  /* 暗色色系值和实体、玻璃候选值 */
}
```

所有内置 `--wt-*` 默认值和主题覆盖均使用 `:where(...)` 降为零优先级。消费方可用
`:root`、带 `data-wt-*` 的主题选择器或组件实例变量稳定覆盖内置值；仍建议在工具库
`style.css` 后加载消费方主题 CSS，但覆盖结果不依赖该加载顺序。

### 6.3 材质令牌

`material` 把当前色系候选值映射到最终公开表面、边框、阴影和遮罩。实体材质使用
`:where(:root)` 作为默认映射；玻璃材质只覆盖与材质有关的最终变量。玻璃不改变
`--wt-surface-page`，工具库不接管消费方页面背景。

玻璃候选值矩阵：

| 变量                       | Light                             | Dark                           |
| -------------------------- | --------------------------------- | ------------------------------ |
| `--wt-glass-bg`            | `rgb(255 255 255 / 56%)`          | `rgb(20 20 24 / 64%)`          |
| `--wt-glass-bg-strong`     | `rgb(255 255 255 / 72%)`          | `rgb(29 30 31 / 78%)`          |
| `--wt-glass-highlight`     | `rgb(255 255 255 / 55%)`          | `rgb(255 255 255 / 8%)`        |
| `--wt-glass-border`        | `rgb(255 255 255 / 52%)`          | `rgb(245 248 255 / 16%)`       |
| `--wt-glass-border-strong` | `rgb(255 255 255 / 72%)`          | `rgb(245 248 255 / 24%)`       |
| `--wt-glass-shadow-soft`   | `0 8px 24px rgb(15 23 42 / 10%)`  | `0 10px 30px rgb(0 0 0 / 36%)` |
| `--wt-glass-shadow`        | `0 18px 50px rgb(15 23 42 / 16%)` | `0 20px 56px rgb(0 0 0 / 52%)` |
| `--wt-glass-blur`          | `22px`                            | `22px`                         |
| `--wt-glass-saturation`    | `170%`                            | `150%`                         |
| 私有玻璃遮罩候选值         | `rgb(0 0 0 / 32%)`                | `rgb(0 0 0 / 62%)`             |

玻璃映射规则：

| 最终公开变量               | 玻璃来源                   |
| -------------------------- | -------------------------- |
| `--wt-surface-base`        | `--wt-glass-bg`            |
| `--wt-surface-raised`      | `--wt-glass-bg-strong`     |
| `--wt-surface-overlay`     | `--wt-glass-bg-strong`     |
| `--wt-border-color`        | `--wt-glass-border`        |
| `--wt-border-color-light`  | `--wt-glass-border`        |
| `--wt-border-color-strong` | `--wt-glass-border-strong` |
| `--wt-shadow-base`         | `--wt-glass-shadow-soft`   |
| `--wt-shadow-raised`       | `--wt-glass-shadow-soft`   |
| `--wt-shadow-overlay`      | `--wt-glass-shadow`        |
| `--wt-surface-mask`        | 当前色系私有玻璃遮罩候选值 |

滤镜规则：

```css
:where(:root[data-wt-material='glass']) {
  --wt-backdrop-filter: blur(var(--wt-glass-blur))
    saturate(var(--wt-glass-saturation));
  /* 半透明表面、玻璃描边、玻璃阴影映射 */
}
```

移除 glass 属性后自然回到实体默认映射。

## 7. 毛玻璃材质

### 7.1 视觉组成

参考样式中的毛玻璃效果由以下部分组成：

- 半透明底色。
- 顶部或局部径向高光。
- 半透明描边。
- 分层阴影。
- `backdrop-filter: blur(...) saturate(...)`。
- 明暗主题分别调整底色和高光强度。

工具库优先使用多层 `background` 表达高光，不把 `overflow: hidden` 和伪元素作为
所有组件的统一前提：

```css
background:
  radial-gradient(circle at 20% 0%, var(--wt-glass-highlight), transparent 34%),
  var(--wt-glass-bg);
```

这样可以减少 Dialog、Popover 和其他浮层出现内容裁剪、伪元素覆盖交互区域等问题。

### 7.2 使用前提

玻璃效果依赖组件背后存在可被模糊的壁纸、渐变或内容。工具库只负责组件表面效果，
不替消费方设置应用背景。纯色页面上浅色玻璃的表现可能较弱，因此同时提供
`glass-dark`，但暗色玻璃也不保证在所有纯色背景上产生明显景深。

### 7.3 变量

```css
--wt-glass-bg
--wt-glass-bg-strong
--wt-glass-highlight
--wt-glass-border
--wt-glass-border-strong
--wt-glass-shadow
--wt-glass-shadow-soft
--wt-glass-blur
--wt-glass-saturation
--wt-backdrop-filter
```

消费方通过 `--wt-glass-blur` 和 `--wt-glass-saturation` 调整强度，通过
`--wt-backdrop-filter: none` 完全关闭滤镜。组件级 backdrop-filter 变量默认引用该全局
变量，可以按实例覆盖。主题插件和 `useWtTheme()` 不增加模糊开关 API。

浏览器不支持 `backdrop-filter` 时，保留半透明表面、描边和阴影作为自然降级。

## 8. Element Plus 联动

`SuperButton`、`SuperDialog`、`SuperForm` 及表单字段复用 Element Plus。主题系统必须
协调 `--wt-*` 与 `--el-*`，否则玻璃背景、文字、输入框和 Teleport 面板会出现不一致。

### 8.1 黑白主题

- 不引入或复制 Element Plus 的完整暗色变量文件。
- WT 语义变量作为明暗主题的色值来源。
- `theme/index.scss` 将工具库实际使用的基础 `--el-*` 变量桥接至 `--wt-*`。
- 桥接选择器必须带 `data-wt-scheme`，降低 Element Plus 普通 `:root` 声明及样式加载
  顺序产生的覆盖风险。
- 未安装主题插件、根节点没有 `data-wt-scheme` 时，不主动接管消费方全局 Element Plus
  主题。

桥接统一写在以下选择器中：

```css
:root:is([data-wt-scheme='light'], [data-wt-scheme='dark']) {
  --el-bg-color: var(--wt-surface-base);
  --el-bg-color-page: var(--wt-surface-page);
  --el-bg-color-overlay: var(--wt-surface-overlay);
  --el-text-color-primary: var(--wt-text-primary);
  --el-text-color-regular: var(--wt-text-regular);
  --el-border-color: var(--wt-border-color);
  --el-fill-color-blank: var(--wt-surface-base);
}
```

桥接清单以工具库实际使用的 Element Plus 组件为边界，不试图覆盖 Element Plus 全组件
主题。文字、表面、圆角和禁用态使用以下直接映射：

| Element Plus                  | WT                        |
| ----------------------------- | ------------------------- |
| `--el-text-color-primary`     | `--wt-text-primary`       |
| `--el-text-color-regular`     | `--wt-text-regular`       |
| `--el-text-color-secondary`   | `--wt-text-secondary`     |
| `--el-text-color-placeholder` | `--wt-text-placeholder`   |
| `--el-text-color-disabled`    | `--wt-text-disabled`      |
| `--el-bg-color-page`          | `--wt-surface-page`       |
| `--el-bg-color`               | `--wt-surface-base`       |
| `--el-bg-color-overlay`       | `--wt-surface-overlay`    |
| `--el-fill-color-blank`       | `--wt-surface-base`       |
| `--el-border-radius-base`     | `--wt-radius-base`        |
| `--el-border-radius-small`    | `--wt-radius-small`       |
| `--el-disabled-bg-color`      | `--el-fill-color-light`   |
| `--el-disabled-text-color`    | `--wt-text-disabled`      |
| `--el-disabled-border-color`  | `--wt-border-color-light` |

`round` 和 `circle` 保留 Element Plus 的结构值。状态色对
`primary/success/warning/danger/info` 统一生成，`error` 与 `danger` 均来自
`--wt-color-danger`：

| Element Plus 后缀 | 计算方式                  |
| ----------------- | ------------------------- |
| `light-3`         | 基础色 70% + 混合表面 30% |
| `light-5`         | 基础色 50% + 混合表面 50% |
| `light-7`         | 基础色 30% + 混合表面 70% |
| `light-8`         | 基础色 20% + 混合表面 80% |
| `light-9`         | 基础色 10% + 混合表面 90% |
| `dark-2`          | 基础色 80% + 对比色 20%   |

例如：

```css
--el-color-primary-light-3: color-mix(
  in srgb,
  var(--wt-color-primary) 70%,
  var(--wt-palette-mix-surface)
);
```

Fill 从当前主文字与表面混合，比例固定为：

| Fill 层级     | Light | Dark |
| ------------- | ----: | ---: |
| `darker`      |   12% |  20% |
| `dark`        |   10% |  16% |
| 默认          |    7% |  12% |
| `light`       |    4% |   8% |
| `lighter`     |    2% |   4% |
| `extra-light` |    1% |   2% |

比例由 `light.scss` 和 `dark.scss` 的私有变量提供，最终通过
`color-mix(in srgb, var(--wt-text-primary) <比例>, var(--wt-surface-base))`
生成。玻璃材质因此会基于当前半透明表面生成交互填充。

边框层级固定映射为：

| Element Plus                    | 计算方式                           |
| ------------------------------- | ---------------------------------- |
| `--el-border-color-darker`      | `--wt-border-color-strong`         |
| `--el-border-color-dark`        | 强边框 60% + 基础边框 40%          |
| `--el-border-color`             | `--wt-border-color`                |
| `--el-border-color-light`       | `--wt-border-color-light`          |
| `--el-border-color-lighter`     | 弱边框 75% + 当前表面 25%          |
| `--el-border-color-extra-light` | 弱边框 50% + 当前表面 50%          |
| `--el-border-color-hover`       | `--wt-border-color-strong`         |
| `--el-border`                   | `1px solid var(--el-border-color)` |

阴影映射为：

| Element Plus              | WT                    |
| ------------------------- | --------------------- |
| `--el-box-shadow`         | `--wt-shadow-overlay` |
| `--el-box-shadow-light`   | `--wt-shadow-raised`  |
| `--el-box-shadow-lighter` | `--wt-shadow-base`    |
| `--el-box-shadow-dark`    | `--wt-shadow-overlay` |

Dialog 页面遮罩使用 `--wt-surface-mask`；Loading 等内容遮罩从当前组件表面派生：

```css
--el-overlay-color: var(--wt-surface-mask);
--el-overlay-color-light: var(--wt-surface-mask);
--el-overlay-color-lighter: var(--wt-surface-mask);
--el-popup-modal-bg-color: var(--wt-surface-mask);
--el-popup-modal-opacity: 1;
--el-mask-color: color-mix(in srgb, var(--wt-surface-base) 90%, transparent);
--el-mask-color-extra-light: color-mix(
  in srgb,
  var(--wt-surface-base) 30%,
  transparent
);
```

`--el-popup-modal-opacity` 固定为 `1`，避免 WT 遮罩自身透明度被重复计算。

内置 `--wt-*` 使用低优先级选择器，Element Plus 全局桥接则保留带 `data-wt-scheme` 的
正常优先级。消费方优先覆盖 WT 变量；确需脱离 WT 单独控制 `--el-*` 时，使用明确的
`data-wt-scheme` 选择器。

### 8.2 玻璃主题

Element Plus 没有通用的玻璃材质方案。工具库需要在明暗基础上增加玻璃覆盖：

1. 根节点提供应用级 Element Plus 表面、文字、描边和遮罩变量。
2. 工具库组件使用组件级 `--wt-*` 可选覆盖变量。
3. 对 Element Plus 没有变量入口的 `backdrop-filter`，使用范围明确的工具库稳定选择器
   补充。

例如：

```css
.super-form .el-input__wrapper,
.super-form .el-select__wrapper,
.super-form .el-textarea__inner {
  background: var(--wt-form-control-bg, var(--el-fill-color-blank));
  backdrop-filter: var(
    --wt-form-control-backdrop-filter,
    var(--wt-backdrop-filter, none)
  );
}
```

启用 WT 主题插件意味着接受其与消费方应用内 Element Plus 的全局明暗联动。这个影响
范围必须在 README 和主题文档中明确说明。SuperDialog、SuperPopover、SuperForm 内控件
和工具库注入稳定 class 的 Select、DatePicker 浮层可以增加玻璃滤镜；ElMessage、ElImage
Viewer 第一版只保证暗色配色和遮罩可读，不额外增加玻璃滤镜。消费方直接使用的原生
Element Plus 控件获得全局明暗配色联动，但不会被工具库选择器强制增加滤镜。

## 9. 组件变量规划

所有公开组件应提供与其视觉职责相匹配的 CSS 变量。变量采用以下固定解析顺序：

```text
公开组件变量
→ 私有状态或 effect 变量
→ 全局语义变量
→ 字面量兜底
```

公开组件变量使用 `--wt-*` 命名，私有中间变量使用 `--_wt-*` 命名。内置主题不为任何
公开组件变量设置默认值，组件根节点、状态 class 和 effect class 也不声明公开组件变量，
避免元素自身声明覆盖从 `:root` 继承的消费方配置。所有默认值只在实际 CSS 属性使用处
回退到私有状态变量、Element Plus 当前变体变量、语义变量或字面量。

例如 Popover 的背景按以下方式消费：

```css
.super-popover-floating {
  background: var(
    --wt-popover-bg,
    var(--_wt-popover-bg, var(--wt-surface-overlay, #fff))
  );
}

.super-popover-floating--dark {
  --_wt-popover-bg: #1f1f1f;
}
```

消费方可以在根节点、主题选择器或单个组件实例上覆盖公开变量。Teleport 到 `body` 的
浮层可以继承根节点变量，但不能继承原组件普通祖先上的实例变量；单个 Teleport 浮层继续
通过 `popperStyle` 或 `popperClass` 覆盖。

### 9.1 SuperIcon

```css
--wt-icon-color
--wt-icon-loading-color
--wt-icon-loading-duration
```

图标默认继续继承 `currentColor`。变量不能破坏字符串 sprite、Vue 图标组件和动态图标的
现有行为。

| 属性         | fallback                                              |
| ------------ | ----------------------------------------------------- |
| 普通颜色     | `--wt-icon-color → inherit`                           |
| loading 颜色 | `--wt-icon-loading-color → --wt-icon-color → inherit` |
| loading 时长 | `--wt-icon-loading-duration → 1.2s`                   |

### 9.2 SuperButton

```css
--wt-button-bg
--wt-button-color
--wt-button-border-color
--wt-button-hover-bg
--wt-button-hover-color
--wt-button-hover-border-color
--wt-button-active-bg
--wt-button-active-color
--wt-button-active-border-color
--wt-button-disabled-bg
--wt-button-disabled-color
--wt-button-disabled-border-color
--wt-button-shadow
--wt-button-radius
--wt-button-backdrop-filter
--wt-button-icon-size
--wt-button-icon-only-bg
--wt-button-icon-only-hover-bg
```

Element Plus 的 `type`、`plain`、`text`、`link` 等按钮状态必须继续生效。组件变量应通过
Element Plus 当前按钮变量作为 fallback，而不是把所有按钮强制绘制成同一种表面：

```css
.super-button.el-button {
  color: var(--wt-button-color, var(--el-button-text-color));
  background: var(--wt-button-bg, var(--el-button-bg-color));
  border-color: var(--wt-button-border-color, var(--el-button-border-color));
}
```

`theme/index.scss` 不为背景、文字、描边及交互状态等变体敏感的 WT 按钮变量设置统一实体
值；未设置时继续使用 Element Plus 当前变体。消费方主动设置这些 WT 变量时，视为明确
覆盖按钮变体外观。非 square 的纯图标按钮默认仍透明，可通过 icon-only 变量单独覆盖。

状态 fallback：

| 状态             | 背景                                                      | 文字                                                           | 边框                                                                    |
| ---------------- | --------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 默认             | `--wt-button-bg → --el-button-bg-color`                   | `--wt-button-color → --el-button-text-color`                   | `--wt-button-border-color → --el-button-border-color`                   |
| hover/focus      | `--wt-button-hover-bg → --el-button-hover-bg-color`       | `--wt-button-hover-color → --el-button-hover-text-color`       | `--wt-button-hover-border-color → --el-button-hover-border-color`       |
| active           | `--wt-button-active-bg → --el-button-active-bg-color`     | `--wt-button-active-color → --el-button-active-text-color`     | `--wt-button-active-border-color → --el-button-active-border-color`     |
| disabled/loading | `--wt-button-disabled-bg → --el-button-disabled-bg-color` | `--wt-button-disabled-color → --el-button-disabled-text-color` | `--wt-button-disabled-border-color → --el-button-disabled-border-color` |

其他属性：

| 属性         | fallback                                                    |
| ------------ | ----------------------------------------------------------- |
| 阴影         | `--wt-button-shadow → none`                                 |
| 圆角         | `--wt-button-radius → --el-border-radius-base → 4px`        |
| 滤镜         | `--wt-button-backdrop-filter → --wt-backdrop-filter → none` |
| 图标尺寸     | `--wt-button-icon-size → 20px`                              |
| 纯图标背景   | `--wt-button-icon-only-bg → transparent`                    |
| 纯图标 hover | `--wt-button-icon-only-hover-bg → transparent`              |

现有 `--wt-button-square` 继续作为 `square` prop 写入的内部实例变量，不作为公开主题
变量；按钮结构尺寸仍由组件 prop 控制。

### 9.3 SuperPopover

保留并扩展现有变量：

```css
--wt-popover-bg
--wt-popover-color
--wt-popover-border-color
--wt-popover-radius
--wt-popover-padding
--wt-popover-shadow
--wt-popover-backdrop-filter
--wt-popover-z-index
--wt-popover-max-width
```

`effect` 扩展为 `'auto' | 'dark' | 'light'`，默认值改为 `auto`：

- `auto` 在启用主题插件时跟随当前 `scheme + material`。
- `auto` 在未启用主题插件时回退到改造前的暗色实体外观。
- 显式 `dark` 或 `light` 强制使用对应的现有实体外观，不跟随全局材质。

`SuperIcon.effect` 同步扩展并默认 `auto`，确保其自动生成的 tooltip 能跟随全局主题。
第一版不增加 `glass`、`glass-dark` 或 `glass-light` 等 Popover 私有 effect；玻璃由全局
材质控制。

浮层节点补齐 `.super-popover-floating--auto`、`--dark`、`--light` 状态 class。这些状态
class 只声明 `--_wt-*` 私有中间变量。玻璃选择器只命中 `auto`，显式 `dark/light` 不应用
全局玻璃滤镜。

| 属性     | fallback                                                              |
| -------- | --------------------------------------------------------------------- |
| 背景     | `--wt-popover-bg → --_wt-popover-bg → #222`                           |
| 文字     | `--wt-popover-color → --_wt-popover-color → #fff`                     |
| 边框     | `--wt-popover-border-color → --_wt-popover-border-color → 当前背景`   |
| 阴影     | `--wt-popover-shadow → --_wt-popover-shadow → none`                   |
| 滤镜     | `--wt-popover-backdrop-filter → --_wt-popover-backdrop-filter → none` |
| 圆角     | `--wt-popover-radius → --wt-radius-base → 4px`                        |
| padding  | `--wt-popover-padding → 4px 6px`                                      |
| z-index  | `--wt-popover-z-index → 2000`                                         |
| 最大宽度 | `--wt-popover-max-width → 400px`                                      |

`auto` 在有插件时使用当前语义表面、边框、阴影和材质滤镜，无插件时使用暗色实体私有值；
显式 `light/dark` 使用固定实体私有值。玻璃 `auto` 使用径向高光与表面色组成多层背景，
箭头复用同一背景和边框链。

### 9.4 SuperDialog

```css
--wt-dialog-bg
--wt-dialog-color
--wt-dialog-border-color
--wt-dialog-radius
--wt-dialog-shadow
--wt-dialog-backdrop-filter
--wt-dialog-header-color
--wt-dialog-body-color
--wt-dialog-footer-border-color
```

Dialog 使用 Element Plus Teleport 到 `body`，主题变量应从根节点继承。毛玻璃背景优先
使用多层 `background`，避免统一增加可能裁剪内容的 `overflow: hidden`。

| 属性        | fallback                                                                  |
| ----------- | ------------------------------------------------------------------------- |
| 背景        | `--wt-dialog-bg → --_wt-dialog-bg → --el-dialog-bg-color`                 |
| 主文字      | `--wt-dialog-color → --wt-text-regular → --el-text-color-regular`         |
| 边框        | `--wt-dialog-border-color → --wt-border-color-light → transparent`        |
| 圆角        | `--wt-dialog-radius → --el-dialog-border-radius → --wt-radius-base → 4px` |
| 阴影        | `--wt-dialog-shadow → --wt-shadow-overlay → --el-dialog-box-shadow`       |
| 滤镜        | `--wt-dialog-backdrop-filter → --wt-backdrop-filter → none`               |
| 标题        | `--wt-dialog-header-color → --wt-text-primary → inherit`                  |
| 正文        | `--wt-dialog-body-color → --wt-dialog-color → --wt-text-regular`          |
| Footer 描边 | `--wt-dialog-footer-border-color → transparent`                           |

Footer 默认无描边，消费方设置变量后才显示顶部描边。玻璃材质通过私有背景变量增加多层
高光，不覆盖公开背景变量。

### 9.5 SuperForm

```css
--wt-form-label-color
--wt-form-label-required-color
--wt-form-control-bg
--wt-form-control-color
--wt-form-control-placeholder-color
--wt-form-control-border-color
--wt-form-control-hover-border-color
--wt-form-control-focus-border-color
--wt-form-control-disabled-bg
--wt-form-control-disabled-color
--wt-form-control-disabled-border-color
--wt-form-control-shadow
--wt-form-control-backdrop-filter
```

Input、Textarea、InputNumber、Radio、Checkbox、Switch、Select 和 DatePicker 优先共享
这一组表单语义变量，只有组件确有独立视觉职责时才增加字段专用变量。

| 属性        | fallback                                                               |
| ----------- | ---------------------------------------------------------------------- |
| Label       | `--wt-form-label-color → --el-text-color-regular`                      |
| 必填标记    | `--wt-form-label-required-color → --el-color-danger`                   |
| 控件背景    | `--wt-form-control-bg → --el-fill-color-blank`                         |
| 控件文字    | `--wt-form-control-color → --el-text-color-regular`                    |
| placeholder | `--wt-form-control-placeholder-color → --el-text-color-placeholder`    |
| 默认边框    | `--wt-form-control-border-color → --el-border-color`                   |
| hover 边框  | `--wt-form-control-hover-border-color → --el-border-color-hover`       |
| focus 边框  | `--wt-form-control-focus-border-color → --el-color-primary`            |
| 禁用背景    | `--wt-form-control-disabled-bg → --el-disabled-bg-color`               |
| 禁用文字    | `--wt-form-control-disabled-color → --el-disabled-text-color`          |
| 禁用边框    | `--wt-form-control-disabled-border-color → --el-disabled-border-color` |
| 阴影        | `--wt-form-control-shadow → none`                                      |
| 滤镜        | `--wt-form-control-backdrop-filter → --wt-backdrop-filter → none`      |

这些 fallback 直接用于实际 CSS 属性，不在同一元素上用 `--el-*` 回退到自身，避免自定义
属性循环依赖。内部字段组件增加稳定根 class 供 `SuperForm` 主题规则命中。

SuperForm 内部 Select 与 DatePicker 分别合并稳定浮层 class：

```text
wt-form-select-popper
wt-form-date-picker-popper
```

稳定 class 必须与消费方传入的 `popperClass` 合并，不得覆盖。根节点变量可以统一驱动
Teleport 内容；设置在单个 SuperForm 实例上的变量只影响其真实 DOM 后代，不跨 Teleport
复制。单个 Teleport 面板通过公开的 `popperClass` 定制，第一版不使用
`getComputedStyle()` 或运行时变量同步。

### 9.6 SuperFormUpload

```css
--wt-upload-trigger-bg
--wt-upload-trigger-color
--wt-upload-trigger-border-color
--wt-upload-trigger-hover-bg
--wt-upload-trigger-hover-color
--wt-upload-file-hover-bg
--wt-upload-image-border-color
--wt-upload-image-overlay-bg
--wt-upload-delete-bg
--wt-upload-delete-color
--wt-upload-radius
```

现有硬编码白色删除背景、黑色图片遮罩和过渡时间应迁移到变量，但不能改变远程/本地文件
所有权、预览、删除和 Object URL 生命周期逻辑。

| 属性         | fallback                                                                                |
| ------------ | --------------------------------------------------------------------------------------- |
| 选择入口背景 | `--wt-upload-trigger-bg → --wt-form-control-bg → --el-fill-color-blank`                 |
| 入口文字     | `--wt-upload-trigger-color → --el-text-color-secondary`                                 |
| 入口边框     | `--wt-upload-trigger-border-color → --wt-form-control-border-color → --el-border-color` |
| hover 背景   | `--wt-upload-trigger-hover-bg → --el-fill-color-light`                                  |
| hover 文字   | `--wt-upload-trigger-hover-color → --el-color-primary`                                  |
| 文件项 hover | `--wt-upload-file-hover-bg → --el-fill-color-light`                                     |
| 图片边框     | `--wt-upload-image-border-color → --el-border-color-lighter`                            |
| 图片数量遮罩 | `--wt-upload-image-overlay-bg → rgb(0 0 0 / 52%)`                                       |
| 删除背景     | `--wt-upload-delete-bg → --wt-surface-raised → rgb(255 255 255 / 72%)`                  |
| 删除颜色     | `--wt-upload-delete-color → --wt-color-danger`                                          |
| 圆角         | `--wt-upload-radius → 6px`                                                              |

### 9.7 SuperFormDialog

`SuperFormDialog` 是 `SuperDialog` 与 `SuperForm` 的组合，不重复建立同义变量。其主题由
Dialog、Form 和内部 Button 变量共同决定，仅在组合层出现独有视觉职责时再增加变量。
`SuperThemeSwitcher` 同样复用 Button、Popover 和 Form/Radio 变量，不增加同义变量。

## 10. 插件初始化

### 10.1 创建方式

主题采用“插件初始化，组合式函数控制”：

```ts
import { createWtTheme } from '@yyitian/web-toolkit';

const wtTheme = createWtTheme({
  scheme: 'light',
  material: 'solid',
  storage: false,
});

app.use(wtTheme);
```

配置类型：

```ts
export interface WtThemeOptions {
  scheme?: WtColorScheme;
  material?: WtMaterial;
  storage?: boolean;
}
```

不增加 `initial` 包装层。`scheme` 与 `material` 直接表达插件的初始化状态。

### 10.2 状态隔离

- 每次调用 `createWtTheme()` 创建独立响应式状态，内部使用单一
  `shallowRef<{ scheme, material }>` 保存完整状态。
- 插件通过 Vue `provide` 注入主题上下文。
- 不使用模块级可写单例，避免 SSR 请求间串状态。
- 服务端创建状态时不访问 `window`、`document`、`matchMedia` 或 `localStorage`。
- 浏览器端安装后再同步根节点 `data-*` 属性。
- 不检测同一 document 中的其他主题控制器，不维护全局控制器注册状态。

`setTheme()` 整体替换状态对象；`setScheme()`、`setMaterial()` 基于当前状态构造新对象，
避免两个 ref 依次修改时产生中间主题组合。DOM 属性与持久化监听使用 `flush: 'sync'`，
只响应一次完整状态。

### 10.3 初始化解析顺序

初始化解析顺序：

```text
storage=true 时，固定 key `wt-theme` 中的有效完整状态
→ createWtTheme({ scheme, material })
→ light + solid
```

初始化参数通过默认值直接形成完整状态，内部不设计部分主题状态。TypeScript 初始化配置
视为可信，运行时只校验不可信的 storage 对象。默认不开启持久化。若持久化数据缺字段、
字段非法、版本不支持或 JSON 无法解析，应整份忽略并使用完整初始化状态，不与初始化
配置合并，也不让应用启动失败。

### 10.4 持久化格式

持久化保存真实维度，不保存派生主题名：

```json
{
  "version": 1,
  "scheme": "dark",
  "material": "glass"
}
```

`storage` 默认值为 `false`，由消费方显式开启；开启后固定使用 `wt-theme`，第一版不开放
自定义 key。`setTheme()`、`setScheme()` 和 `setMaterial()` 均在状态变更后写入完整对象。
读取或写入 `localStorage` 失败时静默降级，不影响内存中的主题切换。

### 10.5 生命周期

DOM 与持久化监听放入独立 `effectScope()`。插件安装时记录根节点原有三个 `data-wt-*`
属性；通过 Vue 3.5 的 `app.onUnmount()` 停止监听，并把属性恢复为安装前的值。应用卸载
不清除 `localStorage`。

### 10.6 首屏应用边界

主题插件在 `app.use()` 阶段同步解析初始化参数与持久化状态，并在 `app.mount()` 前写入
根节点三个 `data-*` 属性。第一版不提供独立的 head 内联脚本生成器、SSR 主题脚本或
cookie 协议，接受页面 CSS 加载完成至应用 JavaScript 执行前可能出现的默认浅色窗口。

## 11. 组合式函数 API

### 11.1 基本用法

```ts
const { theme, scheme, material, setTheme, setScheme, setMaterial } =
  useWtTheme();

setTheme('dark', 'glass');
```

上下文类型：

```ts
export interface WtThemeContext {
  theme: ComputedRef<WtBuiltinTheme>;
  scheme: Readonly<Ref<WtColorScheme>>;
  material: Readonly<Ref<WtMaterial>>;

  setTheme(scheme: WtColorScheme, material: WtMaterial): void;

  setScheme(scheme: WtColorScheme): void;
  setMaterial(material: WtMaterial): void;
}
```

`setTheme()` 原子更新两个维度，适合自定义主题选择器；`setScheme()` 与
`setMaterial()` 保留另一个维度，适合两个独立控件。

### 11.2 未安装插件

组件树未安装主题插件时调用 `useWtTheme()` 应明确报错，不静默创建浏览器全局实例。
错误信息应指出需要先执行：

```ts
app.use(createWtTheme());
```

### 11.3 非目标 API

第一版不提供：

```ts
registerTheme();
unregisterTheme();
setTheme('custom-name');
```

消费方通过 `setTheme(scheme, material)` 自定义切换行为，通过 `--wt-*` 覆盖具体视觉。

## 12. 开箱即用组件

新增 `SuperThemeSwitcher`。不采用 `SuperThemeSwitch`，因为四种组合不是二态开关。

组件内部调用 `useWtTheme()`，不自行创建或持久化主题状态。

### 12.1 形态

```vue
<SuperThemeSwitcher variant="popover" />
<SuperThemeSwitcher variant="inline" />
```

- `popover`：用一个图标按钮悬停打开主题选项，适合导航栏和工具栏。
- `inline`：直接显示主题选项，适合设置页和演示页。

内部应组合已有 `SuperButton`、`SuperIcon` 和 `SuperPopover`，不直接复制它们的交互
逻辑。

两种形态复用同一份内容，不把四种组合硬编码成四个选项，而是使用两个
`SuperFormRadio` group 表达双轴状态：

```text
色系：浅色 / 暗色
材质：实体 / 毛玻璃
```

切换任一 Radio 时，通过 `setTheme()` 提交新维度与另一个当前维度。Popover 使用
`trigger="hover"`，选择后保持打开，继续沿用 `SuperPopover` 的悬停浮层关闭延迟。
Radio 自身已有 hover、active 和 focus 状态，不额外叠加 `.wt-interactive` 位移动效。
第一版只实现并验收桌面鼠标 hover 路径。

### 12.2 Props

```ts
export interface SuperThemeSwitcherProps {
  variant?: 'popover' | 'inline';
  disabled?: boolean;
  placement?: Placement;
}
```

默认使用 `variant="popover"` 和 `placement="bottom-end"`。第一版不提供 `v-model`、
自定义主题选项、trigger/options 插槽、`showLabel`、持久化 props、`change` 事件或
`teleportTo`；完全自定义切换界面时直接使用 `useWtTheme()`。

`disabled` 在 popover 形态下同时禁用 SuperButton 与 SuperPopover，已打开时立即关闭；
inline 形态下同时禁用两个 SuperFormRadio group。`placement` 在 inline 形态下忽略。

## 13. 通用交互动效

### 13.1 开放方式

参考 `.ui-interactive`，在工具库中使用自身命名空间：

```css
.wt-interactive
```

同时通过公开 SCSS mixin 提供：

```scss
@include interactive();
```

二者共享变量：

```css
--wt-interactive-hover-transform
--wt-interactive-active-transform
--wt-interactive-hover-border-color
--wt-interactive-hover-shadow
--wt-interactive-hover-filter
--wt-interactive-transition
```

`interactive()` 第一版直接定义在 `src/styles/mixin/index.scss`。现有通用 mixin 自动生成
的 class 保持原名；`interactive` 属于定制视觉能力，由 `src/styles/class/index.scss`
在生成阶段单独映射为 `.wt-interactive`。消费方不需要额外引入 theme 或 class 文件，
编译后的 class 统一进入 `style.css`，mixin 继续由 `webToolkitPlugin()` 注入。

工具类生成器继续为专用循环输出 flex gap 和字号变体。`font` 不再从通用生成阶段排除，
因此同时存在使用默认 14px 参数的 `.font` 与显式 `.font-14`；已经由专用逻辑生成同名
基础 class 的 flex mixin 仍需避免重复输出。

### 13.2 交互行为

默认效果参考：

```css
.wt-interactive:hover {
  transform: translateY(-2px);
}

.wt-interactive:active {
  transform: translateY(0) scale(0.98);
}
```

必须提供 `prefers-reduced-motion: reduce` 降级，移除位移、缩放和滤镜，只保留必要的
颜色、描边和透明度过渡。

`interactive()` 会接管应用节点的 `transform`；同一节点存在其他 transform 需求时不应
同时使用该 mixin 或 class。交互选择器排除 `:disabled` 与 `[aria-disabled='true']`。

### 13.3 项目内使用边界

第一版接入点：

- `SuperFormUpload` 图片选择入口。
- `SuperFormUpload` 文件选择按钮。
- `SuperFormUpload` 已选择图片项。
- `SuperFormUpload` 已选择文件列表项。

已选择图片内部原有的 hover 放大效果同步删除，由图片项外层交互动效统一表达反馈。

## 14. 公开导出与样式入口

`lib/main.ts` 公开导出：

```ts
createWtTheme;
useWtTheme;
SuperThemeSwitcher;
```

以及相关公开类型：

```ts
WtColorScheme;
WtMaterial;
WtBuiltinTheme;
WtThemeOptions;
WtThemeContext;
SuperThemeSwitcherProps;
```

`src/styles/index.scss` 统一加载 theme 与 class，主题基础变量、组件变量、现有通用工具类
和 `.wt-interactive` 均进入发布样式
`@yyitian/web-toolkit/style.css`。SCSS `interactive()` mixin 需要通过现有
`@yyitian/web-toolkit/styles/mixin` 子路径开放。

消费方仍必须显式引入：

```ts
import '@yyitian/web-toolkit/style.css';
```

本次主题功能不会移除这一要求。

## 15. 变更边界

- 未安装 `createWtTheme()` 插件时，各组件保持现有默认表现。
- 本次允许 CSS 变量协议发生破坏式更新，旧变量直接删除。
- `SuperButton` 继续透传 Element Plus 按钮能力。
- `SuperIcon` 的字符串图标、Vue 组件图标、loading 和动态图标行为保持不变。
- `SuperPopover` 继续默认 Teleport 到 `body`，不恢复参考节点包装 DOM。
- `SuperForm` 和 `SuperFormDialog` 的数据、校验、提交及 draft 语义不因主题功能改变。
- `SuperFormUpload` 的远程/本地值、预览和资源释放行为不因视觉重构改变。
- CSS 变量覆盖应优先于新增大量视觉 props。

## 16. 文档与演示

已同步更新：

- README：插件安装、样式引入和最小切换示例。
- 主题指南：四种内置组合、变量清单、Element Plus 影响范围和玻璃背景前提。
- `SuperThemeSwitcher` 组件文档。
- 文档站实时主题切换示例。
- `src/App.vue` 或文档演示中展示四种主题下的 Button、Popover、Dialog、Form 和 Upload。

文档示例需要同时覆盖自定义 UI：

```vue
<script setup lang="ts">
import { useWtTheme } from '@yyitian/web-toolkit';

const { setTheme } = useWtTheme();
</script>

<template>
  <button @click="setTheme('dark', 'glass')">使用暗色毛玻璃</button>
</template>
```

## 17. 验证要求

验证命令：

```bash
pnpm lint
pnpm build
pnpm docs:build
pnpm verify:theme
```

`verify:theme` 使用可重复执行的生命周期验证脚本，不引入完整测试框架，至少覆盖：

1. 有效 storage 完整覆盖初始化状态。
2. 缺字段、字段非法、版本不支持及无法解析的 storage 被整份忽略。
3. storage 读取或写入异常时，内存主题状态仍可正常切换。
4. `setTheme()` 原子替换 scheme 与 material，根节点三个属性只同步最终组合。
5. 应用卸载后停止监听并恢复安装前的根节点属性，不清除 storage。
6. 未安装插件时调用 `useWtTheme()` 明确报错。

静态检查不能替代真实浏览器验证。浏览器验收应覆盖：

1. 四种主题组合均可切换。
2. 自定义按钮调用 `setTheme(scheme, material)` 能驱动现成切换组件同步更新。
3. 刷新后的持久化行为符合最终约定。
4. Dialog、Popover、Select 和 DatePicker 的 Teleport 内容主题正确。
5. Input、Textarea、Radio、Checkbox、Switch、Upload 等表单控件对比度可用。
6. 玻璃主题在有背景图、浅色背景和暗色背景下均无明显可读性问题。
7. 暗色切回浅色后，Element Plus 变量和根节点 `data-*` 状态正确。
8. `prefers-reduced-motion` 下交互动效正确降级。
9. 消费方覆盖组件变量后，不需要依赖组件内部 DOM 选择器。
10. 未安装主题插件时，组件仍有完整可用的默认样式。
11. SuperPopover 与带 title 的 SuperIcon 按以下矩阵验收：

| 插件状态      | `effect` | 预期                 |
| ------------- | -------- | -------------------- |
| 未安装        | `auto`   | 暗色实体，保持旧默认 |
| light + solid | `auto`   | 浅色实体             |
| dark + solid  | `auto`   | 暗色实体             |
| light + glass | `auto`   | 浅色玻璃             |
| dark + glass  | `auto`   | 暗色玻璃             |
| 任意全局主题  | `light`  | 浅色实体             |
| 任意全局主题  | `dark`   | 暗色实体             |

## 18. 实现内容与需求边界

### 18.1 实现内容

1. 建立主题类型、主题上下文和 `createWtTheme()` Vue 插件。
2. 实现 `useWtTheme()` 组合式函数及主题状态同步。
3. 实现根节点 `data-*` 属性、`color-scheme` 和 Element Plus 变量联动。
4. 建立新的全局语义变量并删除旧变量。
5. 调整 `src/styles/index.scss`、库入口与本地演示入口，正式发布现有通用工具类。
6. 本地 Vite 配置改用 `webToolkitPlugin()` 注入 mixin，并避免注入空 SVG sprite。
7. 为公开组件补齐与视觉职责匹配的 CSS 变量。
8. 为 Form/Dialog 和 Teleport 控件完成 Element Plus 明暗/玻璃适配。
9. 实现 `SuperThemeSwitcher` 并从 `lib/main.ts` 导出。
10. 开放 `.wt-interactive` 和 `interactive()` mixin。
11. 在确认范围内小规模接入交互动效，并移除图片项内部旧 hover 放大。
12. 增加并运行主题生命周期验证脚本。
13. 更新 README、主题指南、组件文档和演示。
14. 完成 lint、build、docs build 和真实浏览器验收。

### 18.2 明确边界

- 第一版只支持 `light/dark × solid/glass` 四种组合。
- 第一版不内置系统主题跟随，也不把 `system` 作为 `scheme` 可选值。
- 自定义切换通过 `setTheme(scheme, material)` 完成。
- 自定义视觉通过 CSS 变量完成，不提供命名主题注册中心。
- 旧版全局 CSS 变量直接删除，不提供兼容别名。
- 插件负责初始化，组合式函数负责组件内控制。
- 插件在 `app.use()` 阶段同步应用主题，不提供独立首屏初始化脚本。
- 主题视觉效果作用于 document 根节点，不实现局部 ThemeProvider，也不检测或协调同一
  document 中的多个主题控制器。
- 消费方继续只引入 `@yyitian/web-toolkit/style.css`；该入口正式包含现有通用工具类和
  `.wt-interactive`，不包含 reset。
- `SuperThemeSwitcher` 的 Popover 第一版只覆盖桌面鼠标 hover 操作。
- 毛玻璃不会自动设置页面背景。
- 不为了统一动效而覆盖所有组件现有 `transform` 和过渡。
- 不改变组件数据协议、事件语义和核心交互流程。
