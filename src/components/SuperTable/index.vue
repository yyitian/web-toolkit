<script setup lang="ts" generic="Row extends object = Record<string, unknown>">
import { vLoading } from 'element-plus';
import type { TableInstance } from 'element-plus';
import { formatLabel } from '../SuperForm/config.ts';
import { getSearchColumns } from './config.ts';
import TableSearch from './TableSearch.vue';
import TableContent from './TableContent.vue';
import TablePagination from './TablePagination.vue';
import TableBeforeHeader from './TableBeforeHeader.vue';
import { useTableQuery } from './useTableQuery.ts';
import type {
  SuperTableProps,
  SuperTableQuery,
  SuperTableResult,
} from './types.ts';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SuperTableProps<Row>>(), {
  columns: () => [],
  data: () => [],
  total: 0,
  loading: false,
  selection: false,
  config: () => ({}),
});
const page = defineModel<number>('page', { default: 1 });
const pageSize = defineModel<number>('pageSize', { default: 20 });
const emit = defineEmits<{
  'query-change': [query: SuperTableQuery];
  'selection-change': [rows: Row[]];
  load: [result: SuperTableResult<Row>];
}>();
const attrs = useAttrs();
const defaultSort = (attrs.defaultSort ?? attrs['default-sort']) as
  | { prop?: string; order?: string }
  | undefined;
const slots = useSlots();
const tableAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(([key]) => !['class', 'style'].includes(key)),
  ),
);
const searchColumns = computed(() => getSearchColumns(props.columns));
const searchSlots = computed(() =>
  Object.keys(slots).filter(
    (name) => name.startsWith('search-') && name !== 'search-extra',
  ),
);
const contentSlots = computed(() =>
  Object.keys(slots).filter(
    (name) =>
      name.startsWith('column-') ||
      name.startsWith('header-') ||
      ['expand', 'empty', 'append'].includes(name),
  ),
);
const content = ref<{
  clearSelection(): void;
  elTable: TableInstance | undefined;
}>();
const selections = shallowRef<Row[]>([]);
const reserveSelection = computed(
  () =>
    typeof props.selection === 'object' &&
    props.selection.reserveSelection === true,
);

function updateSelection(rows: Row[]) {
  selections.value = rows.slice();
  emit('selection-change', rows.slice());
}
function clearSelection() {
  content.value?.clearSelection();
  if (selections.value.length) updateSelection([]);
}

const query = useTableQuery<Row>({
  page,
  pageSize,
  request: () => props.request,
  immediate: () => props.config.immediate !== false,
  initialSort:
    defaultSort?.prop &&
    (defaultSort.order === 'ascending' || defaultSort.order === 'descending')
      ? { prop: defaultSort.prop, order: defaultSort.order }
      : null,
  beforeQuery: () => {
    if (!reserveSelection.value) clearSelection();
  },
  onQuery: (value) => emit('query-change', value),
  onLoad: (value) => emit('load', value),
});
const rows = computed(() =>
  props.request ? query.result.value.data : props.data,
);
const total = computed(() =>
  props.request ? query.result.value.total : props.total,
);
const busy = computed(() => props.loading || query.loading.value);

watch(
  () => props.data,
  () => {
    if (!props.request && !reserveSelection.value) clearSelection();
  },
);
watch(
  () => props.selection,
  (value) => {
    if (!value) clearSelection();
  },
);

defineExpose({
  refresh: query.refresh,
  reload: query.reload,
  getQuery: query.getQuery,
  clearSelection,
  get selections() {
    return selections.value.slice();
  },
  get elTable() {
    return content.value?.elTable;
  },
});
</script>

<template>
  <section
    class="super-table"
    :class="attrs.class"
    :style="attrs.style"
    :aria-busy="busy"
  >
    <TableSearch
      v-if="searchColumns.length"
      v-show="config.search !== false"
      :columns="searchColumns"
      @initialize="query.initializeSearch"
      @search="query.submitSearch"
    >
      <template v-if="slots['search-extra']" #extra
        ><slot name="search-extra"
      /></template>
      <template v-for="name in searchSlots" #[name.slice(7)]="scope">
        <slot :name="name" v-bind="scope ?? {}" />
      </template>
    </TableSearch>
    <TableBeforeHeader v-if="slots['before-header']">
      <slot name="before-header" />
    </TableBeforeHeader>
    <div class="super-table__content">
      <header v-if="config.header !== false" class="super-table__header">
        <div class="super-table__title">
          <strong
            ><slot name="title">{{
              title === undefined ? '' : formatLabel(title)
            }}</slot></strong
          >
          <span class="super-table__count">共 {{ total }} 条</span>
        </div>
        <div class="super-table__toolbar">
          <slot
            name="toolbar"
            :selections="selections.slice()"
            :refresh="query.refresh"
          />
        </div>
      </header>
      <div v-loading="busy" class="super-table__body">
        <TableContent
          v-bind="tableAttrs"
          ref="content"
          :columns="columns"
          :data="rows"
          :row-key="config.rowKey ?? 'id'"
          :selection="selection"
          @sort="query.setSort"
          @selection="updateSelection"
        >
          <template v-for="name in contentSlots" #[name]="scope"
            ><slot :name="name" v-bind="scope"
          /></template>
        </TableContent>
      </div>
      <TablePagination
        v-if="config.pagination !== false"
        v-model:page="page"
        v-model:page-size="pageSize"
        :total="total"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.super-table {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: min-content;
  gap: var(--wt-table-gap, 12px);
  min-width: 0;
  color: var(--wt-table-color, var(--wt-text-regular));
  :deep(.super-table__search),
  .super-table__content {
    border: 1px solid var(--wt-table-border-color, var(--wt-border-color-light));
    border-radius: var(--wt-table-radius, var(--wt-radius-large));
    background: var(--wt-table-bg, var(--wt-surface-base));
    box-shadow: var(--wt-table-shadow, var(--wt-shadow-base));
    backdrop-filter: var(--wt-table-backdrop-filter, var(--wt-backdrop-filter));
  }
  :deep(.super-table__search) {
    flex: none;
    padding: var(--wt-table-padding, 12px 16px);
  }
  :deep(.super-table__before-header) {
    flex: none;
    min-width: 0;
  }
}
.super-table__content {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.super-table__header {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: var(--wt-table-padding, 12px 16px);
  border-bottom: 1px solid
    var(--wt-table-border-color, var(--wt-border-color-light));
}
.super-table__title,
.super-table__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.super-table__title {
  color: var(--wt-text-primary);
  font-size: 14px;
}
.super-table__count {
  color: var(--wt-text-secondary);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 20px;
  background: var(--el-fill-color-light);
}
.super-table__body {
  display: flex;
  flex-direction: column;
  flex: 1 0 0;
  height: 0;
  // 默认列头与十行数据；自定义高行可增加此变量。
  min-height: var(--wt-table-body-min-height, 440px);
  min-width: 0;
  overflow: hidden;
}
</style>
