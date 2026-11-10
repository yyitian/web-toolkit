<script setup lang="ts">
import { ElCascader } from 'element-plus';
import type { CascaderOption, CascaderProps } from 'element-plus';
import { formatLabel } from '../config.ts';
import type { LabelValue, SuperFormOption } from '../types.ts';

defineOptions({ inheritAttrs: false });
const fieldProps = withDefaults(
  defineProps<{
    options?: (SuperFormOption | CascaderOption)[];
    props?: CascaderProps;
  }>(),
  { options: () => [], props: () => ({}) },
);
const attrs = useAttrs();
const mergedAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) => !['popperClass', 'popper-class'].includes(key),
    ),
  ),
);
const popperClass = computed(() =>
  ['wt-form-cascader-popper', attrs.popperClass ?? attrs['popper-class']]
    .filter(Boolean)
    .join(' '),
);

const options = computed(() => {
  const labelKey = fieldProps.props.label ?? 'label';
  const childrenKey = fieldProps.props.children ?? 'children';
  function formatTree(
    items: (SuperFormOption | CascaderOption)[],
  ): CascaderOption[] {
    return items.map((item) => {
      const option = { ...item } as Record<string, unknown>;
      if (option[labelKey] !== undefined) {
        option[labelKey] = formatLabel(option[labelKey] as LabelValue);
      }
      if (Array.isArray(option[childrenKey])) {
        option[childrenKey] = formatTree(option[childrenKey]);
      }
      return option as CascaderOption;
    });
  }
  return formatTree(fieldProps.options);
});
</script>

<template>
  <ElCascader
    class="super-form-cascader"
    v-bind="{ filterable: true, clearable: true, ...mergedAttrs }"
    :options="options"
    :props="fieldProps.props"
    :popper-class="popperClass"
  >
    <template v-for="(_, name) in $slots" #[name]="scope">
      <slot :name="name" v-bind="scope ?? {}" />
    </template>
  </ElCascader>
</template>

<style scoped>
.super-form-cascader {
  width: 100%;
}
</style>
