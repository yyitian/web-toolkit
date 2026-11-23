<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import CardDemoSettings from './CardDemoSettings.vue';
import { createCardSettings } from './card-demo-settings.ts';
import SuperTags from '@/components/SuperTags/index.vue';
import { Workflow, Eye, Settings } from '@lucide/vue';
import { ElMessage } from 'element-plus';
import SuperTable from '@/components/SuperTable/index.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperStatus from '@/components/SuperStatus/index.vue';
import type {
  SuperTableInstance,
  SuperTableQuery,
  SuperTableRequest,
} from '@/components/SuperTable/types.ts';
import type {
  SuperTableCardConfig,
  SuperTableCardSwitchChange,
  SuperTableView,
} from '@/components/SuperTable/card-types.ts';
import { cardColumns, createCardRows, queryCardRows } from './card-data.ts';
import type { CardDemoRow } from './card-data.ts';

const props = withDefaults(defineProps<{ mode?: 'request' | 'external' }>(), {
  mode: 'request',
});
const table = ref<SuperTableInstance<CardDemoRow>>();
const view = ref<SuperTableView>('card');
const settings = ref(createCardSettings(props.mode));
const pageSize = ref(6);
const message = ref('请求与开关保存均为本地模拟。');
const pending = ref(new Set<number>());
const source = ref(createCardRows());
const lastQuery = ref<SuperTableQuery>({
  page: 1,
  pageSize: 6,
  search: {},
  sort: null,
});
const result = shallowRef(queryCardRows(source.value, lastQuery.value));
const config = computed<SuperTableCardConfig<CardDemoRow>>(() => ({
  fields: {
    title: 'name',
    image:
      settings.value.image === 'mixed'
        ? 'image'
        : () =>
            settings.value.image === 'missing'
              ? undefined
              : 'data:image/png;base64,AA==',
    description: settings.value.description ? 'description' : false,
    tags: settings.value.tags ? 'tags' : false,
    createdAt: settings.value.createdAt ? 'createdAt' : false,
    icon: settings.value.icon ? () => Workflow : false,
  },
  imageFit: settings.value.imageFit,
  tagsMaxVisible: settings.value.tagsLimit,
  status:
    settings.value.status === 'hidden'
      ? false
      : {
          value: 'status',
          options:
            settings.value.status === 'custom'
              ? [
                  { value: 'running', label: '执行中', type: 'primary' },
                  { value: 'failed', label: '需人工处理', type: 'warning' },
                ]
              : undefined,
        },
  switch: settings.value.switch
    ? {
        prop: 'enabled',
        disabled: settings.value.switchDisabled,
        loading: (row) => pending.value.has(row.id),
      }
    : false,
  actions: settings.value.actions
    ? {
        display: settings.value.always ? 'always' : 'hover',
        placement: settings.value.placement,
      }
    : false,
}));
const request: SuperTableRequest<CardDemoRow> = async (query, { signal }) => {
  await new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new Error('已取消'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, 350);
    signal.addEventListener('abort', abort, { once: true });
  });
  return queryCardRows(source.value, query);
};
function onQuery(query: SuperTableQuery) {
  lastQuery.value = query;
  if (settings.value.mode === 'external')
    result.value = queryCardRows(source.value, query);
}
async function changeSwitch(change: SuperTableCardSwitchChange<CardDemoRow>) {
  pending.value.add(change.row.id);
  try {
    // 仅供演示：调用方在这里请求接口并回写业务值，表格不会自动修改行。
    await new Promise((resolve) => setTimeout(resolve, 450));
    change.row.enabled = change.value === true;
    message.value = `${change.row.name}：${change.value ? '已激活' : '已停用'}`;
  } catch {
    ElMessage.error('激活状态更新失败');
  } finally {
    pending.value.delete(change.row.id);
  }
}
watch(
  () => settings.value.mode,
  () => {
    result.value = queryCardRows(source.value, lastQuery.value);
  },
);
</script>

<template>
  <DemoLayout class="card-table-demo" data-demo="card-showcase">
    <template #controls><CardDemoSettings v-model="settings" /></template>
    <p class="wt-text-caption">调整配置查看卡片效果；开关保存为本地模拟。</p>
    <div
      class="card-table-demo__viewport"
      :class="{ 'is-narrow': settings.narrow }"
    >
      <SuperTable
        ref="table"
        v-model:page-size="pageSize"
        :view="view"
        :card="config"
        :config="{ pageSizes: [6, 12, 24] }"
        title="自动化任务"
        :columns="cardColumns"
        :request="settings.mode === 'request' ? request : undefined"
        :data="result.data"
        :total="result.total"
        :selection="
          settings.selection
            ? {
                reserveSelection: settings.reserve,
                selectable: (row) =>
                  !settings.selectionDisabled && row.id % 7 !== 0,
              }
            : false
        "
        @query-change="onQuery"
        @card-switch-change="changeSwitch"
      >
        <template #before-header
          ><div class="card-table-demo__summary">共 72 个任务</div></template
        >
        <template #toolbar="{ selections, sort, setSort }">
          <span>已选 {{ selections.length }} 条</span>
          <SuperButton
            size="small"
            @click="
              setSort({
                prop: 'createdAt',
                order:
                  sort?.order === 'descending' ? 'ascending' : 'descending',
              })
            "
            >创建时间排序</SuperButton
          >
          <SuperButton
            size="small"
            @click="view = view === 'card' ? 'table' : 'card'"
            >{{ view === 'card' ? '表格视图' : '卡片视图' }}</SuperButton
          >
          <SuperButton size="small" @click="table?.clearSelection()"
            >清空勾选</SuperButton
          >
        </template>
        <template v-if="settings.extra" #card-extra="{ row }"
          ><span>负责人：{{ row.owner.name }}</span></template
        >
        <template v-if="settings.customSlots" #card-title="{ row }">
          <SuperButton
            link
            type="primary"
            @click="message = `查看：${row.name}`"
            >{{ row.name }}</SuperButton
          >
        </template>
        <template v-if="settings.customSlots" #card-tags="{ row }">
          <SuperTags
            :tags="row.tags"
            :limit="settings.tagsLimit"
            :props="{ size: 'small', effect: 'plain' }"
          />
        </template>
        <template v-if="settings.customSlots" #card-image-fallback>
          <span>请添加任务封面</span>
        </template>
        <template #card-actions="{ row, overflow }">
          <SuperButton
            :icon="Eye"
            :square="overflow ? undefined : 32"
            :text="overflow"
            label="查看"
            @click="message = `查看：${row.name}`"
            ><template v-if="overflow" #default>查看</template></SuperButton
          >
          <SuperButton
            :icon="Settings"
            :square="overflow ? undefined : 32"
            :text="overflow"
            label="配置"
            @click="message = `配置：${row.name}`"
            ><template v-if="overflow" #default>配置</template></SuperButton
          >
        </template>
        <template #column-status="{ value }"
          ><SuperStatus :value="value"
        /></template>
      </SuperTable>
    </div>
    <details>
      <summary>当前查询</summary>
      <pre>{{ JSON.stringify(lastQuery, null, 2) }}</pre>
    </details>
    <template #output>{{ message }}</template>
  </DemoLayout>
</template>

<style scoped>
.card-table-demo {
  min-width: 0;
}
.card-table-demo__viewport {
  height: 800px;
  min-width: 0;
  overflow: auto;
}
.card-table-demo__viewport.is-narrow {
  width: min(100%, 430px);
}
.card-table-demo__summary {
  padding: 10px 12px;
  border: 1px solid var(--wt-border-color-light);
  border-radius: var(--wt-radius-base);
  background: var(--wt-surface-raised);
  font-size: 12px;
}
.card-table-demo pre {
  white-space: pre-wrap;
}
</style>
