<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import TableDemoViewport from '../TableDemoViewport.vue';
import { ElTag } from 'element-plus';
import { Eye } from '@lucide/vue';
import SuperTable from '@/components/SuperTable/index.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import type {
  SuperTableInstance,
  SuperTableQuery,
  SuperTableRequest,
} from '@/components/SuperTable/types.ts';
import { queryDemoRows, tableColumns } from './table-data.ts';
import type { DemoTableRow } from './table-data.ts';

const table = ref<SuperTableInstance<DemoTableRow>>();
const failNext = ref(false);
const reserve = ref(false);
const lastQuery = ref<SuperTableQuery>();
const detail = ref('点击操作查看任务');
const responseDelay = ref(250);
const request: SuperTableRequest<DemoTableRow> = async (query, { signal }) => {
  await new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new Error('请求已取消'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, responseDelay.value);
    signal.addEventListener('abort', abort, { once: true });
  });
  if (failNext.value) {
    failNext.value = false;
    throw new Error('演示请求失败');
  }
  return queryDemoRows(query);
};
function triggerFailure() {
  failNext.value = true;
  void table.value?.refresh();
}
function refreshWithDelay(delay: number) {
  responseDelay.value = delay;
  void table.value?.refresh();
}
</script>

<template>
  <DemoLayout class="table-demo" data-demo="table-request">
    <template #controls>
      <SuperButton @click="reserve = !reserve"
        >跨页保留：{{ reserve ? '开' : '关' }}</SuperButton
      >
      <SuperButton @click="refreshWithDelay(50)">快速请求</SuperButton>
      <SuperButton @click="refreshWithDelay(1500)">慢速请求</SuperButton>
      <SuperButton @click="triggerFailure">模拟失败</SuperButton>
      <span class="wt-text-caption"
        >使用本地模拟请求，失败时保留已有数据。</span
      >
    </template>
    <TableDemoViewport>
      <SuperTable
        ref="table"
        :columns="tableColumns"
        title="任务列表"
        :request="request"
        :selection="{ reserveSelection: reserve }"
        @query-change="lastQuery = $event"
      >
        <template #toolbar="{ selections }">
          <span>已选 {{ selections.length }} 条</span>
          <SuperButton @click="table?.clearSelection()">清空勾选</SuperButton>
          <SuperButton @click="refreshWithDelay(250)">刷新</SuperButton>
        </template>
        <template #column-enabled="{ value }">
          <ElTag :type="value ? 'success' : 'info'">{{
            value ? '启用' : '停用'
          }}</ElTag>
        </template>
        <template #column-operation="{ row }">
          <SuperButton
            :icon="Eye"
            :square="32"
            label="查看"
            @click="detail = `当前任务：${row.name}`"
          />
        </template>
      </SuperTable>
    </TableDemoViewport>
    <template #output>
      <p>{{ detail }}</p>
      <details>
        <summary>查询参数</summary>
        <pre>{{ JSON.stringify(lastQuery, null, 2) }}</pre>
      </details>
    </template>
  </DemoLayout>
</template>

<style scoped>
.table-demo {
  width: 100%;
  min-width: 0;
}
.table-demo pre {
  white-space: pre-wrap;
}
</style>
