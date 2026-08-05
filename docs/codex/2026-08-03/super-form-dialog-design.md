# SuperForm、SuperDialog 与 SuperFormDialog 集成设计

> 状态：设计边界已确认，待继续讨论与实施
>
> 日期：2026-08-03
>
> 本文只记录设计，不代表组件、demo、依赖或导出已经完成。

## 1. 背景

`src/demo` 中现有 `app-form`、`app-dialog`、`app-form-dialog` 展示了一套配置式表单和弹窗组合方案。其分层方向可复用，但当前文件来自业务项目，依赖告警 API、国际化、业务工具函数和缺失组件，且存在若干尚未收敛的 API 与实现问题。

本次计划在保留核心使用习惯的基础上重新实现三个正式公共组件：

- `SuperForm`
- `SuperDialog`
- `SuperFormDialog`

三个组件固定基于 Element Plus，不为未来替换底层 UI 库增加抽象层。

## 2. 目标

1. 把配置式表单、通用 Dialog 和表单 Dialog 集成为可发布组件。
2. 三个组件从 `lib/main.ts` 对外导出。
3. 使用 TypeScript 定义消费方真正需要的公共配置与实例类型。
4. 保留 Element Plus 的属性、事件和实例逃生口，避免重复封装全部底层能力。
5. 保留现有方案中的内部表单数据副本、字段默认值、条件展示、字段插槽和表单校验流程。
6. 提供可运行的新 demo，并在后续实施阶段更新 README。

## 3. 非目标

1. 不主动集成任何国际化方案。
2. 不支持运行期间动态增删 `columns`；单次挂载期间视其为稳定结构。
3. 不为未知字段类型、重复 `prop`、缺失插槽等配置错误增加运行时检查或警告。
4. 不提供 Tree Select 和 Slider 内置字段。
5. 不提前为 Step Dialog、左右栏或表格弹窗增加形态 API。
6. 不增加 Dialog 主题变量；消费方通过透传的 `class/style` 编写全局 CSS。
7. 不接管 Element Plus Dialog 的关闭入口和关闭拦截。
8. 不引入测试框架。
9. 本设计阶段不实施代码、依赖、demo、README、版本、发布或 Git commit。

## 4. 发布边界与目录

建议目录结构：

```text
src/components/
├── SuperDialog/
│   └── index.vue
├── SuperForm/
│   ├── index.vue
│   ├── config.ts
│   ├── types.ts
│   └── fields/
│       ├── SuperFormInput.vue
│       ├── SuperFormTextarea.vue
│       ├── SuperFormInputNumber.vue
│       ├── SuperFormRadio.vue
│       ├── SuperFormSelect.vue
│       ├── SuperFormCheckbox.vue
│       ├── SuperFormSwitch.vue
│       ├── SuperFormDatePicker.vue
│       └── SuperFormUpload.vue
└── SuperFormDialog/
    └── index.vue
```

对外导出：

```ts
export { default as SuperForm } from '@/components/SuperForm/index.vue';
export { default as SuperDialog } from '@/components/SuperDialog/index.vue';
export { default as SuperFormDialog } from '@/components/SuperFormDialog/index.vue';
```

字段适配器只作为 `SuperForm` 内部实现，不单独发布。从 `lib/main.ts` 明确导出以下公共类型：

- `LabelValue`
- `LabelRecord`
- `SuperDialogProps`
- `SuperFormProps`
- `SuperFormColumn`
- `SuperFormOption`
- `SuperFormInstance`
- `SuperUploadValue`
- `SuperUploadResult`
- `SuperUploadRequest`
- `SuperUploadProps`
- `SuperUploadAction`
- `SuperFormDialogProps`
- `SuperFormDialogInstance`

除三个组件外，还需对外导出：

- `formatLabel`
- `datePickerDefaultTime`
- `dateFormat`
- `dateFormatSec`

### 4.1 最终公共类型

公共类型按以下定义实现并从 `lib/main.ts` 导出；字段适配器可在内部继续拆分辅助类型，但不得改变这里的消费方契约：

```ts
import type { Component, Slot } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';

export type LabelRecord = Record<string, string | (() => string)>;

export type LabelValue = string | (() => string) | LabelRecord;

export interface SuperDialogProps {
  title?: LabelValue;
  footer?: boolean;
  width?: number | string;
  height?: number;
  maxHeight?: number;
  cancel?: boolean | LabelValue;
  confirm?: LabelValue;
}

export interface SuperFormOption {
  value: unknown;
  label: LabelValue;
  disabled?: boolean;
  children?: SuperFormOption[];
}

interface SuperFormColumnBase {
  prop: string;
  label?: LabelValue;
  tips?: LabelValue;
  rules?: FormItemRule | FormItemRule[];
  class?: unknown;
  show?: (formData: Record<string, unknown>) => boolean;
}

type SuperFormBuiltinType =
  | 'input'
  | 'textarea'
  | 'input-number'
  | 'radio'
  | 'select'
  | 'checkbox'
  | 'switch'
  | 'date-picker';

export interface SuperUploadProps extends Record<string, unknown> {
  type?: 'file' | 'image';
  multiple?: boolean;
  limit?: number;
  upload?: SuperUploadRequest;
}

export type SuperFormColumn =
  | (SuperFormColumnBase & {
      formType: SuperFormBuiltinType;
      component?: never;
      defaultValue?: unknown;
      props?: Record<string, unknown> & {
        options?: SuperFormOption[];
      };
      slots?: Record<string, string | Slot>;
      change?: (
        formData: Record<string, unknown>,
        value: unknown,
      ) => void;
    })
  | (SuperFormColumnBase & {
      formType: 'upload';
      component?: never;
      defaultValue?: SuperUploadValue | SuperUploadValue[] | File | File[] | null;
      props: SuperUploadProps;
      slots?: Record<string, string | Slot>;
      change?: (
        formData: Record<string, unknown>,
        value: SuperUploadValue | SuperUploadValue[] | File | File[] | null,
      ) => void;
    })
  | (SuperFormColumnBase & {
      formType: 'slot';
      component?: never;
      defaultValue?: never;
      props?: never;
      slots?: never;
      change?: never;
    })
  | (SuperFormColumnBase & {
      formType: 'custom';
      component: Component;
      defaultValue?: unknown;
      props?: never;
      slots?: never;
      change?: never;
    });

export interface SuperFormProps {
  columns?: SuperFormColumn[];
  disabled?: boolean;
}

export interface SuperFormInstance {
  getFormData(): Record<string, unknown>;
  setFormData(data: Record<string, unknown>): void;
  validate(): Promise<boolean>;
  submit(): Promise<void>;
  elForm: FormInstance | undefined;
}

export interface SuperUploadValue {
  id?: string | number;
  url: string;
  name: string;
  type: string;
  size: number;
}

export type SuperUploadResult =
  | SuperUploadValue
  | SuperUploadValue[]
  | undefined
  | null
  | false;

export type SuperUploadRequest = (
  files: File[],
  currentFiles: SuperUploadValue[],
) => Promise<SuperUploadResult>;

export type SuperUploadAction =
  | [
      action: 'selected',
      selectedFiles: SuperUploadValue[] | File[],
      currentFiles: SuperUploadValue[] | File[],
    ]
  | [
      action: 'delete',
      deletedFile: SuperUploadValue | File,
      currentFiles: SuperUploadValue[] | File[],
    ];

export interface SuperFormDialogProps {
  title?: LabelValue;
  formData?: Record<string, unknown>;
  columns?: SuperFormColumn[];
  disabled?: boolean;
  width?: number | string;
  loading?: boolean;
  confirm?: LabelValue;
}

export type SuperFormDialogInstance = SuperFormInstance;
```

相关事件签名固定为：

```ts
// SuperDialog
defineEmits<{ confirm: [] }>();

// SuperForm
defineEmits<{
  submit: [formData: Record<string, unknown>];
}>();

// SuperFormUpload（内部字段适配器）
defineEmits<{
  action: SuperUploadAction;
}>();

// SuperFormDialog
defineEmits<{
  'form:mounted': [];
  confirm: [formData: Record<string, unknown>];
}>();
```

`defineModel<boolean>()` 自动生成的 `update:modelValue` 沿用 Vue 标准类型，不重复声明。`submit()` 仅负责异步校验和触发事件，无论禁用、校验失败或提交成功都不通过返回值表达结果，因此统一为 `Promise<void>`。

## 5. 公共文案模型

### 5.1 LabelValue

组件不依赖翻译函数，但所有由工具库主动定义的文案 API 支持动态取值：

```ts
type LabelRecord = Record<string, string | (() => string)>;

type LabelValue =
  | string
  | (() => string)
  | LabelRecord;
```

公共函数保留自定义键参数：

```ts
function formatLabel(label: LabelValue, labelKey = 'label'): string | LabelRecord;
```

行为：

1. 字符串直接返回。
2. 函数执行后返回结果。
3. 对象读取 `labelKey` 对应的值；该值为函数时执行。
4. 对象不存在 `labelKey` 时返回原始输入对象，维持现有行为。
5. 不识别 `{ i18n: '...' }`，不导入消费方翻译函数。

### 5.2 主动格式化范围

工具库主动处理：

- `SuperDialog.title`
- `SuperDialog.cancel`
- `SuperDialog.confirm`
- `SuperFormDialog.confirm`
- `FormColumn.label`
- `FormColumn.tips`
- 选项 `label`
- Upload 触发按钮等工具库自定义文案

暂不处理：

- `column.props.placeholder`
- `column.rules[].message`
- `activeText`、`inactiveText`、`rangeSeparator` 等 Element Plus 透传属性

这些属性由消费方传入最终可用值。

## 6. SuperDialog

### 6.1 职责

`SuperDialog` 负责：

- 统一默认宽度、高度布局和 footer。
- 使用 `SuperButton` 渲染默认取消、确认按钮。
- 提供 header/default/footer 插槽。
- 完整透传 `$attrs` 到 `ElDialog`。

它不负责：

- 识别不同关闭来源。
- 统一关闭事件结构。
- 脏数据确认或关闭拦截。
- 表单校验、loading、按钮 disabled。

### 6.2 Props

核心封装属性：

```ts
interface SuperDialogProps {
  title?: LabelValue;
  footer?: boolean;
  width?: number | string;
  height?: number;
  maxHeight?: number;
  cancel?: boolean | LabelValue;
  confirm?: LabelValue;
}
```

Dialog 显示状态使用 `defineModel<boolean>()`，遵循标准 `modelValue / update:modelValue` 协议。

默认值：

```ts
{
  title: '',
  footer: true,
  width: 600,
  maxHeight: 600,
  cancel: true,
  confirm: '确认',
}
```

未设置 `height` 时，Dialog 随内容自然增长，但总高度默认不超过 `600px`。

### 6.3 Element Plus 透传

所有 `$attrs` 完整传给 `ElDialog`。组件提供以下默认配置，消费方仍可通过透传值覆盖：

```ts
{
  draggable: true,
  destroyOnClose: true,
  appendToBody: true,
}
```

关闭相关能力沿用 Element Plus 原生属性和事件，例如：

- `closeOnClickModal`
- `closeOnPressEscape`
- `beforeClose`
- `showClose`
- `close/open/opened/closed`

组件不再为这些能力增加中间层。

### 6.4 高度与滚动

取消原有 `scrollable + ElScrollbar + JS 像素扣减` 方案。

统一采用 CSS grid/flex：

```text
header  自然高度
body    minmax(0, 1fr)，overflow: auto
footer  自然高度
```

规则：

- 默认 `maxHeight=600`：Dialog 自然增长，单输入框场景没有额外空白；总高度达到 `600px` 后 body 滚动。
- 同时使用 `calc(100dvh - 32px)` 做简单视口兜底；复杂边距、局部高度和布局由消费方处理。
- `height`：固定 Dialog 总高度，body 使用剩余空间并滚动。
- `maxHeight`：可覆盖默认最大总高度，Dialog 到达该高度后 body 滚动。
- 二者同时传入时直接遵循 CSS 的 `height + max-height` 语义，不警告、不人为规定优先级。
- `height/maxHeight` 只接受 number，并按 px 应用。

消费方需要局部固定高度时，在默认插槽内部自行布局，不增加 `contentHeight` 或 Step Dialog API。

透传的 `class/style` 作用于 Dialog 面板本身，不作用于遮罩层。

### 6.5 Header

取消 `header` 布尔属性，始终使用 Element Plus 标准 header。

默认标题使用格式化后的 `title`，并正确绑定 Element Plus 提供的 `titleId/titleClass`。

`#header` 原样提供作用域参数：

```ts
{
  close,
  titleId,
  titleClass,
}
```

### 6.6 Footer 与按钮

`footer=false` 时不渲染 footer。

默认 footer：

- 使用 `SuperButton`。
- `cancel=false` 隐藏取消按钮。
- `cancel=true` 使用默认“取消”。
- `cancel` 为文案值时覆盖默认文案。
- 点击取消直接把 Dialog 的 `v-model` 设为 `false`，不增加 `cancel` 事件。
- `confirm` 只承担确认按钮文案，按钮始终显示。
- 点击确认只触发 `confirm`，不自动关闭。
- 不提供 confirm loading/disabled。

`#footer` 可完整替换默认按钮区域。

## 7. SuperForm

### 7.1 数据所有权

`SuperForm` 维护内部表单数据，不使用表单数据 `v-model`，也不增加 `formData` prop。

核心 props：

```ts
interface SuperFormProps {
  columns?: SuperFormColumn[];
  disabled?: boolean;
}
```

`columns` 默认为空数组，`disabled` 默认为 `false`。

初始化流程：

1. 挂载前根据稳定的 `columns` 建立字段默认值。
2. 独立使用时，消费方通过实例调用 `setFormData()`。
3. 在 `SuperFormDialog` 中，由组合组件在表单挂载后调用 `setFormData(formData)`。

`columns` 在单次挂载期间视为稳定结构，不监听增删变化。字段是否显示由 `show(formData)` 动态决定。隐藏字段通常保留内部值；本地 Upload 是明确例外，规则见第 8 节。

`prop` 始终按扁平字段名处理；例如 `user.name` 是字面键名，不解析为嵌套对象路径，也不增加格式校验。

### 7.2 深复制

新增普通依赖：

```text
es-toolkit
```

使用 `cloneDeep` 处理：

- `setFormData()` 写入内部状态。
- `getFormData()` 返回数据。
- 对象、数组类型默认值的恢复。

消费方不需要额外安装 `es-toolkit` peer dependency。

### 7.3 字段配置

简化结构示意如下，最终判别联合类型以第 4.1 节为准：

```ts
interface SuperFormColumn {
  prop: string;
  label?: LabelValue;
  tips?: LabelValue;
  formType:
    | 'input'
    | 'textarea'
    | 'input-number'
    | 'radio'
    | 'select'
    | 'checkbox'
    | 'switch'
    | 'date-picker'
    | 'upload'
    | 'slot'
    | 'custom';
  component?: Component;
  defaultValue?: unknown;
  rules?: FormItemRule | FormItemRule[];
  props?: Record<string, unknown>;
  slots?: Record<string, string | Slot>;
  class?: unknown;
  show?: (formData: Record<string, unknown>) => boolean;
  change?: (formData: Record<string, unknown>, value: unknown) => void;
}
```

`custom.component` 必填以及 `slot/custom` 不接收无效配置等关系，由第 4.1 节的判别联合类型直接约束，不留到施工阶段重新决定。

所有字段，包括 `slot/custom`，都必须提供 `prop`。组件不增加运行时检查；错误配置按 Vue 和 JavaScript 的自然运行结果处理。

### 7.4 内置字段

首批支持：

- input
- textarea
- input-number
- radio
- select
- checkbox
- switch
- date-picker
- upload
- slot
- custom

不支持：

- tree-select
- slider

默认字段行为：

```text
input         clearable=true
textarea      resize=none，autosize={ minRows: 2, maxRows: 4 }
input-number  stepStrictly=true，controlsPosition=right
select        filterable、clearable、fitInputWidth、reserveKeyword=false
switch        inlinePrompt=true
date-picker   宽度占满表单项
```

`column.props` 可以覆盖字段适配器的普通默认值。

### 7.5 内置字段参数和插槽

内置字段支持 `column.props` 与 `column.slots`。

从 `column.props` 过滤由 `SuperForm` 接管的 VNode/数据参数：

```text
modelValue
onUpdate:modelValue
onChange
ref
key
```

其他属性，包括 `class/style` 和 Element Plus 字段属性，正常透传。

Upload 的 `upload/type/multiple/limit` 属于字段适配器自身配置，由适配器消费，不继续透传给内部原生文件输入；其余适用的输入属性继续透传。

`column.slots` 与 props 分离：

- 值为字符串时，从 `SuperForm` 自身 slots 中查找同名插槽。
- 值为函数时，直接作为字段组件插槽。
- `SuperForm` 不主动注入额外的 `formData/value/column/setValue` 上下文。

`change(formData, value)` 只对内置字段生效，替代 `column.props.onChange`。

`show/change` 获得内部实时响应式数据，维持现有字段联动方式；深复制边界只用于 `setFormData()` 输入、`getFormData()` 输出和默认值恢复。

### 7.6 自定义组件

自定义字段使用：

```ts
{
  prop: 'customField',
  formType: 'custom',
  component: CustomField,
}
```

只传递：

```ts
{
  modelValue,
  disabled,
  'onUpdate:modelValue': handler,
}
```

暂不传递 `column.props`、`column.slots` 或 `change`。自定义组件是否真正实现 disabled 视觉和交互，由该组件自己负责。

### 7.7 Slot 字段

`formType: 'slot'` 使用 `prop` 查找 `SuperForm` 的同名插槽。

Slot 字段：

- 不建立表单数据默认值。
- 不进入 `getFormData()`。
- 不接收额外上下文。

### 7.8 Label 与 tips

`label` 可省略。省略时不渲染 label 内容和 tips。

有 `tips` 时：

- 在 label 旁显示 `CircleHelp`。
- 通过 `SuperIcon + SuperPopover` 提供 hover tooltip。
- tips 经 `formatLabel` 得到纯文本。
- 不支持富文本、trigger 或 placement 配置；复杂场景使用 slot 字段。
- 沿用当前 `SuperPopover` 的默认行为，将浮层 Teleport 到 `body`，避免被 Dialog 的可滚动 body 裁剪；不显式传入 `teleportTo=false`。

`CircleHelp` 采用：

```ts
import { CircleHelp } from '@lucide/vue';
```

Lucide 构建策略见第 11 节。

### 7.9 选项格式化

Radio、Select、Checkbox 的 options 严格转换，只保留：

```ts
{
  value,
  label: formatLabel(label),
  disabled,
  children,
}
```

`children` 递归使用相同规则，其他选项属性不透传。

### 7.10 默认值

`column.defaultValue` 优先；未配置时使用字段默认值：

| formType | 默认值 |
| --- | --- |
| input、textarea | `''` |
| input-number | `0` |
| radio | 第一项 option.value；没有选项时 `undefined` |
| select | 单选 `''`；多选 `[]` |
| checkbox | 有 options 时 `[]`；无 options 时 `false` |
| switch | `inactiveValue`；未配置时 `false` |
| date-picker | 范围/多值 `[]`；单值 `''` |
| upload | 单选 `null`；多选 `[]` |
| custom | `undefined` |
| slot | 不建立数据 |

对象和数组默认值在每次使用时通过 `cloneDeep` 复制。

### 7.11 setFormData

```ts
setFormData(data: Record<string, unknown>): void;
```

规则：

1. 只处理 `columns` 声明的非 slot 字段，忽略其他属性。
2. data 中缺少的字段保留当前值。
3. `null/undefined` 视为无效值，恢复该字段默认值。
4. `''`、`false`、`0`、`[]` 都是有效值。
5. 写入前使用 `cloneDeep`。

### 7.12 getFormData

```ts
getFormData(): Record<string, unknown>;
```

返回前过滤：

1. `show(formData) === false` 的隐藏字段。
2. slot 字段。
3. 值为 `undefined` 的字段，包括尚未产生值的 custom 字段。

`remote` Upload 返回远程记录，`local` Upload 返回原始 `File`；具体单选/多选结构见第 8.2 节。

隐藏字段通常只从返回结果排除，内部值继续保留；local Upload 按第 8.4 节清除本地文件。

最终结果通过 `cloneDeep` 返回。

### 7.13 表单属性透传

`SuperForm` 将 `disabled` 作为正式 prop，并继续传给 `ElForm`；其他 `$attrs` 完整透传。默认行为维持现有方案：

```ts
{
  labelPosition: 'top',
  statusIcon: true,
  scrollToError: true,
  requireAsteriskPosition: 'right',
}
```

消费方可通过透传属性和事件使用其他 Element Plus Form 能力。

### 7.14 校验与提交

`validate()` 覆盖为稳定的 await 形式：

```ts
validate(): Promise<boolean>;
```

校验失败返回 `false`，不把 Element Plus 校验失败作为调用方必须捕获的异常。

`submit()`：

```ts
submit(): Promise<void>;
```

```text
disabled=true 时直接终止
→ 否则 await validate()
→ 失败时终止
→ 成功时 emit('submit', getFormData())
```

`SuperForm` 处理原生 form submit：

- 单行输入框按 Enter 触发 `submit()`。
- textarea 的 Enter 保持换行，不提交。

### 7.15 实例暴露

只直接公开四个自定义方法：

```ts
getFormData()
setFormData()
validate()
submit()
```

同时提供底层实例逃生口：

```ts
elForm: FormInstance | undefined
```

其他 Element Plus Form 实例能力统一通过 `elForm` 调用，不再修改 Vue 内部的 `vm.expose/vm.exposeProxy`。

## 8. Upload 字段

### 8.1 两种模式与职责边界

Upload 根据是否提供 `upload` 自动确定模式，不增加 `mode` 属性：

- 提供 `upload` 时为 `remote`：选择文件后立即调用消费方提供的上传适配函数；表单只保存格式化后的远程记录，不保存 `File`。
- 未提供 `upload` 时为 `local`：表单直接保存原始 `File`，由消费方在最终提交时统一构造 `FormData`。
- Upload 不接收 action、响应路径、成功码或响应转换等具体 API 配置。

远程记录结构：

```ts
interface SuperUploadValue {
  id?: string | number;
  url: string;
  name: string;
  type: string;
  size: number;
}
```

`id` 是可选的远程资源标识；具体 API 的原始字段由消费方在 `upload` 函数中完成转换，不进入组件协议。

### 8.2 v-model 与 getFormData

```text
remote + multiple=false → SuperUploadValue | null
remote + multiple=true  → SuperUploadValue[]
local  + multiple=false → File | null
local  + multiple=true  → File[]
```

- `remote` 的 `getFormData()` 只返回远程记录，可用于新增、编辑场景的表单快照；消费方仍负责将完整快照转换为具体 POST、PUT 或 PATCH 参数。
- `local` 的 `getFormData()` 返回原始 `File`，预览 URL 只是 Upload 内部视图状态，不进入表单数据和提交结果。
- 取消原来的 `editable` 模式，所有选择和删除都直接更新字段值。

### 8.3 Remote 模式

提供 `upload` 后进入 `remote` 模式。上传函数签名为：

```ts
type SuperUploadResult =
  | SuperUploadValue
  | SuperUploadValue[]
  | undefined
  | null
  | false;

type SuperUploadRequest = (
  files: File[],
  currentFiles: SuperUploadValue[],
) => Promise<SuperUploadResult>;

interface SuperUploadProps extends Record<string, unknown> {
  type?: 'file' | 'image';
  multiple?: boolean;
  limit?: number;
  upload?: SuperUploadRequest;
}
```

两种模式均支持 `type/multiple/limit` 及其他允许透传的文件输入属性。组件只校验返回值的顶层类型、单复选数量和 `limit`，不深度校验远程记录字段。

该函数只返回本批新增的格式化远程记录。组件不理解原始 API 响应，消费方在函数内部负责：

- 发起网络请求。
- 鉴权、额外参数和错误提示。
- 将响应转换成 `SuperUploadValue` 或 `SuperUploadValue[]`。
- 决定部分成功时返回哪些记录。

交互流程：

1. 选择文件并通过数量检查后，立即进入内部 loading。
2. 保留已有远程文件列表，在列表末尾追加与本批文件数量对应的 Skeleton。
3. loading 期间禁用选择和删除，避免重复操作及 limit 并发竞争。
4. `await upload(selectedFiles, currentFiles)` 成功后，先按单复选规则将结果归一化成数组，再与字段当前值合并。
5. `undefined/null/false` 视为上传失败，保持原值且不触发 `selected`。
6. Promise 抛出异常时保持原字段值不变；无论成功或失败均通过 `finally` 关闭 loading。

返回值归一化规则：

- `multiple=false` 接受单项或长度为 `1` 的数组。
- `multiple=true` 接受单项或任意长度数组；空数组不更新字段且不触发 `selected`。
- 单选返回其他长度的数组，或返回值顶层类型不符合约定时，整批拒绝更新并调用 `ElMessage.warning('上传结果格式不正确')`。
- 归一化结果与字段当前值合并后超过 `limit` 时，整批拒绝更新并调用 `ElMessage.warning('最多只能选择 N 个文件')`。

组件不为 `setFormData()`、动态隐藏等主动操作建立请求版本或失效机制。请求完成时基于字段当前值合并；调用方在上传期间主动改写相关状态导致的数据竞争由调用方承担。动态隐藏不清除已经完成上传的远程记录，再次显示时正常回显。组件整体卸载后只允许在途 Promise 自然结束，不再更新状态或触发事件，也不要求消费方 Promise 支持取消。

### 8.4 Local 模式

未提供 `upload` 时进入 `local` 模式：

- 选择后直接把原始 `File` 写入字段值。
- image 类型使用 `URL.createObjectURL(file)` 生成仅供内部展示的预览 URL。
- 组件只记录并释放自己创建的 object URL；消费方数据中不存在预览 URL。
- 删除文件时先释放对应预览 URL，再更新字段值并触发 `action`。
- `setFormData()` 替换字段值时，释放已不再使用的预览 URL，并为新的 `File` 重建预览。
- 字段动态隐藏或表单卸载时释放全部预览 URL，并从内部表单数据删除该字段的本地文件；再次显示时恢复字段默认值，不回显上次选择。
- `destroyOnClose=true` 导致表单卸载时遵循同一清理规则。

### 8.5 类型、数量与触发器

- `type: 'file' | 'image'`，默认 `file`。
- file 接受任意文件，显示文件名。
- image 使用 `accept="image/*"`，显示图片预览。
- 支持 `multiple`。
- 支持 `limit`。
- `multiple=false` 固定只允许一个文件。
- `multiple=true` 且未设置 limit 时不限制数量。
- 达到上限后禁用文件选择触发器，删除后恢复。
- 一次选择超过剩余名额时整批拒绝，不修改 v-model。
- 选择前的数量判断使用 `currentFiles.length + incomingFiles.length > effectiveLimit`；remote 返回后再使用 `currentFiles.length + normalizedResult.length` 复核。单选的有效上限固定为 `1`，多选未设置 limit 时跳过判断。remote loading 期间不能再次选择，因此不额外维护跨批次待上传数量。
- 数量检查通过后，local image 才创建预览 URL，remote 才启动上传函数。
- 超限时组件直接调用 `ElMessage.warning('最多只能选择 N 个文件')`，文案固定，不提供事件或覆盖属性。

### 8.6 Action 事件

保留统一 action 事件。

整批选择成功时只触发一次：

```ts
emit(
  'action',
  'selected',
  selectedFiles, // remote 为新增远程记录，local 为本批 File[]
  currentFiles,  // 对应模式下更新后的完整数组
);
```

删除时：

```ts
emit(
  'action',
  'delete',
  deletedFile,
  currentFiles, // 对应模式下删除后的完整数组
);
```

即使 `multiple=false`，事件里的 `selectedFiles/currentFiles` 仍使用数组，保持签名稳定。

remote 只有在上传函数成功返回并更新字段后才触发 `selected`；失败不触发 action。local 在写入 `File` 后立即触发。删除只修改表单中的远程记录或本地文件，不负责调用远程删除接口。

## 9. 日期配置

工具库通过私有工厂创建默认时间，并导出一份供消费方使用的常量：

```ts
function getDatePickDefaultTime(): [Date, Date] {
  const year = new Date().getFullYear();
  return [
    new Date(year, 0, 1, 0, 0, 0),
    new Date(year, 0, 1, 23, 59, 59),
  ];
}

export const datePickerDefaultTime: readonly [Date, Date] =
  getDatePickDefaultTime();

export const dateFormat = 'YYYY-MM-DD HH:mm';
export const dateFormatSec = 'YYYY-MM-DD HH:mm:ss';
```

不导出 `getDatePickDefaultTime()`。消费方引用公开的 `datePickerDefaultTime`；`SuperForm` 内部调用私有工厂创建自己的默认时间，不读取公开常量。

只读元组只能避免数组元素被重新赋值，无法阻止 `Date#setHours()` 等方法修改 Date 内部值。公开常量允许消费方自行修改，但该修改不会影响组件内部重新创建的默认时间。

Date Picker 默认时间规则沿用现有意图：

- range 类型使用两项默认时间。
- 单值日期/时间类型按需要使用第一项。
- 多值日期类型不强行设置默认时间。

## 10. SuperFormDialog

### 10.1 Props 与透传

核心属性：

```ts
interface SuperFormDialogProps {
  title?: LabelValue;
  formData?: Record<string, unknown>;
  columns?: SuperFormColumn[];
  disabled?: boolean;
  width?: number | string;
  loading?: boolean;
  confirm?: LabelValue;
}
```

Dialog 显示状态同样使用 `defineModel<boolean>()`。

默认值：

```ts
{
  formData: {},
  columns: [],
  disabled: false,
  width: 480,
  loading: false,
}
```

`confirm` 统一控制默认 footer 的按钮文案：

- 未传入时，编辑状态默认显示“保存”，只读状态默认显示“关闭”。
- 显式传入时，编辑和只读状态均使用格式化后的同一文案。

`$attrs` 完整透传给 `SuperDialog`，包括 `height/maxHeight` 和 Element Plus Dialog 属性、事件。`closeOnClickModal` 默认设为 `false`，消费方仍可透传覆盖。

### 10.2 初始化

内部 `SuperForm` 挂载后：

1. 维持现有行为，先触发无参数 `form:mounted`；该事件只表示表单实例已经就绪，不表示初始化数据已经写入。
2. 再调用 `setFormData(formData)`。

监听者若在 `form:mounted` 中同步写入表单数据，随后可能被初始化快照覆盖，这是该事件时序的既定行为；本次不增加实例参数，也不改为初始化完成事件。

`formData` 只在挂载时作为初始化快照，不监听后续变化。

默认 `destroyOnClose=true`，每次重新打开都会重新创建并初始化表单。消费方若覆盖为 false，自行承担状态保留行为。

### 10.3 loading 与 disabled

内部表单禁用状态：

```ts
formDisabled = disabled || loading;
```

- loading 时禁用内部表单，阻止提交期间修改数据。
- 编辑状态的确认按钮使用 `SuperButton` 的 loading，阻止重复点击。
- 自定义字段接收 disabled，但是否实现禁用由自定义组件负责。

### 10.4 默认 Footer

维持现有单按钮模式，不使用 `SuperDialog` 的“取消 + 确认”：

- `disabled=false`：显示一个确认按钮，默认文案为“保存”。
- `disabled=true`：显示一个确认按钮，默认文案为“关闭”。
- `confirm` 可统一覆盖两种状态的按钮文案。
- 所有按钮使用 `SuperButton`。
- loading 只用于保存状态。
- `#footer` 可以完整替换默认按钮。

### 10.5 提交流程

编辑状态点击确认按钮时调用内部 `SuperForm.submit()`：

```text
点击确认按钮或单行输入框 Enter
→ SuperForm.validate()
→ 校验失败时终止
→ SuperForm emit('submit', getFormData())
→ SuperFormDialog 转换为 emit('confirm', formData)
→ 不自动关闭 Dialog
```

`disabled=true` 时点击确认按钮直接关闭 Dialog，不校验、不触发 confirm 事件。

实例调用 `submit()` 时沿用内部 `SuperForm` 语义：只读状态直接终止，不校验、不关闭、不触发 confirm。

### 10.6 Slots

插槽分流：

- `#header` 交给 `SuperDialog`，并保留 header 作用域参数。
- `#footer` 交给 `SuperDialog`。
- 其他命名插槽交给 `SuperForm`。

`header`、`footer` 是 `SuperFormDialog` 的保留插槽名，不能作为内部 `formType: 'slot'` 字段的 `prop`；需要同类表单内容时应改用其他字段名。

### 10.7 实例暴露

`SuperFormDialog` 向外提供与内部 `SuperForm` 相同的接口：

```ts
getFormData()
setFormData()
validate()
submit()
elForm
```

通过显式方法转发和底层实例引用实现，不修改 Vue 内部实例字段。

## 11. Lucide 构建策略

Lucide 官方说明图标支持 tree-shaking，本方案据此采用具名导入，并在实际构建产物中再次验证结果：<https://next.lucide.dev/>。

tips 只具名引入：

```ts
import { CircleHelp } from '@lucide/vue';
```

实施时调整构建策略：

1. 不再把内部使用的 `@lucide/vue` 整体 external。
2. 让 Rollup tree-shaking 后只把 `CircleHelp` 打入工具库产物。
3. `@lucide/vue` 继续保留 optional peer，供消费方主动向 `SuperIcon` 传 Lucide 组件时使用。
4. 构建后检查产物，确认没有打入整套图标。

Element Plus 的 optional peer 状态本次暂不调整。

## 12. Demo 与文档

### 12.1 旧 demo

实施阶段：

1. 将当前 `src/demo/` 内容迁入 `src/demo/bak/`。
2. 在 Git 忽略规则中忽略 `src/demo/bak/`。
3. 不重写旧业务案例。

### 12.2 新 demo

在 `src/demo/` 新建独立可运行案例，并接入 `src/App.vue`。

案例覆盖：

- `SuperDialog` 默认 footer、固定高度和最大高度。
- `SuperForm` 独立使用。
- `SuperFormDialog` 新增、编辑、只读和 loading。
- 内置字段。
- slot 字段。
- custom 字段。
- 动态 show。
- tips。
- 单文件、多文件、limit 和超限拒绝。
- Upload remote 适配函数、loading/Skeleton 和 local 最终提交。
- Enter 提交与 textarea 换行。

### 12.3 README

后续实施阶段更新 README，记录：

- 三个组件的导入与基本示例。
- 表单字段配置协议。
- 实例方法与 elForm 逃生口。
- Upload 模式判断、上传适配函数、数据结构和 action 事件。
- `formatLabel`。
- 日期配置常量。
- Element Plus 与样式引入要求。

## 13. 后续验证边界

仓库不引入 Vitest。实施完成后计划验证：

```bash
pnpm lint
pnpm build
```

并进行浏览器交互检查：

1. Dialog 高度、最大高度和 body 滚动。
2. 表单默认值、set/get 深复制、隐藏字段过滤。
3. 内置字段、自定义字段、slot 和 tips。
4. Enter 校验提交，textarea 不提交。
5. FormDialog loading 期间禁止编辑和重复提交。
6. Upload remote 上传结果归一化、成功/失败、loading/Skeleton、local File 返回、动态隐藏清理、单选、多选、limit、批量超限拒绝、预览和删除。
7. 构建产物只包含实际使用的 Lucide 图标代码。
8. 使用消费方 TypeScript 编译检查，从发布入口验证组件 props、实例 ref、事件、字段判别联合类型及全部公共类型可用。

## 14. 已确认的取舍摘要

- 三个组件均正式发布，固定依赖 Element Plus。
- 完整透传 Element Plus attrs，但只直接公开工具库明确设计的方法。
- `SuperForm` 不接收 formData prop，不监听 columns 变化。
- `SuperForm.disabled` 是正式 prop，禁用状态下 `submit()` 直接终止。
- 表单数据通过 `es-toolkit/cloneDeep` 隔离。
- 隐藏字段通常保留内部值，只在 get/submit 时排除；local Upload 隐藏时清除 File 并释放预览 URL。
- Upload 根据是否提供 `upload` 判断模式：提供时通过 Promise 适配函数取得格式化远程记录，否则返回原始 File。
- 自定义组件仅接收 v-model 与 disabled。
- Dialog 不接管关闭策略，不为 Step Dialog 增加抽象。
- Dialog 默认自然增长且最大总高度为 600px，同时支持覆盖固定总高度和最大总高度。
- FormDialog 使用单按钮 footer；提交成功只 emit，不自动关闭。
- 不做内置国际化，通过 `formatLabel` 支持消费方动态文案。
- 旧 demo 归档忽略，新 demo 独立实现。
