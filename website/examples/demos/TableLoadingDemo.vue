<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperTable from '@/components/SuperTable/index.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import type { SuperTableColumn } from '@/components/SuperTable/types.ts';

interface Row {
  id: number;
  name: string;
  owner: string;
}
const columns: SuperTableColumn<Row>[] = [
  { prop: 'id', label: '编号', width: 80 },
  { prop: 'name', label: '任务名称', minWidth: 180 },
  { prop: 'owner', label: '负责人', minWidth: 120 },
];
const rows: Row[] = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  name: `已加载任务 ${i + 1}`,
  owner: i % 2 ? '小林' : '小周',
}));
const loading = ref(false);
const view = ref<'table' | 'card'>('table');
const empty = ref(false);
const alternateColor = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
function finish() {
  clearTimeout(timer);
  loading.value = false;
}
function quickLoad() {
  loading.value = true;
  timer = setTimeout(finish, 50);
}
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <DemoLayout class="table-loading-demo" data-demo="table-loading">
    <template #controls>
      <SuperButton @click="view = view === 'table' ? 'card' : 'table'">{{
        view === 'table' ? '切换卡片' : '切换表格'
      }}</SuperButton>
      <SuperButton :disabled="loading" @click="loading = true"
        >开始加载</SuperButton
      >
      <SuperButton :disabled="!loading" @click="finish">结束加载</SuperButton>
      <SuperButton :disabled="loading" @click="quickLoad"
        >快速加载（50ms）</SuperButton
      >
      <SuperButton @click="empty = !empty">{{
        empty ? '恢复数据' : '清空数据'
      }}</SuperButton>
      <SuperButton @click="alternateColor = !alternateColor"
        >切换主色</SuperButton
      >
    </template>
    <SuperTable
      title="加载时保留已有数据"
      :view="view"
      :card="{ fields: { title: 'name' } }"
      :columns="columns"
      :data="empty ? [] : rows"
      :total="empty ? 0 : rows.length"
      :loading="loading"
      :style="{ '--wt-color-primary': alternateColor ? '#8b5cf6' : undefined }"
    />
  </DemoLayout>
</template>

<style scoped>
.table-loading-demo {
  min-width: 0;
}
</style>
