<script setup>
import FormDemo from '../examples/demos/FormDemo.vue';
import FormCascaderDemo from '../examples/demos/FormCascaderDemo.vue';
</script>

# SuperForm

通过 `columns` 配置生成 Element Plus 表单，统一默认值、条件显示、验证、提交和文件字段
的数据语义。

## 综合示例

<ClientOnly><DemoBlock><FormDemo /></DemoBlock></ClientOnly>

```ts
import type { SuperFormColumn } from '@yyitian/web-toolkit';

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
```

## Props

| 属性       | 类型                | 默认值  | 说明               |
| ---------- | ------------------- | ------- | ------------------ |
| `columns`  | `SuperFormColumn[]` | `[]`    | 字段配置           |
| `disabled` | `boolean`           | `false` | 禁用全部字段与提交 |

其他 attrs 会传给底层 `ElForm`，例如 `label-width`、`size` 和验证配置。

## Column 通用配置

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

## 字段类型

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

## 数据初始化与赋值

字段默认值在挂载时建立，单次挂载期间应保持 `columns` 的字段结构稳定。显式
`defaultValue` 优先于上表的类型默认值；默认值会深拷贝，避免多个表单共享可变数据。

实例 `setFormData(data)` 只写入已配置且实际提供的字段：缺少的字段保持原值；传入
`null` 或 `undefined` 时恢复该字段默认值，并清除表单验证状态。

`getFormData()` 和提交事件只返回当前可见且值不为 `undefined` 的字段；`slot` 字段
始终排除。一般字段隐藏后保留内部值，再次显示可继续编辑；本地 Upload 隐藏时清除文件。

## 自定义字段与插槽

`custom` 字段必须提供 `component`，组件接收 `modelValue`、`disabled` 并通过
`update:modelValue` 更新数据。此类型不支持 `props`、`slots` 和 `change` 配置。

`slot` 字段只用于布局和说明，通过 `prop` 同名插槽填充，不参与表单数据：

```vue
<SuperForm :columns="[{ prop: 'notice', formType: 'slot' }]">
  <template #notice>提交前请确认信息。</template>
</SuperForm>
```

内置字段可通过 `column.slots` 映射子插槽；值为当前 SuperForm 的插槽名或 Vue `Slot`
函数。底层字段的作用域参数会透传给该插槽，例如输入框的前缀：

```vue
<SuperForm
  :columns="[
    { prop: 'url', formType: 'input', slots: { prepend: 'url-prefix' } },
  ]"
>
  <template #url-prefix>https://</template>
</SuperForm>
```

内置字段的值由表单管理，请用 `defaultValue`、`setFormData()` 和 `change` 配置处理
初始值、赋值与变化，不要在 `column.props` 中设置 `modelValue`、`onUpdate:modelValue`
或 `onChange`。

## 日期字段

`formType: 'date-picker'` 的 `props.type` 默认为 `date`。范围类型默认时刻为
00:00:00～23:59:59，单日期为 00:00:00；可用 `props.defaultTime` 覆盖。

表单不预设 `valueFormat`，不配置时沿用 Element Plus 的 Date 值；需要提交字符串时
显式设置，例如：

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

`format` 控制界面显示，`valueFormat` 控制绑定值。表格搜索另有字符串格式默认值，参阅
[SuperTable 日期配置](/components/super-table#搜索与日期配置)。

## Cascader 级联选择

<ClientOnly><DemoBlock><FormCascaderDemo /></DemoBlock></ClientOnly>

使用 `formType: 'cascader'`，将树形选项放入 `column.props.options`。
选项标签支持字符串、函数和 `LabelValue` 对象，并递归处理子节点。

```ts
const columns: SuperFormColumn[] = [
  {
    prop: 'region',
    label: '地区',
    formType: 'cascader',
    defaultValue: ['zhejiang', 'hangzhou'],
    props: {
      options: [
        {
          value: 'zhejiang',
          label: '浙江',
          children: [
            { value: 'hangzhou', label: '杭州' },
            { value: 'ningbo', label: '宁波', disabled: true },
          ],
        },
      ],
      props: {
        multiple: false,
        emitPath: true,
        checkStrictly: false,
      },
    },
    change: (formData, value) => {
      console.log(formData.region, value);
    },
  },
];
```

- 默认 `filterable: true`、`clearable: true`，可在 `column.props` 中覆盖。
- Cascader 的节点行为配置位于 **`column.props.props`**，包括 `multiple`、
  `emitPath`、`checkStrictly`、`expandTrigger`、`lazy` 和 `lazyLoad`。
- 默认单选输出路径数组，例如 `['zhejiang', 'hangzhou']`；`emitPath: false`
  时输出节点值，例如 `'hangzhou'`。
- 多选默认输出路径数组的数组；同时设置 `emitPath: false` 时输出节点值数组。
- 未提供 `defaultValue` 时，路径单选和多选初始值为 `[]`；关闭路径输出的单选为
  `''`。清空后的值遵循 Element Plus 行为，不额外转换。
- 支持 `column.slots` 透传节点等插槽，以及 `column.props.popperClass` 定制浮层。
  `SuperFormDialog` 使用同样的字段配置。

后端选项使用自定义键时，可通过节点配置映射；其他选项属性会原样保留：

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

懒加载通过 Element Plus 的 `lazyLoad(node, resolve, reject)` 返回原生选项结构，
动态节点标签使用字符串。

## Upload 使用教程

Upload 是否提供 `props.upload` 决定文件的所有权和字段值类型：不提供时保留浏览器本地
`File`；提供后由上传适配器返回远程文件信息。

### Upload 配置

| 配置       | 默认值   | 说明                               |
| ---------- | -------- | ---------------------------------- |
| `type`     | `'file'` | `'file'` 或 `'image'`              |
| `multiple` | `false`  | 是否允许多文件                     |
| `limit`    | —        | 多文件数量上限；单文件始终最多一项 |
| `upload`   | —        | 远程上传适配器；省略时使用本地模式 |

文件数量达到上限后需先删除已有文件再选择。图片列表最多显示 8 个缩略图，超出数量
显示在最后一项；预览仍包含全部图片。

### 本地 Upload

本地模式不传 `upload`，适合在表单最终提交时统一发送文件：

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

- 单文件字段值为 `File | null`，多文件字段值为 `File[]`。
- `type: 'image'` 设置文件选择器的 `accept="image/*"` 并提供本地预览；实际上传校验由业务处理。
- 隐藏或卸载本地 Upload 时，组件会释放预览 URL 并清除它持有的本地文件；需要长期
  保留时，应在表单外自行接管文件。

### 远程 Upload

远程模式传入异步 `upload(files, currentFiles)`。适配器负责调用项目上传 API，并返回
可持久化的文件信息：

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

完整函数签名为：

```ts
type SuperUploadRequest = (
  files: File[],
  currentFiles: SuperUploadValue[],
) => Promise<SuperUploadValue | SuperUploadValue[] | undefined | null | false>;
```

## Slots

| 插槽                      | 参数               | 说明             |
| ------------------------- | ------------------ | ---------------- |
| `column.prop` 同名插槽    | —                  | `slot` 字段内容  |
| `column.slots` 映射的名称 | 底层字段的插槽参数 | 内置字段的子插槽 |

## Events

| 事件     | 参数         | 说明                       |
| -------- | ------------ | -------------------------- |
| `submit` | `(formData)` | 验证通过后携带表单数据触发 |

事件参数是当前可见字段数据的深拷贝。

## Expose

| 名称                | 返回值                      | 说明                                     |
| ------------------- | --------------------------- | ---------------------------------------- |
| `getFormData()`     | `Record<string, unknown>`   | 读取当前可见字段数据的深拷贝             |
| `setFormData(data)` | `void`                      | 按上方赋值规则写入字段并清除验证         |
| `validate()`        | `Promise<boolean>`          | 执行验证；验证失败返回 `false`，不会抛出 |
| `submit()`          | `Promise<void>`             | 主动执行验证，成功后触发 `submit` 事件   |
| `elForm`            | `FormInstance \| undefined` | 底层 Element Plus 表单实例               |

在单行 input 中按 Enter 会提交；textarea 和文件输入不会触发该行为。
