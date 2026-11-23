<script setup>
import FormDialogDemo from '../examples/demos/FormDialogDemo.vue';
</script>

# SuperFormDialog

用于新增、编辑和只读查看配置。
字段配置参阅 [SuperForm](./super-form#column-通用配置)，弹窗布局参阅 [SuperDialog](./super-dialog)。

## 基础用法

通过 `columns` 配置字段、`formData` 传入初始数据。示例模拟保存成功后关闭。

::: tip 提示
`confirm` 在校验通过后触发；保存、错误提示和关闭由调用方处理，保存期间使用 `loading` 防止重复提交。
:::

<ClientOnly><DemoBlock><FormDialogDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { SuperButton, SuperFormDialog } from '@yyitian/web-toolkit';
import type { SuperFormColumn } from '@yyitian/web-toolkit';

const visible = ref(false);
const loading = ref(false);
const columns: SuperFormColumn[] = [
  {
    prop: 'name',
    label: '名称',
    formType: 'input',
    rules: { required: true, message: '请输入名称' },
  },
  {
    prop: 'type',
    label: '类型',
    formType: 'select',
    props: {
      options: [
        { label: '普通', value: 'normal' },
        { label: '高级', value: 'advanced' },
      ],
    },
  },
];
async function save() {
  loading.value = true;
  await new Promise((resolve) => setTimeout(resolve, 800));
  loading.value = false;
  visible.value = false;
  ElMessage.success('模拟保存完成');
}
</script>

<template>
  <SuperButton type="primary" @click="visible = true">编辑配置</SuperButton>
  <SuperFormDialog
    v-model="visible"
    title="编辑配置"
    :columns="columns"
    :form-data="{ name: '示例配置', type: 'normal' }"
    :loading="loading"
    @confirm="save"
  />
</template>
```

:::

## API

### Props

| 属性         | 类型                      | 默认值  | 说明                             |
| ------------ | ------------------------- | ------- | -------------------------------- |
| `modelValue` | `boolean`                 | —       | 弹窗可见状态                     |
| `title`      | `LabelValue`              | —       | 弹窗标题                         |
| `formData`   | `Record<string, unknown>` | `{}`    | 每次打开时应用的初始数据         |
| `columns`    | `SuperFormColumn[]`       | `[]`    | 表单字段配置                     |
| `disabled`   | `boolean`                 | `false` | 只读模式；默认按钮文案变为“关闭” |
| `width`      | `number \| string`        | `480`   | 弹窗宽度                         |
| `loading`    | `boolean`                 | `false` | 禁用表单并让确认按钮显示 loading |
| `confirm`    | `LabelValue`              | 自动    | 自定义确认按钮文案               |

其他弹窗属性参阅 [SuperDialog Props](./super-dialog#props)。遮罩点击关闭默认禁用，可通过
`close-on-click-modal` 覆盖；默认页脚仅提供一个保存（只读时为关闭）按钮。

打开时应用 `formData`，字段的赋值规则参阅
[SuperForm 数据赋值](/components/super-form#数据初始化与赋值)。弹窗已打开后修改
`formData` 不会自动同步到表单；异步加载数据时可调用实例 `setFormData()`。

### Events

| 事件                | 参数                 | 说明                            |
| ------------------- | -------------------- | ------------------------------- |
| `update:modelValue` | `(visible: boolean)` | 弹窗状态变化                    |
| `form:mounted`      | —                    | 表单已挂载，尚未应用 `formData` |
| `confirm`           | `(formData)`         | 非禁用状态下验证通过后触发      |

### Slots

| 插槽         | 说明                                                   |
| ------------ | ------------------------------------------------------ |
| `header`     | 自定义弹窗标题                                         |
| `footer`     | 覆盖默认确认按钮                                       |
| 其他命名插槽 | 透传到 `SuperForm`，用于字段及子插槽；不透传作用域参数 |

### Expose

提供与 [SuperForm 实例方法](./super-form#expose)相同的 `getFormData()`、
`setFormData()`、`validate()`、`submit()` 和 `elForm`。
