<script setup lang="ts">
import { ElPagination } from 'element-plus';

defineProps<{ total: number }>();
const page = defineModel<number>('page', { required: true });
const pageSize = defineModel<number>('pageSize', { required: true });
</script>

<template>
  <footer class="super-table__footer">
    <span>第 {{ page }} 页，每页 {{ pageSize }} 条</span>
    <ElPagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      size="small"
      layout="total, sizes, prev, pager, next, jumper"
      :page-sizes="[10, 20, 50, 100]"
      :total="total"
    />
  </footer>
</template>

<style scoped>
.super-table__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: var(--wt-table-padding, 12px 16px);
  color: var(--wt-text-secondary);
  font-size: 12px;
  border-top: 1px solid
    var(--wt-table-border-color, var(--wt-border-color-light));
  min-width: 0;
}
.el-pagination {
  max-width: 100%;
  overflow-x: auto;
  padding-bottom: 2px;
}
</style>
