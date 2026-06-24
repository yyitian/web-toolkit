# 可靠性修复清单（2026-06-23）

基于对当前代码（非 CLAUDE.md 描述）的架构评估。构建/类型/lint 链路本身已可靠，本清单聚焦**测试缺失**与**使用方踩坑点**。按优先级从高到低排序。

> 状态图例：☐ 待办 / ☑ 已完成 / ⊘ 本轮不做（已决策）
>
> **2026-06-24 处置批次**：逐项讨论后，本轮完成 2/3/4(部分)/5/6/7；P0-1 留下一轮单独做；P1-4 的 `<Teleport>`、P1-5 的 SuperButton 子路径拆分明确不做（理由见各项）。

---

## P0 — 影响发布质量 / 静默失败

### ☐ 1. 补齐测试框架与核心组件测试（本轮不做，留待下一轮单独进行）

- **问题**：仓库无任何测试，`SuperIcon` 的渲染分支（string→sprite / Component→lucide / dynamicIcon / loading）与 `SuperPopover` 箭头反向定位均为非平凡逻辑，重构无回归保护。
- **落地**：
  - 引入 `vitest` + `@vue/test-utils` + `jsdom`，加 `pnpm test` / `test:run` 脚本。
  - 用例覆盖：`SuperIcon` 四条渲染分支、`title` 时包裹 `SuperPopover`、`loading` 渲染内联 spinner；`SuperPopover` 的 `placementMap` 与 `arrowInnerBorderHidden` 映射；`SuperButton` 的 `isDisabled`（loading||disabled）与 `renderIcon` 空值短路。
  - 更新 CLAUDE.md「仓库没有测试框架」的表述。
- **验收**：`pnpm test:run` 通过，核心分支有断言覆盖。

### ☑ 2. 声明 `package.json` 的 `sideEffects`（已完成）

- **问题**：`lib/main.ts` 顶部 `import '@/styles/theme.css'` 使入口带副作用；`index.js` 是三组件合并的单一 chunk。未声明 `sideEffects` 时，使用方只 `import { SuperPopover }` 也可能无法 tree-shake 掉 `SuperButton`/`SuperIcon` 及其对 element-plus 的引用。
- **落地**：在 `package.json` 增加 `"sideEffects": ["**/*.css", "**/*.scss"]`。
- **验收**：使用方只引一个组件时，打包产物不含其余组件代码（可用 `rollup` 体积或手动验证）。

### ☑ 3. 强化「必须引入 style.css」约束，避免组件静默隐形（已完成，采纳文档方案）

- **问题**：`theme.css` 经 `cssFileName` 抽到独立 `dist/style.css`，JS 不再自动注入。使用方若忘记 `import '@yyitian/web-toolkit/style.css'`，`--wt-color-bg-inverse` 等变量全部 undefined → popover 透明、边框消失，且无任何报错。
- **落地**（择一或叠加）：
  - README 顶部「快速开始」醒目标注必须 `import '@yyitian/web-toolkit/style.css'`。
  - 或在主入口保留对 theme 的副作用注入路径（评估与抽取策略的取舍）。
- **验收**：文档明确，或缺失样式时有可感知的降级表现。

---

## P1 — 交互可靠性 / API 一致性

### ☑ 4. 修复 `SuperPopover` 的浮层裁剪与定位时机（部分完成；Teleport 决定不做）

- **问题**（`src/components/SuperPopover/index.vue`）：
  - 浮层渲染在 `display:contents` 容器内、未 `<Teleport>` → 任意 `overflow:hidden` 祖先都会裁剪它。
  - `useFloating` 未配 `whileElementsMounted: autoUpdate` → 打开期间滚动/缩放不重新定位。
  - 无开/关延迟，纯 `mouseenter/leave` → 移入带 `content` slot 的浮层时闪烁/消失。
- **落地**（已完成）：`useFloating` 加 `strategy: 'fixed'` + `whileElementsMounted: autoUpdate`；加 120ms 关闭延迟、浮层自身绑定 `mouseenter/leave` 以支持鼠标移入交互内容。
- **决策：不做 `<Teleport to="body">`**。本组件主题靠 DOM 继承——浮层作为单根 `.super-popover` 的后代继承 `--wt-popover-*`，消费方 class 覆盖才生效；Teleport 到 body 会切断继承、砸掉二开能力。改用 `strategy: 'fixed'` 已能逃出多数 `overflow:hidden` 祖先的裁剪。残留风险：含 `transform/filter/perspective` 的祖先仍可能裁剪 fixed 浮层，此场景暂不覆盖。
- **验收**：滚动/缩放时跟随；鼠标移入浮层不闪烁；二开变量覆盖仍生效。

### ☑ 5. 澄清 optional peer 与硬依赖的不一致（已完成文档侧；子路径拆分不做）

- **问题**：`element-plus`/`@lucide/vue` 标记为 optional peer，但 `SuperButton` 硬 `import { ElButton }` 且总是从主入口导出；`DynamicPin` 硬依赖 `@lucide/vue`。"可选"语义有误导——用到对应组件就必须装。
- **落地**（已完成）：README 安装段加「依赖矩阵」表格 + 「可选=没用到就不用装、用到即硬性」说明。
- **决策：不做 SuperButton 子路径拆分**。改动面大、收益有限(element-plus 已是 external，不进产物；配合 P0-2 的 `sideEffects` 后未用到 SuperButton 时其 import 可被消费方摇掉)，暂不拆。
- **验收**：依赖矩阵在文档中明确。

### ☑ 6. 处理 `SuperIcon` 负向 rotate 被静默忽略（已完成）

- **问题**（`src/components/SuperIcon/index.vue:67`）：`!props.loading && props.rotate >= 0 && transform`，`rotate >= 0` 守卫使任何负角度（如 `-90`）直接不应用变换且无提示。
- **落地**：若应支持负角度，去掉 `>= 0` 守卫（仅判断 `!loading`）；若刻意不支持，在 prop 类型/文档说明。
- **验收**：行为与文档一致。

---

## P2 — 文档与协作可靠性

### ☑ 7. 更新 CLAUDE.md，使其与现状一致（已完成；测试框架表述待 P0-1 落地后再改）

- **问题**：CLAUDE.md「图标系统（双轨）」描述已脱节：
  - 文档称传 `lucide="Pin"`，实际为单一 `icon` prop（string=sprite / Component=lucide 或 dynamic）。
  - 文档称 `icon-preset.ts` 提供叠加动画路径——该文件已不存在，叠加动画现由 `dynamic-icons/DynamicPin.vue` + `defineOptions({ dynamicIcon: true })` 实现。
  - 文档称 loading 渲染 lucide `Loader`，实际为内联 SVG spinner（`SuperIcon` 不再依赖 lucide Loader）。
  - 文档称 `SuperButton` 以 `lucide-` 前缀区分图标来源，实际 `SuperButton` 直接透传 `icon: string | Component` 给 `SuperIcon`，无前缀逻辑。
  - 「仓库没有配置测试框架」需随 P0-1 一并更新。
- **落地**：改写「图标系统」「组件组合关系」「常用命令」相关段落，对齐当前实现。
- **验收**：CLAUDE.md 描述与代码逐条一致。

---

## 附：本次评估已确认正常的项（无需修复）

- `pnpm build`（vue-tsc + 两段 vite build）、`pnpm lint` 均通过。
- `package.json` 的 `exports` 与产物声明路径完全对应（`dist/lib/main.d.ts`、`dist/vite.plugin.d.ts`、`dist/lib/dynamic-icons.d.ts` 均存在）。
- `files` 含 `src/styles`，`./styles/mixin` 指向源码 scss，mixin 跨项目共享链路正常。
- 构建期 `${NODE_AUTH_TOKEN}` 警告仅在本地无 token 时出现，发布（CI）环境注入后即消失，属预期。
