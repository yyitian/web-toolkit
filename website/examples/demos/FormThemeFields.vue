<script setup lang="ts">
import { ElFormItem } from 'element-plus';
import SuperFormInput from '@/components/SuperForm/fields/SuperFormInput.vue';
import SuperFormTextarea from '@/components/SuperForm/fields/SuperFormTextarea.vue';
import SuperFormInputNumber from '@/components/SuperForm/fields/SuperFormInputNumber.vue';
import SuperFormSelect from '@/components/SuperForm/fields/SuperFormSelect.vue';
import SuperFormCascader from '@/components/SuperForm/fields/SuperFormCascader.vue';
import SuperFormDatePicker from '@/components/SuperForm/fields/SuperFormDatePicker.vue';
import SuperFormCheckbox from '@/components/SuperForm/fields/SuperFormCheckbox.vue';
import SuperFormRadio from '@/components/SuperForm/fields/SuperFormRadio.vue';
import SuperFormSwitch from '@/components/SuperForm/fields/SuperFormSwitch.vue';
import SuperFormUpload from '@/components/SuperForm/fields/SuperFormUpload.vue';

const states = reactive([
  {
    label: '未选中',
    checked: false,
    disabled: false,
    indeterminate: false,
    radio: '',
  },
  {
    label: '选中',
    checked: true,
    disabled: false,
    indeterminate: false,
    radio: 'a',
  },
  {
    label: '禁用未选中',
    checked: false,
    disabled: true,
    indeterminate: false,
    radio: '',
  },
  {
    label: '禁用选中',
    checked: true,
    disabled: true,
    indeterminate: false,
    radio: 'a',
  },
  {
    label: '半选',
    checked: false,
    disabled: false,
    indeterminate: true,
    radio: '',
  },
  {
    label: '禁用半选',
    checked: false,
    disabled: true,
    indeterminate: true,
    radio: '',
  },
]);
const disabled = ref(false);
const input = ref('');
const textarea = ref('');
const count = ref(1);
const select = ref('');
const cascade = ref([]);
const date = ref('');
const range = ref([]);
const options = [
  { label: '选项一', value: 'a' },
  { label: '禁用选项', value: 'b', disabled: true },
];
const tree = [
  {
    label: '浙江',
    value: 'zhejiang',
    children: [{ label: '杭州', value: 'hangzhou' }],
  },
];
</script>

<template>
  <section data-context="standalone">
    <h3>直接使用子组件</h3>
    <div class="form-theme-fields__choices">
      <div
        v-for="state in states"
        :key="state.label"
        class="form-theme-fields__choice"
        :data-state="state.label"
      >
        <span>{{ state.label }}</span>
        <SuperFormSwitch
          v-model="state.checked"
          :disabled="state.disabled"
          :aria-label="`${state.label}开关`"
        />
        <SuperFormCheckbox
          v-model="state.checked"
          :disabled="state.disabled"
          :indeterminate="state.indeterminate"
          :aria-label="`${state.label}复选框`"
        />
        <SuperFormRadio
          v-model="state.radio"
          :options="[{ label: '单选', value: 'a' }]"
          :disabled="state.disabled"
        />
      </div>
    </div>
    <label class="form-theme-fields__toggle"
      ><SuperFormSwitch v-model="disabled" aria-label="禁用其他子组件" />
      禁用其他子组件</label
    >
    <div class="form-theme-fields__inputs">
      <label
        >输入框<SuperFormInput
          v-model="input"
          :disabled="disabled"
          placeholder="请输入内容"
          aria-label="独立输入框"
      /></label>
      <label
        >文本域<SuperFormTextarea
          v-model="textarea"
          :disabled="disabled"
          placeholder="请输入说明"
          aria-label="独立文本域"
      /></label>
      <label
        >数字<SuperFormInputNumber
          v-model="count"
          :disabled="disabled"
          aria-label="独立数字"
      /></label>
      <label
        >选择器<SuperFormSelect
          v-model="select"
          :options="options"
          :disabled="disabled"
          aria-label="独立选择器"
      /></label>
      <label
        >级联<SuperFormCascader
          v-model="cascade"
          :options="tree"
          :disabled="disabled"
          aria-label="独立级联"
      /></label>
      <label
        >日期<SuperFormDatePicker
          v-model="date"
          :disabled="disabled"
          aria-label="独立日期"
      /></label>
      <label class="form-theme-fields__range"
        >日期范围<SuperFormDatePicker
          v-model="range"
          type="daterange"
          :disabled="disabled"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
      /></label>
      <ElFormItem label="独立校验" error="校验错误样式">
        <SuperFormInput :disabled="disabled" placeholder="独立校验字段" />
      </ElFormItem>
      <label>文件上传<SuperFormUpload :disabled="disabled" /></label>
      <label
        >图片上传<SuperFormUpload type="image" :disabled="disabled"
      /></label>
    </div>
  </section>
</template>

<style scoped>
.form-theme-fields__choices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.form-theme-fields__choice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border: 1px solid var(--wt-border-color);
  border-radius: 4px;
}
.form-theme-fields__choice > span {
  width: 100%;
}
.form-theme-fields__toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0 8px;
}
.form-theme-fields__inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 16px;
}
.form-theme-fields__inputs > label {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
}
.form-theme-fields__range {
  grid-column: 1 / -1;
}
</style>
