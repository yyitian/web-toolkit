# SuperIcon Dynamic Icon 设计

> 状态:已批准,待写实现 plan
> 日期:2026-06-17
> 关联 backlog:`docs/superpowers/backlog.md` 章节一(SuperIcon 按需加载 lucide,根治打包体积)

## 1. 背景与问题

`src/components/SuperIcon/index.vue` 当前这样取 lucide 图标:

```ts
import * as LucideIcons from '@lucide/vue';
const lucideIcon = Reflect.get(LucideIcons, lucideName); // 按字符串动态取
```

`import *` + `Reflect.get(...)` 是**动态属性访问**,bundler 无法静态分析「到底用了哪几个图标」,因此即便我们把 `@lucide/vue` 设为 external 可选 peer,**消费方 app 仍会把整包 lucide(约 790KB)打进去**——体积问题只是从我们的包转移到了消费方,未根治。

`@lucide/vue` 的 `package.json` 标了 `"sideEffects": false` 且为 ESM。这意味着**只要改成静态的 `import { Pin } from '@lucide/vue'`,现代 bundler 就能 tree-shake,只打进用到的那几个图标**——根治的钥匙在此。

同时要保住的现有能力:`icon-preset.ts` 给特定图标提供「按 `active` 切换的状态 + 过渡动画」(Pin 的置顶/取消置顶描边)。这是必须保留的核心功能,且要求 **icon 与状态层 1:1**。

## 2. 方案:传组件 + Dynamic Icon

### 2.1 基础图标:传组件(根治 tree-shaking)

`SuperIcon` 的 `lucide` prop 从「字符串」改为「组件」。消费方静态 `import { Search } from '@lucide/vue'` 后把组件传进来:

```vue
<SuperIcon :lucide="Search" />
```

消费方的静态 import + `sideEffects:false` ⇒ tree-shaking 自动生效,只打进用到的图标。`SuperIcon` 内部不再 `import * as LucideIcons`,只负责渲染传入的组件。

### 2.2 状态层:Dynamic Icon(icon 与状态 1:1)

「Dynamic icon」= 某个 lucide 底图 + 它专属的 active 状态/过渡,**打包成单个组件**。1:1 由构造方式保证,不存在分开传两个参数。

关键机制(已验证,来自 `node_modules/@lucide/vue/dist/esm/Icon.mjs`):lucide 图标渲染时是 `[...基础路径, ...slots.default()]`,即**会把默认插槽内容画进自己的 `<svg>` 里**。Pin 现有描边动画正是用此机制叠加,迁移后机制不变。

**每个 Dynamic Icon 是独立的 SFC**。原因:状态层的过渡动画依赖一组 CSS(`super-icon-pin-enter-active` / `-leave-active` + `@keyframes super-icon-pin-draw`/`erase`),`.ts` 渲染函数无法携带 scoped CSS,而 SFC 天然把「结构 + 专属样式」绑定在一起,正是 Dynamic Icon 该有的形态。**不使用工厂函数**。

```vue
<!-- src/components/SuperIcon/dynamic-icons/DynamicPin.vue —— 引用 lucide 底图 -->
<script setup lang="ts">
import { Pin } from '@lucide/vue';
defineOptions({ dynamicIcon: true }); // 标记:供 SuperIcon 判断是否转发 active
// 只声明 active(声明后会被吃掉、不漏到 svg);size 等其余 attrs 默认透传到根组件 Pin
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
/* 由现 icon-preset.ts / SuperIcon 的 super-icon-pin 过渡 CSS 搬入:
   .super-icon-pin-enter-active / -leave-active + @keyframes draw/erase */
</style>
```

`<path>` 在 SFC 模板内 → 拿到本组件 scope id,过渡 class 正常匹配(与现有行为一致,仅换了归属文件)。scoped CSS 经 Vite lib 构建汇入 `dist/style.css`,消费方本就会 `import '@yyitian/web-toolkit/style.css'`,自动生效。

> **关键:库主入口保持 lucide-free。** `import { Pin }` 只发生在 `dynamic-icons/` 下的 SFC 中,经子路径入口发布;主入口 `lib/main.ts` 不 import 任何 lucide 图标,可选 peer 定位不破。

### 2.3 成品 Dynamic Icon:独立子路径入口(用户选 B)

库直接发成品 `DynamicPin`,放在独立子路径 `@yyitian/web-toolkit/dynamic-icons`。该子路径(及其引用的 SFC)import lucide 底图;主入口 `@yyitian/web-toolkit` 仍 lucide-free,只用 sprite 的消费方不受影响。

```ts
// lib/dynamic-icons.ts —— lucide 子路径入口,re-export 各 Dynamic Icon SFC
export { default as DynamicPin } from '@/components/SuperIcon/dynamic-icons/DynamicPin.vue';
```

> **扩展方式:** 将来要新增 Dynamic Icon,照 `DynamicPin.vue` 再写一个 SFC、在 `lib/dynamic-icons.ts` re-export 即可,无需学习工厂 API。

### 2.4 统一的使用入口

普通 lucide 图标和 Dynamic icon 走**同一个 `:lucide` 入口**,`SuperIcon` 无需 `preset` prop:

```vue
<script setup lang="ts">
import { Search } from '@lucide/vue';
import { DynamicPin } from '@yyitian/web-toolkit/dynamic-icons';
</script>

<template>
  <SuperIcon :lucide="DynamicPin" :active="isPinned" />
  <!-- 有状态:置顶/取消置顶带动画 -->
  <SuperIcon :lucide="Search" />
  <!-- 普通静态图标 -->
  <SuperIcon name="my-sprite" />
  <!-- sprite,不变 -->
</template>
```

`SuperIcon` 渲染 `:lucide` 组件,转发 `size`;仅当组件带 `dynamicIcon` 标记(即 `props.lucide?.dynamicIcon === true`)时才向下转发 `active`,避免普通 lucide 图标的 `<svg>` 上挂多余的 `active` 属性。

## 3. 组件 API 变更

### SuperIcon（`src/components/SuperIcon/index.vue`）

| prop                                    | 旧               | 新                                     |
| --------------------------------------- | ---------------- | -------------------------------------- |
| `lucide`                                | `String`(图标名) | `Object`(组件)                         |
| `preset`                                | —                | 不引入(状态层已并入 Dynamic icon 组件) |
| `name`                                  | `String`(sprite) | 不变                                   |
| `active`                                | `Boolean`        | 不变(仅转发给带标记的 Dynamic icon)    |
| `size` / `rotate` / `loading` / `title` | 不变             | 不变                                   |

行为变更:

- 删除 `import * as LucideIcons` 与 `import { getIconPreset } from './icon-preset.ts'`。
- `renderLucideIcon`:由「按字符串 `Reflect.get` 取组件」改为「直接渲染传入的 `props.lucide` 组件」,渲染时若组件带 `dynamicIcon` 标记则传 `active`。
- loading 态:由 `renderLucideIcon('Loader')` 改为**内联 SVG spinner**(沿用现有 `.loading` 旋转 keyframes),`SuperIcon` 从此零 lucide 依赖。
- **把 `super-icon-pin` 过渡相关 CSS(`-enter-active` / `-leave-active` + `@keyframes draw`/`erase`)从这里迁出到 `DynamicPin.vue` 的 `<style scoped>`**;`SuperIcon` 仅保留 `.super-icon`、`.loading` 及 loading 旋转 keyframes。

### SuperButton（`src/components/SuperButton/index.vue`）

`icon` prop 由 `string`(带 `lucide-` 前缀 hack)改为 `string | Component`:

- 传字符串 ⇒ 作为 sprite `name`。
- 传组件(普通 lucide 或 `DynamicPin`)⇒ 作为 `lucide`,并转发 `active`。
- 删除 `props.icon.startsWith('lucide-')` 前缀判断逻辑。

```vue
<SuperButton :icon="DynamicPin" :active="x" />
<!-- lucide / dynamic -->
<SuperButton icon="my-sprite" />
<!-- sprite -->
```

## 4. 构建与发布配置

- **Vite 主构建多入口**:`vite.config.ts` 的 `build.lib.entry` 由单入口 `lib/main.ts` 改为
  `{ index: 'lib/main.ts', 'dynamic-icons': 'lib/dynamic-icons.ts' }`,
  同次构建产出 `dist/index.js` + `dist/dynamic-icons.js`。`@lucide/vue` 继续 external(已在 external 列表),由消费方解析并 tree-shake。不新增构建配置文件。
- **dts**:`vite-plugin-dts` 的 `include` 已含 SuperIcon 目录与 `lib`;新增 `lib/dynamic-icons.ts` 后产出 `dist/lib/dynamic-icons.d.ts`(沿用 main 的 `dist/lib/...` 落点)。确认 `dynamic-icons/*.vue` 在 dts include 覆盖范围内。
- **package.json `exports`** 新增子路径:
  ```json
  "./dynamic-icons": {
    "types": "./dist/lib/dynamic-icons.d.ts",
    "import": "./dist/dynamic-icons.js"
  }
  ```
- **README** 增补一节:dynamic icon 用法 + 提醒「用 `DynamicPin` 需安装可选 peer `@lucide/vue`」。
- **本地演示** `src/App.vue`:把现有 Pin 用法迁移到新 API,作为开发预览验证。

## 5. 不在本次范围

- backlog 章节二(SuperButton 脱离 element-plus)、章节三(单元测试)不动。
- 不为 Pin 以外的图标新增成品 Dynamic icon(将来按需照 `DynamicPin.vue` 复制扩展)。

## 6. 验收标准

1. `pnpm build` 通过(`vue-tsc --noEmit` + vite 多入口构建),产出 `dist/index.js`、`dist/dynamic-icons.js` 及对应 `.d.ts`。
2. `dist/index.js`(主入口)**不含任何 lucide 图标代码**;`@lucide/vue` 不被打进任一产物(external)。
3. `pnpm lint` 与 `pnpm format:check` 均通过。
4. `src/App.vue` 用新 API 渲染:`DynamicPin` 的 active 切换仍有描边过渡动画;普通 lucide 图标正常显示;sprite 图标不变;loading 态显示内联 SVG spinner 旋转。
5. 消费方只 `import` 主入口(只用 sprite)时,其构建产物不含 lucide。
