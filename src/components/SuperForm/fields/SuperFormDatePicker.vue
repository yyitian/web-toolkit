<script setup lang="ts">
import { ElDatePicker } from 'element-plus';
import { getDatePickerDefaultTime } from '../config.ts';
defineOptions({ inheritAttrs: false });
type DatePickerType =
  | 'date'
  | 'month'
  | 'year'
  | 'dates'
  | 'months'
  | 'years'
  | 'week'
  | 'datetime'
  | 'datetimerange'
  | 'daterange'
  | 'monthrange'
  | 'yearrange';
const props = withDefaults(defineProps<{ type?: DatePickerType }>(), {
  type: 'date',
});
const dynamicProps = computed(() => {
  const times = getDatePickerDefaultTime();
  if (props.type.includes('range')) return { defaultTime: times };
  if (props.type.includes('s')) return {};
  return { defaultTime: times[0] };
});
</script>
<template>
  <ElDatePicker
    class="super-form-date-picker"
    v-bind="{ ...dynamicProps, ...$attrs }"
    :type="type"
  />
</template>
<style scoped>
.super-form-date-picker {
  width: 100%;
}
</style>
