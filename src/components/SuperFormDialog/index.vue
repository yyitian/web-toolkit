<script setup lang="ts">
import SuperButton from '../SuperButton/index.vue';
import SuperDialog from '../SuperDialog/index.vue';
import SuperForm from '../SuperForm/index.vue';
import { formatLabel } from '../SuperForm/config.ts';
import type {
  SuperFormDialogProps,
  SuperFormInstance,
} from '../SuperForm/types.ts';

defineOptions({ inheritAttrs: false });
const visible = defineModel<boolean>();
const props = withDefaults(defineProps<SuperFormDialogProps>(), {
  formData: () => ({}),
  columns: () => [],
  disabled: false,
  width: 480,
  loading: false,
});
const emit = defineEmits<{
  'form:mounted': [];
  confirm: [formData: Record<string, unknown>];
}>();
const slots = useSlots();
const form = ref<SuperFormInstance>();
const formDisabled = computed(() => props.disabled || props.loading);
const confirmText = computed(() =>
  props.confirm === undefined
    ? props.disabled
      ? '关闭'
      : '保存'
    : formatLabel(props.confirm),
);
const formSlotNames = computed(() =>
  Object.keys(slots).filter((name) => !['header', 'footer'].includes(name)),
);

function handleFormMounted() {
  emit('form:mounted');
  form.value?.setFormData(props.formData);
}

function handleSubmit(data: Record<string, unknown>) {
  emit('confirm', data);
}

function handleConfirm() {
  if (props.disabled) {
    visible.value = false;
    return;
  }
  void form.value?.submit();
}

function getFormData() {
  return form.value?.getFormData() ?? {};
}
function setFormData(data: Record<string, unknown>) {
  form.value?.setFormData(data);
}
async function validate() {
  return (await form.value?.validate()) ?? false;
}
async function submit() {
  await form.value?.submit();
}
const elForm = computed(() => form.value?.elForm);

defineExpose({ getFormData, setFormData, validate, submit, elForm });
</script>

<template>
  <SuperDialog
    v-model="visible"
    :close-on-click-modal="false"
    v-bind="$attrs"
    class="super-form-dialog"
    :title="title"
    :width="width"
    :cancel="false"
  >
    <template v-if="$slots.header" #header="headerProps">
      <slot name="header" v-bind="headerProps" />
    </template>

    <SuperForm
      ref="form"
      :columns="columns"
      :disabled="formDisabled"
      @vue:mounted="handleFormMounted"
      @submit="handleSubmit"
    >
      <template v-for="name in formSlotNames" #[name]>
        <slot :name="name" />
      </template>
    </SuperForm>

    <template #footer>
      <slot name="footer">
        <SuperButton
          type="primary"
          :loading="!disabled && loading"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </SuperButton>
      </slot>
    </template>
  </SuperDialog>
</template>
