<script setup lang="ts">
import { ElDatePicker, useLocale } from 'element-plus';
import { getDatePickerDefaultTime } from '../../../constants/date.ts';
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
const attrs = useAttrs();
// 日期面板缓存初始语言的周布局，切换语言时重建底层控件。
const { lang } = useLocale();
const mergedAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) => !['popperClass', 'popper-class'].includes(key),
    ),
  ),
);
const popperClass = computed(() =>
  ['wt-form-date-picker-popper', attrs.popperClass ?? attrs['popper-class']]
    .filter(Boolean)
    .join(' '),
);
const dynamicProps = computed(() => {
  const times = getDatePickerDefaultTime();
  if (props.type.includes('range')) return { defaultTime: times };
  if (props.type.includes('s')) return {};
  return { defaultTime: times[0] };
});
</script>
<template>
  <ElDatePicker
    :key="lang"
    class="super-form-date-picker"
    v-bind="{ ...dynamicProps, ...mergedAttrs }"
    :type="type"
    :popper-class="popperClass"
  />
</template>
<style scoped>
.super-form-date-picker {
  width: 100%;
}
</style>
