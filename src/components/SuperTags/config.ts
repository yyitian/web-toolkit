import { toDisplayString } from 'vue';
import type { TagProps } from 'element-plus';
import { formatLabel } from '../SuperForm/config.ts';
import type { SuperTagItem, SuperTagValue, SuperTagsLimit } from './types.ts';

export function isTagItem(value: unknown): value is SuperTagItem {
  return value !== null && typeof value === 'object' && 'label' in value;
}

/** 表格仍兼容单值及原先可直接插值的值。 */
export function toTagValues(value: unknown): SuperTagValue[] {
  return (Array.isArray(value) ? value : [value]).map((tag) =>
    isTagItem(tag) || ['string', 'number', 'boolean'].includes(typeof tag)
      ? (tag as SuperTagValue)
      : toDisplayString(tag),
  );
}

export function normalizeLimit(value: SuperTagsLimit | unknown): number {
  if (value === 'all') return Infinity;
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : 2;
}

export function getTagEntries(
  tags: readonly SuperTagValue[],
  props: Partial<TagProps> = {},
) {
  return tags.map((tag, index) => {
    const item = isTagItem(tag) ? tag : undefined;
    const raw = item ? item.label : tag;
    const label =
      raw == null
        ? ''
        : typeof raw === 'number' || typeof raw === 'boolean'
          ? String(raw)
          : toDisplayString(formatLabel(raw as SuperTagItem['label']));
    return {
      tag,
      index,
      key:
        item?.key !== undefined
          ? `item:${typeof item.key}:${item.key}`
          : `index:${index}`,
      label,
      props: { ...props, ...item?.props },
    };
  });
}

export type TagEntry = ReturnType<typeof getTagEntries>[number];

/** 计数入口只继承外观，不继承关闭能力及业务事件。 */
export function getCountProps(props: Partial<TagProps>) {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) =>
      [
        'type',
        'size',
        'effect',
        'color',
        'round',
        'hit',
        'disableTransitions',
        'class',
        'style',
      ].includes(key),
    ),
  );
}
