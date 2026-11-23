<script setup lang="ts">
import SuperForm from '@/components/SuperForm/index.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import type {
  SuperFormColumn,
  SuperFormInstance,
} from '@/components/SuperForm/types.ts';

defineProps<{ size: 'small' | 'default' | 'large' }>();
const disabled = ref(false);
const form = ref<SuperFormInstance>();
const columns: SuperFormColumn[] = [
  {
    prop: 'required',
    label: '校验与输入计数',
    formType: 'input',
    props: {
      placeholder: '点击下方按钮验证错误排版',
      maxlength: 40,
      showWordLimit: true,
    },
    rules: { required: true, message: '请填写字段，错误色保持独立。' },
  },
  { prop: 'number', label: '数字', formType: 'input-number', defaultValue: 3 },
  {
    prop: 'description',
    label: '多行与计数',
    formType: 'textarea',
    defaultValue: '说明、占位和计数分别保留文字语义。',
    props: { maxlength: 100, showWordLimit: true },
  },
  {
    prop: 'select',
    label: '下拉分组、多选与选中',
    formType: 'select',
    defaultValue: ['one', 'three'],
    props: {
      multiple: true,
      collapseTags: true,
      options: [
        {
          label: '任务分组',
          value: 'group',
          children: [
            { label: '选项一', value: 'one' },
            { label: '禁用选项', value: 'two', disabled: true },
            { label: '选项三', value: 'three' },
          ],
        },
      ],
    },
  },
  {
    prop: 'cascader',
    label: '级联',
    formType: 'cascader',
    props: {
      options: [
        {
          label: '任务',
          value: 'task',
          children: [{ label: '巡检', value: 'check' }],
        },
      ],
    },
  },
  {
    prop: 'date',
    label: '日期时间与密集面板',
    formType: 'date-picker',
    props: { type: 'datetime' },
  },
  {
    prop: 'checkbox',
    label: '勾选',
    formType: 'checkbox',
    props: {
      options: [
        { label: '选项一', value: 'one' },
        { label: '选项二', value: 'two' },
      ],
    },
    defaultValue: ['one'],
  },
  {
    prop: 'radio',
    label: '单选',
    formType: 'radio',
    props: {
      options: [
        { label: '正常', value: 'one' },
        { label: '禁用', value: 'two', disabled: true },
      ],
    },
    defaultValue: 'one',
  },
  {
    prop: 'enabled',
    label: '开关内外文字',
    formType: 'switch',
    defaultValue: false,
    props: { inlinePrompt: false, activeText: '激活', inactiveText: '停用' },
  },
  {
    prop: 'files',
    label: '文件名称与行高',
    formType: 'upload',
    props: { multiple: true },
  },
  {
    prop: 'images',
    label: '图片计数与反色文字',
    formType: 'upload',
    props: { type: 'image', multiple: true },
  },
];
const image = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#5476c2"/><circle cx="48" cy="48" r="24" fill="#ffffff" fill-opacity=".7"/></svg>')}`;
function initialize() {
  form.value?.setFormData({
    files: [
      {
        url: 'data:text/plain,example',
        name: '用于检查长名称截断与行高的示例文件.txt',
        type: 'text/plain',
        size: 7,
      },
    ],
    images: Array.from({ length: 9 }, (_, index) => ({
      id: index,
      url: image,
      name: `图片 ${index + 1}`,
      type: 'image/svg+xml',
      size: 100,
    })),
  });
}
</script>

<template>
  <section class="typography-fields">
    <div class="typography-fields__toolbar">
      <SuperButton :size="size" @click="disabled = !disabled">{{
        disabled ? '启用字段' : '禁用字段'
      }}</SuperButton>
      <SuperButton :size="size" @click="form?.validate()"
        >显示校验反馈</SuperButton
      >
    </div>
    <SuperForm
      ref="form"
      :columns="columns"
      :size="size"
      :disabled="disabled"
      @vue:mounted="initialize"
    />
  </section>
</template>

<style scoped>
.typography-fields {
  min-width: 0;
  overflow-x: auto;
}
.typography-fields__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
