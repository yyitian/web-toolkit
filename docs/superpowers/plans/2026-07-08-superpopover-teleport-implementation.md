# SuperPopover Teleport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `SuperPopover` 改为默认 Teleport 的浮层组件,并补齐禁用、箭头开关、触发方式、delay、点外关闭和新的浮层样式入口。

**Architecture:** 改动集中在 `src/components/SuperPopover/index.vue`:脚本层新增 props、归一化状态和事件管理,模板层把 floating 节点抽成 Teleport/非 Teleport 两个渲染分支,样式层把 `--wt-popover-*` 默认值迁移到 `.super-popover-floating`。README 和 `src/App.vue` 只负责消费方说明与本地验收场景。

**Tech Stack:** Vue 3.5 `<script setup>`、TypeScript、`@floating-ui/vue`、SCSS、pnpm。

---

## 文件结构

- Modify: `src/components/SuperPopover/index.vue`
  - 承载全部运行时行为:新 props、`v-model` 压制、hover/click/manual 触发、Teleport 渲染、箭头 middleware、点外关闭监听、floating 样式合并。
- Modify: `src/App.vue`
  - 更新本地 demo,覆盖 overflow 裁剪、半透明无箭头、click 触发、disabled 压制。
- Modify: `README.md`
  - 更新 `SuperPopover` 用法,把 `popperClass` / `popperStyle` 设为正式自定义入口,保留 `style.css` 必须引入说明。

## 约束

- 不新增测试框架。
- 不改 `lib/main.ts`,组件已存在对外导出。
- 不主动调整 `offset`:关闭箭头只影响箭头节点和 middleware。
- 不新增 `zIndex`、`maxWidth`、`enterable`、transition、middleware 自定义等额外 API。
- Vue API 继续依赖自动导入,不要手动导入 `ref`、`computed`、`watch`、`onMounted`、`onBeforeUnmount`。

### Task 1: 定义新 API 与归一化状态

**Files:**
- Modify: `src/components/SuperPopover/index.vue`

- [ ] **Step 1: 替换脚本区的类型、props、refs 与 middleware**

把 `src/components/SuperPopover/index.vue` 的 `<script setup lang="ts">` 顶部到 `useFloating(...)` 之前替换为以下结构。保留 `@floating-ui/vue` 运行时导入,新增 `StyleValue` 类型导入,并用条件 middleware 支持 `arrow=false`。

```ts
<script setup lang="ts">
import {
  useFloating,
  autoUpdate,
  offset as useOffset,
  flip as useFlip,
  shift as useShift,
  arrow as useArrow,
} from '@floating-ui/vue';
import type { Placement } from '@floating-ui/vue';
import type { StyleValue } from 'vue';
import { placementMap } from './config';

type PopoverTrigger = 'hover' | 'click' | 'manual';
type PopoverDelay = number | { open?: number; close?: number };
type TeleportTarget = string | HTMLElement | false;

const DEFAULT_DELAY = { open: 0, close: 120 } as const;

const visible = defineModel({ type: Boolean });
const props = withDefaults(
  defineProps<{
    placement?: Placement;
    offset?: number;
    effect?: 'dark' | 'light';
    title?: string;
    teleportTo?: TeleportTarget;
    trigger?: PopoverTrigger;
    disabled?: boolean;
    arrow?: boolean;
    delay?: PopoverDelay;
    closeOnClickOutside?: boolean;
    popperClass?: unknown;
    popperStyle?: StyleValue;
  }>(),
  {
    placement: 'top',
    title: '',
    offset: 12,
    effect: 'dark',
    teleportTo: 'body',
    trigger: 'hover',
    disabled: false,
    arrow: true,
    delay: () => ({ ...DEFAULT_DELAY }),
    closeOnClickOutside: true,
  },
);

const { placement } = toRefs(props);

const reference = ref<HTMLElement | null>(null);
const floating = ref<HTMLElement | null>(null);
const floatingArrow = ref<HTMLElement | null>(null);

const normalizedDelay = computed(() => {
  if (typeof props.delay === 'number') {
    return {
      open: props.delay,
      close: props.delay,
    };
  }

  return {
    open: props.delay.open ?? DEFAULT_DELAY.open,
    close: props.delay.close ?? DEFAULT_DELAY.close,
  };
});

const isOpen = computed(() => Boolean(visible.value) && !props.disabled);

const middleware = computed(() => {
  const list = [useOffset(props.offset), useFlip(), useShift()];

  if (props.arrow) {
    list.push(useArrow({ element: floatingArrow }));
  }

  return list;
});
```

- [ ] **Step 2: 保留并更新 `useFloating` 配置**

紧接 Task 1 Step 1 的代码放置以下 `useFloating` 调用。删除旧注释里“不用 `<Teleport>`”的说明,保留 fixed 和 autoUpdate 的意图。

```ts
const {
  floatingStyles,
  middlewareData,
  placement: usePlacement,
} = useFloating(reference, floating, {
  placement,
  middleware,
  strategy: 'fixed',
  whileElementsMounted: autoUpdate,
});
```

- [ ] **Step 3: 运行类型检查入口验证当前中间状态**

Run: `pnpm build`

Expected: 这一阶段可能因为模板仍引用旧方法而失败,但不能出现 `StyleValue` 类型导入、props 类型或 middleware 数组类型相关错误。若只出现旧模板事件方法与后续任务相关的错误,继续 Task 2。

### Task 2: 实现可见状态、disabled 压制和 hover delay

**Files:**
- Modify: `src/components/SuperPopover/index.vue`

- [ ] **Step 1: 用新的定时器和打开关闭函数替换旧 `open` / `scheduleClose` 块**

删除旧的 `closeTimer`、`open()`、`scheduleClose()`、`onBeforeUnmount(() => clearTimeout(closeTimer))`,替换为以下代码。

```ts
let openTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

function clearOpenTimer() {
  clearTimeout(openTimer);
  openTimer = undefined;
}

function clearCloseTimer() {
  clearTimeout(closeTimer);
  closeTimer = undefined;
}

function clearTimers() {
  clearOpenTimer();
  clearCloseTimer();
}

function setOpen(nextVisible: boolean) {
  if (props.disabled) {
    visible.value = false;
    return;
  }

  visible.value = nextVisible;
}

function closeImmediately() {
  clearTimers();
  visible.value = false;
}

function scheduleOpen() {
  if (props.trigger !== 'hover' || props.disabled) return;

  clearTimers();
  const delay = normalizedDelay.value.open;

  if (delay <= 0) {
    setOpen(true);
    return;
  }

  openTimer = setTimeout(() => setOpen(true), delay);
}

function scheduleClose() {
  if (props.trigger !== 'hover') return;

  clearTimers();
  const delay = normalizedDelay.value.close;

  if (delay <= 0) {
    visible.value = false;
    return;
  }

  closeTimer = setTimeout(() => {
    visible.value = false;
  }, delay);
}

onBeforeUnmount(() => {
  clearTimers();
});
```

- [ ] **Step 2: 添加 disabled 与外部 `v-model` 同步压制**

在 Task 2 Step 1 后添加 watcher。它保证 `disabled=true` 时当前浮层立即关闭,并把外部写入的 `v-model=true` 压回 `false`。

```ts
watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      closeImmediately();
    }
  },
  { immediate: true },
);

watch(visible, (nextVisible) => {
  if (props.disabled && nextVisible) {
    visible.value = false;
  }
});
```

- [ ] **Step 3: 更新箭头计算对 `arrow=false` 的处理**

保留 `staticSide` 和 `arrowInnerBorderHidden`,但把 `arrowInnerBorderHidden` 改成在 `props.arrow=false` 时返回空对象。

```ts
const staticSide = computed(() => {
  return placementMap[usePlacement.value.split('-')[0]];
});

const arrowInnerBorderHidden = computed<Record<string, string>>(() => {
  if (!props.arrow) return {};

  const map: Record<string, Record<string, string>> = {
    bottom: { borderTopWidth: '0', borderLeftWidth: '0' },
    top: { borderBottomWidth: '0', borderRightWidth: '0' },
    left: { borderTopWidth: '0', borderRightWidth: '0' },
    right: { borderBottomWidth: '0', borderLeftWidth: '0' },
  };
  return map[staticSide.value] ?? {};
});
```

- [ ] **Step 4: 运行 lint 检查脚本区**

Run: `pnpm lint`

Expected: 允许因为模板还未改完出现引用错误；不能出现 props、watcher、timer 类型错误。若 lint 因后续模板未引用函数失败,继续 Task 3。

### Task 3: 实现 click/manual、点外关闭和样式合并

**Files:**
- Modify: `src/components/SuperPopover/index.vue`

- [ ] **Step 1: 添加触发事件处理函数**

在 `arrowInnerBorderHidden` 后添加以下函数。hover 只响应 hover 事件,click 只响应 click,manual 不绑定任何主动打开关闭。

```ts
function handleReferenceMouseenter() {
  if (props.trigger === 'hover') {
    scheduleOpen();
  }
}

function handleReferenceMouseleave() {
  if (props.trigger === 'hover') {
    scheduleClose();
  }
}

function handleFloatingMouseenter() {
  if (props.trigger === 'hover') {
    clearTimers();
  }
}

function handleFloatingMouseleave() {
  if (props.trigger === 'hover') {
    scheduleClose();
  }
}

function handleReferenceClick() {
  if (props.trigger !== 'click' || props.disabled) return;

  clearTimers();
  setOpen(!isOpen.value);
}
```

- [ ] **Step 2: 添加点外关闭监听**

在 Task 3 Step 1 后添加以下代码。监听只在浮层打开、允许点外关闭、且触发模式为 click 或 manual 时生效。

```ts
const shouldBindClickOutside = computed(() => {
  return (
    isOpen.value &&
    props.closeOnClickOutside &&
    (props.trigger === 'click' || props.trigger === 'manual')
  );
});

function handleDocumentPointerdown(event: PointerEvent) {
  if (!shouldBindClickOutside.value) return;

  const target = event.target;
  if (!(target instanceof Node)) return;

  if (reference.value?.contains(target) || floating.value?.contains(target)) {
    return;
  }

  closeImmediately();
}

watch(
  shouldBindClickOutside,
  (shouldBind) => {
    if (shouldBind) {
      document.addEventListener('pointerdown', handleDocumentPointerdown);
      return;
    }

    document.removeEventListener('pointerdown', handleDocumentPointerdown);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerdown);
});
```

- [ ] **Step 3: 添加 floating class 与 style 合并**

在点外关闭监听之后添加以下 computed。定位样式在前,`popperStyle` 在后,允许消费方通过 CSS 变量覆盖外观变量。

```ts
const floatingClass = computed(() => [
  'super-popover-floating',
  {
    'super-popover-floating--light': props.effect === 'light',
  },
  props.popperClass,
]);

const mergedFloatingStyle = computed<StyleValue>(() => [
  floatingStyles.value,
  props.popperStyle,
]);
```

- [ ] **Step 4: 运行 lint 检查行为函数**

Run: `pnpm lint`

Expected: 允许模板还未替换导致旧事件引用或新函数未使用；不能出现 `document` 监听函数重复定义、类型导入错误或 `StyleValue` computed 类型错误。

### Task 4: 重写模板和 SCSS

**Files:**
- Modify: `src/components/SuperPopover/index.vue`

- [ ] **Step 1: 替换整个 `<template>`**

用以下模板替换旧模板。`teleportTo !== false` 时把 floating 渲染到目标容器,`teleportTo === false` 时保留在组件当前位置。`v-if="isOpen"` 同时满足 disabled 不渲染 floating 的要求。

```vue
<template>
  <div class="super-popover">
    <div
      ref="reference"
      class="super-popover-reference"
      @mouseenter="handleReferenceMouseenter"
      @mouseleave="handleReferenceMouseleave"
      @click="handleReferenceClick"
    >
      <slot><span>hover</span></slot>
    </div>

    <Teleport v-if="teleportTo !== false" :to="teleportTo">
      <div
        v-if="isOpen"
        ref="floating"
        :class="floatingClass"
        :style="mergedFloatingStyle"
        @mouseenter="handleFloatingMouseenter"
        @mouseleave="handleFloatingMouseleave"
      >
        <slot name="content">
          <span>{{ title }}</span>
        </slot>
        <div
          v-if="arrow"
          ref="floatingArrow"
          class="super-popover-arrow"
          :style="{
            left:
              middlewareData.arrow?.x != null
                ? `${middlewareData.arrow.x}px`
                : '',
            top:
              middlewareData.arrow?.y != null
                ? `${middlewareData.arrow.y}px`
                : '',
            [staticSide]: '-4px',
            ...arrowInnerBorderHidden,
          }"
        ></div>
      </div>
    </Teleport>

    <div
      v-else-if="isOpen"
      ref="floating"
      :class="floatingClass"
      :style="mergedFloatingStyle"
      @mouseenter="handleFloatingMouseenter"
      @mouseleave="handleFloatingMouseleave"
    >
      <slot name="content">
        <span>{{ title }}</span>
      </slot>
      <div
        v-if="arrow"
        ref="floatingArrow"
        class="super-popover-arrow"
        :style="{
          left:
            middlewareData.arrow?.x != null
              ? `${middlewareData.arrow.x}px`
              : '',
          top:
            middlewareData.arrow?.y != null ? `${middlewareData.arrow.y}px` : '',
          [staticSide]: '-4px',
          ...arrowInnerBorderHidden,
        }"
      ></div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: 替换整个 `<style lang="scss" scoped>`**

把变量默认值迁移到 floating 自身,新增 z-index 和 max-width 变量,light effect 也改为作用在 floating 修饰类上。

```scss
<style lang="scss" scoped>
.super-popover {
  display: contents;
}

.super-popover-reference {
  display: contents;
}

.super-popover-floating {
  --wt-popover-bg: var(--wt-color-bg-inverse);
  --wt-popover-color: var(--wt-color-text-inverse);
  --wt-popover-border-color: var(--wt-popover-bg);
  --wt-popover-radius: var(--wt-radius);
  --wt-popover-padding: 4px 6px;
  --wt-popover-shadow: none;
  --wt-popover-z-index: 2000;
  --wt-popover-max-width: 400px;

  @include font(12px, $color: var(--wt-popover-color));
  z-index: var(--wt-popover-z-index);
  max-width: var(--wt-popover-max-width);
  background: var(--wt-popover-bg);
  border: 1px solid var(--wt-popover-border-color);
  border-radius: var(--wt-popover-radius);
  padding: var(--wt-popover-padding);
  box-shadow: var(--wt-popover-shadow);
}

.super-popover-floating--light {
  --wt-popover-bg: var(--wt-color-bg);
  --wt-popover-color: var(--wt-color-text);
  --wt-popover-shadow: 0 2px 8px rgb(0 0 0 / 12%);
}

.super-popover-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--wt-popover-bg);
  border: 1px solid var(--wt-popover-border-color);
  transform: rotate(45deg);
}
</style>
```

- [ ] **Step 3: 运行 build 验证组件完整性**

Run: `pnpm build`

Expected: PASS。若失败,修复类型、模板或样式编译错误后再次运行同一命令直到通过。

- [ ] **Step 4: 提交组件实现**

```bash
git add src/components/SuperPopover/index.vue
git commit -m "feat: 优化 SuperPopover Teleport 行为"
```

### Task 5: 更新本地 demo

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: 替换脚本区状态**

在现有 `<script setup lang="ts">` 内保留图标和按钮 demo 状态,新增 popover demo 状态。

```ts
const pinActive = ref(false);

const loading = ref(false);
const active = ref(false);
const disabledManualVisible = ref(true);

function handleLoading() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    active.value = !active.value;
  }, 2000);
}
```

- [ ] **Step 2: 替换 SuperPopover demo 区块**

把当前仅展示 `class="rich-tip"` 的 demo 区块替换为以下四个场景。它们分别覆盖默认 Teleport 逃离 overflow、无箭头半透明浮层、click trigger、disabled 压制 manual 外部打开。

```vue
<div class="super-icon-group popover-demo">
  <div class="clip-box">
    <SuperPopover popper-class="rich-tip">
      <span class="demo-trigger">overflow 内 hover</span>
      <template #content>
        <div class="rich-tip-content">
          <strong>默认 Teleport</strong>
          <p>父容器 overflow:hidden 不会裁剪浮层</p>
        </div>
      </template>
    </SuperPopover>
  </div>

  <SuperPopover
    :arrow="false"
    popper-class="glass-tip"
    :popper-style="{ '--wt-popover-z-index': 2600 }"
  >
    <span class="demo-trigger">半透明无箭头</span>
    <template #content>
      <div class="rich-tip-content">
        <strong>无箭头</strong>
        <p>半透明背景不会露出本该遮挡的箭头区域</p>
      </div>
    </template>
  </SuperPopover>

  <SuperPopover trigger="click" effect="light" popper-class="click-tip">
    <span class="demo-trigger">click 打开</span>
    <template #content>
      <button class="inside-button" type="button">内部点击不关闭</button>
    </template>
  </SuperPopover>

  <SuperPopover
    v-model="disabledManualVisible"
    trigger="manual"
    disabled
    title="disabled 时不会显示"
  >
    <span class="demo-trigger">disabled manual</span>
  </SuperPopover>
</div>
```

- [ ] **Step 3: 替换 demo 相关样式**

用以下样式替换旧 `.demo-trigger`、`.rich-tip`、`.rich-tip-content` 样式,并新增 demo 容器样式。

```scss
.popover-demo {
  align-items: center;
  flex-wrap: wrap;
}

.clip-box {
  width: 180px;
  height: 44px;
  overflow: hidden;
  border: 1px solid #d8dee4;
  border-radius: 6px;
  padding: 8px;
}

.demo-trigger {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 6px 10px;
  border: 1px dashed #8c959f;
  border-radius: 4px;
  cursor: pointer;
}

.rich-tip {
  --wt-popover-bg: linear-gradient(45deg, #d4af37, #2e8b57);
  --wt-popover-color: #fff;
  --wt-popover-border-color: #ffe08a;
  --wt-popover-padding: 8px 12px;
  --wt-popover-max-width: 520px;
}

.glass-tip {
  --wt-popover-bg: rgb(20 20 20 / 70%);
  --wt-popover-color: #fff;
  --wt-popover-border-color: rgb(255 255 255 / 20%);
  --wt-popover-padding: 8px 12px;
}

.click-tip {
  --wt-popover-padding: 8px;
}

.inside-button {
  border: 1px solid #d0d7de;
  border-radius: 4px;
  padding: 6px 10px;
  background: #fff;
  cursor: pointer;
}

.rich-tip-content {
  strong {
    display: block;
    margin-bottom: 2px;
  }

  p {
    margin: 0;
    opacity: 0.9;
  }
}
```

- [ ] **Step 4: 运行 lint 和 build**

Run: `pnpm lint`

Expected: PASS。

Run: `pnpm build`

Expected: PASS。

- [ ] **Step 5: 提交 demo 更新**

```bash
git add src/App.vue
git commit -m "docs: 更新 SuperPopover 本地演示"
```

### Task 6: 更新 README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 替换 SuperPopover 文档段落**

把 “SuperPopover 气泡支持二次开发” 开头到 “边框默认与背景同色” 提示结束的段落替换为以下内容。

````md
### SuperPopover

`SuperPopover` 默认把浮层 Teleport 到 `body`,避免被父组件的 `overflow:hidden`、局部 stacking context 等影响。消费方仍可通过 `--wt-popover-*` 变量定制 UI,但变量必须作用在浮层节点自身或它的真实 DOM 祖先上。

默认推荐使用 `popperClass` / `popperStyle` 作为浮层自定义入口:

```vue
<SuperPopover
  popper-class="my-rich-tip"
  :popper-style="{ '--wt-popover-z-index': 3000 }"
  :arrow="false"
>
  <button>hover</button>
  <template #content>…title + description…</template>
</SuperPopover>
```

```css
.my-rich-tip {
  --wt-popover-bg: rgb(0 0 0 / 70%);
  --wt-popover-color: #fff;
  --wt-popover-border-color: rgb(255 255 255 / 20%);
  --wt-popover-padding: 8px 12px;
  --wt-popover-shadow: 0 2px 8px rgb(0 0 0 / 12%);
  --wt-popover-z-index: 3000;
  --wt-popover-max-width: 520px;
}
```

常用交互配置:

```vue
<SuperPopover trigger="click" close-on-click-outside>
  <button>点击打开</button>
  <template #content>点击浮层内部不会关闭</template>
</SuperPopover>

<SuperPopover v-model="visible" trigger="manual" :close-on-click-outside="false">
  <button>外部控制</button>
  <template #content>完全手动关闭</template>
</SuperPopover>
```

`teleportTo` 默认是 `'body'`;传 `false` 时浮层会保留在组件当前位置渲染,此时可以利用真实 DOM 继承影响浮层变量,但这不是默认推荐路径。

边框默认与背景同色,因此通常不可见;设置 `--wt-popover-border-color` 即可显形。`--wt-popover-max-width` 默认是 `400px`。
````

- [ ] **Step 2: 检查 README 中旧写法残留**

Run: `rg "给 <SuperPopover>|组件根|变量需挂|class=\"my-rich-tip\"|rich-tip" README.md`

Expected: 不再出现推荐“给 `<SuperPopover>` 加 class 覆盖变量”的旧说法。允许出现 `popper-class="my-rich-tip"`。

- [ ] **Step 3: 运行格式检查**

Run: `pnpm format:check`

Expected: PASS。若 README 格式失败,运行 `pnpm format README.md`,再运行 `pnpm format:check` 直到通过。

- [ ] **Step 4: 提交 README 更新**

```bash
git add README.md
git commit -m "docs: 更新 SuperPopover 使用说明"
```

### Task 7: 最终验证与人工验收

**Files:**
- Verify: `src/components/SuperPopover/index.vue`
- Verify: `src/App.vue`
- Verify: `README.md`

- [ ] **Step 1: 运行静态验证**

Run: `pnpm lint`

Expected: PASS。

Run: `pnpm build`

Expected: PASS。

- [ ] **Step 2: 启动本地 demo**

Run: `pnpm dev`

Expected: Vite 输出本地访问地址,通常是 `http://localhost:5173/`。保持该进程运行到人工验收完成。

- [ ] **Step 3: 人工验收四个场景**

在浏览器打开 Vite 地址,验证:

- `overflow 内 hover`:浮层显示在父容器外,不被 `clip-box` 裁剪。
- `半透明无箭头`:浮层显示时没有箭头节点造成的半透明遮挡残影。
- `click 打开`:点击 reference 打开,点击浮层内部按钮不关闭,点击页面其他区域关闭。
- `disabled manual`:虽然 `disabledManualVisible` 初始为 `true`,页面不会显示 floating。

- [ ] **Step 4: 停止本地 demo**

在运行 `pnpm dev` 的终端按 `Ctrl+C`。

Expected: Vite 进程退出,当前会话没有遗留运行中的必要进程。

- [ ] **Step 5: 检查提交历史和工作区**

Run: `git status --short`

Expected: 无输出。

Run: `git log --oneline -4`

Expected: 最近提交包含:

```text
docs: 更新 SuperPopover 使用说明
docs: 更新 SuperPopover 本地演示
feat: 优化 SuperPopover Teleport 行为
docs: 设计 SuperPopover Teleport 优化
```

## 自检

- 规格覆盖:默认 Teleport、`teleportTo=false`、`popperClass` / `popperStyle`、`disabled`、`arrow=false`、三种 trigger、delay、点外关闭、z-index/max-width 变量、README、demo、lint/build 验证均已映射到任务。
- 范围控制:没有新增非目标 API,没有引入测试框架,没有改导出入口。
- 类型一致性:计划中使用的 prop 名称与规格一致:`teleportTo`、`trigger`、`disabled`、`arrow`、`delay`、`closeOnClickOutside`、`popperClass`、`popperStyle`。
