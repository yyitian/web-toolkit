<script setup lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElMessage } from 'element-plus';
import SuperDialog from '@/components/SuperDialog/index.vue';
import SuperForm from '@/components/SuperForm/index.vue';
import SuperFormDialog from '@/components/SuperFormDialog/index.vue';
import type {
  SuperFormColumn,
  SuperFormInstance,
  SuperUploadRequest,
} from '@/components/SuperForm/types.ts';

const CustomField = defineComponent({
  props: {
    modelValue: { type: String, default: '' },
    disabled: Boolean,
  },
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

const remoteUpload: SuperUploadRequest = async (files) => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return files.map((file, index) => ({
    id: `${Date.now()}-${index}`,
    url: URL.createObjectURL(file),
    name: file.name,
    type: file.type,
    size: file.size,
  }));
};

const columns: SuperFormColumn[] = [
  {
    prop: 'name',
    label: '名称',
    tips: () => '支持动态文案和 Enter 提交',
    formType: 'input',
    rules: { required: true, message: '请输入名称' },
    props: { placeholder: '请输入名称' },
  },
  {
    prop: 'description',
    label: '说明',
    formType: 'textarea',
    props: { placeholder: 'Enter 在这里保持换行' },
  },
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
  { prop: 'showExtra', label: '显示联动字段', formType: 'switch' },
  {
    prop: 'extra',
    label: '联动字段',
    formType: 'input',
    show: (data) => data.showExtra === true,
  },
  {
    prop: 'date',
    label: '日期',
    formType: 'date-picker',
    props: { type: 'daterange' },
  },
  {
    prop: 'custom',
    label: '自定义字段',
    formType: 'custom',
    component: CustomField,
  },
  { prop: 'notice', label: 'Slot 字段', formType: 'slot' },
  {
    prop: 'localFiles',
    label: '本地多文件',
    formType: 'upload',
    props: { multiple: true, limit: 5 },
  },
  {
    prop: 'remoteImages',
    label: '远程图片',
    formType: 'upload',
    props: { type: 'image', multiple: true, limit: 12, upload: remoteUpload },
  },
];

const form = ref<SuperFormInstance>();
const dialogVisible = ref(false);
const fixedDialogVisible = ref(false);
const formDialogVisible = ref(false);
const readonlyDialogVisible = ref(false);
const saving = ref(false);
const output = ref('尚未提交');

function stringify(data: Record<string, unknown>) {
  return JSON.stringify(
    data,
    (_key, value) => (value instanceof File ? `File(${value.name})` : value),
    2,
  );
}

function handleSubmit(data: Record<string, unknown>) {
  output.value = stringify(data);
}

function handleDialogConfirm(data: Record<string, unknown>) {
  saving.value = true;
  output.value = stringify(data);
  setTimeout(() => {
    saving.value = false;
    formDialogVisible.value = false;
    ElMessage.success('模拟保存完成');
  }, 800);
}
</script>

<template>
  <section class="form-demo">
    <h2>SuperForm / SuperDialog / SuperFormDialog</h2>
    <div class="form-demo__actions">
      <button @click="dialogVisible = true">默认 Dialog</button>
      <button @click="fixedDialogVisible = true">固定高度 Dialog</button>
      <button @click="formDialogVisible = true">新增 / 编辑</button>
      <button @click="readonlyDialogVisible = true">只读</button>
    </div>

    <SuperForm ref="form" :columns="columns" @submit="handleSubmit">
      <template #notice><span>这是不进入表单数据的 slot 内容。</span></template>
    </SuperForm>
    <button @click="form?.submit()">提交独立表单</button>
    <pre>{{ output }}</pre>

    <SuperDialog
      v-model="dialogVisible"
      title="默认弹窗"
      @confirm="dialogVisible = false"
    >
      内容随高度自然增长，达到 maxHeight 后 body 滚动。
    </SuperDialog>
    <SuperDialog
      v-model="fixedDialogVisible"
      title="固定高度弹窗"
      :height="420"
      :max-height="520"
      @confirm="fixedDialogVisible = false"
    >
      <p v-for="index in 30" :key="index">滚动内容 {{ index }}</p>
    </SuperDialog>
    <SuperFormDialog
      v-model="formDialogVisible"
      title="编辑配置"
      :columns="columns"
      :form-data="{ name: '已有名称', kind: 'normal' }"
      :loading="saving"
      @confirm="handleDialogConfirm"
    >
      <template #notice>Dialog 内的 slot 字段</template>
    </SuperFormDialog>
    <SuperFormDialog
      v-model="readonlyDialogVisible"
      title="查看配置"
      :columns="columns.slice(0, 5)"
      :form-data="{ name: '只读数据', kind: 'advanced', count: 2 }"
      disabled
    />
  </section>
</template>

<style scoped>
.form-demo {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}
.form-demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
button {
  padding: 7px 12px;
  cursor: pointer;
}
pre {
  overflow: auto;
  padding: 12px;
  background: #f6f8fa;
}
</style>
