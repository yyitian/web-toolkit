<script setup lang="ts">
import { CircleHelp } from '@lucide/vue';
import { cloneDeep } from 'es-toolkit';
import { ElForm, ElFormItem } from 'element-plus';
import type { FormInstance } from 'element-plus';
import type { Component } from 'vue';
import SuperIcon from '../SuperIcon/index.vue';
import { formatLabel, formatOptions } from './config.ts';
import SuperFormCheckbox from './fields/SuperFormCheckbox.vue';
import SuperFormDatePicker from './fields/SuperFormDatePicker.vue';
import SuperFormInput from './fields/SuperFormInput.vue';
import SuperFormInputNumber from './fields/SuperFormInputNumber.vue';
import SuperFormRadio from './fields/SuperFormRadio.vue';
import SuperFormSelect from './fields/SuperFormSelect.vue';
import SuperFormSwitch from './fields/SuperFormSwitch.vue';
import SuperFormTextarea from './fields/SuperFormTextarea.vue';
import SuperFormUpload from './fields/SuperFormUpload.vue';
import type { SuperFormColumn, SuperFormProps } from './types.ts';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SuperFormProps>(), {
  columns: () => [],
  disabled: false,
});
const emit = defineEmits<{
  submit: [formData: Record<string, unknown>];
}>();
const attrs = useAttrs();
const slots = useSlots();
const formData = reactive<Record<string, unknown>>({});
const elForm = ref<FormInstance>();

const fieldComponents = {
  input: SuperFormInput,
  textarea: SuperFormTextarea,
  'input-number': SuperFormInputNumber,
  radio: SuperFormRadio,
  select: SuperFormSelect,
  checkbox: SuperFormCheckbox,
  switch: SuperFormSwitch,
  'date-picker': SuperFormDatePicker,
  upload: SuperFormUpload,
};

function hasDefaultValue(column: SuperFormColumn) {
  return Reflect.has(column, 'defaultValue');
}

function getDefaultValue(column: SuperFormColumn): unknown {
  if (hasDefaultValue(column)) return cloneDeep(column.defaultValue);
  const fieldProps: Record<string, unknown> =
    column.formType === 'slot' || column.formType === 'custom'
      ? {}
      : ((column.props ?? {}) as Record<string, unknown>);
  switch (column.formType) {
    case 'input':
    case 'textarea':
      return '';
    case 'input-number':
      return 0;
    case 'radio':
      return (fieldProps.options as Array<{ value: unknown }> | undefined)?.[0]
        ?.value;
    case 'select':
      return fieldProps.multiple ? [] : '';
    case 'checkbox':
      return fieldProps.options ? [] : false;
    case 'switch':
      return fieldProps.inactiveValue ?? false;
    case 'date-picker': {
      const type = String(fieldProps.type ?? 'date');
      return type.includes('range') || type.includes('s') ? [] : '';
    }
    case 'upload':
      return fieldProps.multiple ? [] : null;
    case 'custom':
      return undefined;
    case 'slot':
      return undefined;
  }
}

function initializeField(column: SuperFormColumn) {
  if (column.formType !== 'slot') {
    formData[column.prop] = getDefaultValue(column);
  }
}

props.columns.forEach(initializeField);

const visibility = new Map<string, boolean>();
watchEffect(() => {
  for (const column of props.columns) {
    const visible = column.show?.(formData) !== false;
    const wasVisible = visibility.get(column.prop);
    visibility.set(column.prop, visible);
    if (column.formType !== 'upload' || column.props.upload) continue;
    if (!visible && wasVisible !== false) delete formData[column.prop];
    if (visible && !Reflect.has(formData, column.prop)) initializeField(column);
  }
});

function getFormData(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const column of props.columns) {
    if (column.formType === 'slot' || column.show?.(formData) === false)
      continue;
    const value = formData[column.prop];
    if (value !== undefined) result[column.prop] = value;
  }
  return cloneDeep(result);
}

function setFormData(data: Record<string, unknown>) {
  for (const column of props.columns) {
    if (column.formType === 'slot' || !Reflect.has(data, column.prop)) continue;
    const value = data[column.prop];
    formData[column.prop] =
      value === null || value === undefined
        ? getDefaultValue(column)
        : cloneDeep(value);
    if (
      column.formType === 'upload' &&
      !column.props.upload &&
      column.show?.(formData) === false
    ) {
      delete formData[column.prop];
    }
  }
  elForm.value?.clearValidate();
}

async function validate(): Promise<boolean> {
  if (!elForm.value) return false;
  try {
    return await elForm.value.validate();
  } catch {
    return false;
  }
}

async function submit(): Promise<void> {
  if (props.disabled || !(await validate())) return;
  emit('submit', getFormData());
}

function controlledFieldProps(column: SuperFormColumn) {
  if (column.formType === 'slot' || column.formType === 'custom') return {};
  const source = column.props ?? {};
  return Object.fromEntries(
    Object.entries(source).filter(
      ([key]) =>
        ![
          'modelValue',
          'onUpdate:modelValue',
          'onChange',
          'ref',
          'key',
        ].includes(key),
    ),
  );
}

function fieldSlots(column: SuperFormColumn) {
  if (
    column.formType === 'slot' ||
    column.formType === 'custom' ||
    !column.slots
  ) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(column.slots).flatMap(([name, slot]) => {
      const resolved = typeof slot === 'string' ? slots[slot] : slot;
      return resolved ? [[name, resolved]] : [];
    }),
  );
}

function updateField(column: SuperFormColumn, value: unknown) {
  formData[column.prop] = value;
}

function invokeChange(column: SuperFormColumn, value: unknown) {
  const change = column.change as
    | ((data: Record<string, unknown>, nextValue: unknown) => void)
    | undefined;
  change?.(formData, value);
}

function renderLabel(column: SuperFormColumn) {
  if (column.label === undefined) return undefined;
  const children: ReturnType<typeof h>[] = [
    h('span', String(formatLabel(column.label))),
  ];
  if (column.tips !== undefined) {
    children.push(
      h(SuperIcon, {
        icon: CircleHelp,
        size: 14,
        title: String(formatLabel(column.tips)),
      }),
    );
  }
  return h('span', { class: 'super-form__label' }, children);
}

function renderField(column: SuperFormColumn) {
  if (column.formType === 'slot') return slots[column.prop]?.();
  if (column.formType === 'custom') {
    return h(column.component, {
      modelValue: formData[column.prop],
      disabled: props.disabled,
      'onUpdate:modelValue': (value: unknown) => updateField(column, value),
    });
  }
  const component: Component = fieldComponents[column.formType];
  const fieldProps = controlledFieldProps(column);
  if ('options' in fieldProps) {
    fieldProps.options = formatOptions(fieldProps.options as never[]);
  }
  return h(
    component,
    {
      ...fieldProps,
      modelValue: formData[column.prop],
      disabled: props.disabled,
      'onUpdate:modelValue': (value: unknown) => {
        updateField(column, value);
        if (column.formType === 'upload') invokeChange(column, value);
      },
      ...(column.formType === 'upload'
        ? {}
        : { onChange: (value: unknown) => invokeChange(column, value) }),
    } as Record<string, unknown>,
    fieldSlots(column),
  );
}

function renderForm() {
  return h(
    ElForm,
    {
      labelPosition: 'top',
      statusIcon: true,
      scrollToError: true,
      requireAsteriskPosition: 'right',
      ...attrs,
      ref: elForm,
      class: ['super-form', attrs.class],
      model: formData,
      disabled: props.disabled,
      onSubmit: (event: Event) => {
        event.preventDefault();
        void submit();
      },
      onKeydown: (event: KeyboardEvent) => {
        const target = event.target as HTMLInputElement;
        if (
          event.key === 'Enter' &&
          !event.isComposing &&
          target.tagName === 'INPUT' &&
          target.type !== 'file'
        ) {
          event.preventDefault();
          void submit();
        }
      },
    },
    {
      default: () =>
        props.columns
          .filter((column) => column.show?.(formData) !== false)
          .map((column) =>
            h(
              ElFormItem,
              {
                key: column.prop,
                prop: column.prop,
                rules: column.rules,
                class: column.class,
              },
              {
                ...(column.label === undefined
                  ? {}
                  : { label: () => renderLabel(column) }),
                default: () => renderField(column),
              },
            ),
          ),
    },
  );
}

defineExpose({ getFormData, setFormData, validate, submit, elForm });
</script>

<template><Component :is="renderForm" /></template>

<style lang="scss" scoped>
.super-form__label {
  @include flex-align-center(6px);
}
</style>
