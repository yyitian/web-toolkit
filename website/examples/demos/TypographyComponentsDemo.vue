<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import TypographyFieldsDemo from './TypographyFieldsDemo.vue';
import TypographyPrimitivesDemo from './TypographyPrimitivesDemo.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperForm from '@/components/SuperForm/index.vue';
import SuperFormDialog from '@/components/SuperFormDialog/index.vue';
import SuperTable from '@/components/SuperTable/index.vue';
import type { SuperFormColumn } from '@/components/SuperForm/types.ts';
import type {
  SuperTableCardConfig,
  SuperTableView,
} from '@/components/SuperTable/card-types.ts';

const props = defineProps<{
  semanticStyle: Record<string, string>;
  instanceOverride: boolean;
}>();
const visible = ref(false);
const view = ref<SuperTableView>('table');
const size = ref<'small' | 'default' | 'large'>('default');
const columns: SuperFormColumn[] = [
  {
    prop: 'name',
    label: '名称 Name',
    tips: '说明文字使用 12px / 20px，浮层支持主题切换。',
    formType: 'input',
    rules: { required: true, message: '请输入名称' },
    props: { placeholder: '请输入名称 Name' },
  },
  {
    prop: 'kind',
    label: '类型 Type',
    formType: 'select',
    props: {
      options: [
        { label: '标准 Standard', value: 'standard' },
        { label: '高级 Advanced', value: 'advanced' },
      ],
    },
  },
  { prop: 'date', label: '日期 Date', formType: 'date-picker' },
];
const rows = [
  {
    id: 1,
    name: '任务中心 Task Center',
    description: '查看当前任务与执行记录。Review tasks and execution history.',
    createdAt: '2026-11-20 10:00:00',
  },
  {
    id: 2,
    name: '用于验证单行截断的较长卡片标题 LongCardTitleWithoutSpaces',
    description:
      '较长的说明文字保持两行截断，辅助信息使用相同语义样式。Long descriptions retain the existing two-line clamp without changing card behavior.',
    createdAt: '2026-11-20 11:00:00',
  },
];
const tableColumns = [
  { prop: 'name', label: '名称 Name', minWidth: 170 },
  { prop: 'description', label: '说明 Description', minWidth: 180 },
];
const card: SuperTableCardConfig<(typeof rows)[number]> = {
  fields: { title: 'name', description: 'description', createdAt: 'createdAt' },
};
const instanceStyle = computed(() =>
  props.instanceOverride
    ? {
        '--wt-form-label-color': '#b45309',
        '--wt-dialog-header-color': '#b45309',
        '--wt-table-header-color': '#b45309',
      }
    : {},
);
const settings: SuperFormColumn[] = [
  {
    prop: 'size',
    label: '控件尺寸',
    formType: 'select',
    defaultValue: 'default',
    props: {
      options: ['small', 'default', 'large'].map((value) => ({
        label: value,
        value,
      })),
    },
    change: (_, value) => {
      size.value = value as typeof size.value;
    },
  },
];
</script>

<template>
  <DemoLayout class="typography-components" :style="instanceStyle">
    <template #controls>
      <SuperForm :columns="settings" inline label-position="top" />
      <SuperButton :size="size" @click="visible = true"
        >查看表单弹窗</SuperButton
      >
      <SuperButton
        :size="size"
        @click="view = view === 'table' ? 'card' : 'table'"
        >{{ view === 'table' ? '切换卡片' : '切换表格' }}</SuperButton
      >
    </template>
    <h3>按钮、提示与状态</h3>
    <TypographyPrimitivesDemo :size="size" :semantic-style="semanticStyle" />
    <details>
      <summary>查看表单字段与校验示例</summary>
      <TypographyFieldsDemo :size="size" />
    </details>
    <h3>表格与卡片</h3>
    <div class="typography-components__table">
      <SuperTable
        title="任务列表 Tasks"
        :columns="tableColumns"
        :data="rows"
        :total="2"
        :page-size="2"
        :view="view"
        :card="card"
        :config="{ search: false, pageSizes: [2] }"
      />
    </div>
    <SuperFormDialog
      v-model="visible"
      title="编辑任务 Edit task"
      :columns="columns"
      :style="{ ...semanticStyle, ...instanceStyle }"
      @confirm="visible = false"
    />
  </DemoLayout>
</template>

<style scoped>
.typography-components {
  min-width: 0;
}
.typography-components__table {
  height: 420px;
}
</style>
