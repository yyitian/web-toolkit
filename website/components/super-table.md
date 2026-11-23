---
pageClass: super-table-doc
---

<script setup>
import TableDemo from '../examples/demos/TableDemo.vue';
import CardTableDemo from '../examples/demos/CardTableDemo.vue';
import CardAdaptiveActionsDemo from '../examples/demos/CardAdaptiveActionsDemo.vue';
import CardBasicDemo from '../examples/demos/CardBasicDemo.vue';
import TableExternalDemo from '../examples/demos/TableExternalDemo.vue';
import TableDateDemo from '../examples/demos/TableDateDemo.vue';
import TableFeaturesDemo from '../examples/demos/TableFeaturesDemo.vue';
import TableLayoutDemo from '../examples/demos/TableLayoutDemo.vue';
import TableLoadingDemo from '../examples/demos/TableLoadingDemo.vue';
</script>

# SuperTable

提供搜索、分页和勾选，支持表格与[卡片视图](#卡片视图)。

## 请求模式

通过 `columns` 配置列，`request` 返回当前页的 `{ data, total }`。示例使用模拟请求。

::: tip 提示
请求失败时保留原数据，组件不向外抛出异常；错误提示由请求函数处理。新查询会取消旧请求，旧响应不覆盖新数据。
:::

<ClientOnly><DemoBlock><TableDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Eye } from '@lucide/vue';
import { SuperButton, SuperTable } from '@yyitian/web-toolkit';
import type {
  SuperTableColumn,
  SuperTableQuery,
  SuperTableRequest,
} from '@yyitian/web-toolkit';

interface Task {
  id: number;
  name: string;
  createdAt: string;
}
const tasks: Task[] = Array.from({ length: 57 }, (_, index) => ({
  id: index + 1,
  name: `${['资产巡检', '告警分析', '日志归档'][index % 3]} ${index + 1}`,
  createdAt: `2026-11-${String((index % 9) + 1).padStart(2, '0')} 12:30:00`,
}));
const columns: SuperTableColumn<Task>[] = [
  { prop: 'name', label: '任务名称', search: true, sortable: true },
  { prop: 'createdAt', label: '创建时间', tableType: 'date' },
  {
    prop: 'operation',
    label: '操作',
    tableType: 'operation',
    width: 100,
    fixed: 'right',
  },
];
const detail = ref('点击操作查看任务');
function queryTasks(query: SuperTableQuery) {
  let filtered = tasks.filter(
    (row) => !query.search.name || row.name.includes(String(query.search.name)),
  );
  if (query.sort) {
    const { prop, order } = query.sort;
    filtered = filtered.toSorted(
      (a, b) =>
        String(a[prop as keyof Task]).localeCompare(
          String(b[prop as keyof Task]),
          'zh-CN',
          { numeric: true },
        ) * (order === 'ascending' ? 1 : -1),
    );
  }
  return {
    data: filtered.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize,
    ),
    total: filtered.length,
  };
}

const request: SuperTableRequest<Task> = async (query) => queryTasks(query);
</script>

<template>
  <div style="height: 720px; overflow: auto">
    <SuperTable
      title="任务列表"
      :columns="columns"
      :request="request"
      selection
    >
      <template #column-operation="{ row }">
        <SuperButton
          :icon="Eye"
          :square="32"
          label="查看"
          @click="detail = `当前任务：${row.name}`"
        />
      </template>
    </SuperTable>
  </div>
  <p role="status">{{ detail }}</p>
</template>
```

:::

## 外部数据模式

通过 `data/total/loading` 传入当前页数据并监听 `query-change` 查询。

::: tip 提示
首次加载、分页切片和排序均由调用方完成。
:::

<ClientOnly><DemoBlock><TableExternalDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import { SuperTable } from '@yyitian/web-toolkit';
import type { SuperTableColumn, SuperTableQuery } from '@yyitian/web-toolkit';

interface Task {
  id: number;
  name: string;
  createdAt: string;
}
const tasks: Task[] = Array.from({ length: 57 }, (_, index) => ({
  id: index + 1,
  name: `${['资产巡检', '告警分析', '日志归档'][index % 3]} ${index + 1}`,
  createdAt: `2026-11-${String((index % 9) + 1).padStart(2, '0')} 12:30:00`,
}));
const columns: SuperTableColumn<Task>[] = [
  { prop: 'name', label: '任务名称', search: true, sortable: true },
  { prop: 'createdAt', label: '创建时间', tableType: 'date' },
];
function queryTasks(query: SuperTableQuery) {
  let filtered = tasks.filter(
    (row) => !query.search.name || row.name.includes(String(query.search.name)),
  );
  if (query.sort) {
    const { prop, order } = query.sort;
    filtered = filtered.toSorted(
      (a, b) =>
        String(a[prop as keyof Task]).localeCompare(
          String(b[prop as keyof Task]),
          'zh-CN',
          { numeric: true },
        ) * (order === 'ascending' ? 1 : -1),
    );
  }
  return {
    data: filtered.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize,
    ),
    total: filtered.length,
  };
}

const page = ref(1);
const pageSize = ref(10);
const result = shallowRef(
  queryTasks({ page: 1, pageSize: 10, search: {}, sort: null }),
);
function query(value: SuperTableQuery) {
  result.value = queryTasks(value);
}
</script>

<template>
  <div style="height: 720px; overflow: auto">
    <SuperTable
      v-model:page="page"
      v-model:page-size="pageSize"
      title="外部数据"
      :columns="columns"
      :data="result.data"
      :total="result.total"
      selection
      @query-change="query"
    />
  </div>
</template>
```

:::

## 卡片视图

设置 `view="card"`，通过 `card` 配置图片、状态、标签、开关与操作栏；可在同一案例中调整布局、切换数据模式和自定义插槽。

<span id="卡片最小配置"></span>
<span id="卡片交互示例"></span>
<span id="受控激活开关"></span>
<span id="卡片布局与分页"></span>

::: tip 提示
`card`、`fields` 和字段映射均可省略，默认读取同名字段；每行仍需唯一的 `rowKey`。开关由调用方保存并回写，示例使用本地模拟保存。
:::

<ClientOnly><DemoBlock><CardTableDemo /></DemoBlock></ClientOnly>

::: details 查看配置与示例数据

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { Workflow, Eye, Settings } from '@lucide/vue';
import { SuperButton, SuperTable } from '@yyitian/web-toolkit';
import type {
  SuperTableCardConfig,
  SuperTableCardSwitchChange,
  SuperTableRequest,
} from '@yyitian/web-toolkit';
import type { SuperTableColumn, SuperTableQuery } from '@yyitian/web-toolkit';
import type { SuperTagValue } from '@yyitian/web-toolkit';

interface CardDemoRow {
  id: number;
  name: string;
  description: string;
  image?: string;
  status: string;
  enabled: boolean;
  tags: SuperTagValue[];
  createdAt: string;
  owner: { name: string };
}
function illustration(index: number) {
  const color = ['#4f8df7', '#8765d7', '#2c9f8b'][index % 3];
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#142d52"/></linearGradient></defs><path fill="url(#bg)" d="M0 0h480v270H0z"/><g fill="none" stroke="white" stroke-opacity=".25" stroke-width="2"><path d="M0 195h130l48-60h120l54-60h128M70 0v70l50 50v150"/><circle cx="240" cy="135" r="62"/><circle cx="240" cy="135" r="82"/></g><path fill="white" fill-opacity=".9" d="m225 100 42 35-42 35z"/><circle cx="350" cy="75" r="7" fill="white" fill-opacity=".6"/></svg>`)}`;
}
function createCardRows(): CardDemoRow[] {
  return Array.from({ length: 72 }, (_, index) => ({
    id: index + 1,
    name:
      index === 0
        ? '安全自动化巡检与任务编排的长名称示例'
        : `自动化任务 ${String(index + 1).padStart(2, '0')}`,
    description:
      index === 0
        ? '定时收集任务运行情况，自动处理异常并通知负责人，汇总巡检结果与历史趋势，帮助团队及时发现服务和资源风险。'
        : '持续监测、自动编排，统一展示任务执行情况。',
    image:
      index === 1
        ? undefined
        : index === 2
          ? 'data:image/png;base64,AA=='
          : illustration(index),
    status: ['running', 'pending', 'failed', 'success', 'stopped', 'starting'][
      index % 6
    ]!,
    enabled: index % 3 !== 0,
    tags: [
      { label: '自动化', props: { type: 'success' } },
      '巡检',
      '安全运营',
      '定时执行',
    ],
    createdAt: `2026-11-${String((index % 19) + 1).padStart(2, '0')} 12:30:00`,
    owner: { name: index % 2 ? '小林' : '小周' },
  }));
}
const cardColumns: SuperTableColumn<CardDemoRow>[] = [
  {
    prop: 'name',
    label: '任务名称',
    search: true,
    sortable: true,
    minWidth: 220,
  },
  { prop: 'owner.name', label: '负责人', width: 100 },
  { prop: 'status', label: '执行状态', tableType: 'slot', width: 120 },
  { prop: 'tags', label: '标签', tableType: 'tag', width: 170 },
  {
    prop: 'createdAt',
    label: '创建时间',
    tableType: 'date',
    sortable: true,
    search: true,
  },
];
function queryCardRows(rows: CardDemoRow[], query: SuperTableQuery) {
  const range = query.search.createdAt;
  let filtered = rows.filter(
    (row) =>
      (!query.search.name || row.name.includes(String(query.search.name))) &&
      (!Array.isArray(range) ||
        !range.length ||
        (row.createdAt >= String(range[0]) &&
          row.createdAt <= String(range[1]))),
  );
  const sort = query.sort;
  if (sort)
    filtered = filtered.toSorted(
      (a, b) =>
        String(a[sort.prop as keyof CardDemoRow]).localeCompare(
          String(b[sort.prop as keyof CardDemoRow]),
          'zh-CN',
          { numeric: true },
        ) * (sort.order === 'ascending' ? 1 : -1),
    );
  return {
    data: filtered.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize,
    ),
    total: filtered.length,
  };
}

const rows = ref(createCardRows());
const pending = ref(new Set<number>());
const result = ref('请求和保存均为本地模拟');
const card = computed<SuperTableCardConfig<CardDemoRow>>(() => ({
  fields: {
    title: 'name',
    image: 'image',
    description: 'description',
    icon: () => Workflow,
    tags: 'tags',
    createdAt: 'createdAt',
  },
  status: { value: 'status' },
  switch: { prop: 'enabled', loading: (row) => pending.value.has(row.id) },
  imageFit: 'cover',
  tagsMaxVisible: 1,
  actions: { display: 'hover', placement: 'bottom-right' },
}));
const request: SuperTableRequest<CardDemoRow> = async (query) =>
  queryCardRows(rows.value, query);
async function save(change: SuperTableCardSwitchChange<CardDemoRow>) {
  pending.value.add(change.row.id);
  try {
    await new Promise((resolve) => setTimeout(resolve, 450));
    change.row.enabled = change.value === true;
    result.value = `${change.row.name}：${change.value ? '已激活' : '已停用'}`;
  } finally {
    pending.value.delete(change.row.id);
  }
}
</script>

<template>
  <div style="height: 800px; overflow: auto">
    <SuperTable
      view="card"
      title="自动化任务"
      :card="card"
      :columns="cardColumns"
      :request="request"
      :page-size="6"
      :config="{ pageSizes: [6, 12, 24] }"
      :selection="{
        reserveSelection: true,
        selectable: (row) => row.id % 7 !== 0,
      }"
      @card-switch-change="save"
    >
      <template #card-extra="{ row }">负责人：{{ row.owner.name }}</template>
      <template #card-actions="{ row, overflow }">
        <SuperButton
          :icon="Eye"
          :square="overflow ? undefined : 32"
          :text="overflow"
          label="查看"
          @click="result = `查看：${row.name}`"
          ><template v-if="overflow" #default>查看</template></SuperButton
        >
        <SuperButton
          :icon="Settings"
          :square="overflow ? undefined : 32"
          :text="overflow"
          label="配置"
          @click="result = `配置：${row.name}`"
          ><template v-if="overflow" #default>配置</template></SuperButton
        >
      </template>
    </SuperTable>
  </div>
  <p role="status">{{ result }}</p>
</template>
```

:::

::: details 查看自定义插槽片段

打开“自定义插槽”后可替换标题、标签和缺图内容。以下片段使用上方的 `card`、`cardColumns` 和 `request`：

```vue
<script setup lang="ts">
import { SuperButton, SuperTable, SuperTags } from '@yyitian/web-toolkit';
</script>

<template>
  <SuperTable
    view="card"
    :card="card"
    :columns="cardColumns"
    :request="request"
  >
    <template #card-title="{ row }">
      <SuperButton link type="primary">{{ row.name }}</SuperButton>
    </template>
    <template #card-tags="{ row }">
      <SuperTags
        :tags="row.tags"
        :limit="1"
        :props="{ size: 'small', effect: 'plain' }"
      />
    </template>
    <template #card-image-fallback>请添加任务封面</template>
  </SuperTable>
</template>
```

:::

### 同名字段与关闭区域

图片和名称区域始终保留。省略映射时读取 `title/image/description/icon/tags/createdAt` 同名字段；图片缺失或失败显示占位图。
下面只提供同名数据，无需配置 `card`：

<ClientOnly><DemoBlock><CardBasicDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { SuperTable } from '@yyitian/web-toolkit';

interface Task {
  id: number;
  title: string;
  image?: string;
  createdAt: string;
}
const rows: Task[] = [
  { id: 1, title: '资产巡检', createdAt: '2026-11-20 09:00:00' },
  { id: 2, title: '告警分析', createdAt: '2026-11-20 10:00:00' },
];
</script>

<template>
  <div style="height: 660px; overflow: auto">
    <SuperTable
      view="card"
      title="任务卡片"
      :data="rows"
      :total="rows.length"
      selection
    />
  </div>
</template>
```

:::

需要改用业务字段时填写路径或 getter；可选映射显式设为 `false` 时关闭整个区域，包括对应插槽。
配置片段：

```ts
const card = {
  fields: {
    title: 'name',
    image: 'cover',
    description: false,
    createdAt: false,
    // tags、icon 继续读取同名字段。
  },
  status: false,
  switch: false,
  actions: false,
};
```

`status/switch` 省略时不生成默认内容，状态仍可由插槽提供；保留原有对象配置，`false` 明确关闭。`actions: false` 关闭两种位置的操作插槽，
省略时按有效插槽内容展示。`card-extra` 由条件插槽控制。
可选内容为空时不占位，文本 `0/false` 正常展示；这里的数据 `false` 与映射配置中的关闭值不同。

卡片悬停或键盘聚焦时轻微抬升，已加载的默认图片平滑放大；状态、开关、操作栏和勾选框保持原尺寸。
图片慢加载时显示骨架，失败后恢复占位；完全自定义 `card-image` 时由调用方负责图片加载展示。

### 自适应操作

底部操作与时间无法同时完整显示时，操作收进“更多”菜单；调整宽度可比较两种展示。使用 `overflow` 切换图标与文字，点击菜单中的操作会更新演示结果。

<ClientOnly><DemoBlock><CardAdaptiveActionsDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ElSlider } from 'element-plus';
import { Eye, Settings } from '@lucide/vue';
import { SuperButton, SuperTable } from '@yyitian/web-toolkit';
import { ref } from 'vue';

const width = ref(400);
const rows = [
  {
    id: 1,
    title: '自动化巡检',
    description: '调节容器宽度，观察底部操作的自适应展示。',
    createdAt: '2026-11-20 12:30',
  },
];
const result = ref('调整容器宽度，比较操作按钮与更多菜单。');
</script>

<template>
  <div>
    <div class="adaptive-actions-controls">
      <span>容器宽度 {{ width }}px</span>
      <ElSlider
        v-model="width"
        :min="240"
        :max="560"
        :step="1"
        aria-label="卡片容器宽度"
      />
    </div>
    <div class="adaptive-actions-demo" :style="{ width: `${width}px` }">
      <SuperTable
        view="card"
        :data="rows"
        :config="{ search: false, header: false, pagination: false }"
        :card="{ actions: { display: 'always' } }"
      >
        <template #card-created-at="{ formatted }"
          >创建：{{ formatted }}</template
        >
        <template #card-actions="{ row, overflow }">
          <SuperButton
            :icon="Eye"
            :square="overflow ? undefined : 32"
            :text="overflow"
            label="查看"
            @click="result = `查看：${row.title}`"
          >
            <template v-if="overflow" #default>查看</template>
          </SuperButton>
          <SuperButton
            :icon="Settings"
            :square="overflow ? undefined : 32"
            :text="overflow"
            label="配置"
            @click="result = `配置：${row.title}`"
          >
            <template v-if="overflow" #default>配置</template>
          </SuperButton>
        </template>
      </SuperTable>
    </div>
    <p role="status">{{ result }}</p>
  </div>
</template>

<style scoped>
.adaptive-actions-demo {
  max-width: 100%;
  height: 560px;
}
:deep(.el-slider) {
  max-width: 240px;
  margin-inline: 12px;
}
</style>
```

:::

## 自定义列内容

标签列通过 `cellProps` 设置 [SuperTags](/components/super-tags#props) 的数量和标签外观；
默认展示 2 个。

<ClientOnly><DemoBlock><TableFeaturesDemo /></DemoBlock></ClientOnly>

::: details 查看配置片段

```ts
const column = {
  prop: 'tags',
  label: '标签',
  tableType: 'tag',
  cellProps: { limit: 2, type: 'info' },
};
```

:::

## 搜索与日期配置

使用 `search: true` 显示搜索输入框；需要日期或其他字段时，配置 `search.formType/props`，
字段选项参阅 [SuperForm](./super-form#column-通用配置)。点击搜索或按 Enter 查询，重置恢复初始条件。

::: tip 提示
日期搜索默认提交字符串范围数组，不拆分为开始、结束参数。通过 `valueFormat` 调整提交格式。
:::

<ClientOnly><DemoBlock><TableDateDemo /></DemoBlock></ClientOnly>

::: details 查看配置片段

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

:::

## 视图与分页

通过 `view` 切换表格或卡片；卡片所需配置参阅[卡片视图](#卡片最小配置)。
切换视图回到第一页，保留搜索与排序，并发出一次查询。

| 视图  | 默认每页条数 | 默认可选条数       |
| ----- | ------------ | ------------------ |
| table | 20           | 10 / 20 / 50 / 100 |
| card  | 24           | 12 / 24 / 36 / 48  |

使用 `config.pageSizes` 自定义两视图共用选项，值应为正整数；`pageSize` 应包含在选项中。
当前条数不在选项中时采用视图默认值或首项，并回到第一页查询。未自定义选项时，切换视图使用目标视图默认条数。

## 勾选

`selection: true` 开启勾选，默认每次查询清空，包括刷新。`selectable` 返回 false 可禁用单行或全部勾选，两种视图及程序化勾选都遵循该规则；禁用本身不会清空已有勾选。跨页保留使用：

::: tip 提示
跨页保留需要稳定唯一的 `rowKey`，搜索和刷新后仍保留勾选；调用 `clearSelection()` 清空。
:::

::: details 查看配置片段

```vue
<SuperTable
  :selection="{ reserveSelection: true, selectable: (row) => row.enabled }"
  :config="{ rowKey: 'id' }"
  :columns="columns"
  :request="request"
/>
```

:::

## 高度与区域布局

为父容器设置高度，表体填满可用空间，分页保持在底部。使用 `before-header` 插槽添加统计或提示。

::: tip 提示
表体最小高度默认 `440px`，整表还需容纳搜索、标题和分页；父容器较小时请设置 `overflow: auto`。
:::

<ClientOnly><DemoBlock><TableLayoutDemo /></DemoBlock></ClientOnly>

::: details 查看配置片段

配置片段，`columns`、`request` 与 `summary` 由业务提供：

```vue
<template>
  <div class="table-container">
    <SuperTable title="任务列表" :columns="columns" :request="request">
      <template #before-header>
        <div v-if="summary">{{ summary }}</div>
      </template>
    </SuperTable>
  </div>
</template>

<style scoped>
.table-container {
  height: 800px;
  overflow: auto;
}
</style>
```

:::

## 加载反馈

使用 `loading` 控制加载状态，请求模式自动管理。无数据时显示行骨架或自适应卡片骨架；
已有数据时保留原内容，以顶部进度条提示加载。内容区暂时不可操作，搜索、工具栏与分页仍可使用。
反馈延迟 150ms 出现，快速查询不闪现，已显示的反馈至少保留 200ms；实际数据更新及交互解锁不等待动画。

新结果淡入；卡片前进/后退页成功后使用短距离滑动，搜索、排序、每页条数或视图变化使用淡入。
请求失败保留旧数据，不播放成功入场。外部模式请同时更新 `data` 与 `loading`；不使用 loading 时，在 query-change 后提供新的 data 数组即可触发入场。
直接回写行数据、勾选与容器重排不会播放翻页。减少动画偏好下使用静态加载反馈。

下例可切换两种视图。先“清空数据”再“开始加载”观察骨架；有数据时观察刷新进度，快速加载用于检查防闪烁。

<ClientOnly><DemoBlock><TableLoadingDemo /></DemoBlock></ClientOnly>

::: details 查看配置片段

配置片段，`loading` 由外部操作或请求状态设置：

```vue
<SuperTable
  :columns="columns"
  :data="rows"
  :total="rows.length"
  :loading="loading"
/>
```

:::

## 文字主题与排版

使用 `size` 调整表格尺寸，通过 CSS 变量定制字号与颜色，参阅[文字层级与排版](/guide/theming#文字层级与排版)。

::: tip 提示
局部变量不会自动传到挂载于 body 的浮层。溢出提示通过 `tooltip-options.popperStyle`
设置，标签浮层通过 [SuperTags 浮层配置](/components/super-tags#浮层配置与交互)设置。
:::

::: details 查看配置片段

```vue
<SuperTable
  :style="{
    '--wt-font-size-body': '15px',
    '--wt-table-header-color': '#b45309',
  }"
  :columns="columns"
  :data="rows"
/>
```

:::

## API

### Props 与 config

| 属性               | 类型                                  | 默认值    | 说明                  |
| ------------------ | ------------------------------------- | --------- | --------------------- |
| `view`             | `'table' \| 'card'`                   | `'table'` | 内容视图              |
| `card`             | `SuperTableCardConfig<Row>`           | {}        | 可选卡片配置          |
| `columns`          | `SuperTableColumn<Row>[]`             | `[]`      | 列配置                |
| `title`            | `LabelValue`                          | —         | 标题                  |
| `data`             | `Row[]`                               | `[]`      | 外部模式的当前页      |
| `total`            | `number`                              | `0`       | 外部模式总数          |
| `loading`          | `boolean`                             | `false`   | 外部加载状态          |
| `request`          | `SuperTableRequest<Row>`              | —         | Promise 查询适配函数  |
| `selection`        | `boolean \| SuperTableSelection<Row>` | `false`   | 勾选配置              |
| `config`           | `SuperTableConfig<Row>`               | `{}`      | 通用配置              |
| `v-model:page`     | `number`                              | `1`       | 当前页                |
| `v-model:pageSize` | `number`                              | `20/24`   | 每页条数（表格/卡片） |

| config 字段  | 类型                                    | 默认值 | 说明                                |
| ------------ | --------------------------------------- | ------ | ----------------------------------- |
| `immediate`  | `boolean`                               | `true` | 请求模式是否挂载加载                |
| `rowKey`     | `string \| ((row) => string \| number)` | `'id'` | 稳定唯一的行标识                    |
| `search`     | `boolean`                               | `true` | 显示搜索区，无字段时不显示          |
| `header`     | `boolean`                               | `true` | 显示标题工具栏                      |
| `pagination` | `boolean`                               | `true` | 显示分页栏                          |
| `pageSizes`  | `number[]`                              | 按视图 | 表格 10/20/50/100；卡片 12/24/36/48 |

`config.search: false` 仅隐藏搜索区域，字段默认值仍作为初始搜索条件。
`pagination: false` 仅隐藏分页栏，不改变请求协议。

普通表格支持 Element Plus Table 属性与事件，`default-sort` 同时作为初始排序条件，
`empty-text` 设置空状态文字。整体高度通过父容器或根节点 `style` 设置，`height/max-height` 仅控制表体。

### 列配置

| 字段                  | 类型                             | 说明                                            |
| --------------------- | -------------------------------- | ----------------------------------------------- |
| `prop`                | `string`                         | 唯一列标识，支持 `owner.name` 等嵌套路径        |
| `label`               | `LabelValue`                     | 列标签                                          |
| `tableType`           | 见下表                           | 默认文本                                        |
| `width/minWidth`      | `number \| string`               | 列宽或最小宽度                                  |
| `align/headerAlign`   | `'left' \| 'center' \| 'right'`  | 对齐                                            |
| `fixed`               | `boolean \| 'left' \| 'right'`   | 固定列，默认不固定                              |
| `showOverflowTooltip` | `boolean`                        | 仅文本列默认开启，日期默认关闭                  |
| `sortable`            | `boolean`                        | 通过查询执行排序                                |
| `search`              | `boolean \| SuperTableSearch`    | 搜索字段配置                                    |
| `formatter`           | `(row, value, index) => unknown` | 格式化单元格值                                  |
| `component`           | `Component`                      | custom 类型使用的组件                           |
| `props`               | `Record<string, unknown>`        | 底层 ElTableColumn 属性，例如 `index/resizable` |
| `cellProps`           | 对象或 `(context) => 对象`       | 传给标签、进度、自定义组件                      |

| tableType            | 行为                                                                           |
| -------------------- | ------------------------------------------------------------------------------ |
| `text` / 省略        | 文本，空字符串及 null/undefined 显示 `—`，保留 0/false                         |
| `date`               | 默认按 `YYYY-MM-DD HH:mm` 展示，提供 formatter 时使用格式化结果                |
| `tag`                | 单值或数组标签，默认展示两个，其余通过 +N 浮层展示；cellProps 设置属性及 limit |
| `progress`           | 0～100 进度，通过 cellProps 设置其他进度属性                                   |
| `slot` / `operation` | 使用 `column-${prop}` 插槽；不自动绑定业务操作                                 |
| `custom`             | 指定 component，接收 cellProps 和 row/value/column/index 上下文                |
| `index`              | Element Plus 序号列                                                            |
| `expand`             | 使用 expand 插槽，展开行为沿用 Element Plus                                    |

顶层列配置优先于 `props`。业务状态和成员信息可使用插槽或自定义组件。

缺省尺寸：日期 `width: 180`、序号 `width: 60`、展开 `width: 48`、进度 `minWidth: 160`，勾选列保持 48px。
列顶层或 `props` 已指定任一 `width/minWidth` 时，不套用缺省尺寸。日期默认完整显示分钟精度时间，并关闭溢出提示。
自定义较长格式可指定宽度或开启提示，例如：

```ts
const column = {
  prop: 'createdAt',
  label: '创建时间',
  tableType: 'date',
  minWidth: 220, // 使用弹性列，替代默认固定宽度
  showOverflowTooltip: true,
};
```

### 查询参数

```ts
interface SuperTableQuery {
  page: number;
  pageSize: number;
  search: Record<string, unknown>;
  sort: { prop: string; order: 'ascending' | 'descending' } | null;
}
```

搜索、排序、每页条数变化回到第一页。搜索字段变化不立即查询；提交时过滤空字符串、null、undefined 和空数组，保留 `0/false`。
日期搜索默认 `datetimerange`，提交格式 `YYYY-MM-DD HH:mm:ss`，默认时刻为 00:00:00～23:59:59，均可通过字段 `props` 覆盖。
请求默认挂载后加载，可用 `config.immediate: false` 关闭首次加载，并调用 `refresh()` 主动查询。

### Slots

| 名称             | 参数                                       | 说明                                              |
| ---------------- | ------------------------------------------ | ------------------------------------------------- |
| `title`          | —                                          | 替换标题                                          |
| `toolbar`        | `{ selections, refresh, sort, setSort }`   | 工具栏                                            |
| `search-extra`   | —                                          | 搜索区附加内容                                    |
| `before-header`  | —                                          | 搜索区与标题面板之间的内容，空时不占位            |
| `search-${name}` | 透传 SuperForm 插槽参数                    | 搜索表单字段或其子插槽；映射名称去掉 search- 前缀 |
| `column-${prop}` | `{ row, value, column, index }`            | 任意列内容                                        |
| `header-${prop}` | Element Plus 列头作用域，column 为本库配置 | 列头                                              |
| `expand`         | `{ row, value, column, index }`            | 展开内容                                          |
| `empty`          | —                                          | 空状态                                            |
| `append`         | —                                          | 底层表格追加内容                                  |

### Events 与 Expose

| 事件                 | 参数                                         | 说明                                    |
| -------------------- | -------------------------------------------- | --------------------------------------- |
| `query-change`       | `SuperTableQuery`                            | 请求模式和外部模式均触发                |
| `selection-change`   | `Row[]`                                      | 勾选变化                                |
| `card-switch-change` | `{ row, index, prop, value, previousValue }` | 用户操作卡片开关；调用方负责业务回写    |
| `load`               | `{ data, total }`                            | 最新请求成功                            |
| `update:page`        | `number`                                     | 当前页变化（配合 `v-model:page`）       |
| `update:pageSize`    | `number`                                     | 每页条数变化（配合 `v-model:pageSize`） |

| 实例成员                                   | 说明                                    |
| ------------------------------------------ | --------------------------------------- |
| `refresh(): Promise<void>`                 | 保持当前页重新查询                      |
| `reload(): Promise<void>`                  | 回到第一页重新查询                      |
| `toggleRowSelection(row, selected?): void` | 两视图当前页勾选                        |
| `clearSelection(): void`                   | 清空全部勾选                            |
| `getQuery(): SuperTableQuery`              | 获取查询深拷贝                          |
| `selections: Row[]`                        | 只读勾选数组副本                        |
| `elTable: TableInstance \| undefined`      | Element Plus 实例，卡片模式为 undefined |

实例类型可使用 `SuperTableInstance<Task>`。

### 样式定制

支持四种主题。组件变量包括 `--wt-table-bg/color/header-bg/header-color/border-color/hover-bg/`
`fixed-bg/radius/shadow/backdrop-filter/gap/padding`；未配置时回退到现有主题变量。
`--wt-table-body-min-height` 默认 `440px`，可调整表体的最小预留高度。
`--wt-table-loading-bg` 控制加载遮罩颜色，`--wt-table-loading-color` 控制加载进度与提示颜色。

```css
.my-table {
  --wt-table-radius: 12px;
  --wt-table-header-bg: var(--wt-surface-raised);
  --wt-table-padding: 12px 16px;
}
```

### 卡片配置

`SuperTableCardValue<Row, Value>` 为字段路径字符串或 `(row, index) => Value`。
字符串始终代表路径；常量文案、图片地址或图标字符串使用 getter 返回，支持嵌套字段。
文本支持 `LabelValue/number/boolean`，保留 `0/false`。映射可省略并读取同名字段；可选字段可设置为 `false` 强制隐藏，规则见[同名字段与关闭区域](#同名字段与关闭区域)。

| 配置                 | 类型                                     | 默认/说明                                                  |
| -------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `fields.title`       | 字段映射                                 | 默认 title；区域始终保留，名称单行省略                     |
| `fields.image`       | 字段映射                                 | 默认 image；区域始终保留，缺失或失败显示占位图             |
| `fields.description` | 字段映射                                 | 默认 description；最多两行，false 隐藏                     |
| `fields.icon`        | 字段映射                                 | 默认 icon，false 隐藏；值为 `string \| Component`          |
| `fields.tags`        | 字段映射                                 | 默认 tags，false 隐藏；[标签内容](./super-tags#props)      |
| `fields.createdAt`   | 字段映射                                 | 默认 createdAt，false 隐藏；数字按毫秒，有值但无效显示 `—` |
| `status.value`       | 字段映射                                 | 图片左上角的多状态值                                       |
| `status.options`     | `readonly SuperStatusOption[]`           | 自定义状态，见 [SuperStatus](./super-status#props)         |
| `switch`             | `false \| SuperTableCardSwitch<Row>`     | 可选图片右上角激活开关                                     |
| `imageFit`           | `'cover' \| 'contain'`                   | `cover`                                                    |
| `dateFormat`         | `string`                                 | `DATE_FORMATS.dateTime`                                    |
| `tagsMaxVisible`     | `number \| 'all'`                        | `1`；非负整数，`0` 仅计数；无效值按 SuperTags 回退 2       |
| `actions.display`    | `'always' \| 'hover'`                    | `hover`                                                    |
| `actions.placement`  | `'bottom-right' \| 'image-bottom-right'` | `bottom-right`                                             |

操作默认在悬停或聚焦时显示，触摸设备常驻；使用 `actions.display: 'always'` 始终显示。
`status/switch/actions` 都支持 `false`；关闭后不保留区域或占位。操作底板跟随主题，时间会为其预留空间。
需要名称导航时使用 `card-title` 插槽。

#### switch

| 字段               | 类型                                  | 默认/说明                          |
| ------------------ | ------------------------------------- | ---------------------------------- |
| `prop`             | `string`                              | 必填；业务字段路径                 |
| `activeValue`      | `boolean \| string \| number`         | `true`                             |
| `inactiveValue`    | `boolean \| string \| number`         | `false`；与 activeValue 相同则禁用 |
| `disabled/loading` | `boolean \| ((row,index) => boolean)` | `false`                            |
| `label`            | `LabelValue`                          | 无障碍名称，默认“激活：主体名称”   |

### 卡片插槽与实例

以下插槽的共享参数为 `{ row, index, selected, selectable }`。显式 `false` 的字段配置优先于对应插槽。
自定义标签插槽自行决定折叠和滚动。

| 插槽                  | 额外参数           | 位置                                              |
| --------------------- | ------------------ | ------------------------------------------------- |
| `card-image`          | `value`            | 图片内容，保留外围状态、开关和勾选                |
| `card-image-fallback` | `src`              | 图片缺失或失败占位                                |
| `card-status`         | `value`            | 图片左上状态                                      |
| `card-icon`           | `value`            | 名称左侧                                          |
| `card-title`          | `value`            | 名称                                              |
| `card-description`    | `value`            | 说明                                              |
| `card-tags`           | `value`            | 名称右侧标签                                      |
| `card-created-at`     | `value, formatted` | 左下角时间                                        |
| `card-extra`          | —                  | 说明之后、底部信息之前                            |
| `card-actions`        | `overflow, close`  | 按 actions 配置定位；底部空间不足时收起为更多菜单 |

`card-actions` 可使用 `SuperTableCardActionsContext<Row>` 类型。`overflow=true` 表示正在更多菜单中展示，`close()` 可由自定义内容主动关闭菜单；普通操作按钮点击后自动关闭。更多菜单默认悬停打开，支持移入浮层，也支持点击和键盘操作；聚焦菜单时保持展开。图片区的 `overflow` 始终为 false。

搜索、标题、工具栏、空态等共用插槽，以及事件和实例方法，参阅
[通用 Slots](#slots)与[Events、Expose](#events-与-expose)。
工具栏的 `sort/setSort` 可读取或设置排序，设置后回到第一页查询；传 `null` 清除排序。

卡片模式不提供 `elTable` 实例，也不使用 `column-*`、`header-*`、`expand` 和 `append` 插槽。
程序化勾选使用两视图通用的 `toggleRowSelection()`，清空使用 `clearSelection()`。
禁用沿用 `selection.selectable`，开关使用 `card.switch.disabled`；禁用保留已选/已激活状态，不触发业务变更。
加载与错误处理参阅[加载反馈](#加载反馈)及[请求模式](#请求模式)。

### 卡片主题变量

可通过以下变量定制卡片样式：

| 变量                             | 默认                      |
| -------------------------------- | ------------------------- |
| `--wt-table-card-min-width`      | `240px`                   |
| `--wt-table-card-gap`            | `16px`                    |
| `--wt-table-card-padding`        | `12px`                    |
| `--wt-table-card-content-gap`    | `8px`                     |
| `--wt-table-card-image-ratio`    | `16 / 9`                  |
| `--wt-table-card-bg`             | `--wt-surface-base`       |
| `--wt-table-card-border-color`   | `--wt-border-color-light` |
| `--wt-table-card-radius`         | `--wt-radius-large`       |
| `--wt-table-card-shadow`         | `--wt-shadow-base`        |
| `--wt-table-card-hover-shadow`   | `--wt-shadow-raised`      |
| `--wt-table-card-selected-color` | `--wt-color-primary`      |
| `--wt-table-card-overlay-bg`     | `--wt-surface-overlay`    |

普通表格操作列和卡片操作栏均推荐使用带 `icon/label` 的 SuperButton，设置 `:square="32"`，默认图标 16px。无需显式设置 `size`，沿用 Element Plus 默认值及外层配置。

操作区不覆盖按钮主题，SuperButton / ElButton 沿用各自的类型和交互状态。底部直接排列按钮；时间与按钮无法完整显示时收起为更多菜单，宽度恢复后自动展开，参阅[自适应操作](#自适应操作)。

以下变量仅用于图片区操作底板，默认 8px 主题圆角、上下 4px 与左右 12px 内边距。

| 变量                             | 默认值                                                |
| -------------------------------- | ----------------------------------------------------- |
| `--wt-table-card-actions-bg`     | `--wt-table-card-overlay-bg` / `--wt-surface-overlay` |
| `--wt-table-card-actions-shadow` | `--wt-shadow-overlay`                                 |
| `--wt-table-card-actions-radius` | `--wt-radius-large`，未配置主题变量时回退到 `8px`     |
