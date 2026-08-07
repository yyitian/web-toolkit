<script setup>
import FormDialogDemo from '../examples/demos/FormDialogDemo.vue';
</script>

# SuperFormDialog

组合 `SuperDialog` 与 `SuperForm`，适合新增、编辑和只读查看配置。表单在弹窗每次挂载
时先建立字段默认值，再应用 `formData` 中提供的数据。

## 基础用法

<ClientOnly><DemoBlock><FormDialogDemo /></DemoBlock></ClientOnly>

```vue
<SuperFormDialog
  v-model="visible"
  title="编辑配置"
  :columns="columns"
  :form-data="currentData"
  :loading="saving"
  @confirm="save"
/>
```

## Props

| 属性         | 类型                      | 默认值  | 说明                             |
| ------------ | ------------------------- | ------- | -------------------------------- |
| `modelValue` | `boolean`                 | —       | 弹窗可见状态                     |
| `title`      | `LabelValue`              | —       | 弹窗标题                         |
| `formData`   | `Record<string, unknown>` | `{}`    | 挂载后写入与 columns 匹配的字段  |
| `columns`    | `SuperFormColumn[]`       | `[]`    | 表单字段配置                     |
| `disabled`   | `boolean`                 | `false` | 只读模式；默认按钮文案变为“关闭” |
| `width`      | `number \| string`        | `480`   | 弹窗宽度                         |
| `loading`    | `boolean`                 | `false` | 禁用表单并让确认按钮显示 loading |
| `confirm`    | `LabelValue`              | 自动    | 自定义确认按钮文案               |

其他 attrs 会传给 `SuperDialog`，组件固定设置 `close-on-click-modal="false"`。

`formData` 只写入其中实际提供且与 `columns` 匹配的字段；未提供的字段保留各自默认值。

## Events

| 事件                | 参数                 | 说明                       |
| ------------------- | -------------------- | -------------------------- |
| `update:modelValue` | `(visible: boolean)` | 弹窗状态变化               |
| `form:mounted`      | —                    | 内部 `SuperForm` 已挂载    |
| `confirm`           | `(formData)`         | 非禁用状态下验证通过后触发 |

`confirm` 不会自动关闭弹窗。使用方应在保存成功后修改 `v-model`；保存期间传入
`loading` 可以阻止重复提交。

## Slots

| 插槽         | 说明                                   |
| ------------ | -------------------------------------- |
| `header`     | 透传到 `SuperDialog` 标题              |
| `footer`     | 覆盖默认确认按钮                       |
| 其他命名插槽 | 透传到 `SuperForm`，供 `slot` 字段使用 |

## Expose

与 `SuperForm` 一致，暴露 `getFormData()`、`setFormData()`、`validate()`、`submit()` 和
`elForm`。
