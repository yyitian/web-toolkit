<script setup lang="ts" generic="Row extends object">
import { ElTable, ElTableColumn } from 'element-plus';
import { get } from 'es-toolkit/compat';
import type { TableInstance, TableProps } from 'element-plus';
import { formatLabel } from '../SuperForm/config.ts';
import { getCellValue, getColumnDefaults } from './config.ts';
import TableSkeleton from './TableSkeleton.vue';
import type { TableMotion } from './useTableMotion.ts';
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
  selections: Row[];
  sort: SuperTableQuery['sort'];
  loading?: boolean;
  feedback?: boolean;
  motion?: TableMotion;
}>();
const emit = defineEmits<{
  sort: [sort: SuperTableQuery['sort']];
  selection: [rows: Row[]];
}>();
const attrs = useAttrs();
const tableAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) => !['tooltipOptions', 'tooltip-options'].includes(key),
    ),
  ),
);
const tooltipOptions = computed(() => {
  const source = (attrs.tooltipOptions ??
    attrs['tooltip-options'] ??
    {}) as TableProps<Row>['tooltipOptions'];
  return {
    ...source,
    popperClass: ['wt-table-tooltip', source?.popperClass]
      .filter(Boolean)
      .join(' '),
  };
});
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
    ...getColumnDefaults(column),
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

const skeletonColumns = computed(() => {
  const actual = table.value?.store?.states.columns.value;
  if (actual?.length)
    return actual.map((column, index) => ({
      key: String(column.columnKey ?? index),
      width: Number(column.realWidth || column.width || column.minWidth || 80),
      type: column.type,
    }));
  return [
    ...(props.selection
      ? [{ key: 'selection', width: 48, type: 'selection' }]
      : []),
    ...props.columns.map((column) => {
      const resolved = columnProps(column);
      return {
        key: column.prop,
        width:
          Number.parseFloat(
            String(resolved.width ?? resolved.minWidth ?? 80),
          ) || 80,
        type: resolved.type,
      };
    }),
  ];
});

function context(row: Row, column: SuperTableColumn<Row>, index: number) {
  return { row, column, index, value: getCellValue(row, column, index) };
}

let syncingSelection = true;
let syncingSort = true;
let syncSequence = 0;
let displayedSort: string | undefined;
const sortKey = (value: SuperTableQuery['sort']) =>
  value ? `${value.prop}:${value.order}` : '';
async function synchronize() {
  const sequence = ++syncSequence;
  syncingSelection = true;
  syncingSort = true;
  await nextTick();
  if (sequence !== syncSequence || !table.value) return;
  const instance = table.value;
  const desired = props.selection ? props.selections : [];
  if (!desired.length) instance.clearSelection();
  else {
    const identity = (row: Row) =>
      String(
        typeof props.rowKey === 'function'
          ? props.rowKey(row)
          : get(row, props.rowKey),
      );
    const current = new Map(
      (instance.getSelectionRows() as Row[]).map((row) => [identity(row), row]),
    );
    const target = new Map(desired.map((row) => [identity(row), row]));
    // 只同步变化项，避免原生勾选后再清空并回填整份跨页选择。
    for (const [key, row] of current) {
      if (!target.has(key) || toRaw(target.get(key)) !== toRaw(row))
        instance.toggleRowSelection(row, false, true);
    }
    for (const [key, row] of target) {
      if (!current.has(key) || toRaw(current.get(key)) !== toRaw(row))
        instance.toggleRowSelection(row, true, true);
    }
  }
  if (displayedSort !== sortKey(props.sort)) {
    if (props.sort) instance.sort(props.sort.prop, props.sort.order);
    else instance.clearSort();
    displayedSort = sortKey(props.sort);
  }
  await nextTick();
  if (sequence === syncSequence) {
    syncingSelection = false;
    syncingSort = false;
  }
}
watch(
  [
    () => props.data,
    () => props.selections,
    () => props.selection,
    () => props.rowKey,
    selectionColumnKey,
  ],
  () => {
    void synchronize();
  },
  { flush: 'sync' },
);
watch(
  () => props.sort,
  () => {
    void synchronize();
  },
  { flush: 'sync' },
);
onMounted(() => {
  void synchronize();
});
function handleSelection(rows: Row[]) {
  if (!syncingSelection) emit('selection', rows);
}
function handleSort(value: {
  prop?: string | null;
  order?: 'ascending' | 'descending' | null;
}) {
  const next =
    value.prop && value.order ? { prop: value.prop, order: value.order } : null;
  displayedSort = sortKey(next);
  if (!syncingSort) emit('sort', next);
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
    :tooltip-options="tooltipOptions"
    v-bind="tableAttrs"
    class="super-table__table"
    :class="{
      'is-result-a': motion && motion.version > 0 && motion.version % 2 === 1,
      'is-result-b': motion && motion.version > 0 && motion.version % 2 === 0,
    }"
    :inert="loading || undefined"
    :data="data"
    :row-key="tableRowKey"
    @sort-change="handleSort"
    @selection-change="handleSelection"
  >
    <ElTableColumn
      v-if="selection"
      :key="`selection-${selectionColumnKey}`"
      type="selection"
      class-name="wt-table-selection"
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
    <template #empty>
      <TableSkeleton v-if="loading && feedback" :columns="skeletonColumns" />
      <slot v-else-if="!loading" name="empty">{{
        attrs['empty-text'] ?? attrs.emptyText ?? '暂无数据'
      }}</slot>
    </template>
    <template v-if="$slots.append" #append><slot name="append" /></template>
  </ElTable>
</template>

<style lang="scss" scoped>
@use '../../styles/typography' as typography;
.super-table__table.is-result-a :deep(.el-table__body) {
  animation: table-rows-a 160ms ease-out backwards;
}
.super-table__table.is-result-b :deep(.el-table__body) {
  animation: table-rows-b 160ms ease-out backwards;
}
@keyframes table-rows-a {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes table-rows-b {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.super-table__table :deep(.el-table__empty-block:has(.super-table-skeleton)) {
  align-items: flex-start;
  justify-content: flex-start;
}
.super-table__table :deep(.el-table__empty-text:has(.super-table-skeleton)) {
  width: 100%;
  line-height: normal;
}
.super-table__table.el-table--small {
  --wt-table-skeleton-row-height: 32px;
}
.super-table__table.el-table--large {
  --wt-table-skeleton-row-height: 48px;
}
@media (prefers-reduced-motion: reduce) {
  .super-table__table :deep(.el-table__body) {
    animation: none !important;
  }
}

.super-table__table {
  --el-font-size-extra-small: var(--wt-font-size-caption, 12px);
  --_wt-table-line-height: var(--wt-line-height-body, 22px);
  font-weight: var(--wt-font-weight-regular, 400);
  &.el-table--small {
    --_wt-table-line-height: var(--wt-line-height-caption, 20px);
  }
  --el-table-text-color: var(--wt-table-color, var(--wt-text-regular));
  --el-table-header-text-color: var(
    --wt-table-header-color,
    var(--wt-text-title)
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
  :deep(th.el-table__cell),
  :deep(td.el-table__cell) {
    font-size: inherit;
  }
  :deep(th.el-table__cell) {
    color: var(--wt-table-header-color, var(--wt-text-title));
    font-weight: var(--wt-font-weight-bold, 700);
    line-height: var(--_wt-table-line-height);
  }
  :deep(.cell) {
    line-height: var(--_wt-table-line-height);
  }
  :deep(.el-table__empty-text) {
    @include typography.text(caption);
  }
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

<style lang="scss">
@use '../SuperForm/control-theme' as controls;

.wt-table-tooltip.el-popper {
  font-size: var(--wt-font-size-caption, 12px);
  line-height: var(--wt-line-height-caption, 20px);
  font-weight: var(--wt-font-weight-regular, 400);
}

// 仅作用于选择列，业务单元格和插槽内的控件不受影响。
.super-table__table .wt-table-selection .el-checkbox {
  @include controls.checkbox-vars;
}

.super-table__table .wt-table-selection .el-checkbox__inner {
  @include controls.backdrop;
}
</style>
