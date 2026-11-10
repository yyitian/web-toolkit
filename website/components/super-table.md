---
pageClass: super-table-doc
---

<script setup>
import TableDemo from '../examples/demos/TableDemo.vue';
import TableExternalDemo from '../examples/demos/TableExternalDemo.vue';
import TableDateDemo from '../examples/demos/TableDateDemo.vue';
import TableFeaturesDemo from '../examples/demos/TableFeaturesDemo.vue';
</script>

# SuperTable

基于 Element Plus 的配置式标准表格，组合搜索、工具栏、表格和分页。使用前安装
`element-plus`，并在入口引入 `@yyitian/web-toolkit/style.css`。

## 请求模式

<ClientOnly><DemoBlock><TableDemo /></DemoBlock></ClientOnly>

```vue
<script setup lang="ts">
import { SuperTable } from '@yyitian/web-toolkit';
import type { SuperTableColumn, SuperTableRequest } from '@yyitian/web-toolkit';

interface Task {
  id: number;
  name: string;
  createdAt: string;
}

const columns: SuperTableColumn<Task>[] = [
  { prop: 'name', label: '名称', search: true, sortable: true },
  { prop: 'createdAt', label: '创建时间', tableType: 'date', search: true },
];
const request: SuperTableRequest<Task> = async (query, { signal }) => {
  // 在这里适配后端分页命名、日期范围、排序字段和返回结构。
  // 实际项目请使用已配置统一返回拦截器的请求客户端。
  const response = await fetch('/api/tasks', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || '获取任务失败');
  return { data: result.list, total: result.total };
};
</script>

<template>
  <SuperTable
    title="任务列表"
    :columns="columns"
    :request="request"
    selection
  />
</template>
```

提供 `request` 时使用其结果，`data/total` 用于外部数据模式。`loading` 可叠加外部加载
状态。请求默认挂载后执行，`config.immediate: false` 可关闭首次自动加载，后续交互仍
会查询；可通过实例 `refresh()` 主动加载。

新查询会取消旧请求；即使适配函数忽略 `signal`，旧响应也不会覆盖新数据。失败保留
已有数据并结束加载；请求异常不会再次抛出。错误解析和提示由调用方的请求函数或
返回拦截器处理。

## 外部数据模式

<ClientOnly><DemoBlock><TableExternalDemo /></DemoBlock></ClientOnly>

不传 `request`，通过 `data/total/loading` 传入当前页及总数，监听 `query-change` 自行查询。
组件不会对 `data` 再次切片或排序，也不会在挂载时发出首次查询。

```vue
<SuperTable
  v-model:page="page"
  v-model:page-size="pageSize"
  :columns="columns"
  :data="rows"
  :total="total"
  :loading="loading"
  @query-change="loadRows"
/>
```

查询参数如下；搜索、排序、每页条数变化均回到第一页，翻页保留其他条件。

```ts
interface SuperTableQuery {
  page: number;
  pageSize: number;
  search: Record<string, unknown>;
  sort: { prop: string; order: 'ascending' | 'descending' } | null;
}
```

`query-change` 与请求函数分别获得独立的查询快照，不会因为调用方修改参数污染内部
状态。附加固定参数可在请求函数闭包中合并。

## Props 与 config

| 属性               | 类型                                  | 默认值  | 说明                 |
| ------------------ | ------------------------------------- | ------- | -------------------- |
| `columns`          | `SuperTableColumn<Row>[]`             | `[]`    | 列配置               |
| `title`            | `LabelValue`                          | —       | 标题                 |
| `data`             | `Row[]`                               | `[]`    | 外部模式的当前页     |
| `total`            | `number`                              | `0`     | 外部模式总数         |
| `loading`          | `boolean`                             | `false` | 外部加载状态         |
| `request`          | `SuperTableRequest<Row>`              | —       | Promise 查询适配函数 |
| `selection`        | `boolean \| SuperTableSelection<Row>` | `false` | 勾选配置             |
| `config`           | `SuperTableConfig<Row>`               | `{}`    | 通用配置             |
| `v-model:page`     | `number`                              | `1`     | 当前页               |
| `v-model:pageSize` | `number`                              | `20`    | 每页条数             |

| config 字段  | 类型                                    | 默认值 | 说明                       |
| ------------ | --------------------------------------- | ------ | -------------------------- |
| `immediate`  | `boolean`                               | `true` | 请求模式是否挂载加载       |
| `rowKey`     | `string \| ((row) => string \| number)` | `'id'` | 稳定唯一的行标识           |
| `search`     | `boolean`                               | `true` | 显示搜索区，无字段时不显示 |
| `header`     | `boolean`                               | `true` | 显示标题工具栏             |
| `pagination` | `boolean`                               | `true` | 显示分页栏                 |

`config.search: false` 仅隐藏搜索区域，字段默认值仍作为初始搜索条件。
`pagination: false` 仅隐藏分页栏，不改变请求协议。

`class/style` 作用于组件根节点。其余属性和未接管事件传给底层 `ElTable`，例如
`height`、`max-height`、`border`、`stripe`、`default-expand-all`、`row-click`。
表格的 `data/row-key`、排序查询和勾选由组件管理。

`default-sort` 同步作为初始查询排序条件；`empty-text` 可覆盖默认空状态文案。

## 列配置

| 字段                  | 类型                             | 说明                                            |
| --------------------- | -------------------------------- | ----------------------------------------------- |
| `prop`                | `string`                         | 唯一列标识，支持 `owner.name` 等嵌套路径        |
| `label`               | `LabelValue`                     | 列标签                                          |
| `tableType`           | 见下表                           | 默认文本                                        |
| `width/minWidth`      | `number \| string`               | 列宽或最小宽度                                  |
| `align/headerAlign`   | `'left' \| 'center' \| 'right'`  | 对齐                                            |
| `fixed`               | `boolean \| 'left' \| 'right'`   | 固定列，默认不固定                              |
| `showOverflowTooltip` | `boolean`                        | 文本及日期列默认开启                            |
| `sortable`            | `boolean`                        | 通过查询执行排序                                |
| `search`              | `boolean \| SuperTableSearch`    | 搜索字段配置                                    |
| `formatter`           | `(row, value, index) => unknown` | 格式化单元格值                                  |
| `component`           | `Component`                      | custom 类型使用的组件                           |
| `props`               | `Record<string, unknown>`        | 底层 ElTableColumn 属性，例如 `index/resizable` |
| `cellProps`           | 对象或 `(context) => 对象`       | 传给标签、进度、自定义组件                      |

| tableType            | 行为                                                            |
| -------------------- | --------------------------------------------------------------- |
| `text` / 省略        | 文本，空字符串及 null/undefined 显示 `—`，保留 0/false          |
| `date`               | 默认按 `YYYY-MM-DD HH:mm` 展示，提供 formatter 时使用格式化结果 |
| `tag`                | 单值或数组标签，通过 cellProps 设置颜色等属性                   |
| `progress`           | 0～100 进度，通过 cellProps 设置其他进度属性                    |
| `slot` / `operation` | 使用 `column-${prop}` 插槽；不自动绑定业务操作                  |
| `custom`             | 指定 component，接收 cellProps 和 row/value/column/index 上下文 |
| `index`              | Element Plus 序号列                                             |
| `expand`             | 使用 expand 插槽，展开行为沿用 Element Plus                     |

顶层列配置优先于 `props`，查询相关属性由组件统一处理。表头不提供筛选，检索统一通过搜索区完成。
业务状态和成员信息通过插槽或自定义组件实现。

<ClientOnly><DemoBlock><TableFeaturesDemo /></DemoBlock></ClientOnly>

## 搜索与日期配置

`search: true` 默认生成输入框，日期列生成 `datetimerange`。对象形式复用
`SuperFormColumn` 的 `formType/props/defaultValue/rules/show` 等协议，`prop/label`
默认继承表格列。单次挂载期间搜索字段结构应保持稳定，与 SuperForm 的使用方式一致。

搜索表单使用 `label-position="left"`，标签显示在控件左侧。

点击搜索或在单行输入框中按 Enter 提交；重置恢复初始默认值并查询。提交过滤空字符串、
null、undefined、空数组，保留 0/false。修改字段不会立即查询。

日期预设 `DATE_FORMATS` 和 `datePickerDefaultTime` 从包根入口导入，完整定义参阅
[工具方法](/guide/utilities#日期格式化)。

日期搜索默认使用 `datePickerDefaultTime`（00:00:00～23:59:59）和
`DATE_FORMATS.dateTimeSeconds`（`YYYY-MM-DD HH:mm:ss`）。列级 `search.props.defaultTime/valueFormat` 分别优先覆盖，
不影响其他日期选择器属性。`format` 可另行控制显示格式。

```ts
import { DATE_FORMATS } from '@yyitian/web-toolkit';
import type { SuperTableColumn } from '@yyitian/web-toolkit';

const dateColumn: SuperTableColumn = {
  prop: 'createdAt',
  label: '创建时间',
  tableType: 'date',
  search: {
    formType: 'date-picker',
    props: {
      type: 'datetimerange',
      valueFormat: DATE_FORMATS.dateTimeSeconds,
      // defaultTime: [自定义开始时刻, 自定义结束时刻],
    },
  },
};
```

日期范围仍按原字段提交数组，不自动生成 `_start/_end` 参数。默认值精确到秒，
开始、结束时刻分别为 `00:00:00`、`23:59:59`。仅需要日期或分钟时，可分别覆盖为
`DATE_FORMATS.date` 或 `DATE_FORMATS.dateTime`。

<ClientOnly><DemoBlock><TableDateDemo /></DemoBlock></ClientOnly>

## 勾选

`selection: true` 开启勾选，默认每次查询清空，包括刷新。跨页保留使用：

```vue
<SuperTable
  :selection="{ reserveSelection: true, selectable: (row) => row.enabled }"
  :config="{ rowKey: 'id' }"
  :columns="columns"
  :request="request"
/>
```

跨页保留要求稳定且唯一的 rowKey，搜索和刷新后也会保留历史勾选，可通过实例
`clearSelection()` 清空所有记录。工具栏插槽和实例均可读取当前 selections；
程序化勾选可通过 `elTable.toggleRowSelection()`。

## Slots

| 名称             | 参数                                       | 说明                                              |
| ---------------- | ------------------------------------------ | ------------------------------------------------- |
| `title`          | —                                          | 替换标题                                          |
| `toolbar`        | `{ selections, refresh }`                  | 工具栏                                            |
| `search-extra`   | —                                          | 搜索区附加内容                                    |
| `search-${name}` | 透传 SuperForm 插槽参数                    | 搜索表单字段或其子插槽；映射名称去掉 search- 前缀 |
| `column-${prop}` | `{ row, value, column, index }`            | 任意列内容                                        |
| `header-${prop}` | Element Plus 列头作用域，column 为本库配置 | 列头                                              |
| `expand`         | `{ row, value, column, index }`            | 展开内容                                          |
| `empty`          | —                                          | 空状态                                            |
| `append`         | —                                          | 底层表格追加内容                                  |

## Events 与 Expose

| 事件               | 参数              | 说明                                    |
| ------------------ | ----------------- | --------------------------------------- |
| `query-change`     | `SuperTableQuery` | 请求模式和外部模式均触发                |
| `selection-change` | `Row[]`           | 勾选变化                                |
| `load`             | `{ data, total }` | 最新请求成功                            |
| `update:page`      | `number`          | 当前页变化（配合 `v-model:page`）       |
| `update:pageSize`  | `number`          | 每页条数变化（配合 `v-model:pageSize`） |

| 实例成员                              | 说明               |
| ------------------------------------- | ------------------ |
| `refresh(): Promise<void>`            | 保持当前页重新查询 |
| `reload(): Promise<void>`             | 回到第一页重新查询 |
| `clearSelection(): void`              | 清空全部勾选       |
| `getQuery(): SuperTableQuery`         | 获取查询深拷贝     |
| `selections: Row[]`                   | 只读勾选数组副本   |
| `elTable: TableInstance \| undefined` | Element Plus 实例  |

实例类型可使用 `SuperTableInstance<Task>`。

## 样式定制

支持四种主题。组件变量包括 `--wt-table-bg/color/header-bg/header-color/border-color/hover-bg/`
`fixed-bg/radius/shadow/backdrop-filter/gap/padding`；未配置时回退到现有主题变量。

```css
.my-table {
  --wt-table-radius: 12px;
  --wt-table-header-bg: var(--wt-surface-raised);
  --wt-table-padding: 12px 16px;
}
```
