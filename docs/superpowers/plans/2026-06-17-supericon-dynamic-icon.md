# SuperIcon Dynamic Icon 实现 plan

> **For agentic workers:** REQUIRED SUB-SKILL: 用 superpowers:subagent-driven-development(推荐)或 superpowers:executing-plans 逐任务实现。步骤用 `- [ ]` 复选框跟踪。

**Goal:** 把 `SuperIcon` 的 lucide 图标从「按字符串 `Reflect.get` 动态取」改为「传组件」以根治 tree-shaking,并把「按 active 切换状态+过渡动画」的能力重构为独立 SFC 形态的 Dynamic Icon,经子路径 `@yyitian/web-toolkit/dynamic-icons` 发布。

**Architecture:** 基础 lucide 图标由消费方静态 import 后作为组件传入 `:lucide`;有状态的图标做成独立 SFC(`DynamicPin.vue`,自带 `<template>` + scoped 过渡 CSS),用 `defineOptions({ dynamicIcon: true })` 标记,`SuperIcon` 据此决定是否向下转发 `active`。库主入口保持 lucide-free,lucide 仅出现在 `dynamic-icons` 子路径。

**Tech Stack:** Vue 3(SFC + `defineComponent`/`h`)、Vite 8 lib 模式多入口、`vite-plugin-dts`、`@lucide/vue`(external 可选 peer)、pnpm。

**关于提交:** 依用户既有偏好(此前明确「先别提交」,且仓库工作区尚未提交),本 plan **不含 git commit 步骤**;每个任务以构建/类型检查/lint 作为验收闸口。用户决定何时提交。

**验证手段说明:** 本仓库无测试框架,故每个任务的验证 = `pnpm exec vue-tsc --noEmit`(类型)+ `pnpm lint`(规范),集成任务额外跑 `pnpm build` 与产物检查。可视化验收(App.vue 动画效果)由用户自行在 `pnpm dev` 中确认 —— **执行者不要自动启动 dev server**。

---

## Task 1: 新建 DynamicPin SFC 与子路径入口

**Files:**

- Create: `src/components/SuperIcon/dynamic-icons/DynamicPin.vue`
- Create: `src/components/SuperIcon/dynamic-icons/dynamic-icon.d.ts`
- Create: `lib/dynamic-icons.ts`

本任务只新增文件,不改动既有代码,旧 `icon-preset.ts` 暂时保留(Task 2 才删)。

- [ ] **Step 1: 创建 `DynamicPin.vue`**

把现有 Pin 描边动画的结构与 CSS 从 `SuperIcon` 迁入此 SFC。`size` 等 attrs 靠默认透传落到根组件 `Pin`,只声明 `active`。

```vue
<script setup lang="ts">
import { Pin } from '@lucide/vue';

defineOptions({ dynamicIcon: true });
// 只声明 active(声明后被吃掉、不漏到 svg);size 等其余 attrs 默认透传到根组件 Pin
defineProps<{ active?: boolean }>();
</script>

<template>
  <component :is="Pin">
    <Transition name="super-icon-pin">
      <path
        v-if="active"
        class="super-icon-active-path"
        d="M4.5 4.5 L19.5 19.5"
        stroke-width="2"
        stroke-linecap="round"
        stroke-dasharray="22"
      />
    </Transition>
  </component>
</template>

<style scoped>
.super-icon-pin-enter-active {
  animation: super-icon-pin-draw 0.4s ease forwards;
}

.super-icon-pin-leave-active {
  animation: super-icon-pin-erase 0.4s ease forwards;
}

@keyframes super-icon-pin-draw {
  from {
    stroke-dashoffset: 22;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes super-icon-pin-erase {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -22;
  }
}
</style>
```

- [ ] **Step 2: 创建 `dynamic-icon.d.ts`(类型增强,让 `defineOptions({ dynamicIcon })` 通过类型检查)**

```ts
import 'vue';

declare module 'vue' {
  interface ComponentCustomOptions {
    dynamicIcon?: boolean;
  }
}
```

- [ ] **Step 3: 创建子路径入口 `lib/dynamic-icons.ts`**

```ts
export { default as DynamicPin } from '@/components/SuperIcon/dynamic-icons/DynamicPin.vue';
```

- [ ] **Step 4: 类型检查**

Run: `pnpm exec vue-tsc --noEmit`
Expected: 退出码 0(旧代码完好,新文件合法;`dynamic-icons.ts` 仅被类型检查,尚未被 Vite 打包)。

- [ ] **Step 5: lint**

Run: `pnpm lint`
Expected: 退出码 0。

---

## Task 2: 重构 SuperIcon + 迁移 App 的 SuperIcon 用法 + 删除 icon-preset

**Files:**

- Modify: `src/components/SuperIcon/index.vue`(全量替换 `<script>` 与 `<style>`)
- Modify: `src/App.vue`(仅 SuperIcon 相关用法 + import)
- Delete: `src/components/SuperIcon/icon-preset.ts`

SuperIcon 与 App 的 SuperIcon 用法必须同任务改动:`lucide` prop 从 `String` 变 `Object` 后,旧的 `lucide="Pin"` 字符串写法会被 vue-tsc 判为类型不符。本任务结束时 SuperButton 仍是旧 API,App 的 SuperButton 用法保持 `icon="lucide-..."` 字符串(对旧 SuperButton 仍合法),故整体类型检查保持绿色。

- [ ] **Step 1: 替换 `SuperIcon/index.vue` 的 `<script>`**

要点:删除 `import * as LucideIcons` 与 `import { getIconPreset } from './icon-preset.ts'`;`lucide` prop 改 `Object`;直接渲染传入组件,仅带 `dynamicIcon` 标记者转发 `active`;loading 改内联 SVG。

```vue
<script lang="ts">
import { defineComponent, type Component } from 'vue';
import SuperPopover from '../SuperPopover/index.vue';

export default defineComponent({
  props: {
    name: { type: String, default: '' },
    lucide: { type: Object as () => Component, default: null },
    title: { type: String, default: '' },
    size: { type: [String, Number], default: 20 },
    rotate: { type: Number, default: 0 },
    loading: { type: Boolean },
    active: { type: Boolean },
  },
  setup(props) {
    function renderLucideIcon() {
      const isDynamic =
        (props.lucide as Record<string, unknown> | null)?.dynamicIcon === true;
      return h(props.lucide, {
        size: props.size,
        ...(isDynamic ? { active: props.active } : {}),
      });
    }

    function renderSpriteIcon() {
      return h(
        'svg',
        { width: props.size, height: props.size, ariaHidden: true },
        h('use', { href: `#icon-${props.name}` }),
      );
    }

    // 内联 SVG spinner，沿用 .loading 旋转动画，SuperIcon 不再依赖 lucide Loader
    function renderLoading() {
      return h(
        'svg',
        {
          width: props.size,
          height: props.size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 2,
          'stroke-linecap': 'round',
          ariaHidden: true,
        },
        h('path', { d: 'M21 12a9 9 0 1 1-6.219-8.56' }),
      );
    }

    function renderIcon() {
      const icon = props.lucide ? renderLucideIcon() : renderSpriteIcon();
      const transform = `rotate(${props.rotate}deg)`;
      return h(
        'span',
        {
          class: ['super-icon', { loading: props.loading }],
          style: {
            transform: !props.loading && props.rotate >= 0 && transform,
          },
        },
        props.loading ? renderLoading() : icon,
      );
    }

    function renderPopover() {
      return h(SuperPopover, { title: props.title }, { default: renderIcon });
    }

    return () => (props.title ? renderPopover() : renderIcon());
  },
});
</script>
```

- [ ] **Step 2: 替换 `SuperIcon/index.vue` 的 `<style>`(移除 super-icon-pin 过渡 CSS,已迁至 DynamicPin)**

```vue
<style lang="scss" scoped>
.super-icon {
  @include flex-align-center;
  position: relative;
  cursor: pointer;
  &.loading {
    animation: loading 2s linear infinite;
  }
}

@keyframes loading {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
```

- [ ] **Step 3: 删除 `icon-preset.ts`**

Run: `rm src/components/SuperIcon/icon-preset.ts`

- [ ] **Step 4: 迁移 `src/App.vue` 的 import 与 SuperIcon 用法**

在 `<script setup>` 顶部新增 import(SuperButton 用法下一任务才改,但 `Settings`/`DynamicPin` 这里一并引入):

```ts
import { Settings } from '@lucide/vue';
import DynamicPin from '@/components/SuperIcon/dynamic-icons/DynamicPin.vue';
```

把 `<template>` 中 `super-icon-group` 第一个 div 内的三个 SuperIcon 改为:

```vue
<SuperIcon
  :lucide="DynamicPin"
  :active="pinActive"
  @click="pinActive = !pinActive"
/>
<SuperIcon loading />
<SuperIcon :lucide="Settings" title="设置" />
```

（SuperButton 那个 div 暂不动,保持 `icon="lucide-Settings"` / `icon="lucide-Pin"`。）

- [ ] **Step 5: 类型检查**

Run: `pnpm exec vue-tsc --noEmit`
Expected: 退出码 0。

- [ ] **Step 6: lint**

Run: `pnpm lint`
Expected: 退出码 0。

---

## Task 3: 重构 SuperButton + 迁移 App 的 SuperButton 用法

**Files:**

- Modify: `src/components/SuperButton/index.vue`
- Modify: `src/App.vue`(仅 SuperButton 用法)

- [ ] **Step 1: 替换 `SuperButton/index.vue` 的 `<script setup>`**

`icon` 改 `string | Component`:字符串当 sprite `name`,组件当 `lucide` 并转发 `active`;删除 `lucide-` 前缀判断。

```vue
<script setup lang="ts">
import { ElButton } from 'element-plus';
import type { Component } from 'vue';
import SuperIcon from '../SuperIcon/index.vue';

const props = withDefaults(
  defineProps<{
    icon?: string | Component;
    active?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    icon: '',
    loading: false,
    disabled: false,
  },
);

const isDisabled = computed(() => props.loading || props.disabled);

function renderIcon() {
  if (!props.icon) {
    return;
  }
  if (props.loading) {
    return h(SuperIcon, { loading: true });
  }
  const iconProps =
    typeof props.icon === 'string'
      ? { name: props.icon }
      : { lucide: props.icon, active: props.active };
  return h(SuperIcon, iconProps);
}
</script>
```

`<template>` 与 `<style>` 不变。

- [ ] **Step 2: 迁移 `src/App.vue` 的 SuperButton 用法**

把第二个 `super-icon-group` div 内三个 SuperButton 改为(`Settings`/`DynamicPin` 已在 Task 2 引入):

```vue
<SuperButton type="primary" :icon="Settings" />
<SuperButton type="success" :icon="DynamicPin">置顶</SuperButton>
<SuperButton
  type="warning"
  :loading="loading"
  :active="active"
  :icon="DynamicPin"
  @click="handleLoading"
>
  点击加载
</SuperButton>
```

- [ ] **Step 3: 类型检查**

Run: `pnpm exec vue-tsc --noEmit`
Expected: 退出码 0。

- [ ] **Step 4: lint**

Run: `pnpm lint`
Expected: 退出码 0。

---

## Task 4: 构建配置(Vite 多入口 + package.json exports)

**Files:**

- Modify: `vite.config.ts:12-17`(`build.lib`)
- Modify: `package.json`(`exports` 新增子路径)

- [ ] **Step 1: 改 `vite.config.ts` 的 `build.lib` 为多入口**

将原:

```ts
lib: {
  entry: './lib/main.ts',
  formats: ['es'],
  fileName: () => 'index.js',
  cssFileName: 'style', // 抽取的组件样式 → dist/style.css
},
```

改为:

```ts
lib: {
  entry: {
    index: './lib/main.ts',
    'dynamic-icons': './lib/dynamic-icons.ts',
  },
  formats: ['es'],
  fileName: (_format, entryName) => `${entryName}.js`,
  cssFileName: 'style', // 抽取的组件样式 → dist/style.css
},
```

`rollupOptions.external` 不变(`@lucide/vue` 已在其中)。

- [ ] **Step 2: 在 `package.json` 的 `exports` 中新增 `./dynamic-icons` 子路径**

在 `"./style.css": "./dist/style.css",` 与 `"./styles/mixin"` 之间(或紧随 `./vite-plugin` 之后)加入:

```json
"./dynamic-icons": {
  "types": "./dist/lib/dynamic-icons.d.ts",
  "import": "./dist/dynamic-icons.js"
},
```

- [ ] **Step 3: 完整构建**

Run: `pnpm build`
Expected: 退出码 0;`dist/` 下生成 `index.js`、`dynamic-icons.js`、`style.css`、`lib/main.d.ts`、`lib/dynamic-icons.d.ts`、`vite-plugin.js`。

- [ ] **Step 4: 校验主入口 lucide-free、子入口外置引用 lucide**

Run:

```bash
grep -q "@lucide/vue" dist/index.js && echo "FAIL: 主入口引用了 lucide" || echo "OK: 主入口 lucide-free"
grep -q "@lucide/vue" dist/dynamic-icons.js && echo "OK: dynamic-icons 外置引用 lucide" || echo "FAIL: dynamic-icons 未引用 lucide"
```

Expected: 两行均打印 `OK: ...`。

- [ ] **Step 5: 校验 dynamic-icons 的类型声明存在**

Run: `test -f dist/lib/dynamic-icons.d.ts && echo OK || echo FAIL`
Expected: `OK`。若声明落点不是 `dist/lib/dynamic-icons.d.ts`,据实际路径修正 Step 2 中 `exports.types` 的值后重跑 Step 3-5。

---

## Task 5: README 文档 + 最终验收

**Files:**

- Modify: `README.md`(新增 Dynamic Icon 小节)

- [ ] **Step 1: 在 `README.md` 的「用法 › 组件」之后新增 Dynamic Icon 小节**

````markdown
### Dynamic Icon(带状态/过渡动画的图标)

`DynamicPin` 等成品图标经子路径导出,内置「按 `active` 切换 + 过渡动画」(如置顶/取消置顶描边)。使用需安装可选 peer `@lucide/vue`。

\```ts
import { SuperIcon } from '@yyitian/web-toolkit';
import { DynamicPin } from '@yyitian/web-toolkit/dynamic-icons';
\```

\```vue
<SuperIcon :lucide="DynamicPin" :active="isPinned" /> <!-- 有状态 -->
<SuperButton :icon="DynamicPin" :active="isPinned" /> <!-- 按钮内同理 -->
\```

普通(无状态)lucide 图标直接由消费方静态 import 后传入,自动 tree-shake:

\```ts
import { Settings } from '@lucide/vue';
\```

\```vue
<SuperIcon :lucide="Settings" />
<SuperButton :icon="Settings" />
\```
````

（写入时把 `\``` ` 还原为三反引号。)

- [ ] **Step 2: 规范化格式**

Run: `pnpm format`
Expected: 退出码 0。

- [ ] **Step 3: 最终三闸全绿**

Run:

```bash
pnpm exec vue-tsc --noEmit && pnpm lint && pnpm format:check && pnpm build
```

Expected: 全部退出码 0。

- [ ] **Step 4: 对照 spec 第 6 节验收标准逐条确认**

人工核对:

1. `pnpm build` 通过且产物齐全(Task 4 Step 3 已验)。
2. 主入口 `dist/index.js` 不含 lucide(Task 4 Step 4 已验)。
3. lint / format:check 通过(本任务 Step 3 已验)。
4. 可视化:提示用户运行 `pnpm dev`,确认 `DynamicPin` 的 active 切换有描边过渡、普通 lucide 图标正常、sprite 不变、loading 显示内联 spinner 旋转。**执行者不要自动启动 dev server。**
5. 主入口 tree-shaking:已由 Step 2 的「主入口 lucide-free」间接保证。

---

## 自检清单(写完 plan 的复核)

- **Spec 覆盖:** 传组件(Task 2)、Dynamic Icon SFC(Task 1)、子路径发布(Task 1+4)、SuperButton 联合类型(Task 3)、loading 内联 SVG(Task 2)、CSS 迁移(Task 1+2)、构建多入口与 exports(Task 4)、README(Task 5)—— 均有对应任务。
- **占位符:** 无 TBD/TODO;每步含完整代码或精确命令。
- **类型一致:** 标记统一为 `dynamicIcon`;`lucide` prop 全程 `Object`/`Component`;`DynamicPin` 默认导出贯穿 App 与子路径入口一致。
