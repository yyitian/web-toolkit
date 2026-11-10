<script setup lang="ts">
import { ElTag } from 'element-plus';
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
const count = ref(0);
const failNext = ref(false);
const reserve = ref(false);
const lastQuery = ref<SuperTableQuery>();
const detail = ref('点击操作查看任务');
const request: SuperTableRequest<DemoTableRow> = async (query, { signal }) => {
  count.value++;
  await new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new Error('请求已取消'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, 250);
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
</script>

<template>
  <div class="table-demo" data-demo="table-request">
    <p>请求次数：{{ count }}；{{ detail }}</p>
    <SuperTable
      ref="table"
      :columns="tableColumns"
      title="任务列表"
      :request="request"
      :selection="{ reserveSelection: reserve }"
      :max-height="360"
      @query-change="lastQuery = $event"
    >
      <template #search-extra>
        <SuperButton @click="reserve = !reserve"
          >跨页保留：{{ reserve ? '开' : '关' }}</SuperButton
        >
      </template>
      <template #toolbar="{ selections, refresh }">
        <span>已选 {{ selections.length }} 条</span>
        <SuperButton @click="table?.clearSelection()">清空勾选</SuperButton>
        <SuperButton @click="refresh()">刷新</SuperButton>
        <SuperButton @click="triggerFailure">模拟失败</SuperButton>
      </template>
      <template #column-enabled="{ value }">
        <ElTag :type="value ? 'success' : 'info'">{{
          value ? '启用' : '停用'
        }}</ElTag>
      </template>
      <template #column-operation="{ row }">
        <SuperButton
          link
          type="primary"
          @click="detail = `当前任务：${row.name}`"
          >查看</SuperButton
        >
      </template>
    </SuperTable>
    <details>
      <summary>当前查询参数</summary>
      <pre>{{ JSON.stringify(lastQuery, null, 2) }}</pre>
    </details>
  </div>
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
