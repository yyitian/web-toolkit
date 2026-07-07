# 成品动态图标实现计划

> **给代理执行者的要求：** 实现本计划时必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，并按任务逐项执行。步骤使用复选框语法，便于跟踪进度。

**目标：** 新增 `DynamicAudioLines` 和 `DynamicChevronLeft` 两个成品动态图标，并通过 `@yyitian/web-toolkit/dynamic-icons` 导出。

**架构：** 沿用现有 `DynamicPin` 模式：每个动态图标都是独立 Vue SFC，使用 `defineOptions({ dynamicIcon: true })` 标记，只声明 `active?: boolean`，其余 attrs 透传给 lucide 根组件。`SuperIcon` 不需要改动，继续负责识别 `dynamicIcon` 并透传 `active`。

**技术栈：** Vue 3 SFC、TypeScript、`@lucide/vue`、scoped CSS、pnpm、Vite library build。

---

## 文件结构

- 新建：`src/components/SuperIcon/dynamic-icons/DynamicAudioLines.vue`
  - 基于 lucide `AudioLines` 表达播放中状态。
  - `active=false` 静态显示，`active=true` 时内部声波线错峰呼吸。
- 新建：`src/components/SuperIcon/dynamic-icons/DynamicChevronLeft.vue`
  - 基于 lucide `ChevronLeft` 表达展开收起状态。
  - `active=false` 向左，`active=true` 旋转到 `-90deg`，视觉等价向下。
- 修改：`lib/dynamic-icons.ts`
  - 增加两个成品动态图标的子路径导出。

本次不修改 `SuperIcon`、`SuperButton`、`SuperPopover`、Vite 插件或主题样式。

---

### 任务 1：新增 DynamicAudioLines

**文件：**
- 新建：`src/components/SuperIcon/dynamic-icons/DynamicAudioLines.vue`

- [x] **步骤 1：查看现有动态图标模式**

运行：

```bash
sed -n '1,220p' src/components/SuperIcon/dynamic-icons/DynamicPin.vue
```

预期：输出包含 `defineOptions({ dynamicIcon: true })`、`defineProps<{ active?: boolean }>()`，并且 lucide 组件作为根组件接收 `size` 等 attrs。

- [x] **步骤 2：创建 `DynamicAudioLines.vue`**

写入完整文件：

```vue
<script setup lang="ts">
import { AudioLines } from '@lucide/vue';

defineOptions({ dynamicIcon: true });
// 只声明 active，避免它透传到 svg；size 等其余 attrs 默认透传到根组件 AudioLines
defineProps<{ active?: boolean }>();
</script>

<template>
  <component :is="AudioLines" :class="{ active }" />
</template>

<style scoped>
:deep(svg.active path:nth-of-type(1)),
:deep(svg.active path:nth-of-type(6)) {
  animation: super-icon-audio-lines-wave 0.78s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

:deep(svg.active path:nth-of-type(2)),
:deep(svg.active path:nth-of-type(5)) {
  animation: super-icon-audio-lines-wave 0.78s ease-in-out 0.14s infinite;
  transform-box: fill-box;
  transform-origin: center;
}

:deep(svg.active path:nth-of-type(3)),
:deep(svg.active path:nth-of-type(4)) {
  animation: super-icon-audio-lines-wave 0.78s ease-in-out 0.28s infinite;
  transform-box: fill-box;
  transform-origin: center;
}

@keyframes super-icon-audio-lines-wave {
  0%,
  100% {
    transform: scaleY(0.58);
    opacity: 0.45;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>
```

- [x] **步骤 3：运行构建验证**

运行：

```bash
pnpm build
```

预期：构建退出码为 0。若失败信息显示 `AudioLines` 不能从 `@lucide/vue@1.18.0` 导入，停止执行并向用户报告完整编译错误，不直接改用其他图标名。

- [x] **步骤 4：提交 DynamicAudioLines**

运行：

```bash
git add src/components/SuperIcon/dynamic-icons/DynamicAudioLines.vue
git commit -m "feat: add dynamic audio lines icon"
```

预期：提交成功，提交内容只包含 `DynamicAudioLines.vue`。

---

### 任务 2：新增 DynamicChevronLeft

**文件：**
- 新建：`src/components/SuperIcon/dynamic-icons/DynamicChevronLeft.vue`

- [x] **步骤 1：创建 `DynamicChevronLeft.vue`**

写入完整文件：

```vue
<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue';

defineOptions({ dynamicIcon: true });
// 只声明 active，避免它透传到 svg；size 等其余 attrs 默认透传到根组件 ChevronLeft
defineProps<{ active?: boolean }>();
</script>

<template>
  <component :is="ChevronLeft" class="super-icon-chevron-left" :class="{ active }" />
</template>

<style scoped>
.super-icon-chevron-left {
  transition: transform 0.2s ease;
  transform-origin: center;
}

.super-icon-chevron-left.active {
  transform: rotate(-90deg);
}
</style>
```

- [x] **步骤 2：运行构建验证**

运行：

```bash
pnpm build
```

预期：构建退出码为 0，`ChevronLeft` 能从 `@lucide/vue` 正确导入。

- [x] **步骤 3：提交 DynamicChevronLeft**

运行：

```bash
git add src/components/SuperIcon/dynamic-icons/DynamicChevronLeft.vue
git commit -m "feat: add dynamic chevron left icon"
```

预期：提交成功，提交内容只包含 `DynamicChevronLeft.vue`。

---

### 任务 3：导出新增动态图标

**文件：**
- 修改：`lib/dynamic-icons.ts`

- [x] **步骤 1：替换 `lib/dynamic-icons.ts` 为完整导出**

写入完整文件：

```ts
export { default as DynamicPin } from '@/components/SuperIcon/dynamic-icons/DynamicPin.vue';
export { default as DynamicAudioLines } from '@/components/SuperIcon/dynamic-icons/DynamicAudioLines.vue';
export { default as DynamicChevronLeft } from '@/components/SuperIcon/dynamic-icons/DynamicChevronLeft.vue';
```

- [x] **步骤 2：运行 lint**

运行：

```bash
pnpm lint
```

预期：lint 退出码为 0。

- [x] **步骤 3：运行生产构建**

运行：

```bash
pnpm build
```

预期：构建退出码为 0，并生成包含两个新增导出的 `dist/dynamic-icons.js` 和类型声明。

- [x] **步骤 4：检查构建产物包含新增导出**

运行：

```bash
rg "DynamicAudioLines|DynamicChevronLeft" dist
```

预期：输出同时包含 `DynamicAudioLines` 和 `DynamicChevronLeft`。

- [x] **步骤 5：提交导出入口**

运行：

```bash
git add lib/dynamic-icons.ts
git commit -m "feat: export new dynamic icons"
```

预期：提交成功，提交内容只包含 `lib/dynamic-icons.ts`。

---

### 任务 4：最终验证

**文件：**
- 读取：`src/components/SuperIcon/index.vue`
- 读取：`src/components/SuperIcon/dynamic-icons/DynamicAudioLines.vue`
- 读取：`src/components/SuperIcon/dynamic-icons/DynamicChevronLeft.vue`
- 读取：`lib/dynamic-icons.ts`

- [x] **步骤 1：确认 `SuperIcon` 的 active 透传仍匹配新组件**

运行：

```bash
sed -n '1,180p' src/components/SuperIcon/index.vue
```

预期：`renderComponentIcon` 会检查 `(icon as Record<string, unknown>)?.dynamicIcon === true`，且只对动态图标传入 `{ active: props.active }`。

- [x] **步骤 2：最终 lint**

运行：

```bash
pnpm lint
```

预期：lint 退出码为 0。

- [x] **步骤 3：最终构建**

运行：

```bash
pnpm build
```

预期：构建退出码为 0。

- [x] **步骤 4：检查工作区**

运行：

```bash
git status --short
```

预期：没有已跟踪的实现文件残留未提交。早前流程可能留下未跟踪的 `.superpowers/` 视觉辅助文件和 `AGENTS.md`，除非用户明确要求，不要把它们加入实现提交。

