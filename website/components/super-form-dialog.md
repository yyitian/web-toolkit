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

其他 attrs 会传给 `SuperDialog`。遮罩点击关闭默认禁用，可通过
`close-on-click-modal` 覆盖；默认页脚仅提供一个保存（只读时为关闭）按钮。

`formData` 在内部表单挂载时写入，处理规则参阅
[SuperForm 数据赋值](/components/super-form#数据初始化与赋值)。弹窗已打开后修改
`formData` 不会自动同步到表单；异步加载数据时可调用实例 `setFormData()`。
`form:mounted` 事件先发出，随后组件再写入 `formData`。

## Events

| 事件                | 参数                 | 说明                       |
| ------------------- | -------------------- | -------------------------- |
| `update:modelValue` | `(visible: boolean)` | 弹窗状态变化               |
| `form:mounted`      | —                    | 内部 `SuperForm` 已挂载    |
| `confirm`           | `(formData)`         | 非禁用状态下验证通过后触发 |

`confirm` 不会自动关闭弹窗。使用方应在保存成功后修改 `v-model`；保存期间传入
`loading` 可以阻止重复提交。

## Slots

| 插槽         | 说明                                                   |
| ------------ | ------------------------------------------------------ |
| `header`     | 透传到 `SuperDialog` 标题                              |
| `footer`     | 覆盖默认确认按钮                                       |
| 其他命名插槽 | 透传到 `SuperForm`，用于字段及子插槽；不透传作用域参数 |

## Expose

与 `SuperForm` 一致，暴露 `getFormData()`、`setFormData()`、`validate()`、`submit()` 和
`elForm`。
