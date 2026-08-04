<script setup lang="ts">
import { ElRadio, ElRadioGroup } from 'element-plus';
import type { SuperFormOption } from '../types.ts';
withDefaults(defineProps<{ options?: SuperFormOption[] }>(), {
  options: () => [],
});
defineOptions({ inheritAttrs: false });
function optionValue(value: unknown) {
  return value as string | number | boolean;
}
</script>
<template>
  <ElRadioGroup v-bind="$attrs">
    <ElRadio
      v-for="option in options"
      :key="String(option.value)"
      :value="optionValue(option.value)"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </ElRadio>
  </ElRadioGroup>
</template>
