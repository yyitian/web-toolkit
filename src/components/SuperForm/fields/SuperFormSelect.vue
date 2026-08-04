<script setup lang="ts">
import { ElOption, ElOptionGroup, ElSelect } from 'element-plus';
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
  <ElSelect
    v-bind="{
      filterable: true,
      clearable: true,
      fitInputWidth: true,
      reserveKeyword: false,
      ...$attrs,
    }"
  >
    <template v-for="option in options" :key="String(option.value)">
      <ElOptionGroup
        v-if="option.children"
        :label="String(option.label)"
        :disabled="option.disabled"
      >
        <ElOption
          v-for="child in option.children"
          :key="String(child.value)"
          :value="optionValue(child.value)"
          :label="String(child.label)"
          :disabled="child.disabled"
        />
      </ElOptionGroup>
      <ElOption
        v-else
        :value="optionValue(option.value)"
        :label="String(option.label)"
        :disabled="option.disabled"
      />
    </template>
  </ElSelect>
</template>
