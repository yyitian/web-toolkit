<script setup lang="ts">
import { ElDialog } from 'element-plus';
import SuperButton from '../SuperButton/index.vue';
import { formatLabel } from '../SuperForm/config.ts';
import type { SuperDialogProps } from '../SuperForm/types.ts';

defineOptions({ inheritAttrs: false });
const visible = defineModel<boolean>();
const props = withDefaults(defineProps<SuperDialogProps>(), {
  title: '',
  footer: true,
  width: 600,
  maxHeight: 600,
  cancel: true,
  confirm: '确认',
});
const emit = defineEmits<{ confirm: [] }>();

const panelStyle = computed(() => ({
  ...(props.height === undefined ? {} : { height: `${props.height}px` }),
  maxHeight: `min(${props.maxHeight}px, calc(100dvh - 32px))`,
}));
const titleText = computed(() => formatLabel(props.title));
const cancelText = computed(() =>
  props.cancel === true
    ? '取消'
    : props.cancel
      ? formatLabel(props.cancel)
      : '',
);
</script>

<template>
  <ElDialog
    v-model="visible"
    :draggable="true"
    :destroy-on-close="true"
    :append-to-body="true"
    v-bind="$attrs"
    class="super-dialog"
    :style="panelStyle"
    :width="width"
  >
    <template #header="headerProps">
      <slot name="header" v-bind="headerProps">
        <span :id="headerProps.titleId" :class="headerProps.titleClass">
          {{ titleText }}
        </span>
      </slot>
    </template>
    <slot />
    <template v-if="footer" #footer>
      <slot name="footer">
        <SuperButton v-if="cancel" @click="visible = false">
          {{ cancelText }}
        </SuperButton>
        <SuperButton type="primary" @click="emit('confirm')">
          {{ formatLabel(confirm) }}
        </SuperButton>
      </slot>
    </template>
  </ElDialog>
</template>

<style lang="scss">
.super-dialog {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;

  > .el-dialog__body {
    min-height: 0;
    overflow: auto;
  }
}
</style>
