<script setup lang="ts" generic="Row extends object">
import { ElTable, ElTableColumn } from 'element-plus';
import type { TableInstance } from 'element-plus';
import { formatLabel } from '../SuperForm/config.ts';
import { getCellValue } from './config.ts';
import TableCell from './TableCell.vue';
import type {
  SuperTableColumn,
  SuperTableConfig,
  SuperTableQuery,
  SuperTableSelection,
} from './types.ts';

defineOptions({ inheritAttrs: false });
const props = defineProps<{
  columns: SuperTableColumn<Row>[];
  data: Row[];
  rowKey: NonNullable<SuperTableConfig<Row>['rowKey']>;
  selection: boolean | SuperTableSelection<Row>;
}>();
const emit = defineEmits<{
  sort: [sort: SuperTableQuery['sort']];
  selection: [rows: Row[]];
}>();
const attrs = useAttrs();
const table = ref<TableInstance>();
const selectionConfig = computed(() =>
  typeof props.selection === 'object' ? props.selection : {},
);
// Element Plus 仅在插入勾选列时读取这两项，切换配置时重建该列。
const selectionColumnKey = ref(0);
watch(
  [
    () => selectionConfig.value.reserveSelection,
    () => selectionConfig.value.selectable,
  ],
  () => selectionColumnKey.value++,
);
const tableRowKey = computed(() => {
  const key = props.rowKey;
  return typeof key === 'function' ? (row: Row) => String(key(row)) : key;
});

function columnProps(column: SuperTableColumn<Row>) {
  return {
    resizable: true,
    showOverflowTooltip:
      !column.tableType || ['text', 'date'].includes(column.tableType),
    ...column.props,
    ...(column.width !== undefined ? { width: column.width } : {}),
    ...(column.minWidth !== undefined ? { minWidth: column.minWidth } : {}),
    ...(column.align ? { align: column.align } : {}),
    ...(column.headerAlign ? { headerAlign: column.headerAlign } : {}),
    ...(column.fixed !== undefined ? { fixed: column.fixed } : {}),
    ...(column.showOverflowTooltip !== undefined
      ? { showOverflowTooltip: column.showOverflowTooltip }
      : {}),
    type: ['index', 'expand'].includes(column.tableType ?? '')
      ? column.tableType
      : 'default',
    prop: column.prop,
    columnKey: column.prop,
    label: column.label === undefined ? '' : String(formatLabel(column.label)),
    sortable: column.sortable ? 'custom' : false,
    // 检索统一使用搜索区，不启用底层列头筛选。
    filters: undefined,
    filterMethod: undefined,
  };
}

function context(row: Row, column: SuperTableColumn<Row>, index: number) {
  return { row, column, index, value: getCellValue(row, column, index) };
}

function handleSort(value: {
  prop?: string | null;
  order?: 'ascending' | 'descending' | null;
}) {
  emit(
    'sort',
    value.prop && value.order ? { prop: value.prop, order: value.order } : null,
  );
}

defineExpose({
  clearSelection: () => table.value?.clearSelection(),
  get elTable() {
    return table.value;
  },
});
</script>

<template>
  <ElTable
    ref="table"
    empty-text="暂无数据"
    height="100%"
    v-bind="attrs"
    class="super-table__table"
    :data="data"
    :row-key="tableRowKey"
    @sort-change="handleSort"
    @selection-change="emit('selection', $event)"
  >
    <ElTableColumn
      v-if="selection"
      :key="`selection-${selectionColumnKey}`"
      type="selection"
      :width="48"
      :reserve-selection="selectionConfig.reserveSelection ?? false"
      :selectable="selectionConfig.selectable"
    />
    <ElTableColumn
      v-for="column in columns"
      :key="column.prop"
      v-bind="columnProps(column)"
    >
      <template v-if="$slots[`header-${column.prop}`]" #header="scope">
        <slot :name="`header-${column.prop}`" v-bind="scope" :column="column" />
      </template>
      <template v-if="column.tableType !== 'index'" #default="{ row, $index }">
        <slot
          v-if="column.tableType === 'expand'"
          name="expand"
          v-bind="context(row, column, $index)"
        />
        <slot
          v-else
          :name="`column-${column.prop}`"
          v-bind="context(row, column, $index)"
        >
          <TableCell
            v-if="!['slot', 'operation'].includes(column.tableType ?? '')"
            :context="context(row, column, $index)"
          />
        </slot>
      </template>
    </ElTableColumn>
    <template v-if="$slots.empty" #empty><slot name="empty" /></template>
    <template v-if="$slots.append" #append><slot name="append" /></template>
  </ElTable>
</template>

<style lang="scss" scoped>
.super-table__table {
  --el-table-text-color: var(--wt-table-color, var(--wt-text-regular));
  --el-table-header-text-color: var(
    --wt-table-header-color,
    var(--wt-text-regular)
  );
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: var(
    --wt-table-header-bg,
    var(--wt-surface-raised)
  );
  --el-table-border-color: var(
    --wt-table-border-color,
    var(--wt-border-color-light)
  );
  --el-table-row-hover-bg-color: var(
    --wt-table-hover-bg,
    var(--el-fill-color-light)
  );
  --el-table-current-row-bg-color: var(
    --wt-table-hover-bg,
    var(--el-fill-color-light)
  );
  --el-table-fixed-left-column: var(
    --wt-table-fixed-bg,
    var(--wt-surface-overlay)
  );
  --el-table-fixed-right-column: var(
    --wt-table-fixed-bg,
    var(--wt-surface-overlay)
  );
  width: 100%;
  // 显式 height 过大时收缩至表体可用空间，避免覆盖分页。
  flex: 0 1 auto;
  min-height: 0;
  :deep(.el-table__fixed-right-patch) {
    background: var(--el-table-header-bg-color);
  }
  :deep(.el-table-fixed-column--left),
  :deep(.el-table-fixed-column--right) {
    background: var(--wt-table-fixed-bg, var(--wt-surface-overlay));
    backdrop-filter: var(--wt-backdrop-filter, none);
  }
  :deep(th.el-table-fixed-column--left),
  :deep(th.el-table-fixed-column--right) {
    background: var(--el-table-header-bg-color);
  }
}
</style>
