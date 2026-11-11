<script setup lang="ts">
import SuperTable from '@/components/SuperTable/index.vue';
import SuperButton from '@/components/SuperButton/index.vue';
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
</script>

<template>
  <div class="table-layout-demo" data-demo="table-layout">
    <div class="table-layout-demo__controls">
      <SuperButton
        v-for="count in [0, 3, 10, 30]"
        :key="count"
        @click="rowCount = count"
        >{{ count }} 条数据</SuperButton
      >
      <SuperButton
        v-for="height in [400, 720, 900]"
        :key="height"
        @click="parentHeight = height"
        >父高度 {{ height }}px</SuperButton
      >
      <SuperButton @click="naturalHeight = !naturalHeight"
        >父高度模式：{{ naturalHeight ? '自然高度' : '固定高度' }}</SuperButton
      >
      <SuperButton @click="showExtra = !showExtra"
        >附加内容：{{ showExtra ? '显示' : '隐藏' }}</SuperButton
      >
      <SuperButton @click="showSearch = !showSearch"
        >搜索：{{ showSearch ? '显示' : '隐藏' }}</SuperButton
      >
      <SuperButton @click="showHeader = !showHeader"
        >标题：{{ showHeader ? '显示' : '隐藏' }}</SuperButton
      >
      <SuperButton @click="showPagination = !showPagination"
        >分页：{{ showPagination ? '显示' : '隐藏' }}</SuperButton
      >
    </div>
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
  </div>
</template>

<style scoped>
.table-layout-demo {
  min-width: 0;
}
.table-layout-demo__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.table-layout-demo__controls .super-button {
  margin: 0;
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
