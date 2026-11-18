<script setup lang="ts">
import SuperButton from '@/components/SuperButton/index.vue';
import SuperDialog from '@/components/SuperDialog/index.vue';
import SuperForm from '@/components/SuperForm/index.vue';
import SuperTable from '@/components/SuperTable/index.vue';
import type { SuperFormColumn } from '@/components/SuperForm/types.ts';
import type { SuperTableColumn } from '@/components/SuperTable/types.ts';

const visible = ref(false);
const fields: SuperFormColumn[] = [
  { prop: 'date', label: '日期', formType: 'date-picker' },
  {
    prop: 'choice',
    label: '选择器（空选项）',
    formType: 'select',
    props: { options: [] },
  },
  {
    prop: 'region',
    label: '级联选择',
    formType: 'cascader',
    props: {
      options: [
        {
          label: '浙江',
          value: 'zhejiang',
          children: [{ label: '杭州', value: 'hangzhou' }],
        },
      ],
    },
  },
];
const columns: SuperTableColumn<{ name: string }>[] = [
  { prop: 'name', label: '名称' },
];
const rows = [{ name: '示例记录' }];
</script>

<template>
  <SuperForm :columns="fields" />
  <div class="locale-demo-panel__table">
    <SuperTable
      :columns="columns"
      :data="rows"
      :total="25"
      :config="{ header: false }"
    />
  </div>
  <SuperButton @click="visible = true">查看弹窗</SuperButton>
  <SuperDialog v-model="visible" title="本地化示例" @confirm="visible = false">
    日期浮层、分页和弹窗的内置无障碍文案跟随语言配置，业务文案仍由调用方提供。
  </SuperDialog>
</template>

<style scoped>
.locale-demo-panel__table {
  --wt-table-body-min-height: 80px;
  height: 220px;
  margin-bottom: 16px;
}
</style>
