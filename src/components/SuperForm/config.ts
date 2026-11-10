import type { LabelRecord, LabelValue, SuperFormOption } from './types.ts';

export function formatLabel(
  label: LabelValue,
  labelKey = 'label',
): string | LabelRecord {
  if (typeof label === 'string') return label;
  if (typeof label === 'function') return label();
  if (!Reflect.has(label, labelKey)) return label;
  const value = label[labelKey];
  return typeof value === 'function' ? value() : value;
}

export function formatOptions(
  options: SuperFormOption[] = [],
): SuperFormOption[] {
  return options.map(({ value, label, disabled, children }) => ({
    value,
    label: formatLabel(label) as string,
    disabled,
    ...(children ? { children: formatOptions(children) } : {}),
  }));
}
