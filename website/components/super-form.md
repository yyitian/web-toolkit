<script setup>
import FormDemo from '../examples/demos/FormDemo.vue';
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
| `formType`     | `string`                         | 内置字段、`slot` 或 `custom`            |
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
| `checkbox`     | `false` 或 `[]`            | 单项或选项组                             |
| `switch`       | `inactiveValue` 或 `false` | 开关                                     |
| `date-picker`  | `''` 或 `[]`               | 日期或日期范围                           |
| `upload`       | `null` 或 `[]`             | 本地或远程文件                           |
| `slot`         | 不进入数据                 | 使用以 `prop` 命名的插槽                 |
| `custom`       | `undefined`                | 使用 `component` 指定自定义 v-model 组件 |

## Upload 使用教程

Upload 是否提供 `props.upload` 决定文件的所有权和字段值类型：不提供时保留浏览器本地
`File`；提供后由上传适配器返回远程文件信息。

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
- `type: 'image'` 会限制选择为图片并提供本地预览。
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

## Events

| 事件     | 参数         | 说明                       |
| -------- | ------------ | -------------------------- |
| `submit` | `(formData)` | 验证通过后携带表单数据触发 |

事件参数是当前可见字段数据的深拷贝。

## Expose

| 名称                | 返回值                      | 说明                                     |
| ------------------- | --------------------------- | ---------------------------------------- |
| `getFormData()`     | `Record<string, unknown>`   | 读取当前可见字段数据的深拷贝             |
| `setFormData(data)` | `void`                      | 写入与 columns 匹配的字段并清除验证      |
| `validate()`        | `Promise<boolean>`          | 执行验证；验证失败返回 `false`，不会抛出 |
| `submit()`          | `Promise<void>`             | 主动执行验证，成功后触发 `submit` 事件   |
| `elForm`            | `FormInstance \| undefined` | 底层 Element Plus 表单实例               |

在单行 input 中按 Enter 会提交；textarea 和文件输入不会触发该行为。
