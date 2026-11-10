import dayjs from 'dayjs';
import type { ConfigType } from 'dayjs';
import { DATE_FORMATS } from '../constants/date.ts';

/** 按本地时区格式化日期；空值、无效日期返回空字符串，数字按毫秒解析。 */
export function formatDate(
  value: ConfigType,
  format: string = DATE_FORMATS.date,
): string {
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return '';
  }

  const date = dayjs(value);
  const template = Object.hasOwn(DATE_FORMATS, format)
    ? DATE_FORMATS[format as keyof typeof DATE_FORMATS]
    : format;
  return date.isValid() ? date.format(template) : '';
}
