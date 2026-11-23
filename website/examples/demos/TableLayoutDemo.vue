<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperForm from '@/components/SuperForm/index.vue';
import type { SuperFormColumn } from '@/components/SuperForm/types.ts';
import SuperTable from '@/components/SuperTable/index.vue';
import type { SuperTableColumn } from '@/components/SuperTable/types.ts';

interface Row {
  id: number;
  name: string;
  note: string;
}
const columns: SuperTableColumn<Row>[] = [
  { prop: 'id', label: '编号', width: 80 },
  { prop: 'name', label: '名称', search: true, minWidth: 180 },
  { prop: 'note', label: '说明', minWidth: 420 },
];
const rowCount = ref(30);
const parentHeight = ref(720);
const naturalHeight = ref(false);
const showExtra = ref(false);
const showSearch = ref(true);
const showHeader = ref(true);
const showPagination = ref(true);
const rows = computed(() =>
  Array.from({ length: rowCount.value }, (_, index) => ({
    id: index + 1,
    name: `布局示例 ${index + 1}`,
    note: '数据在表体内滚动，标题和分页保持原位',
  })),
);
const settings: SuperFormColumn[] = [
  {
    prop: 'rows',
    label: '数据条数',
    formType: 'select',
    defaultValue: 30,
    props: {
      options: [0, 3, 10, 30].map((value) => ({ label: `${value} 条`, value })),
    },
    change: (_, value) => {
      rowCount.value = Number(value);
    },
  },
  {
    prop: 'height',
    label: '父容器高度',
    formType: 'select',
    defaultValue: 720,
    props: {
      options: [400, 720, 900].map((value) => ({ label: `${value}px`, value })),
    },
    change: (_, value) => {
      parentHeight.value = Number(value);
    },
  },
  {
    prop: 'natural',
    label: '自然高度',
    formType: 'switch',
    change: (_, value) => {
      naturalHeight.value = value === true;
    },
  },
  {
    prop: 'extra',
    label: '附加内容',
    formType: 'switch',
    change: (_, value) => {
      showExtra.value = value === true;
    },
  },
  {
    prop: 'search',
    label: '搜索区',
    formType: 'switch',
    defaultValue: true,
    change: (_, value) => {
      showSearch.value = value === true;
    },
  },
  {
    prop: 'header',
    label: '标题栏',
    formType: 'switch',
    defaultValue: true,
    change: (_, value) => {
      showHeader.value = value === true;
    },
  },
  {
    prop: 'pagination',
    label: '分页栏',
    formType: 'switch',
    defaultValue: true,
    change: (_, value) => {
      showPagination.value = value === true;
    },
  },
];
</script>

<template>
  <DemoLayout class="table-layout-demo" data-demo="table-layout">
    <template #controls
      ><SuperForm :columns="settings" inline label-position="top"
    /></template>
    <div
      class="table-layout-demo__viewport"
      :style="{ height: naturalHeight ? undefined : `${parentHeight}px` }"
    >
      <SuperTable
        title="占满父容器"
        :columns="columns"
        :data="rows"
        :total="rows.length"
        :page-size="50"
        :config="{
          search: showSearch,
          header: showHeader,
          pagination: showPagination,
        }"
      >
        <template #before-header>
          <div v-if="showExtra" class="table-layout-demo__notice">
            检索后的统计或提示内容。隐藏后不保留额外间距。
          </div>
        </template>
      </SuperTable>
    </div>
  </DemoLayout>
</template>

<style scoped>
.table-layout-demo {
  min-width: 0;
}
.table-layout-demo__viewport {
  min-width: 0;
  overflow: auto;
}
.table-layout-demo__notice {
  padding: 12px 16px;
  border-radius: var(--wt-radius-large);
  color: var(--wt-text-regular);
  background: var(--wt-surface-raised);
}
</style>
