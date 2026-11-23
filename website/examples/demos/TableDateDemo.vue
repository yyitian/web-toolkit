<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import TableDemoViewport from '../TableDemoViewport.vue';
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
const rows = Array.from({ length: 8 }, (_, index) => {
  const day = String(index + 1).padStart(2, '0');
  return {
    id: index + 1,
    defaults: `2026-11-${day} 08:30:00`,
    time: `2026-11-${day} 10:15:00`,
    format: `2026-11-${day} 14:00:00`,
    both: `2026-11-${day} 17:45:00`,
  };
});
const visibleRows = shallowRef(rows);
const lastQuery = ref<SuperTableQuery>();
function query(value: SuperTableQuery) {
  lastQuery.value = value;
  visibleRows.value = rows.filter((row) =>
    Object.entries(value.search).every(([key, range]) => {
      if (!Array.isArray(range) || range.length !== 2) return true;
      const date = String(row[key as keyof typeof row]).slice(0, 10);
      return (
        date >= String(range[0]).slice(0, 10) &&
        date <= String(range[1]).slice(0, 10)
      );
    }),
  );
}
</script>

<template>
  <DemoLayout data-demo="table-dates">
    <TableDemoViewport>
      <SuperTable
        :columns="columns"
        :data="visibleRows"
        :total="visibleRows.length"
        :config="{ header: false, pagination: false }"
        @query-change="query"
      />
    </TableDemoViewport>
    <template #output>
      <pre>{{ JSON.stringify(lastQuery?.search ?? {}, null, 2) }}</pre>
    </template>
  </DemoLayout>
</template>
