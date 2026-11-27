<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import { ElInput } from 'element-plus';
import type {
  SuperFormColumn,
  SuperFormInstance,
  SuperFormOption,
  SuperUploadRequest,
} from '@/components/SuperForm/types.ts';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperForm from '@/components/SuperForm/index.vue';

const CustomField = defineComponent({
  props: { modelValue: { type: String, default: '' }, disabled: Boolean },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h(ElInput, {
        modelValue: props.modelValue,
        disabled: props.disabled,
        placeholder: '自定义组件',
        'onUpdate:modelValue': (value: string) =>
          emit('update:modelValue', value),
      });
  },
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const remoteUpload: SuperUploadRequest = async (files) => {
  await new Promise((resolve) => window.setTimeout(resolve, 500));
  return Promise.all(
    files.map(async (file, index) => ({
      id: `${Date.now()}-${index}`,
      url: await fileToDataUrl(file),
      name: file.name,
      type: file.type,
      size: file.size,
    })),
  );
};

const regionOptions: SuperFormOption[] = [
  {
    value: 'zhejiang',
    label: '浙江',
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
const columns: SuperFormColumn[] = [
  {
    prop: 'name',
    label: '名称',
    tips: '支持 Enter 提交',
    formType: 'input',
    rules: { required: true, message: '请输入名称' },
    props: { placeholder: '请输入名称' },
  },
  { prop: 'description', label: '说明', formType: 'textarea' },
  { prop: 'count', label: '数量', formType: 'input-number' },
  {
    prop: 'kind',
    label: '类型',
    formType: 'radio',
    props: {
      options: [
        { label: '普通', value: 'normal' },
        { label: '高级', value: 'advanced' },
      ],
    },
  },
  {
    prop: 'region',
    label: '区域',
    formType: 'select',
    props: {
      options: [
        { label: '华东', value: 'east' },
        { label: '华南', value: 'south' },
      ],
    },
  },
  {
    prop: 'location',
    label: '所在地区',
    formType: 'cascader',
    rules: { required: true, message: '请选择所在地区', trigger: 'change' },
    props: { options: regionOptions, placeholder: '请选择省市' },
  },
  {
    prop: 'cities',
    label: '服务城市',
    formType: 'cascader',
    props: {
      options: regionOptions,
      props: { multiple: true, emitPath: false },
      collapseTags: true,
      collapseTagsTooltip: true,
    },
  },
  {
    prop: 'features',
    label: '能力',
    formType: 'checkbox',
    props: {
      options: [
        { label: '审计', value: 'audit' },
        { label: '通知', value: 'notice' },
      ],
    },
  },
  { prop: 'enabled', label: '启用', formType: 'switch' },
  { prop: 'date', label: '日期', formType: 'date-picker' },
  {
    prop: 'advancedName',
    label: '高级名称',
    formType: 'input',
    show: (data) => data.kind === 'advanced',
  },
  {
    prop: 'custom',
    label: '自定义字段',
    formType: 'custom',
    component: CustomField,
  },
  { prop: 'notice', label: '说明区域', formType: 'slot' },
  {
    prop: 'localFiles',
    label: '本地文件',
    formType: 'upload',
    props: { multiple: true, limit: 3 },
  },
  {
    prop: 'remoteImages',
    label: '模拟上传图片',
    formType: 'upload',
    props: { type: 'image', multiple: true, limit: 6, upload: remoteUpload },
  },
];

const form = ref<SuperFormInstance>();
const output = ref('尚未提交');

function submit(data: Record<string, unknown>) {
  output.value = JSON.stringify(
    data,
    (_key, value) => (value instanceof File ? `File(${value.name})` : value),
    2,
  );
}
</script>

<template>
  <DemoLayout data-demo="form-comprehensive">
    <p class="wt-text-caption">
      演示使用本地数据；图片上传仅模拟延迟，不发送文件到服务端。
    </p>
    <SuperForm ref="form" :columns="columns" @submit="submit">
      <template #notice>slot 字段不会进入最终表单数据。</template>
    </SuperForm>
    <SuperButton type="primary" @click="form?.submit()">提交表单</SuperButton>
    <template #output>
      <pre>{{ output }}</pre>
    </template>
  </DemoLayout>
</template>
