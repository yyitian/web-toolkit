import type { Component } from 'vue';
import type { TableInstance } from 'element-plus';
import type { LabelValue, SuperFormColumn } from '../SuperForm/types.ts';

export interface SuperTableQuery {
  page: number;
  pageSize: number;
  search: Record<string, unknown>;
  sort: { prop: string; order: 'ascending' | 'descending' } | null;
}

export interface SuperTableResult<Row = Record<string, unknown>> {
  data: Row[];
  total: number;
}

export type SuperTableRequest<Row = Record<string, unknown>> = (
  query: SuperTableQuery,
  context: { signal: AbortSignal },
) => Promise<SuperTableResult<Row>>;

export interface SuperTableConfig<Row = Record<string, unknown>> {
  immediate?: boolean;
  rowKey?: string | ((row: Row) => string | number);
  search?: boolean;
  header?: boolean;
  pagination?: boolean;
}

export interface SuperTableSelection<Row = Record<string, unknown>> {
  reserveSelection?: boolean;
  selectable?: (row: Row, index: number) => boolean;
}

type SearchField<Field> = Field extends SuperFormColumn
  ? Omit<Field, 'prop' | 'label'> & { prop?: string; label?: LabelValue }
  : never;

export type SuperTableSearch = SearchField<SuperFormColumn>;

export interface SuperTableColumn<Row = Record<string, unknown>> {
  prop: string;
  label?: LabelValue;
  tableType?:
    | 'text'
    | 'date'
    | 'tag'
    | 'progress'
    | 'slot'
    | 'custom'
    | 'operation'
    | 'index'
    | 'expand';
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  headerAlign?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  showOverflowTooltip?: boolean;
  sortable?: boolean;
  search?: boolean | SuperTableSearch;
  formatter?: (row: Row, value: unknown, index: number) => unknown;
  component?: Component;
  /** 底层 ElTableColumn 属性；组件管理的查询属性除外。 */
  props?: Record<string, unknown>;
  /** 标签、进度或自定义组件属性；自定义组件同时接收单元格上下文。 */
  cellProps?:
    | Record<string, unknown>
    | ((context: SuperTableCellContext<Row>) => Record<string, unknown>);
}

export interface SuperTableCellContext<Row = Record<string, unknown>> {
  row: Row;
  value: unknown;
  column: SuperTableColumn<Row>;
  index: number;
}

export interface SuperTableProps<Row = Record<string, unknown>> {
  columns?: SuperTableColumn<Row>[];
  title?: LabelValue;
  data?: Row[];
  total?: number;
  loading?: boolean;
  request?: SuperTableRequest<Row>;
  selection?: boolean | SuperTableSelection<Row>;
  config?: SuperTableConfig<Row>;
  page?: number;
  pageSize?: number;
}

export interface SuperTableInstance<Row = Record<string, unknown>> {
  refresh(): Promise<void>;
  reload(): Promise<void>;
  clearSelection(): void;
  getQuery(): SuperTableQuery;
  readonly selections: Row[];
  readonly elTable: TableInstance | undefined;
}
