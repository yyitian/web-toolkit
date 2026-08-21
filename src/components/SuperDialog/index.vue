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
  --_wt-dialog-bg: var(--el-dialog-bg-color);

  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  color: var(
    --wt-dialog-color,
    var(--wt-text-regular, var(--el-text-color-regular))
  );
  background: var(--wt-dialog-bg, var(--_wt-dialog-bg));
  border: 1px solid
    var(--wt-dialog-border-color, var(--wt-border-color-light, transparent));
  border-radius: var(
    --wt-dialog-radius,
    var(--el-dialog-border-radius, var(--wt-radius-base, 4px))
  );
  box-shadow: var(
    --wt-dialog-shadow,
    var(--wt-shadow-overlay, var(--el-dialog-box-shadow))
  );
  backdrop-filter: var(
    --wt-dialog-backdrop-filter,
    var(--wt-backdrop-filter, none)
  );

  > .el-dialog__header {
    color: var(--wt-dialog-header-color, var(--wt-text-primary, inherit));
  }

  > .el-dialog__body {
    min-height: 0;
    color: var(
      --wt-dialog-body-color,
      var(--wt-dialog-color, var(--wt-text-regular))
    );
    overflow: auto;
  }

  > .el-dialog__footer {
    border-top: 1px solid var(--wt-dialog-footer-border-color, transparent);
  }
}

:where(:root[data-wt-material='glass']) .super-dialog {
  --_wt-dialog-bg:
    radial-gradient(
      circle at 20% 0%,
      var(--wt-glass-highlight),
      transparent 34%
    ),
    var(--wt-surface-overlay);
}
</style>
