<script setup lang="ts">
import { ElCheckbox } from 'element-plus';
defineProps<{
  checked: boolean;
  disabled?: boolean;
  label: string;
}>();
const emit = defineEmits<{ change: [checked: boolean] }>();
</script>
<template>
  <ElCheckbox
    class="super-carousel__checkbox"
    :model-value="checked"
    :disabled="disabled"
    :aria-label="label"
    @click.stop
    @change="emit('change', Boolean($event))"
  />
</template>
<style lang="scss">
@use '../SuperForm/control-theme' as controls;
.super-carousel__checkbox {
  @include controls.checkbox;
  margin: 0;
}

// 提亮暗色未选中填充，避免直接使用近黑面板色；选中与禁用仍由原生状态控制。
:where(:root[data-wt-scheme='dark']) .super-carousel__checkbox.el-checkbox {
  --el-checkbox-bg-color: var(--wt-form-control-bg, var(--el-fill-color-dark));
}
</style>
