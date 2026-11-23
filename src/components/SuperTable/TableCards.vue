<script setup lang="ts" generic="Row extends object">
import type {
  SuperTableCardConfig,
  SuperTableCardSwitchChange,
} from './card-types.ts';
import TableCard from './TableCard.vue';
import TableSkeleton from './TableSkeleton.vue';
import type { TableMotion } from './useTableMotion.ts';
import { useCardGrid } from './useCardGrid.ts';

const props = defineProps<{
  data: Row[];
  card?: SuperTableCardConfig<Row>;
  selection: boolean;
  rowKey: (row: Row) => string;
  isSelected: (row: Row) => boolean;
  selectable: (row: Row, index: number) => boolean;
  loading: boolean;
  emptyText: string;
  feedback?: boolean;
  pageSize?: number;
  motion?: TableMotion;
}>();
const emit = defineEmits<{
  select: [row: Row, selected: boolean];
  'switch-change': [change: SuperTableCardSwitchChange<Row>];
}>();
const slots = useSlots();
function cardSlots() {
  return Object.keys(slots).filter((name) => name.startsWith('card-'));
}
const grid = ref<HTMLElement>();
const measure = ref<HTMLElement>();
const columns = useCardGrid(grid, measure);
const cardConfig = computed(() => props.card ?? {});
const skeletonRows = ref(2);
let sizeObserver: ResizeObserver | undefined;
onMounted(() => {
  const update = () => {
    if (!grid.value) return;
    const rect = grid.value.getBoundingClientRect();
    const available = grid.value.parentElement?.clientHeight ?? 440;
    const width = rect.width > 0 ? rect.width / columns.value : 240;
    skeletonRows.value = Math.max(
      1,
      Math.ceil(available / ((width * 9) / 16 + 100)),
    );
  };
  update();
  if (typeof ResizeObserver !== 'undefined') {
    sizeObserver = new ResizeObserver(update);
    if (grid.value) sizeObserver.observe(grid.value);
  }
});
onBeforeUnmount(() => sizeObserver?.disconnect());
const skeletonCount = computed(() =>
  Math.min(props.pageSize ?? 24, columns.value * skeletonRows.value),
);
function context(row: Row, index: number) {
  return {
    row,
    index,
    selected: props.isSelected(row),
    selectable: props.selectable(row, index),
  };
}
</script>

<template>
  <div class="super-table-cards" :inert="loading || undefined">
    <div ref="measure" class="super-table-cards__measure" aria-hidden="true" />
    <div
      ref="grid"
      class="super-table-cards__grid"
      :class="{
        'is-result-a': motion && motion.version > 0 && motion.version % 2 === 1,
        'is-result-b': motion && motion.version > 0 && motion.version % 2 === 0,
      }"
      :style="{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        '--wt-result-x': `${motion?.x ?? 0}px`,
        '--wt-result-duration': motion?.x ? '180ms' : '160ms',
      }"
    >
      <template v-if="data.length">
        <TableCard
          v-for="(row, index) in data"
          :key="rowKey(row)"
          :context="context(row, index)"
          :card="cardConfig"
          :selection="selection"
          :blocked="loading"
          @select="emit('select', row, $event)"
          @switch-change="emit('switch-change', $event)"
        >
          <template v-for="name in cardSlots()" #[name]="scope"
            ><slot :name="name" v-bind="scope"
          /></template>
        </TableCard>
      </template>
      <TableSkeleton
        v-else-if="loading && feedback"
        view="card"
        :count="skeletonCount"
      />
    </div>
    <div
      v-if="!data.length && !loading"
      class="super-table-cards__empty"
      :class="{ 'is-loading': loading }"
    >
      <slot name="empty">{{ emptyText }}</slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/typography' as typography;
@use './motion' as motion;
.super-table-cards {
  position: relative;
  flex: 1;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
  padding: 24px;
  overflow-x: hidden;
  overflow-y: scroll;
  scrollbar-gutter: stable;
}
@supports (scrollbar-gutter: stable) {
  .super-table-cards {
    overflow-y: auto;
  }
}
.super-table-cards__grid {
  @include motion.result;
  display: grid;
  align-items: stretch;
  gap: var(--wt-table-card-gap, 16px);
  min-width: 0;
}
.super-table-cards__measure {
  position: absolute;
  pointer-events: none;
  visibility: hidden;
  width: var(--wt-table-card-min-width, 240px);
  height: var(--wt-table-card-gap, 16px);
}
.super-table-cards__empty {
  @include typography.text(caption);
  display: grid;
  place-items: center;
  min-height: 200px;
  height: 100%;
}
.super-table-cards__empty.is-loading {
  visibility: hidden;
}
</style>
