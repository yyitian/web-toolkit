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

export function getDatePickerDefaultTime(): [Date, Date] {
  const year = new Date().getFullYear();
  return [new Date(year, 0, 1, 0, 0, 0), new Date(year, 0, 1, 23, 59, 59)];
}

export const datePickerDefaultTime: readonly [Date, Date] =
  getDatePickerDefaultTime();
export const dateFormat = 'YYYY-MM-DD HH:mm';
export const dateFormatSec = 'YYYY-MM-DD HH:mm:ss';
