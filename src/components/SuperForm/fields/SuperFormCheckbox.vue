<script setup lang="ts">
import { ElCheckbox, ElCheckboxGroup } from 'element-plus';
import type { SuperFormOption } from '../types.ts';
withDefaults(defineProps<{ options?: SuperFormOption[] }>(), {
  options: () => [],
});
defineOptions({ inheritAttrs: false });
function optionValue(value: unknown) {
  return value as string | number | boolean | object;
}
</script>
<template>
  <ElCheckboxGroup v-if="options.length" v-bind="$attrs">
    <ElCheckbox
      v-for="option in options"
      :key="String(option.value)"
      :value="optionValue(option.value)"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </ElCheckbox>
  </ElCheckboxGroup>
  <ElCheckbox v-else v-bind="$attrs"><slot /></ElCheckbox>
</template>
