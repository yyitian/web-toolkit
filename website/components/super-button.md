<script setup>
import ButtonBasicDemo from '../examples/demos/ButtonBasicDemo.vue';
import ButtonIconDemo from '../examples/demos/ButtonIconDemo.vue';
</script>

# SuperButton

在 Element Plus `ElButton` 基础上统一接入 `SuperIcon`、纯图标形态、tooltip、精确正方形
尺寸和组件自有 loading 状态。

## 基础用法

<ClientOnly><DemoBlock><ButtonBasicDemo /></DemoBlock></ClientOnly>

```vue
<script setup lang="ts">
import { Save } from '@lucide/vue';
import { SuperButton } from '@yyitian/web-toolkit';
</script>

<template>
  <!-- 默认 label -->
  <SuperButton label="普通按钮" />

  <!-- icon + 默认插槽 -->
  <SuperButton :icon="Save">保存</SuperButton>

  <!-- Loading -->
  <SuperButton label="加载中" loading />

  <!-- Disabled -->
  <SuperButton label="按钮禁用" disabled />
</template>
```

没有图标和默认插槽时，`label` 直接作为按钮文字；图标与文字并用时，通过 `icon` 指定
图标、默认插槽提供文字。上方展示区按效果完整呈现 Element Plus Button 的主题色及
`plain`、`round`、`dashed`、`text`、`loading` 状态。字符串图标需要先通过
[Vite 插件](/guide/vite-plugin)注入。

## 图标模式

<ClientOnly><DemoBlock><ButtonIconDemo /></DemoBlock></ClientOnly>

```vue
<script setup lang="ts">
import { Bell, RefreshCw, Search, Settings } from '@lucide/vue';
import { SuperButton } from '@yyitian/web-toolkit';
</script>

<template>
  <!-- 纯图标 -->
  <SuperButton :icon="Search" label="搜索" />

  <!-- Loading -->
  <SuperButton :icon="RefreshCw" label="刷新中" loading />

  <!-- Disabled -->
  <SuperButton :icon="RefreshCw" label="禁用" disabled />

  <!-- Square -->
  <SuperButton type="primary" :icon="Settings" label="设置" :square="36" />

  <!-- Square + Circle -->
  <SuperButton type="primary" :icon="Bell" label="通知" :square="36" circle />
</template>
```

未设置 `square` 的纯图标按钮使用无边框紧凑形态；设置后，`square` 就是按钮的精确
边长，并可配合 Element Plus 的 `circle` 属性切换为圆形外观。纯图标按钮的 `label`
用于 tooltip 和默认无障碍名称；loading 只替换内部图标，不改变原有按钮形态。

## 自有 Props

除下表外，组件支持 Element Plus Button 的其他属性。

| 属性       | 类型                  | 默认值      | 说明                                                      |
| ---------- | --------------------- | ----------- | --------------------------------------------------------- |
| `icon`     | `string \| Component` | `''`        | 直接透传给 `SuperIcon`                                    |
| `label`    | `string`              | `''`        | 无默认插槽时可作为文字；纯图标时作为 tooltip 和无障碍名称 |
| `square`   | `number`              | `undefined` | 纯图标按钮的精确正方形边长，必须大于 0                    |
| `active`   | `boolean`             | `false`     | 透传给动态图标                                            |
| `loading`  | `boolean`             | `false`     | 显示内置 spinner、设置 `aria-busy` 并禁用点击             |
| `disabled` | `boolean`             | `false`     | 禁用按钮                                                  |

## Slots

| 插槽      | 说明                                      |
| --------- | ----------------------------------------- |
| `default` | 按钮文字；存在时不进入纯图标形态          |
| `icon`    | 自定义图标，优先于 `icon` prop 的渲染内容 |

原生事件和 attrs 会继续传给底层 `ElButton`。
