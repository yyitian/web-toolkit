<script setup>
import DialogDemo from '../examples/demos/DialogDemo.vue';
</script>

# SuperDialog

用于编辑、确认和详情查看，提供可滚动正文和默认确认、取消按钮。

## 基础用法

使用 `v-model` 控制显示，默认提供确认与取消按钮。

::: tip 提示
取消按钮直接关闭；确认后由调用方执行操作并关闭弹窗。
:::

<ClientOnly><DemoBlock><DialogDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SuperButton, SuperDialog } from '@yyitian/web-toolkit';

const visible = ref(false);
</script>

<template>
  <SuperButton type="primary" @click="visible = true">打开弹窗</SuperButton>
  <SuperDialog
    v-model="visible"
    title="删除确认"
    :width="480"
    @confirm="visible = false"
  >
    弹窗内容高度自然增长，超过 maxHeight 后正文区域滚动。
  </SuperDialog>
</template>
```

:::

## API

### Props

支持 Element Plus Dialog 属性；默认启用 `draggable`、`destroy-on-close` 和 `append-to-body`。

| 属性         | 类型                    | 默认值      | 说明                                |
| ------------ | ----------------------- | ----------- | ----------------------------------- |
| `modelValue` | `boolean`               | —           | 弹窗可见状态                        |
| `title`      | `LabelValue`            | `''`        | 标题，支持字符串、函数或文案对象    |
| `footer`     | `boolean`               | `true`      | 是否显示页脚                        |
| `width`      | `number \| string`      | `600`       | 弹窗宽度                            |
| `height`     | `number`                | `undefined` | 固定高度，单位 px                   |
| `maxHeight`  | `number`                | `600`       | 最大高度，单位 px，并受视口高度限制 |
| `cancel`     | `boolean \| LabelValue` | `true`      | 取消按钮开关或文案                  |
| `confirm`    | `LabelValue`            | `'确认'`    | 确认按钮文案                        |

### Events

| 事件                | 参数                 | 说明                               |
| ------------------- | -------------------- | ---------------------------------- |
| `update:modelValue` | `(visible: boolean)` | 弹窗状态变化                       |
| `confirm`           | —                    | 点击默认确认按钮；组件不会自动关闭 |

### Slots

| 插槽      | 说明                                           |
| --------- | ---------------------------------------------- |
| `default` | 弹窗正文                                       |
| `header`  | 自定义标题，接收 Element Plus header slot 参数 |
| `footer`  | 覆盖整个默认页脚                               |
