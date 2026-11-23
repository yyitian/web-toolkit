<script setup lang="ts">
import { ElCheckbox, ElInput } from 'element-plus';
import SuperForm from '@/components/SuperForm/index.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperTable from '@/components/SuperTable/index.vue';
import type {
  SuperFormColumn,
  SuperFormInstance,
} from '@/components/SuperForm/types.ts';
import type { SuperTableColumn } from '@/components/SuperTable/types.ts';

const form = ref<SuperFormInstance>();
const formDisabled = ref(false);
const customInput = ref('');
const columns: SuperFormColumn[] = [
  { prop: 'switch', label: '开关', formType: 'switch' },
  { prop: 'checkbox', label: '复选框', formType: 'checkbox' },
  {
    prop: 'group',
    label: '复选组',
    formType: 'checkbox',
    props: {
      options: [
        { label: '普通', value: 'a' },
        { label: '禁用', value: 'b', disabled: true },
      ],
    },
  },
  {
    prop: 'radio',
    label: '单选组',
    formType: 'radio',
    defaultValue: '',
    props: {
      options: [
        { label: '普通', value: 'a' },
        { label: '禁用', value: 'b', disabled: true },
      ],
    },
  },
  {
    prop: 'name',
    label: '必填名称',
    formType: 'input',
    rules: { required: true, message: '请输入名称' },
  },
  { prop: 'custom', label: '自定义插槽', formType: 'slot' },
];
interface Row {
  id: number;
  name: string;
  selectable: boolean;
}
const tableColumns: SuperTableColumn<Row>[] = [
  { prop: 'id', label: '编号', width: 80, fixed: 'left' },
  { prop: 'name', label: '任务名称', width: 500 },
  { prop: 'business', label: '业务插槽', tableType: 'slot', width: 160 },
];
const rows: Row[] = [
  { id: 1, name: '可选择的第一行', selectable: true },
  { id: 2, name: '不可选择的第二行', selectable: false },
  { id: 3, name: '可选择的第三行', selectable: true },
];
const businessChecked = ref(false);
</script>

<template>
  <section data-context="form">
    <h3>表单与自定义字段</h3>
    <div class="form-theme-contexts__actions">
      <SuperButton @click="formDisabled = !formDisabled"
        >切换表单禁用</SuperButton
      >
      <SuperButton @click="form?.validate()">检查校验状态</SuperButton>
    </div>
    <SuperForm
      ref="form"
      :columns="columns"
      :disabled="formDisabled"
      label-width="100px"
    >
      <template #custom
        ><ElInput
          v-model="customInput"
          :disabled="formDisabled"
          placeholder="插槽输入框"
      /></template>
    </SuperForm>
  </section>
  <section data-context="table" class="form-theme-contexts__table">
    <h3>表格选择列</h3>
    <SuperTable
      :columns="tableColumns"
      :data="rows"
      :selection="{ selectable: (row: Row) => row.selectable }"
      :config="{ search: false, header: false, pagination: false }"
    >
      <template #column-business
        ><ElCheckbox v-model="businessChecked">原生控件</ElCheckbox></template
      >
    </SuperTable>
  </section>
</template>

<style scoped>
.form-theme-contexts__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.form-theme-contexts__table {
  --wt-table-body-min-height: 150px;
}
.form-theme-contexts__table .super-table {
  height: 200px;
}
</style>
