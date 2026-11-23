<script setup>
import FormBasicDemo from '../examples/demos/FormBasicDemo.vue';
import FormDemo from '../examples/demos/FormDemo.vue';
import FormCascaderDemo from '../examples/demos/FormCascaderDemo.vue';
import FormLabelDemo from '../examples/demos/FormLabelDemo.vue';
</script>

# SuperForm

通过字段配置创建表单，支持校验、条件显示、赋值与提交。

## 基础用法

配置字段后，调用 `submit()` 执行校验；验证通过后从 `submit` 事件取得数据。

<ClientOnly><DemoBlock><FormBasicDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SuperButton, SuperForm } from '@yyitian/web-toolkit';
import type { SuperFormColumn, SuperFormInstance } from '@yyitian/web-toolkit';

const form = ref<SuperFormInstance>();
const result = ref('');
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
function submit(data: Record<string, unknown>) {
  result.value = JSON.stringify(data, null, 2);
}
</script>

<template>
  <SuperForm ref="form" :columns="columns" @submit="submit" />
  <SuperButton type="primary" @click="form?.submit()">提交表单</SuperButton>
  <pre v-if="result">{{ result }}</pre>
</template>
```

:::

## 综合示例

按类型选择字段，通过 `show` 控制条件显示。图片上传为本地模拟。

<ClientOnly><DemoBlock><FormDemo /></DemoBlock></ClientOnly>

配置片段，仅展示类型选择与条件字段；其他字段配置参阅下方各节。

::: details 查看配置片段

```ts
import type { SuperFormColumn } from '@yyitian/web-toolkit';

const columns: SuperFormColumn[] = [
  {
    prop: 'kind',
    label: '类型',
    formType: 'radio',
    props: {
      options: [
        { label: '普通', value: 'normal' },
        { label: '高级', value: 'advanced' },
      ],
    },
  },
  {
    prop: 'advancedName',
    label: '高级名称',
    formType: 'input',
    show: (data) => data.kind === 'advanced',
  },
];
```

:::

## 标签布局

使用 `label-position` 设置标签位置，`require-asterisk-position` 设置必填星号位置。
省略 `label` 时隐藏标签及提示。

::: tip 提示
隐藏星号不改变校验规则；必填要求由字段或表单级 `rules` 决定。
:::

<ClientOnly><DemoBlock><FormLabelDemo /></DemoBlock></ClientOnly>

::: details 查看配置片段

配置片段，`columns` 使用带 `label` 和 `rules` 的字段配置：

```vue
<SuperForm
  :columns="columns"
  label-position="left"
  label-width="130px"
  require-asterisk-position="left"
/>
```

:::

## 数据初始化与赋值

通过 `defaultValue` 设置初始值，优先于[字段类型默认值](#字段类型)。单次挂载期间应保持字段结构稳定。

实例 `setFormData(data)` 只写入已配置且实际提供的字段：缺少的字段保持原值；传入
`null` 或 `undefined` 时恢复该字段默认值，并清除表单验证状态。

`getFormData()` 和提交事件只返回当前可见且值不为 `undefined` 的字段；`slot` 字段
始终排除。隐藏字段再次显示时保留原值，本地 Upload 除外。

## 自定义字段与插槽

::: tip 提示
字段赋值与变化使用 `defaultValue`、`setFormData()` 和 `change`，不要在 `props` 中绑定 `modelValue` 或变化事件。
:::

`custom` 字段必须提供 `component`，组件接收 `modelValue`、`disabled` 并通过
`update:modelValue` 更新数据。此类型不支持 `props`、`slots` 和 `change` 配置。

`slot` 字段只用于布局和说明，通过 `prop` 同名插槽填充，不参与表单数据：

::: details 查看配置片段

```vue
<SuperForm :columns="[{ prop: 'notice', formType: 'slot' }]">
  <template #notice>提交前请确认信息。</template>
</SuperForm>
```

:::

使用 `column.slots` 自定义内置字段的子插槽，例如输入框前缀：

::: details 查看配置片段

```vue
<SuperForm
  :columns="[
    { prop: 'url', formType: 'input', slots: { prepend: 'url-prefix' } },
  ]"
>
  <template #url-prefix>https://</template>
</SuperForm>
```

:::

## 日期字段

`formType: 'date-picker'` 的 `props.type` 默认为 `date`。范围类型默认时刻为
00:00:00～23:59:59，单日期为 00:00:00；可用 `props.defaultTime` 覆盖。

表单不预设 `valueFormat`，不配置时沿用 Element Plus 的 Date 值；需要提交字符串时
显式设置，例如：

::: details 查看配置片段

```ts
import { DATE_FORMATS } from '@yyitian/web-toolkit';
import type { SuperFormColumn } from '@yyitian/web-toolkit';

const dateColumn: SuperFormColumn = {
  prop: 'createdAt',
  label: '创建时间',
  formType: 'date-picker',
  props: {
    type: 'datetimerange',
    valueFormat: DATE_FORMATS.dateTimeSeconds,
  },
};
```

:::

`format` 控制界面显示，`valueFormat` 控制绑定值。表格搜索另有字符串格式默认值，参阅
[SuperTable 日期配置](/components/super-table#搜索与日期配置)。

## Cascader 级联选择

使用 `formType: 'cascader'`，通过 `props.options` 配置树形选项，`props.props` 配置节点行为。

<ClientOnly><DemoBlock><FormCascaderDemo /></DemoBlock></ClientOnly>

::: details 查看配置片段

```ts
import type { SuperFormColumn } from '@yyitian/web-toolkit';

const options = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      { value: 'hangzhou', label: '杭州' },
      { value: 'ningbo', label: '宁波' },
      { value: 'wenzhou', label: '温州（禁用）', disabled: true },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [
      { value: 'nanjing', label: '南京' },
      { value: 'suzhou', label: '苏州' },
    ],
  },
];
const columns: SuperFormColumn[] = [
  {
    prop: 'region',
    label: '所在地区（路径单选）',
    formType: 'cascader',
    rules: { required: true, message: '请选择所在地区', trigger: 'change' },
    props: { options, placeholder: '请选择省市' },
  },
  {
    prop: 'cities',
    label: '服务城市（多选末级值）',
    formType: 'cascader',
    props: {
      options,
      props: { multiple: true, emitPath: false },
      collapseTags: true,
      collapseTagsTooltip: true,
    },
  },
];
```

:::

后端选项使用自定义键时，可通过节点配置映射；其他选项属性会原样保留：

::: details 查看配置片段

```ts
{
  prop: 'department',
  label: '部门',
  formType: 'cascader',
  props: {
    options: [
      { id: 1, name: '研发', nodes: [{ id: 2, name: '前端', leaf: true }] },
    ],
    props: { value: 'id', label: 'name', children: 'nodes', emitPath: false },
  },
}
```

:::

## Upload 使用教程

不提供 `props.upload` 时保存本地文件，提供后使用远程上传结果。

### 本地 Upload

本地模式不传 `upload`，适合在表单最终提交时统一发送文件：

::: details 查看配置片段

```ts
import type { SuperFormColumn } from '@yyitian/web-toolkit';

const columns: SuperFormColumn[] = [
  {
    prop: 'attachment',
    label: '附件',
    formType: 'upload',
    props: {},
  },
  {
    prop: 'images',
    label: '图片',
    formType: 'upload',
    props: {
      type: 'image',
      multiple: true,
      limit: 6,
    },
  },
];
```

:::

- 单文件字段值为 `File | null`，多文件字段值为 `File[]`。
- `type: 'image'` 设置文件选择器的 `accept="image/*"` 并提供本地预览；实际上传校验由业务处理。
- 隐藏或卸载本地 Upload 后清除文件，需在表单外保留仍要使用的文件。

### 远程 Upload

配置 `upload(files, currentFiles)` 调用上传 API 并返回文件信息。

::: tip 提示
上传失败时保留原值，错误提示由上传函数处理。
:::

::: details 查看配置片段

接入片段中的 `uploadFile`、`showUploadError` 由业务提供：

```ts
import type {
  SuperFormColumn,
  SuperUploadRequest,
  SuperUploadValue,
} from '@yyitian/web-toolkit';

const uploadImages: SuperUploadRequest = async (files, currentFiles) => {
  try {
    const uploaded: SuperUploadValue[] = await Promise.all(
      files.map(async (file) => {
        const result = await uploadFile(file);
        return {
          id: result.id,
          url: result.url,
          name: file.name,
          type: file.type,
          size: file.size,
        };
      }),
    );
    return uploaded;
  } catch (error) {
    showUploadError(error);
    return false;
  }
};

const columns: SuperFormColumn[] = [
  {
    prop: 'images',
    label: '远程图片',
    formType: 'upload',
    props: {
      type: 'image',
      multiple: true,
      limit: 6,
      upload: uploadImages,
    },
  },
];
```

:::

## API

### Props

| 属性       | 类型                | 默认值  | 说明               |
| ---------- | ------------------- | ------- | ------------------ |
| `columns`  | `SuperFormColumn[]` | `[]`    | 字段配置           |
| `disabled` | `boolean`           | `false` | 禁用全部字段与提交 |

其他 attrs 会传给底层 `ElForm`，例如 `label-width`、`size` 和验证配置。

### Column 通用配置

| 字段           | 类型                             | 说明                                    |
| -------------- | -------------------------------- | --------------------------------------- |
| `prop`         | `string`                         | 数据键，同时作为 ElFormItem 的 prop     |
| `label`        | `LabelValue`                     | 标签文案；省略时不渲染 label slot       |
| `tips`         | `LabelValue`                     | 标签旁的 tooltip                        |
| `formType`     | 见下方字段类型                   | 必填，决定字段组件                      |
| `component`    | `Component`                      | 仅 `custom` 类型必填                    |
| `rules`        | `FormItemRule \| FormItemRule[]` | Element Plus 验证规则                   |
| `class`        | 任意 class 值                    | 应用到 ElFormItem                       |
| `show`         | `(formData) => boolean`          | 返回 `false` 时隐藏字段并从提交结果排除 |
| `defaultValue` | `unknown`                        | 显式默认值                              |
| `props`        | `Record<string, unknown>`        | 传给内置字段组件                        |
| `slots`        | `Record<string, string \| Slot>` | 内置字段的子插槽映射                    |
| `change`       | `(formData, value) => void`      | 字段变化回调                            |

### 字段类型

| `formType`     | 默认值                     | 说明                                     |
| -------------- | -------------------------- | ---------------------------------------- |
| `input`        | `''`                       | 单行输入                                 |
| `textarea`     | `''`                       | 多行输入，Enter 不提交表单               |
| `input-number` | `0`                        | 数字输入                                 |
| `radio`        | 第一项的 value             | 单选                                     |
| `select`       | `''` 或 `[]`               | 选择器，`multiple` 时默认为数组          |
| `cascader`     | `[]` 或 `''`               | 级联选择，路径值或多选默认为数组         |
| `checkbox`     | `false` 或 `[]`            | 单项或选项组                             |
| `switch`       | `inactiveValue` 或 `false` | 开关                                     |
| `date-picker`  | `''` 或 `[]`               | 单日期为空字符串；范围或多日期为空数组   |
| `upload`       | `null` 或 `[]`             | 本地或远程文件                           |
| `slot`         | 不进入数据                 | 使用以 `prop` 命名的插槽                 |
| `custom`       | `undefined`                | 使用 `component` 指定自定义 v-model 组件 |

### Slots

| 插槽                      | 参数               | 说明             |
| ------------------------- | ------------------ | ---------------- |
| `column.prop` 同名插槽    | —                  | `slot` 字段内容  |
| `column.slots` 映射的名称 | 底层字段的插槽参数 | 内置字段的子插槽 |

### Events

| 事件     | 参数         | 说明                       |
| -------- | ------------ | -------------------------- |
| `submit` | `(formData)` | 验证通过后携带表单数据触发 |

事件参数是当前可见字段数据的深拷贝。

### Expose

| 名称                | 返回值                      | 说明                                     |
| ------------------- | --------------------------- | ---------------------------------------- |
| `getFormData()`     | `Record<string, unknown>`   | 读取当前可见字段数据的深拷贝             |
| `setFormData(data)` | `void`                      | 按上方赋值规则写入字段并清除验证         |
| `validate()`        | `Promise<boolean>`          | 执行验证；验证失败返回 `false`，不会抛出 |
| `submit()`          | `Promise<void>`             | 主动执行验证，成功后触发 `submit` 事件   |
| `elForm`            | `FormInstance \| undefined` | 底层 Element Plus 表单实例               |

在单行 input 中按 Enter 会提交；textarea 和文件输入不会触发该行为。

### Cascader 配置

`column.props` 中的 `filterable`、`clearable` 默认均为 `true`。
`column.props.props` 支持 Element Plus Cascader 节点选项，常用配置如下：

| 选项            | 默认值    | 说明                                         |
| --------------- | --------- | -------------------------------------------- |
| `expandTrigger` | `'hover'` | 改为 `'click'` 后点击展开子级                |
| `multiple`      | `false`   | 多选                                         |
| `emitPath`      | `true`    | 返回节点路径；关闭后只返回节点值             |
| `checkStrictly` | `false`   | 是否允许选择任意层级                         |
| `lazy/lazyLoad` | —         | 懒加载，返回原生选项结构，动态标签使用字符串 |

路径单选和多选默认值为 `[]`，仅返回节点值的单选为 `''`；清空值遵循 Element Plus 行为。
多选返回路径数组的数组，关闭 `emitPath` 后返回节点值数组。

### Upload 配置

| 配置       | 默认值   | 说明                               |
| ---------- | -------- | ---------------------------------- |
| `type`     | `'file'` | `'file'` 或 `'image'`              |
| `multiple` | `false`  | 是否允许多文件                     |
| `limit`    | —        | 多文件数量上限；单文件始终最多一项 |
| `upload`   | —        | 远程上传适配器；省略时使用本地模式 |

文件数量达到上限后需先删除已有文件再选择。图片列表最多显示 8 个缩略图，超出数量
显示在最后一项；预览仍包含全部图片。

### Upload 类型与返回值

`currentFiles` 是选择新文件前已有的远程文件。成功结果使用以下结构：

```ts
interface SuperUploadValue {
  id?: string | number;
  url: string;
  name: string;
  type: string;
  size: number;
}
```

远程字段值为 `SuperUploadValue | null` 或 `SuperUploadValue[]`。适配器返回
`undefined`、`null` 或 `false` 时，组件保持原值；抛出异常时同样不修改字段，具体错误
提示由适配器负责。单文件模式可以返回一个对象或仅含一个对象的数组；多文件模式可以
返回对象或数组。

上传函数签名：

```ts
type SuperUploadRequest = (
  files: File[],
  currentFiles: SuperUploadValue[],
) => Promise<SuperUploadValue | SuperUploadValue[] | undefined | null | false>;
```

### 样式与主题

控件尺寸使用 `size`，字号参阅[文字层级与排版](/guide/theming#文字层级与排版)。

通过 `--wt-form-label-color` 自定义标签颜色，`--wt-form-control-*` 调整控件背景、文字、
边框及交互状态；`--wt-form-switch-bg`、`--wt-form-switch-border-color` 控制关闭的开关轨道。
变量可设置在表单父级或根节点。

下拉、级联和日期浮层的局部样式通过字段 `props.popperStyle` 或 `props.popperClass` 设置；
挂载于 body 的浮层不会自动继承触发位置的局部变量。
使用效果参阅[表单控件配色](/guide/theming#表单控件配色)。
