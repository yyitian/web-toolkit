/** 通用日期格式预设，分别精确到日、分钟和秒。 */
export const DATE_FORMATS = {
  date: 'YYYY-MM-DD',
  dateTime: 'YYYY-MM-DD HH:mm',
  dateTimeSeconds: 'YYYY-MM-DD HH:mm:ss',
} as const;

/** 为日期选择器创建独立的起止时刻，避免共享可变的 Date 对象。 */
export function getDatePickerDefaultTime(): [Date, Date] {
  const year = new Date().getFullYear();
  return [new Date(year, 0, 1, 0, 0, 0), new Date(year, 0, 1, 23, 59, 59)];
}

/** 日期选择器默认起止时刻：00:00:00～23:59:59。 */
export const datePickerDefaultTime: readonly [Date, Date] =
  getDatePickerDefaultTime();
