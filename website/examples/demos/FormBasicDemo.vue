<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperForm from '@/components/SuperForm/index.vue';
import type {
  SuperFormColumn,
  SuperFormInstance,
} from '@/components/SuperForm/types.ts';

const form = ref<SuperFormInstance>();
const result = ref('');
const columns: SuperFormColumn[] = [
  {
    prop: 'name',
    label: '名称',
    formType: 'input',
    rules: { required: true, message: '请输入名称' },
  },
  {
    prop: 'type',
    label: '类型',
    formType: 'select',
    props: {
      options: [
        { label: '普通', value: 'normal' },
        { label: '高级', value: 'advanced' },
      ],
    },
  },
];
function submit(data: Record<string, unknown>) {
  result.value = JSON.stringify(data, null, 2);
}
</script>

<template>
  <DemoLayout data-demo="form-basic">
    <SuperForm ref="form" :columns="columns" @submit="submit" />
    <SuperButton type="primary" @click="form?.submit()">提交表单</SuperButton>
    <template v-if="result" #output>
      <pre>{{ result }}</pre>
    </template>
  </DemoLayout>
</template>
