<script setup>
import MessageDemo from '../examples/demos/MessageDemo.vue';
</script>

# 工具方法

工具方法和日期常量均从包根入口导入：

```ts
import {
  formatDate,
  DATE_FORMATS,
  datePickerDefaultTime,
  formatLabel,
  openConfirm,
  openDeleteConfirm,
} from '@yyitian/web-toolkit';
```

## 日期格式化

`formatDate(value, format = DATE_FORMATS.date)` 基于 Day.js 格式化日期，返回字符串。

```ts
const value = '2026-11-10 14:05:09';

formatDate(value); // '2026-11-10'
formatDate(value, DATE_FORMATS.dateTime); // '2026-11-10 14:05'
formatDate(value, DATE_FORMATS.dateTimeSeconds); // '2026-11-10 14:05:09'
formatDate(value, 'dateTime'); // '2026-11-10 14:05'
formatDate(value, 'YYYY年MM月DD日 HH:mm'); // '2026年11月10日 14:05'
formatDate(new Date(2026, 10, 10)); // '2026-11-10'

formatDate(null); // ''
formatDate(undefined); // ''
formatDate(''); // ''
formatDate('无效日期'); // ''
```

| 参数     | 类型                                                     | 默认值              | 说明                                   |
| -------- | -------------------------------------------------------- | ------------------- | -------------------------------------- |
| `value`  | `string \| number \| Date \| Dayjs \| null \| undefined` | —                   | 数字按毫秒时间戳解析，`0` 是有效时间戳 |
| `format` | `string`                                                 | `DATE_FORMATS.date` | 格式值、预设键名或自定义模板           |

`DATE_FORMATS` 包含以下预设：

| 键名              | 格式                  |
| ----------------- | --------------------- |
| `date`            | `YYYY-MM-DD`          |
| `dateTime`        | `YYYY-MM-DD HH:mm`    |
| `dateTimeSeconds` | `YYYY-MM-DD HH:mm:ss` |

日期按运行环境本地时区显示。解析与有效性判断沿用 Day.js 默认行为，非严格解析可能
归一化越界日期。自定义模板支持 [Day.js 基础格式标记](https://day.js.org/docs/en/display/format)，
工具库不会自动加载额外插件。

`datePickerDefaultTime` 为日期选择器提供默认起止时刻（00:00:00～23:59:59），
类型为 `readonly [Date, Date]`。将其作为配置使用，不要修改其中的共享 Date 对象。
表单与表格的日期配置分别参阅 [SuperForm](/components/super-form#日期字段) 和
[SuperTable](/components/super-table#搜索与日期配置)。

## 文案解析

`formatLabel(label, labelKey = 'label')` 支持 `LabelValue`：字符串、返回字符串的函数，
或键值为字符串/函数的文案对象。

```ts
formatLabel('名称'); // '名称'
formatLabel(() => '名称'); // '名称'
formatLabel({ label: () => '名称' }); // '名称'
formatLabel({ title: '标题' }, 'title'); // '标题'
```

对象缺少指定键时会原样返回；返回类型为 `string | LabelRecord`。用于组件标签时，
请提供默认的 `label` 键。`LabelValue` 和 `LabelRecord` 也从包根入口导出。

## 确认弹窗

需要安装 `element-plus`，并在应用入口引入 `@yyitian/web-toolkit/style.css`。

<ClientOnly><DemoBlock><MessageDemo /></DemoBlock></ClientOnly>

### openConfirm

支持消息字符串或配置对象。确认返回 `'confirm'`；取消、关闭、ESC 和遮罩关闭均返回
`'cancel'`，无需为用户取消编写 `catch`。实际异常仍会抛出。

```ts
if ((await openConfirm('确认提交吗？')) === 'confirm') {
  // 执行提交
}

const result = await openConfirm({
  title: '提交确认',
  message: '提交后将进入审核流程，是否继续？',
  confirmButtonText: '提交',
  cancelButtonText: '再检查一下',
  type: 'info',
  closeOnClickModal: false,
});
```

| 参数         | 类型                           | 默认值 | 说明                 |
| ------------ | ------------------------------ | ------ | -------------------- |
| `options`    | `string \| OpenConfirmOptions` | `{}`   | 消息字符串或弹窗选项 |
| `appContext` | `AppContext \| null`           | —      | 可选 Vue 应用上下文  |

| 默认选项            | 值                     |
| ------------------- | ---------------------- |
| `title`             | `'操作不可撤销'`       |
| `message`           | `'确认执行此操作吗？'` |
| `confirmButtonText` | `'确认'`               |
| `cancelButtonText`  | `'取消'`               |
| `type`              | `'warning'`            |

`OpenConfirmOptions` 基于 [Element Plus MessageBox 选项](https://element-plus.org/en-US/component/message-box.html#options)，
将 `title` 限定为字符串，并禁用 `callback` 以确保 Promise 正常结束。
仍可通过 `beforeClose` 控制关闭时机。

### openDeleteConfirm

内置删除提示和“操作不可撤销”标题，仅确认返回 `true`，取消或关闭返回 `false`。
方法只获取用户确认，实际删除由调用方执行。

```ts
if (await openDeleteConfirm('示例任务')) {
  // 调用删除接口
}

await openDeleteConfirm('示例任务', {
  title: '删除任务',
  message: '确认永久删除所选任务及其附件吗？此操作不可撤销。',
  confirmButtonText: '永久删除',
  confirmButtonType: 'danger',
});
```

| 参数         | 类型                 | 默认值 | 说明                         |
| ------------ | -------------------- | ------ | ---------------------------- |
| `name`       | `string`             | —      | 对象名称；空白名称使用“该项” |
| `options`    | `OpenConfirmOptions` | `{}`   | 覆盖文案及弹窗选项           |
| `appContext` | `AppContext \| null` | —      | 可选 Vue 应用上下文          |

名称默认作为普通文本显示；无需转义 HTML。多语言项目可在每次调用时通过 `title`、
`message`、`confirmButtonText`、`cancelButtonText` 传入翻译文案。

如需继承应用内的 ConfigProvider 或其他注入，可在组件 `setup` 中取得上下文后传入：

```ts
import { getCurrentInstance } from 'vue';

const appContext = getCurrentInstance()?.appContext;
await openConfirm({ message: '确认继续吗？' }, appContext);
await openDeleteConfirm('示例任务', {}, appContext);
```

返回类型 `ConfirmResult`、配置类型 `OpenConfirmOptions` 也可从包根入口导入。
