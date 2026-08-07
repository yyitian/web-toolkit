<script setup>
import IconDemo from '../examples/demos/IconDemo.vue';
</script>

# SuperIcon

统一渲染 SVG sprite 字符串图标、Vue 图标组件和加载状态。传入 `title` 时会自动使用
`SuperPopover` 提供 tooltip。

## 基础用法

<ClientOnly><DemoBlock><IconDemo /></DemoBlock></ClientOnly>

```vue
<script setup lang="ts">
import { Settings } from '@lucide/vue';
import { SuperIcon } from '@yyitian/web-toolkit';
</script>

<template>
  <SuperIcon icon="example" :size="28" title="SVG sprite 图标" />
  <SuperIcon :icon="Settings" :size="28" title="Lucide 图标" />
  <SuperIcon loading :size="28" title="加载中" />
  <SuperIcon :icon="Settings" :size="28" :rotate="45" title="旋转 45 度" />
</template>
```

字符串图标必须先通过[Vite 插件](/guide/vite-plugin)注入对应 symbol。

## Props

| 属性      | 类型                  | 默认值   | 说明                       |
| --------- | --------------------- | -------- | -------------------------- |
| `icon`    | `string \| Component` | `''`     | sprite 名称或 Vue 图标组件 |
| `title`   | `string`              | `''`     | 非空时显示 tooltip         |
| `size`    | `string \| number`    | `20`     | 图标宽高                   |
| `rotate`  | `number`              | `0`      | 旋转角度，支持负数         |
| `loading` | `boolean`             | `false`  | 使用内置 spinner           |
| `active`  | `boolean`             | `false`  | 仅向动态图标透传状态       |
| `effect`  | `'dark' \| 'light'`   | `'dark'` | tooltip 外观               |

## 注意事项

- `loading` 状态优先于 `icon`，不会加载额外的 spinner 图标依赖。
- 普通 Vue 图标组件只接收 `size`；只有带 `dynamicIcon: true` 标记的组件接收 `active`。
- `title` 用于可见提示；在可交互控件中仍应提供合适的无障碍名称。
