<script setup lang="ts">
import SuperTable from '@/components/SuperTable/index.vue';
import { DATE_FORMATS } from '@/constants/date.ts';
import type {
  SuperTableColumn,
  SuperTableQuery,
} from '@/components/SuperTable/types.ts';

const customTime = [
  new Date(2026, 0, 1, 9, 15, 30),
  new Date(2026, 0, 1, 18, 45, 50),
];
const columns: SuperTableColumn[] = [
  { prop: 'defaults', label: '默认配置', tableType: 'date', search: true },
  {
    prop: 'time',
    label: '仅覆盖时刻',
    tableType: 'date',
    search: { formType: 'date-picker', props: { defaultTime: customTime } },
  },
  {
    prop: 'format',
    label: '仅覆盖格式',
    tableType: 'date',
    search: {
      formType: 'date-picker',
      props: { valueFormat: DATE_FORMATS.date },
    },
  },
  {
    prop: 'both',
    label: '同时覆盖',
    tableType: 'date',
    search: {
      formType: 'date-picker',
      props: {
        defaultTime: customTime,
        valueFormat: DATE_FORMATS.dateTime,
      },
    },
  },
];
const lastQuery = ref<SuperTableQuery>();
</script>

<template>
  <div data-demo="table-dates">
    <SuperTable
      :columns="columns"
      :config="{ header: false, pagination: false }"
      @query-change="lastQuery = $event"
    />
    <pre>{{ JSON.stringify(lastQuery?.search ?? {}, null, 2) }}</pre>
  </div>
</template>
