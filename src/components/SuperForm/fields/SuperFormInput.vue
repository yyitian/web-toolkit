<script setup lang="ts">
import { ElInput } from 'element-plus';
defineOptions({ inheritAttrs: false });
</script>
<template>
  <ElInput class="super-form-input" v-bind="{ clearable: true, ...$attrs }" />
</template>

<style lang="scss">
@use '../control-theme' as controls;

.super-form-input {
  @include controls.text('.super-form-input');
}
</style>
