<script setup lang="ts">
import { ElButton } from 'element-plus';
import DemoLayout from '../DemoLayout.vue';
import SuperForm from '@/components/SuperForm/index.vue';
import type { SuperFormColumn } from '@/components/SuperForm/types.ts';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperTag from '@/components/SuperTag/index.vue';

const roles = [
  { type: 'primary', label: '主色', action: '确认操作' },
  { type: 'success', label: '成功', action: '操作成功' },
  { type: 'warning', label: '警告', action: '查看提醒' },
  { type: 'danger', label: '危险', action: '删除项目' },
  { type: 'info', label: '信息', action: '了解详情' },
] as const;
const appearance = ref('实心');
const disabled = ref(false);
const loading = ref(false);
const settings: SuperFormColumn[] = [
  {
    prop: 'appearance',
    label: '按钮形态',
    formType: 'select',
    defaultValue: '实心',
    props: {
      clearable: false,
      style: { width: '130px' },
      options: ['实心', '描边', '虚线', '文字', '链接'].map((value) => ({
        label: value,
        value,
      })),
    },
    change: (_, value) => {
      appearance.value = String(value);
    },
  },
  {
    prop: 'disabled',
    label: '禁用',
    formType: 'switch',
    defaultValue: false,
    change: (_, value) => {
      disabled.value = value === true;
    },
  },
  {
    prop: 'loading',
    label: '加载',
    formType: 'switch',
    defaultValue: false,
    change: (_, value) => {
      loading.value = value === true;
    },
  },
];
const buttonProps = computed(() => ({
  plain: appearance.value === '描边',
  dashed: appearance.value === '虚线',
  text: appearance.value === '文字',
  link: appearance.value === '链接',
  disabled: disabled.value,
  loading: loading.value,
}));
</script>

<template>
  <DemoLayout class="theme-palette" data-demo="theme-palette">
    <template #controls>
      <SuperForm :columns="settings" inline label-position="top" />
    </template>
    <div class="theme-palette__table">
      <div class="theme-palette__row wt-text-caption" aria-hidden="true">
        <span>语义色</span>
        <span>SuperButton</span>
        <span>Element Plus</span>
        <span>浅底 / 实心 / 描边标签</span>
      </div>
      <div
        v-for="role in roles"
        :key="role.type"
        class="theme-palette__row"
        :data-color-role="role.type"
      >
        <span class="theme-palette__name">
          <i :style="{ background: `var(--wt-color-${role.type})` }" />
          {{ role.label }}
        </span>
        <SuperButton :type="role.type" v-bind="buttonProps">
          {{ role.action }}
        </SuperButton>
        <ElButton :type="role.type" v-bind="buttonProps">原生按钮</ElButton>
        <div class="theme-palette__tags">
          <SuperTag :type="role.type" effect="light">浅底</SuperTag>
          <SuperTag :type="role.type" effect="dark">实心</SuperTag>
          <SuperTag :type="role.type" effect="plain">描边</SuperTag>
        </div>
      </div>
    </div>
  </DemoLayout>
</template>

<style scoped lang="scss">
.theme-palette {
  display: grid;
  gap: 20px;
}
.theme-palette__tags,
.theme-palette__name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.theme-palette__table {
  overflow-x: auto;
}
.theme-palette__row {
  display: grid;
  grid-template-columns: 58px minmax(100px, 1fr) minmax(92px, 1fr) 180px;
  align-items: center;
  gap: 12px;
  min-width: 466px;
  padding: 10px 0;
  border-bottom: 1px solid var(--wt-border-color-light);
  .el-button + .el-button {
    margin-left: 0;
  }
}
.theme-palette__name {
  font-size: var(--wt-font-size-body);
  i {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
}
</style>
