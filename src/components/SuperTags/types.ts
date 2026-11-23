import type { Placement } from '@floating-ui/vue';
import type { TagProps } from 'element-plus';
import type { StyleValue } from 'vue';
import type { LabelValue } from '../SuperForm/types.ts';

export type SuperTagsLimit = number | 'all';

export interface SuperTagItem {
  key?: string | number;
  label: LabelValue;
  props?: Partial<TagProps>;
}

export type SuperTagValue = string | number | boolean | SuperTagItem;

export interface SuperTagsPopoverConfig {
  placement?: Placement;
  teleportTo?: string | HTMLElement | false;
  popperClass?: unknown;
  popperStyle?: StyleValue;
}

export interface SuperTagsProps {
  tags?: readonly SuperTagValue[];
  limit?: SuperTagsLimit;
  props?: Partial<TagProps>;
  popover?: SuperTagsPopoverConfig;
}

export interface SuperTagContext {
  tag: SuperTagValue;
  index: number;
  label: string;
  overflow: boolean;
}

export interface SuperTagEvent {
  tag: SuperTagValue;
  index: number;
  event: MouseEvent;
}
