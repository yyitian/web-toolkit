<script setup lang="ts">
import SuperButton from '@/components/SuperButton/index.vue';
import SuperForm from '@/components/SuperForm/index.vue';
import type {
  SuperFormColumn,
  SuperFormInstance,
  SuperFormOption,
} from '@/components/SuperForm/types.ts';

const options: SuperFormOption[] = [
  {
    value: 'zhejiang',
    label: () => '浙江',
    children: [
      { value: 'hangzhou', label: '杭州' },
      { value: 'ningbo', label: '宁波' },
      { value: 'wenzhou', label: '温州（禁用）', disabled: true },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    children: [
      { value: 'nanjing', label: '南京' },
      { value: 'suzhou', label: '苏州' },
    ],
  },
];
const changeOutput = ref('尚未变化');
const columns: SuperFormColumn[] = [
  {
    prop: 'region',
    label: '所在地区（路径单选）',
    formType: 'cascader',
    rules: { required: true, message: '请选择所在地区', trigger: 'change' },
    props: { options, placeholder: '请选择省市' },
    change: (data, value) => {
      changeOutput.value = JSON.stringify({ value, region: data.region });
    },
  },
  {
    prop: 'cities',
    label: '服务城市（多选末级值）',
    formType: 'cascader',
    props: {
      options,
      props: { multiple: true, emitPath: false },
      collapseTags: true,
      collapseTagsTooltip: true,
    },
  },
];
const form = ref<SuperFormInstance>();
const output = ref('尚未提交');

function fill() {
  form.value?.setFormData({
    region: ['zhejiang', 'hangzhou'],
    cities: ['hangzhou', 'suzhou'],
  });
}
</script>

<template>
  <SuperForm
    ref="form"
    :columns="columns"
    @submit="output = JSON.stringify($event, null, 2)"
  />
  <div class="demo-row">
    <SuperButton @click="fill">回填示例</SuperButton>
    <SuperButton @click="form?.setFormData({ region: null, cities: null })">
      重置字段
    </SuperButton>
    <SuperButton type="primary" @click="form?.submit()"
      >提交级联表单</SuperButton
    >
  </div>
  <p>最近变化：{{ changeOutput }}</p>
  <pre class="demo-output">{{ output }}</pre>
</template>
