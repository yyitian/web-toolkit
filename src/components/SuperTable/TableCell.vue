<script setup lang="ts" generic="Row extends object">
import { dayjs, ElProgress, ElTag } from 'element-plus';
import { DATE_FORMATS } from '../../constants/date.ts';
import type { SuperTableCellContext } from './types.ts';

const props = defineProps<{ context: SuperTableCellContext<Row> }>();
const cellProps = computed(() => {
  const source = props.context.column.cellProps;
  return typeof source === 'function' ? source(props.context) : (source ?? {});
});
const empty = computed(
  () => props.context.value == null || props.context.value === '',
);
const text = computed(() => {
  if (empty.value) return '—';
  if (
    props.context.column.tableType === 'date' &&
    !props.context.column.formatter
  ) {
    const value = props.context.value;
    const date = dayjs(value as string | number | Date);
    return date.isValid() ? date.format(DATE_FORMATS.dateTime) : String(value);
  }
  return String(props.context.value);
});
const tags = computed(() =>
  Array.isArray(props.context.value)
    ? props.context.value
    : [props.context.value],
);
const percentage = computed(() => {
  const value = Number(props.context.value);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
});
</script>

<template>
  <Component
    :is="context.column.component"
    v-if="context.column.tableType === 'custom' && context.column.component"
    v-bind="{ ...cellProps, ...context }"
  />
  <span
    v-else-if="context.column.tableType === 'tag' && !empty"
    class="super-table__tags"
  >
    <ElTag v-for="(tag, index) in tags" :key="index" v-bind="cellProps">{{
      tag
    }}</ElTag>
  </span>
  <ElProgress
    v-else-if="context.column.tableType === 'progress' && !empty"
    v-bind="cellProps"
    :percentage="percentage"
  />
  <span v-else>{{ text }}</span>
</template>

<style scoped>
.super-table__tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
