<script setup lang="ts">
import { ElInput } from 'element-plus';
defineOptions({ inheritAttrs: false });
</script>
<template>
  <ElInput
    class="super-form-textarea"
    v-bind="{
      type: 'textarea',
      resize: 'none',
      autosize: { minRows: 2, maxRows: 4 },
      ...$attrs,
    }"
  />
</template>

<style lang="scss">
@use '../control-theme' as controls;

.super-form-textarea {
  @include controls.text('.super-form-textarea');
}
</style>
