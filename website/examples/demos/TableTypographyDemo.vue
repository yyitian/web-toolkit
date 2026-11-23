<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperForm from '@/components/SuperForm/index.vue';
import type { SuperFormColumn } from '@/components/SuperForm/types.ts';
import SuperTable from '@/components/SuperTable/index.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperStatus from '@/components/SuperStatus/index.vue';
import SuperTags from '@/components/SuperTags/index.vue';
import type {
  SuperTableCardConfig,
  SuperTableView,
} from '@/components/SuperTable/card-types.ts';
import type { SuperTableQuery } from '@/components/SuperTable/types.ts';
import { cardColumns, createCardRows, queryCardRows } from './card-data.ts';
import type { CardDemoRow } from './card-data.ts';

const view = ref<SuperTableView>('table');
const scale = ref(false);
const color = ref(false);
const override = ref(false);
const size = ref<'small' | 'default' | 'large'>('default');
const tokens = computed<Record<string, string>>(() => ({
  ...(scale.value
    ? {
        '--wt-font-size-title': '18px',
        '--wt-line-height-title': '28px',
        '--wt-font-size-body': '15px',
        '--wt-line-height-body': '26px',
        '--wt-font-size-caption': '13px',
        '--wt-line-height-caption': '22px',
        '--wt-font-weight-regular': '500',
        '--wt-font-weight-bold': '800',
      }
    : {}),
  ...(color.value
    ? {
        '--wt-text-title': '#7c3aed',
        '--wt-text-regular': '#0f766e',
        '--wt-text-secondary': '#9a3412',
      }
    : {}),
}));
const tableStyle = computed(() => ({
  ...tokens.value,
  ...(override.value
    ? { '--wt-table-color': '#0369a1', '--wt-table-header-color': '#b45309' }
    : {}),
}));
const rows = createCardRows().slice(0, 4);
const result = shallowRef(
  queryCardRows(rows, { page: 1, pageSize: 4, search: {}, sort: null }),
);
const card: SuperTableCardConfig<CardDemoRow> = {
  fields: {
    title: 'name',
    image: 'image',
    description: 'description',
    createdAt: 'createdAt',
    tags: 'tags',
  },
  status: { value: 'status' },
};
function query(value: SuperTableQuery) {
  result.value = queryCardRows(rows, value);
}
const settings: SuperFormColumn[] = [
  {
    prop: 'size',
    label: '表格尺寸',
    formType: 'select',
    defaultValue: 'default',
    props: {
      options: ['small', 'default', 'large'].map((value) => ({
        label: value,
        value,
      })),
    },
    change: (_, value) => {
      size.value = value as typeof size.value;
    },
  },
  {
    prop: 'scale',
    label: '自定义字号与字重',
    formType: 'switch',
    change: (_, value) => {
      scale.value = value === true;
    },
  },
  {
    prop: 'color',
    label: '自定义语义文字色',
    formType: 'switch',
    change: (_, value) => {
      color.value = value === true;
    },
  },
  {
    prop: 'override',
    label: '自定义表体与表头颜色',
    formType: 'switch',
    change: (_, value) => {
      override.value = value === true;
    },
  },
];
</script>

<template>
  <DemoLayout class="table-typography-demo" data-demo="table-typography">
    <template #controls
      ><SuperForm :columns="settings" inline label-position="top"
    /></template>
    <p class="wt-text-caption">
      标题、表头、正文与元信息分别跟随主题。标签和状态保留业务语义色；浮层的局部变量通过
      popperStyle 显式传入。
    </p>
    <div class="table-typography-demo__viewport">
      <SuperTable
        :style="tableStyle"
        :view="view"
        :card="card"
        :size="size"
        title="任务列表 Tasks"
        :columns="cardColumns"
        :data="result.data"
        :total="result.total"
        :config="{ pageSizes: [4, 8] }"
        :tooltip-options="{
          popperClass: 'table-typography-tip',
          popperStyle: tokens,
        }"
        selection
        @query-change="query"
      >
        <template #toolbar
          ><SuperButton
            size="small"
            @click="view = view === 'card' ? 'table' : 'card'"
            >{{ view === 'table' ? '切换卡片' : '切换表格' }}</SuperButton
          ></template
        >
        <template #column-status="{ value }"
          ><SuperStatus :value="value"
        /></template>
        <template #column-tags="{ value }"
          ><SuperTags :tags="value" :popover="{ popperStyle: tokens }"
        /></template>
        <template #card-tags="{ value }"
          ><SuperTags
            :tags="value"
            :limit="1"
            :props="{ size: 'small' }"
            :popover="{ popperStyle: tokens }"
        /></template>
        <template #card-extra="{ row }">负责人：{{ row.owner.name }}</template>
      </SuperTable>
    </div>
  </DemoLayout>
</template>

<style scoped>
.table-typography-demo {
  min-width: 0;
}
.table-typography-demo__viewport {
  height: 800px;
  overflow: auto;
}
</style>
