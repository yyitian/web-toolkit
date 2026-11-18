<script setup lang="ts">
import { ElSwitch } from 'element-plus';
defineOptions({ inheritAttrs: false });
</script>
<template>
  <ElSwitch
    class="super-form-switch"
    v-bind="{ inlinePrompt: true, ...$attrs }"
  />
</template>

<style lang="scss">
@use '../control-theme' as controls;

.super-form-switch {
  @include controls.switch;
}
</style>
