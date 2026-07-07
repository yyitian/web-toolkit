# 新增成品动态图标设计

日期：2026-07-07

## 背景

当前组件库已有 `DynamicPin` 成品动态图标，模式是：

- 图标组件放在 `src/components/SuperIcon/dynamic-icons/`。
- 使用 `defineOptions({ dynamicIcon: true })` 标记为动态图标。
- 只声明 `active?: boolean`，让 `SuperIcon` 检测到动态图标后透传 `active`。
- 通过 `lib/dynamic-icons.ts` 子路径导出。

本次新增两个成品动态图标：

- 音频播放状态图标。
- 展开收起状态图标。

## 目标

1. 提供 `DynamicAudioLines`，用于表达音频或音乐正在播放。
2. 提供 `DynamicChevronLeft`，用于表达展开/收起方向切换。
3. 沿用现有动态图标架构，不修改 `SuperIcon` 的 `icon` prop 设计和 active 透传机制。
4. 新增图标通过 `@yyitian/web-toolkit/dynamic-icons` 子路径导出。

## 非目标

- 不新增新的 `SuperIcon` prop。
- 不修改 sprite 图标机制。
- 不把 `SuperPopover`、`SuperButton` 或 Vite 插件纳入本次改动。
- 不手写替代 lucide 的正式 SVG 图标源。

## 设计方案

### DynamicAudioLines

新增文件：

```text
src/components/SuperIcon/dynamic-icons/DynamicAudioLines.vue
```

组件基于 `@lucide/vue` 的 `AudioLines`：

```ts
import { AudioLines } from '@lucide/vue';
```

行为：

- `active=false` 或未传时，渲染静态 `AudioLines`。
- `active=true` 时，内部声波线做错峰呼吸动画，表达“正在播放”。
- 动画优先使用 CSS 选择器作用于 lucide 渲染出的内部 `path`，不维护一份手写 SVG 作为正式图标源。
- `size` 等其他 attrs 继续透传到根 lucide 组件，保持与 `DynamicPin` 一致。

动效建议：

- 使用约 `0.78s` 的 `ease-in-out` 循环。
- 不同声波线设置轻微 delay。
- 通过 `scaleY` 和 `opacity` 变化表达音频波形起伏。
- inactive 状态完全停止动画，避免静止状态仍有视觉噪声。

实现注意：

- Vue scoped 样式下，选择 lucide 内部路径需要使用 `:deep(...)`。
- 若 `AudioLines` 的 path 数量或顺序与预期不同，应以构建结果和浏览器实际 DOM 为准微调选择器。
- 当前仓库没有安装 `node_modules`，实现后必须通过安装依赖或现有环境执行 `pnpm build` 验证 `AudioLines` 是否在当前 `@lucide/vue@1.18.0` 中可用。

### DynamicChevronLeft

新增文件：

```text
src/components/SuperIcon/dynamic-icons/DynamicChevronLeft.vue
```

组件基于 `@lucide/vue` 的 `ChevronLeft`：

```ts
import { ChevronLeft } from '@lucide/vue';
```

行为：

- `active=false` 或未传时，保持 `ChevronLeft`。
- `active=true` 时，过渡到 `rotate(-90deg)`，视觉等价于 `ChevronDown`。
- 使用 CSS `transition: transform 0.2s ease`。
- 旋转应发生在该动态图标组件内部，消费方无需使用 `SuperIcon` 的 `rotate` prop。

## 导出

更新：

```text
lib/dynamic-icons.ts
```

新增：

```ts
export { default as DynamicAudioLines } from '@/components/SuperIcon/dynamic-icons/DynamicAudioLines.vue';
export { default as DynamicChevronLeft } from '@/components/SuperIcon/dynamic-icons/DynamicChevronLeft.vue';
```

保留现有 `DynamicPin` 导出。

## 使用示例

```ts
import { DynamicAudioLines, DynamicChevronLeft } from '@yyitian/web-toolkit/dynamic-icons';
```

```vue
<SuperIcon :icon="DynamicAudioLines" :active="isPlaying" />
<SuperIcon :icon="DynamicChevronLeft" :active="isExpanded" />
```

也可通过 `SuperButton` 透传：

```vue
<SuperButton :icon="DynamicAudioLines" :active="isPlaying" />
<SuperButton :icon="DynamicChevronLeft" :active="isExpanded" />
```

## 验证

实现完成后执行：

```bash
pnpm lint
pnpm build
```

重点确认：

- `AudioLines` 和 `ChevronLeft` 能从 `@lucide/vue` 正确导入。
- `DynamicAudioLines` inactive 时静止，active 时声波线错峰呼吸。
- `DynamicChevronLeft` inactive 时向左，active 时平滑旋转为向下。
- `lib/dynamic-icons.ts` 的子路径导出类型和构建产物正常。

## 视觉反馈记录

本次 brainstorming 使用了浏览器视觉辅助。早期预览为了快速展示动效手写了近似 `AudioLines` SVG，并且出现了背景、图标、说明文字对比度不足的问题。后续视觉辅助应优先使用高对比度浅色背景、深色正文和明确的“预览是否等同正式实现”说明。
