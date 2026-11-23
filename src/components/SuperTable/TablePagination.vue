<script setup lang="ts">
import { ElPagination } from 'element-plus';

defineProps<{ total: number; pageSizes: number[] }>();
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
      :page-sizes="pageSizes"
      :total="total"
    />
  </footer>
</template>

<style scoped lang="scss">
@use '../../styles/typography' as typography;

.super-table__footer {
  @include typography.text(caption);
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: var(--wt-table-padding, 12px 16px);
  border-top: 1px solid
    var(--wt-table-border-color, var(--wt-border-color-light));
  min-width: 0;
}
.el-pagination {
  --el-pagination-font-size: var(--wt-font-size-body, 14px);
  --el-pagination-font-size-small: var(--wt-font-size-caption, 12px);
  font-weight: var(--wt-font-weight-regular, 400);
  max-width: 100%;
  overflow-x: auto;
  padding-bottom: 2px;
  // 分页内的 small 控件有原生固定字号，只桥接字号，保留其紧凑行高和高度。
  :deep(.el-select__wrapper),
  :deep(.el-input) {
    font-size: var(--wt-font-size-caption, 12px);
  }
  :deep(.el-pagination__total),
  :deep(.el-pagination__jump),
  :deep(.el-pagination__sizes) {
    @include typography.text(caption);
  }
  :deep(.el-pager li.is-active),
  :deep(.btn-prev.is-active),
  :deep(.btn-next.is-active) {
    font-weight: var(--wt-font-weight-bold, 700);
  }
}
</style>
