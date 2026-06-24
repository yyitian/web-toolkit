# 待办积压(超出本次范围的 TODO)

本文件记录在「代码质量优化 + GitHub Packages 发布配置」(见 `specs/2026-06-17-publish-and-code-quality-design.md`)执行过程中,被明确判定为**超出本次范围**、留待以后处理的事项。每条注明背景与原因,便于将来单独开 spec/plan 推进。

## 1. SuperIcon 按需加载 lucide 图标(根治打包体积)

- **背景:** `src/components/SuperIcon/index.vue` 用 `import * as LucideIcons from '@lucide/vue'` + `Reflect.get(LucideIcons, name)` 动态按名取图标。这种写法**无法 tree-shake**,会把 lucide 全量(约 790KB)带入打包结果。
- **本次处置:** 把 `@lucide/vue` 设为 external 可选 peer(见发布配置),让 790KB 不进入我们发布的包;但消费方若用图标功能,其 app 仍会因动态访问而带入全部 lucide——**体积问题只是转移,未根治**。
- **真正的解法(待办):** 重构图标加载为「按需」,例如:按图标名做动态 `import()`、改为消费方显式传入图标组件、或维护一个显式注册表。属于改变组件行为/API 的重构。
- **优先级:** 中(影响所有使用 SuperIcon lucide 功能的消费方 app 体积)。

## 2. SuperButton 脱离 element-plus(零依赖)

- **背景:** `src/components/SuperButton/index.vue` 内部包裹 `ElButton`,因此 `element-plus` 成为(可选)peer;消费方未装 element-plus 时 `SuperButton` 不可用。
- **本次处置:** `element-plus` 标记为可选 peer;`SuperIcon`/`SuperPopover` 不受影响。
- **待办:** 若希望 `SuperButton` 也能零依赖独立渲染,用原生 `<button>` 重写,去掉 element-plus 依赖。属于改变行为的重构。
- **优先级:** 低(取决于是否真有「无 element-plus 项目要用 SuperButton」的需求)。

## 3. 引入单元测试

- **背景:** 项目当前**无任何测试框架**。
- **本次处置:** 明确不在本次范围(发布配置 + 类型规范优先)。
- **待办:** 为一个会长期跨项目复用的组件库引入 Vitest + Vue Test Utils,至少覆盖三个组件的核心渲染/交互,改组件时防回归。
- **优先级:** 中高(库被多项目依赖后,回归风险随之上升)。

---

> 维护提示:本次范围内已完成项见 `plans/2026-06-17-publish-and-code-quality.md`。以上每条将来推进时,各自走独立的 spec → plan → 实现循环。
