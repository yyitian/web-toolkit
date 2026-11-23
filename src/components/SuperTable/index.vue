<script setup lang="ts" generic="Row extends object = Record<string, unknown>">
import { ElCheckbox } from 'element-plus';
import type { TableInstance } from 'element-plus';
import { useWtLocale } from '../useWtLocale.ts';
import { formatLabel } from '../SuperForm/config.ts';
import { getSearchColumns } from './config.ts';
import TableSearch from './TableSearch.vue';
import TableContent from './TableContent.vue';
import TableCards from './TableCards.vue';
import { useTableSelection } from './useTableSelection.ts';
import { getPageOptions, normalizePageSize } from './pagination.ts';
import type { SuperTableCardSwitchChange } from './card-types.ts';
import TablePagination from './TablePagination.vue';
import TableBeforeHeader from './TableBeforeHeader.vue';
import TableLoading from './TableLoading.vue';
import { useTableLoading } from './useTableLoading.ts';
import { useTableMotion } from './useTableMotion.ts';
import { useTableQuery } from './useTableQuery.ts';
import type {
  SuperTableProps,
  SuperTableQuery,
  SuperTableResult,
} from './types.ts';

defineOptions({ inheritAttrs: false });
useWtLocale();
const props = withDefaults(defineProps<SuperTableProps<Row>>(), {
  view: 'table',
  columns: () => [],
  data: () => [],
  total: 0,
  loading: false,
  selection: false,
  config: () => ({}),
});
const page = defineModel<number>('page', { default: 1 });
const pageSizeModel = defineModel<number>('pageSize');
const pageOptions = computed(() =>
  getPageOptions(props.view, props.config.pageSizes),
);
const pageSize = computed({
  get: () => normalizePageSize(pageSizeModel.value, pageOptions.value),
  set: (value: number) => {
    pageSizeModel.value = normalizePageSize(value, pageOptions.value);
  },
});
pageSizeModel.value = pageSize.value;
const emit = defineEmits<{
  'query-change': [query: SuperTableQuery];
  'selection-change': [rows: Row[]];
  load: [result: SuperTableResult<Row>];
  'card-switch-change': [change: SuperTableCardSwitchChange<Row>];
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
function clearSelection() {
  selectionState.clearSelection();
}

const motion = useTableMotion(toRef(props, 'view'));
let waitingExternal = false;
let changedExternal = false;
let hasExternalResult = props.data.length > 0;
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
    if (!selectionState.reserve.value) clearSelection();
  },
  onQuery: (value, reason) => {
    motion.begin(value, reason === 'page');
    waitingExternal = !props.request;
    changedExternal = false;
    emit('query-change', value);
  },
  onLoad: (value) => {
    motion.commit(value.data.length > 0);
    emit('load', value);
  },
});
const rows = computed(() =>
  props.request ? query.result.value.data : props.data,
);
const total = computed(() =>
  props.request ? query.result.value.total : props.total,
);
const busy = computed(() => props.loading || query.loading.value);
const feedback = useTableLoading(busy);
watch(
  [() => props.data, () => props.loading],
  ([data, loading], [previousData, previousLoading]) => {
    if (props.request) return;
    if (
      data !== previousData &&
      (waitingExternal || loading || previousLoading || !hasExternalResult)
    )
      changedExternal = true;
    if (!loading && changedExternal) {
      if (!waitingExternal) motion.begin(query.getQuery(), false);
      motion.commit(data.length > 0);
      if (data.length) hasExternalResult = true;
      waitingExternal = false;
      changedExternal = false;
    }
  },
);
onMounted(() => {
  if (!props.request && !busy.value && rows.value.length) {
    motion.begin(query.getQuery(), false);
    motion.commit(true);
  }
});

const selectionState = useTableSelection<Row>({
  rows: () => rows.value,
  selection: () => props.selection,
  rowKey: () => props.config.rowKey ?? 'id',
  onChange: (value) => emit('selection-change', value),
});
const selections = selectionState.selections;
// 插槽名称在渲染时读取，响应父级动态增加或移除插槽。
function cardSlots() {
  return Object.keys(slots).filter(
    (name) => name.startsWith('card-') || name === 'empty',
  );
}
watch([() => props.view, pageOptions], ([view, options], [previousView]) => {
  const changedView = view !== previousView;
  const next = normalizePageSize(
    changedView && !options.custom ? undefined : pageSizeModel.value,
    options,
  );
  const changedSize = next !== pageSizeModel.value;
  pageSizeModel.value = next;
  if (changedView || changedSize) void query.reload();
});
watch(pageSizeModel, (value) => {
  const normalized = normalizePageSize(value, pageOptions.value);
  if (value !== normalized) pageSizeModel.value = normalized;
});

defineExpose({
  refresh: query.refresh,
  reload: query.reload,
  getQuery: query.getQuery,
  clearSelection,
  toggleRowSelection: selectionState.toggleRowSelection,
  get selections() {
    return selections.value.slice();
  },
  get elTable() {
    return props.view === 'table' ? content.value?.elTable : undefined;
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
          <ElCheckbox
            v-if="view === 'card' && selection"
            class="super-table__page-selection"
            :model-value="selectionState.checked.value"
            :indeterminate="selectionState.indeterminate.value"
            :disabled="selectionState.selectableRows.value.length === 0"
            @change="selectionState.togglePage($event === true)"
            >本页全选</ElCheckbox
          >
          <strong class="super-table__heading"
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
            :sort="query.sort.value ? { ...query.sort.value } : null"
            :set-sort="query.setSort"
          />
        </div>
      </header>
      <div class="super-table__body" :class="{ 'is-loading': busy }">
        <TableContent
          v-if="view === 'table'"
          v-bind="tableAttrs"
          ref="content"
          :columns="columns"
          :data="rows"
          :row-key="config.rowKey ?? 'id'"
          :selection="selection"
          :selections="selections"
          :sort="query.sort.value"
          :loading="busy"
          :feedback="feedback"
          :motion="motion.state.value"
          @sort="query.setSort"
          @selection="selectionState.fromTable"
        >
          <template v-for="name in contentSlots" #[name]="scope"
            ><slot :name="name" v-bind="scope"
          /></template>
        </TableContent>
        <TableCards
          v-else
          :data="rows"
          :card="card"
          :selection="Boolean(selection)"
          :row-key="selectionState.key"
          :is-selected="
            (row) =>
              selectionState.selectedKeys.value.has(selectionState.key(row))
          "
          :selectable="selectionState.selectable"
          :loading="busy"
          :feedback="feedback"
          :page-size="pageSize"
          :motion="motion.state.value"
          :empty-text="
            String(attrs['empty-text'] ?? attrs.emptyText ?? '暂无数据')
          "
          @select="selectionState.toggleRowSelection"
          @switch-change="emit('card-switch-change', $event)"
        >
          <template v-for="name in cardSlots()" #[name]="scope"
            ><slot :name="name" v-bind="scope"
          /></template>
        </TableCards>
        <TableLoading :loading="busy" :visible="feedback" />
      </div>
      <TablePagination
        v-if="config.pagination !== false"
        v-model:page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="pageOptions.sizes"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '../../styles/typography' as typography;
.super-table {
  @include typography.context;
  @include typography.text(body, var(--wt-table-color, var(--wt-text-regular)));
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: min-content;
  gap: var(--wt-table-gap, 12px);
  min-width: 0;
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
.super-table__heading {
  @include typography.text(title);
}
.super-table__count {
  @include typography.text(caption);
  padding: 2px 8px;
  border-radius: 20px;
  background: var(--el-fill-color-light);
}
.super-table__body {
  position: relative;
  isolation: isolate;
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

<style lang="scss">
@use '../SuperForm/control-theme' as controls;
.super-table__page-selection {
  @include controls.checkbox;
}
</style>
