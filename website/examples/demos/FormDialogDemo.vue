<script setup lang="ts">
import { ElMessage } from 'element-plus';
import type { SuperFormColumn } from '@/components/SuperForm/types.ts';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperFormDialog from '@/components/SuperFormDialog/index.vue';

const visible = ref(false);
const loading = ref(false);
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

function save() {
  loading.value = true;
  window.setTimeout(() => {
    loading.value = false;
    visible.value = false;
    ElMessage.success('模拟保存完成');
  }, 800);
}
</script>

<template>
  <SuperButton type="primary" @click="visible = true">编辑配置</SuperButton>
  <SuperFormDialog
    v-model="visible"
    title="编辑配置"
    :columns="columns"
    :form-data="{ name: '示例配置', type: 'normal' }"
    :loading="loading"
    @confirm="save"
  />
</template>
