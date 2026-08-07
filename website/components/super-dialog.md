<script setup>
import DialogDemo from '../examples/demos/DialogDemo.vue';
</script>

# SuperDialog

对 Element Plus `ElDialog` 的轻量封装，提供统一的可滚动布局、默认页脚和
`SuperButton` 操作按钮。

## 基础用法

<ClientOnly><DemoBlock><DialogDemo /></DemoBlock></ClientOnly>

```vue
<SuperDialog v-model="visible" title="编辑" @confirm="save">
  弹窗正文
</SuperDialog>
```

## Props

除下表外，其他 attrs 会继续传给 `ElDialog`。

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

## Events

| 事件                | 参数                 | 说明                               |
| ------------------- | -------------------- | ---------------------------------- |
| `update:modelValue` | `(visible: boolean)` | 弹窗状态变化                       |
| `confirm`           | —                    | 点击默认确认按钮；组件不会自动关闭 |

## Slots

| 插槽      | 说明                                           |
| --------- | ---------------------------------------------- |
| `default` | 弹窗正文                                       |
| `header`  | 自定义标题，接收 Element Plus header slot 参数 |
| `footer`  | 覆盖整个默认页脚                               |

组件默认启用 `draggable`、`destroy-on-close` 和 `append-to-body`。取消按钮会直接关闭，
确认后的保存和关闭时机由使用方控制。
