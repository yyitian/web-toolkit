# 图标合并 + Popover 主题化 + 主题色 token 实现 plan

> **For agentic workers:** REQUIRED SUB-SKILL: 用 superpowers:subagent-driven-development(推荐)或 superpowers:executing-plans 逐任务实现。步骤用 `- [ ]` 复选框跟踪。

**Goal:** 引入 `--wt-*` 主题色 token;给 SuperPopover 接通 light 主题并把气泡样式变量化(支持消费方二次开发);把 SuperIcon 的 `name`/`lucide` 合并为单个 `icon`。

**Architecture:** 主题 token 走 CSS 自定义属性、经 `theme.css` → `main.ts` import 抽进 `dist/style.css` 自动生效;SuperPopover 用「两层变量」(`--wt-popover-*` 对外覆盖位 / `--_wt-popover-*` 内部预设位)使 effect 给默认、消费方祖先覆盖仍生效;SuperIcon `icon` prop 用 `typeof` 判别字符串(sprite)/组件(渲染)。

**Tech Stack:** Vue 3(SFC + `defineComponent`/`h`)、SCSS scoped、CSS 自定义属性、Vite 8 lib 模式、`@floating-ui/vue`、pnpm。

**关于提交:** 依用户既有偏好(「先别提交」),本 plan **不含 git commit 步骤**;每个任务以构建/类型检查/lint 作为验收闸口。用户决定何时提交。

**验证手段说明:** 本仓库无测试框架。每个任务验证 = `pnpm exec vue-tsc --noEmit`(类型)+ `pnpm lint`(规范),涉及样式打包的任务额外跑 `pnpm build` + 产物 grep。可视化验收(light tooltip、变量覆盖、过渡动画)由用户自行 `pnpm dev` 确认 —— **执行者不要自动启动 dev server**。

---

## Task 1: 主题色 token(`--wt-*`)

**Files:**

- Create: `src/styles/theme.css`
- Modify: `lib/main.ts`(顶部新增 import)

- [ ] **Step 1: 创建 `src/styles/theme.css`**

```css
:root {
  /* 语义色板(模仿 element-plus,自有默认值) */
  --wt-color-primary: #409eff;
  --wt-color-success: #67c23a;
  --wt-color-warning: #e6a23c;
  --wt-color-danger: #f56c6c;
  --wt-color-info: #909399;

  /* 中性色(自绘组件用:文字/表面/描边) */
  --wt-color-text: #222;
  --wt-color-text-inverse: #fff;
  --wt-color-bg: #fff;
  --wt-color-bg-inverse: #222;
  --wt-color-border: #e5e7eb;

  /* 几何 */
  --wt-radius: 4px;
}
```

- [ ] **Step 2: 在 `lib/main.ts` 顶部 import 它**

当前 `lib/main.ts`:

```ts
export { default as SuperIcon } from '@/components/SuperIcon/index.vue';
export { default as SuperButton } from '@/components/SuperButton/index.vue';
export { default as SuperPopover } from '@/components/SuperPopover/index.vue';
```

在最顶部加一行(import 副作用样式,使其被 Vite lib 抽进 `dist/style.css`):

```ts
import '@/styles/theme.css';

export { default as SuperIcon } from '@/components/SuperIcon/index.vue';
export { default as SuperButton } from '@/components/SuperButton/index.vue';
export { default as SuperPopover } from '@/components/SuperPopover/index.vue';
```

- [ ] **Step 3: 类型检查 + lint**

Run: `pnpm exec vue-tsc --noEmit && pnpm lint`
Expected: 退出码 0。

- [ ] **Step 4: 构建并校验 token 进入 style.css**

Run:

```bash
pnpm build && grep -q -- "--wt-color-primary" dist/style.css && echo "OK: token 已进 style.css" || echo "FAIL"
```

Expected: 打印 `OK: token 已进 style.css`。

---

## Task 2: SuperPopover 主题化 + SuperIcon effect 透传 + App light 演示

**Files:**

- Modify: `src/components/SuperPopover/index.vue`(模板 floating 根元素加修饰类 + 全量替换 `<style>`)
- Modify: `src/components/SuperIcon/index.vue`(新增 `effect` prop + `renderPopover` 透传)
- Modify: `src/App.vue`(给设置 tooltip 加 `effect="light"` 演示)

本任务不动 SuperIcon 的 `lucide` prop(合并放 Task 3),故 App 仍用 `:lucide`,整体类型检查保持绿色。

- [ ] **Step 1: SuperPopover 模板 —— floating 根元素按 effect 加修饰类**

把当前 floating div:

```vue
<div
  v-if="visible"
  ref="floating"
  :style="floatingStyles"
  class="super-popover-floating"
>
```

改为:

```vue
<div
  v-if="visible"
  ref="floating"
  :style="floatingStyles"
  class="super-popover-floating"
  :class="{ 'super-popover-floating--light': effect === 'light' }"
>
```

(`effect` 已在 props 声明,script 与模板均无需新增。)

- [ ] **Step 2: 全量替换 SuperPopover 的 `<style>`**

把当前 `<style lang="scss" scoped>` 整块替换为(两层变量 + light 预设):

```vue
<style lang="scss" scoped>
.super-popover-floating {
  /* dark 预设(内部位) */
  --_wt-popover-bg: var(--wt-color-bg-inverse);
  --_wt-popover-color: var(--wt-color-text-inverse);
  --_wt-popover-border: none;
  --_wt-popover-radius: var(--wt-radius);
  --_wt-popover-padding: 4px 6px;
  --_wt-popover-shadow: none;

  @include font(12px);
  /* 对外覆盖位优先,回退到内部预设位 */
  background: var(--wt-popover-bg, var(--_wt-popover-bg));
  color: var(--wt-popover-color, var(--_wt-popover-color));
  border: var(--wt-popover-border, var(--_wt-popover-border));
  border-radius: var(--wt-popover-radius, var(--_wt-popover-radius));
  padding: var(--wt-popover-padding, var(--_wt-popover-padding));
  box-shadow: var(--wt-popover-shadow, var(--_wt-popover-shadow));
}

/* light 预设:仅改内部位 */
.super-popover-floating--light {
  --_wt-popover-bg: var(--wt-color-bg);
  --_wt-popover-color: var(--wt-color-text);
  --_wt-popover-border: 1px solid var(--wt-color-border);
  --_wt-popover-shadow: 0 2px 8px rgb(0 0 0 / 12%);
}

.super-popover-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  /* 箭头与气泡同背景(渐变下会有轻微接缝,属固有取舍) */
  background: var(--wt-popover-bg, var(--_wt-popover-bg));
  /* light 下补边框感:外侧两边可见,内侧被气泡主体盖住 */
  border: var(--wt-popover-border, var(--_wt-popover-border));
  transform: rotate(45deg);
}
</style>
```

- [ ] **Step 3: SuperIcon 新增 `effect` prop 并在 `renderPopover` 透传**

在 `src/components/SuperIcon/index.vue` 的 props 中,`active` 后新增 `effect`:

```ts
    loading: { type: Boolean },
    active: { type: Boolean },
    effect: { type: String as () => 'dark' | 'light', default: 'dark' },
```

把 `renderPopover` 改为透传 effect:

```ts
function renderPopover() {
  return h(
    SuperPopover,
    { title: props.title, effect: props.effect },
    { default: renderIcon },
  );
}
```

- [ ] **Step 4: App.vue —— 给设置 tooltip 加 light 演示**

把 App 中:

```vue
<SuperIcon :lucide="Settings" title="设置" />
```

改为:

```vue
<SuperIcon :lucide="Settings" title="设置" effect="light" />
```

(`:lucide` 暂不改,Task 3 才合并为 `:icon`。)

- [ ] **Step 5: 类型检查 + lint**

Run: `pnpm exec vue-tsc --noEmit && pnpm lint`
Expected: 退出码 0。

- [ ] **Step 6: 构建(确认样式不报错)**

Run: `pnpm build`
Expected: 退出码 0。

---

## Task 3: SuperIcon 合并 `name`/`lucide` → `icon` + SuperButton + App

**Files:**

- Modify: `src/components/SuperIcon/index.vue`(`<script>` 全量替换)
- Modify: `src/components/SuperButton/index.vue`(`renderIcon` 简化)
- Modify: `src/App.vue`(`:lucide` → `:icon`)

三者必须同任务:SuperIcon 去掉 `name`/`lucide`、改用 `icon` 后,SuperButton 内部 `h(SuperIcon, { name/lucide })` 与 App 的 `:lucide` 都会类型不符,须一并迁移才能保持绿色。

- [ ] **Step 1: 全量替换 SuperIcon 的 `<script>`**

(下面是合并 `icon` 后的完整 `<script>`,已含 Task 2 加入的 `effect` prop 与 `renderPopover` 透传;`<style>` 不变,保持 Task 2 后状态。)

```vue
<script lang="ts">
import { defineComponent, type Component } from 'vue';
import SuperPopover from '../SuperPopover/index.vue';

export default defineComponent({
  props: {
    icon: {
      type: [String, Object] as PropType<string | Component>,
      default: '',
    },
    title: { type: String, default: '' },
    size: { type: [String, Number], default: 20 },
    rotate: { type: Number, default: 0 },
    loading: { type: Boolean },
    active: { type: Boolean },
    effect: { type: String as () => 'dark' | 'light', default: 'dark' },
  },
  setup(props) {
    function renderComponentIcon(icon: Component) {
      const isDynamic = (icon as Record<string, unknown>)?.dynamicIcon === true;
      return h(icon, {
        size: props.size,
        ...(isDynamic ? { active: props.active } : {}),
      });
    }

    function renderSpriteIcon(name: string) {
      return h(
        'svg',
        { width: props.size, height: props.size, ariaHidden: true },
        h('use', { href: `#icon-${name}` }),
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
      const icon =
        typeof props.icon === 'string'
          ? props.icon
            ? renderSpriteIcon(props.icon)
            : null
          : renderComponentIcon(props.icon);
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
      return h(
        SuperPopover,
        { title: props.title, effect: props.effect },
        { default: renderIcon },
      );
    }

    return () => (props.title ? renderPopover() : renderIcon());
  },
});
</script>
```

> 注:`PropType` 由 `unplugin-auto-import` 的 `vue` 预设自动注入(同 `h`/`ref`),无需手动 import;若 lint/tsc 报 `PropType` 未定义,改为在顶部 `import { defineComponent, type Component, type PropType } from 'vue';`。

- [ ] **Step 2: 简化 SuperButton 的 `renderIcon`**

把 `src/components/SuperButton/index.vue` 的 `renderIcon` 由:

```ts
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
```

改为(统一透传 `icon`,sprite 分支 SuperIcon 会忽略 `active`):

```ts
function renderIcon() {
  if (!props.icon) {
    return;
  }
  if (props.loading) {
    return h(SuperIcon, { loading: true });
  }
  return h(SuperIcon, { icon: props.icon, active: props.active });
}
```

(`icon: string | Component` 的 props 定义不变。)

- [ ] **Step 3: App.vue —— `:lucide` 改 `:icon`**

把两处 SuperIcon 的 `:lucide` 改为 `:icon`:

```vue
<SuperIcon
  :icon="DynamicPin"
  :active="pinActive"
  @click="pinActive = !pinActive"
/>
<SuperIcon loading />
<SuperIcon :icon="Settings" title="设置" effect="light" />
```

(SuperButton 的 `:icon` 用法 Task 已是 `:icon`,无需改;`loading` 那个 SuperIcon 无 icon,不变。)

- [ ] **Step 4: 类型检查 + lint**

Run: `pnpm exec vue-tsc --noEmit && pnpm lint`
Expected: 退出码 0。

---

## Task 4: README 文档 + 最终验收

**Files:**

- Modify: `README.md`(主题色覆盖说明 + Dynamic Icon/普通图标示例改 `:icon=`)

- [ ] **Step 1: README —— 把图标示例的 `:lucide=` 改为 `:icon=`**

将 README 中 Dynamic Icon 小节里的:

```vue
<SuperIcon :lucide="DynamicPin" :active="isPinned" />
<!-- 有状态 -->
<SuperButton :icon="DynamicPin" :active="isPinned" />
<!-- 按钮内同理 -->
```

改为:

```vue
<SuperIcon :icon="DynamicPin" :active="isPinned" />
<!-- 有状态 -->
<SuperButton :icon="DynamicPin" :active="isPinned" />
<!-- 按钮内同理 -->
```

并把同小节普通图标示例:

```vue
<SuperIcon :lucide="Settings" />
<SuperButton :icon="Settings" />
```

改为:

```vue
<SuperIcon :icon="Settings" />
<SuperButton :icon="Settings" />
```

- [ ] **Step 2: README —— 新增「主题色」小节**

在「用法」区合适位置(如 vite 插件小节之后、发布之前)新增:

````markdown
### 主题色

组件主题色由 `--wt-*` CSS 变量驱动,默认值随 `style.css` 自动引入。消费方可在 `:root`(或任意作用域)覆盖:

\```css
:root {
--wt-color-primary: #6d28d9;
}

/_ 想跟 element-plus 主题同步,消费端自行桥接(库不绑定任何 UI 库) _/
:root {
--wt-color-primary: var(--el-color-primary);
}
\```

SuperPopover 气泡支持二次开发:覆盖 `--wt-popover-bg`(支持渐变)/`--wt-popover-color`/`--wt-popover-border`/`--wt-popover-radius`/`--wt-popover-padding`,配合 `#content` 插槽即可定制富浮层。

\```vue
<SuperPopover>
<button>hover</button>
<template #content>

<div class="my-rich-tip">…title + description…</div>
</template>
</SuperPopover>
\```

\```css
.my-rich-tip {
--wt-popover-bg: linear-gradient(135deg, #6d28d9, #2563eb);
--wt-popover-color: #fff;
--wt-popover-padding: 12px 14px;
}
\```
````

（写入时把 `\``` ` 还原为三反引号。）

- [ ] **Step 3: 格式化 + 最终全闸**

Run:

```bash
pnpm format && pnpm exec vue-tsc --noEmit && pnpm lint && pnpm format:check && pnpm build
```

Expected: 全部退出码 0。

- [ ] **Step 4: 对照 spec 第 6 节验收标准逐条确认**

```bash
grep -q -- "--wt-color-primary" dist/style.css && echo "OK: token 进 style.css" || echo "FAIL"
grep -q "super-popover-floating--light" dist/style.css && echo "OK: light 预设进 style.css" || echo "FAIL"
```

Expected: 两行均 `OK`。

人工/可视化(提示用户 `pnpm dev`,执行者不自动起 dev server):

- SuperPopover `effect="light"` 白底+深字+浅边框+轻阴影,箭头同步;dark 默认维持原样;祖先类设 `--wt-popover-bg`(含渐变)能覆盖气泡与箭头。
- SuperIcon `:icon` 字符串走 sprite、组件走渲染;`DynamicPin` active 过渡仍在;`effect` 切 tooltip 主题。
- SuperButton `:icon` 字符串/组件两路正常,`DynamicPin` active 过渡仍在。

---

## 自检清单(写完 plan 的复核)

- **Spec 覆盖:** 主题 token(Task 1)、theme.css 进 style.css(Task 1 Step 4)、SuperPopover light + 变量化两层(Task 2)、SuperIcon effect 透传(Task 2)、`name`/`lucide`→`icon` 合并(Task 3)、SuperButton 简化(Task 3)、App 迁移(Task 2+3)、README 主题色 + `:icon` 示例(Task 4)—— 均有对应任务。
- **占位符:** 无 TBD/TODO;每步含完整代码或精确命令。
- **类型一致:** `icon` 全程 `string | Component`;`effect` 全程 `'dark' | 'light'` 默认 `'dark'`;两层变量命名统一(对外 `--wt-popover-*` / 内部 `--_wt-popover-*`);`PropType` 用法附 fallback import 方案。
- **绿色检查点:** Task 2 不动 `lucide`→App 仍 `:lucide` 合法;Task 3 把 SuperIcon/SuperButton/App 同任务迁移,避免 prop 翻转导致中途红。
