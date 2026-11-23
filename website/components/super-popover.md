<script setup>
import PopoverDemo from '../examples/demos/PopoverDemo.vue';
</script>

# SuperPopover

在参考元素旁显示提示或自定义内容，支持悬停、点击和手动控制。

## 交互示例

使用 `trigger` 选择触发方式，手动模式通过 `v-model` 控制显示。

::: tip 提示
将 `reference` 插槽中的 `setReference` 绑定到触发元素的 `ref`。
:::

<ClientOnly><DemoBlock><PopoverDemo section="triggers" /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SuperButton, SuperPopover } from '@yyitian/web-toolkit';

const visible = ref(false);
</script>

<template>
  <SuperPopover title="默认 hover 提示">
    <template #reference="{ setReference }">
      <SuperButton :ref="setReference">悬停查看</SuperButton>
    </template>
  </SuperPopover>
  <SuperPopover trigger="click">
    <template #reference="{ setReference }">
      <SuperButton :ref="setReference">点击查看</SuperButton>
    </template>
    <template #content>点击浮层内部不会关闭</template>
  </SuperPopover>
  <SuperPopover v-model="visible" trigger="manual" title="由外部状态控制">
    <template #reference="{ setReference }">
      <SuperButton :ref="setReference" @click="visible = !visible">
        手动控制
      </SuperButton>
    </template>
  </SuperPopover>
</template>
```

:::

## Teleport 与样式

浮层默认挂载到 `body`，可显示在裁切容器外；设置 `:teleport-to="false"` 时挂载在参考元素旁。
原生元素也可作为参考元素。

::: tip 提示
浮层样式通过 `popperClass` 或 `popperStyle` 设置，不依赖触发位置祖先的 scoped 样式。
:::

<ClientOnly><DemoBlock><PopoverDemo section="customization" /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { SuperButton, SuperPopover } from '@yyitian/web-toolkit';
</script>

<template>
  <div class="clip-container">
    <SuperPopover
      popper-class="project-popover"
      :popper-style="{ '--wt-popover-padding': '10px 14px' }"
    >
      <template #reference="{ setReference }">
        <SuperButton :ref="setReference">容器外浮层</SuperButton>
      </template>
      <template #content>浮层不会被容器边界裁切</template>
    </SuperPopover>
  </div>
  <SuperPopover :teleport-to="false" title="浮层与触发器相邻渲染">
    <template #reference="{ setReference }">
      <button :ref="setReference" type="button">
        原生参考元素（不 Teleport）
      </button>
    </template>
  </SuperPopover>
</template>

<style scoped>
.clip-container {
  width: 132px;
  height: 42px;
  overflow: hidden;
}
</style>

<style>
.project-popover {
  --wt-popover-bg: linear-gradient(135deg, #7c3aed, #2563eb);
  --wt-popover-color: #fff;
}
</style>
```

:::

## API

### Props

| 属性                  | 类型                                          | 默认值                    | 说明                                        |
| --------------------- | --------------------------------------------- | ------------------------- | ------------------------------------------- |
| `modelValue`          | `boolean`                                     | `false`                   | 浮层可见状态                                |
| `placement`           | `Placement`                                   | `'top'`                   | Floating UI 定位方向                        |
| `offset`              | `number`                                      | `12`                      | 浮层与参考节点的距离                        |
| `effect`              | `'auto' \| 'dark' \| 'light'`                 | `'auto'`                  | 跟随主题或固定实体外观                      |
| `title`               | `string`                                      | `''`                      | 无 `content` 插槽时的内容                   |
| `teleportTo`          | `string \| HTMLElement \| false`              | `'body'`                  | Teleport 目标；`false` 时渲染为真实兄弟节点 |
| `trigger`             | `'hover' \| 'click' \| 'manual'`              | `'hover'`                 | 触发方式                                    |
| `disabled`            | `boolean`                                     | `false`                   | 禁止打开并关闭现有浮层                      |
| `arrow`               | `boolean`                                     | `true`                    | 是否显示箭头                                |
| `delay`               | `number \| { open?: number; close?: number }` | `{ open: 0, close: 120 }` | 打开和关闭延迟                              |
| `closeOnClickOutside` | `boolean`                                     | `true`                    | click/manual 模式下点击外部关闭             |
| `popperClass`         | 任意 class 值                                 | `undefined`               | 应用到浮层自身的 class                      |
| `popperStyle`         | `StyleValue`                                  | `undefined`               | 应用到浮层自身的样式                        |

### Events

| 事件                | 参数                 | 说明         |
| ------------------- | -------------------- | ------------ |
| `update:modelValue` | `(visible: boolean)` | 可见状态变化 |

### Slots

| 插槽        | 参数               | 说明                                             |
| ----------- | ------------------ | ------------------------------------------------ |
| `reference` | `{ setReference }` | 必须把 `setReference` 绑定到真实参考元素的 `ref` |
| `content`   | —                  | 自定义浮层内容，优先于 `title`                   |
