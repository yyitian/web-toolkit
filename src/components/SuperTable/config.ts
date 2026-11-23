import { cloneDeep } from 'es-toolkit';
import { get } from 'es-toolkit/compat';
import { DATE_FORMATS, datePickerDefaultTime } from '../../constants/date.ts';
import type { SuperFormColumn } from '../SuperForm/types.ts';
import type { SuperTableColumn, SuperTableSearch } from './types.ts';

export function getSearchColumns<Row>(
  columns: SuperTableColumn<Row>[],
): SuperFormColumn[] {
  return columns.flatMap((column) => {
    if (!column.search) return [];
    const field: Partial<SuperTableSearch> =
      typeof column.search === 'object' ? column.search : {};
    const formType =
      'formType' in field
        ? field.formType
        : column.tableType === 'date'
          ? 'date-picker'
          : 'input';
    const search = {
      ...field,
      prop: field.prop ?? column.prop,
      label: field.label ?? column.label,
      formType,
    } as SuperFormColumn;
    if (search.formType === 'date-picker') {
      const type = search.props?.type ?? 'datetimerange';
      search.props = {
        ...search.props,
        type,
        defaultTime:
          search.props?.defaultTime ??
          cloneDeep(
            String(type).includes('range')
              ? datePickerDefaultTime
              : datePickerDefaultTime[0],
          ),
        valueFormat: search.props?.valueFormat ?? DATE_FORMATS.dateTimeSeconds,
      };
    }
    return [search];
  });
}

export function compactSearch(data: Record<string, unknown>) {
  return cloneDeep(
    Object.fromEntries(
      Object.entries(data).filter(
        ([, value]) =>
          value !== '' &&
          value !== null &&
          value !== undefined &&
          !(Array.isArray(value) && value.length === 0),
      ),
    ),
  );
}

export function getCellValue<Row>(
  row: Row,
  column: SuperTableColumn<Row>,
  index: number,
): unknown {
  const value = get(row, column.prop);
  return column.formatter ? column.formatter(row, value, index) : value;
}

/** 显式宽度配置优先，不用固定默认宽度覆盖调用方的弹性列。 */
export function getColumnDefaults<Row>(column: SuperTableColumn<Row>) {
  const defaults: Record<string, unknown> = {
    resizable: true,
    showOverflowTooltip: !column.tableType || column.tableType === 'text',
  };
  if (
    [
      column.width,
      column.minWidth,
      column.props?.width,
      column.props?.minWidth,
    ].every((value) => value === undefined)
  ) {
    const width = { date: 180, index: 60, expand: 48 }[
      column.tableType as 'date' | 'index' | 'expand'
    ];
    if (width !== undefined) defaults.width = width;
    else if (column.tableType === 'progress') defaults.minWidth = 160;
  }
  return defaults;
}
