<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperForm from '@/components/SuperForm/index.vue';
import SuperFormDialog from '@/components/SuperFormDialog/index.vue';
import type {
  SuperFormColumn,
  SuperFormInstance,
} from '@/components/SuperForm/types.ts';

const form = ref<SuperFormInstance>();
const position = ref('top');
const asterisk = ref('right');
const hideAsterisk = ref(false);
const required = ref(true);
const narrow = ref(false);
const dialogVisible = ref(false);
const result = ref('');
const columns = computed<SuperFormColumn[]>(() => [
  {
    prop: 'name',
    label: '名称',
    tips: '请输入名称，点击文案可聚焦输入框',
    formType: 'input',
    rules: { required: required.value, message: '请输入名称' },
  },
  {
    prop: 'code',
    label: '编号',
    formType: 'input',
    rules: [{ required: required.value, message: '请输入编号' }],
  },
  {
    prop: 'description',
    label: '说明',
    tips: '此项始终选填',
    formType: 'input',
  },
  {
    prop: 'long',
    label: '通过表单级规则校验的较长标签文案 LongLabelWithoutSpaces',
    tips: '长标签在窄容器中换行，提示图标保持可见',
    formType: 'input',
  },
  {
    prop: 'unlabelled',
    formType: 'input',
    props: { placeholder: '无标签字段' },
  },
]);
const rules = computed(() => ({
  long: { required: required.value, message: '请输入长标签字段' },
}));

async function validate() {
  result.value = (await form.value?.validate()) ? '校验通过' : '请填写必填字段';
}
const settings: SuperFormColumn[] = [
  {
    prop: 'position',
    label: '标签位置',
    formType: 'select',
    defaultValue: 'top',
    props: {
      options: [
        { label: '顶部', value: 'top' },
        { label: '左对齐', value: 'left' },
        { label: '右对齐', value: 'right' },
      ],
    },
    change: (_, value) => {
      position.value = String(value);
    },
  },
  {
    prop: 'asterisk',
    label: '星号位置',
    formType: 'select',
    defaultValue: 'right',
    props: {
      options: [
        { label: '右侧', value: 'right' },
        { label: '左侧', value: 'left' },
      ],
    },
    change: (_, value) => {
      asterisk.value = String(value);
    },
  },
  {
    prop: 'hide',
    label: '隐藏星号',
    formType: 'switch',
    change: (_, value) => {
      hideAsterisk.value = value === true;
    },
  },
  {
    prop: 'required',
    label: '必填校验',
    formType: 'switch',
    defaultValue: true,
    change: (_, value) => {
      required.value = value === true;
    },
  },
  {
    prop: 'narrow',
    label: '窄容器',
    formType: 'switch',
    change: (_, value) => {
      narrow.value = value === true;
    },
  },
];
</script>

<template>
  <DemoLayout class="form-label-demo" data-demo="form-label">
    <template #controls
      ><SuperForm :columns="settings" inline label-position="top"
    /></template>
    <div
      class="form-label-demo__preview"
      :class="{ 'form-label-demo__preview--narrow': narrow }"
    >
      <SuperForm
        ref="form"
        :columns="columns"
        :rules="rules"
        :label-position="position"
        :label-width="position === 'top' ? undefined : '130px'"
        :hide-required-asterisk="hideAsterisk"
        v-bind="asterisk === 'left' ? { requireAsteriskPosition: 'left' } : {}"
      />
      <div class="demo-row">
        <SuperButton @click="validate">检查必填校验</SuperButton>
        <SuperButton @click="dialogVisible = true">查看表单弹窗</SuperButton>
      </div>
    </div>
    <SuperFormDialog
      v-model="dialogVisible"
      title="表单标签示例"
      :columns="columns.slice(0, 2)"
      @confirm="dialogVisible = false"
    />
    <template v-if="result" #output>{{ result }}</template>
  </DemoLayout>
</template>

<style scoped>
.form-label-demo {
  display: grid;
  gap: 16px;
}
.form-label-demo__preview {
  width: 100%;
  min-width: 0;
}
.form-label-demo__preview--narrow {
  max-width: 280px;
}
</style>
