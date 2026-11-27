import type { SegmentedInstance, SegmentedProps } from 'element-plus';

export type SuperSegmentedOption = NonNullable<
  SegmentedProps['options']
>[number];
export type SuperSegmentedValue = NonNullable<SegmentedProps['modelValue']>;
export type SuperSegmentedProps<
  Option extends SuperSegmentedOption = SuperSegmentedOption,
> = SegmentedProps<Option>;
export type SuperSegmentedInstance = SegmentedInstance;
