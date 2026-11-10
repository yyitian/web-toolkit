<script setup lang="ts">
import SuperTable from '@/components/SuperTable/index.vue';
import type { SuperTableColumn } from '@/components/SuperTable/types.ts';

interface Row {
  id: number;
  name: string;
  value: number;
  enabled: boolean;
  note: string | null;
}
const AmountCell = defineComponent({
  props: { value: { type: Number, default: 0 } },
  setup(props) {
    return () =>
      h(
        'strong',
        { style: 'color: var(--wt-color-primary)' },
        `数量 ${props.value}`,
      );
  },
});
const columns: SuperTableColumn<Row>[] = [
  { prop: 'expand', tableType: 'expand', width: 48 },
  { prop: 'name', label: '名称', fixed: 'left', minWidth: 180 },
  {
    prop: 'value',
    label: '自定义组件',
    tableType: 'custom',
    component: AmountCell,
    minWidth: 180,
  },
  { prop: 'enabled', label: '布尔值', minWidth: 160 },
  { prop: 'note', label: '空值', minWidth: 160 },
  {
    prop: 'formatted',
    label: '格式化',
    minWidth: 160,
    formatter: (row) => `编号 ${row.id}`,
  },
];
const data: Row[] = [
  { id: 1, name: '可选记录', value: 0, enabled: false, note: null },
  { id: 2, name: '不可选记录', value: 8, enabled: true, note: '' },
];
const clicked = ref('尚未点击行');
</script>

<template>
  <div data-demo="table-features">
    <p>{{ clicked }}</p>
    <SuperTable
      :columns="columns"
      :data="data"
      :total="data.length"
      :config="{
        header: false,
        search: false,
        pagination: false,
        rowKey: (row) => row.id,
      }"
      :selection="{ selectable: (row) => row.id !== 2 }"
      @row-click="(row: Row) => (clicked = `已点击：${row.name}`)"
    >
      <template #header-name>自定义列头</template>
      <template #expand="{ row, index }"
        ><p>展开记录：{{ row.name }}，行索引：{{ index }}</p></template
      >
    </SuperTable>
  </div>
</template>
