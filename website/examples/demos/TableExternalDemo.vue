<script setup lang="ts">
import { ElTag } from 'element-plus';
import SuperTable from '@/components/SuperTable/index.vue';
import type { SuperTableQuery } from '@/components/SuperTable/types.ts';
import { queryDemoRows, tableColumns } from './table-data.ts';

const count = ref(0);
const page = ref(1);
const pageSize = ref(10);
const initialQuery: SuperTableQuery = {
  page: 1,
  pageSize: 10,
  search: {},
  sort: null,
};
const result = shallowRef(queryDemoRows(initialQuery));
function query(query: SuperTableQuery) {
  count.value++;
  result.value = queryDemoRows(query);
}
</script>

<template>
  <div data-demo="table-external">
    <p>外部查询次数：{{ count }}；当前页：{{ page }}；每页：{{ pageSize }}</p>
    <SuperTable
      v-model:page="page"
      v-model:page-size="pageSize"
      title="外部数据"
      :columns="
        tableColumns.filter((column) => column.tableType !== 'operation')
      "
      :data="result.data"
      :total="result.total"
      selection
      @query-change="query"
    >
      <template #column-enabled="{ value }"
        ><ElTag>{{ value ? '启用' : '停用' }}</ElTag></template
      >
    </SuperTable>
  </div>
</template>
