<script setup lang="ts">
import SuperForm from '@/components/SuperForm/index.vue';
import type { SuperFormColumn } from '@/components/SuperForm/types.ts';

const states = [
  { label: '未选中', checked: false, disabled: false, indeterminate: false },
  { label: '选中', checked: true, disabled: false, indeterminate: false },
  { label: '禁用未选中', checked: false, disabled: true, indeterminate: false },
  { label: '禁用选中', checked: true, disabled: true, indeterminate: false },
  { label: '半选', checked: false, disabled: false, indeterminate: true },
  { label: '禁用半选', checked: false, disabled: true, indeterminate: true },
];
const columns: SuperFormColumn[][] = states.map((state) => [
  {
    prop: 'enabled',
    label: '开关',
    formType: 'switch',
    defaultValue: state.checked,
    props: { disabled: state.disabled },
  },
  {
    prop: 'checked',
    label: '复选框',
    formType: 'checkbox',
    defaultValue: state.checked,
    props: { disabled: state.disabled, indeterminate: state.indeterminate },
  },
  {
    prop: 'radio',
    label: '单选',
    formType: 'radio',
    defaultValue: state.checked ? 'a' : '',
    props: {
      disabled: state.disabled,
      options: [{ label: '选项一', value: 'a' }],
    },
  },
]);
</script>

<template>
  <section data-context="field-states">
    <h3>选中与禁用状态</h3>
    <div class="form-theme-fields__choices">
      <div
        v-for="(state, index) in states"
        :key="state.label"
        :data-state="state.label"
      >
        <h4>{{ state.label }}</h4>
        <SuperForm
          :columns="columns[index]"
          :disabled="state.disabled"
          label-position="top"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.form-theme-fields__choices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: 16px;
}
.form-theme-fields__choices > div {
  min-width: 0;
}
</style>
