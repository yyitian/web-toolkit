import type { Component } from 'vue';
import type { LabelValue } from '../SuperForm/types.ts';
import type { SuperStatusOption } from '../SuperStatus/types.ts';
import type { SuperTagsLimit, SuperTagValue } from '../SuperTags/types.ts';

export type SuperTableView = 'table' | 'card';
export type SuperTableCardValue<Row, Value> =
  | string
  | ((row: Row, index: number) => Value);
export type SuperTableCardRowOption<Row, Value> =
  | Value
  | ((row: Row, index: number) => Value);
export type SuperTableCardText =
  | LabelValue
  | number
  | boolean
  | null
  | undefined;
export interface SuperTableCardSwitch<Row> {
  prop: string;
  activeValue?: boolean | string | number;
  inactiveValue?: boolean | string | number;
  disabled?: SuperTableCardRowOption<Row, boolean>;
  loading?: SuperTableCardRowOption<Row, boolean>;
  label?: LabelValue;
}
export interface SuperTableCardConfig<Row = Record<string, unknown>> {
  fields?: {
    title?: SuperTableCardValue<Row, SuperTableCardText>;
    image?: SuperTableCardValue<Row, string | null | undefined>;
    description?: false | SuperTableCardValue<Row, SuperTableCardText>;
    createdAt?:
      | false
      | SuperTableCardValue<Row, string | number | Date | null | undefined>;
    icon?:
      | false
      | SuperTableCardValue<Row, string | Component | null | undefined>;
    tags?:
      | false
      | SuperTableCardValue<Row, readonly SuperTagValue[] | null | undefined>;
  };
  status?:
    | false
    | {
        value: SuperTableCardValue<Row, string | number | null | undefined>;
        options?: readonly SuperStatusOption[];
      };
  switch?: false | SuperTableCardSwitch<Row>;
  imageFit?: 'cover' | 'contain';
  dateFormat?: string;
  tagsMaxVisible?: SuperTagsLimit;
  actions?:
    | false
    | {
        display?: 'always' | 'hover';
        placement?: 'bottom-right' | 'image-bottom-right';
      };
}
export interface SuperTableCardContext<Row = Record<string, unknown>> {
  row: Row;
  index: number;
  selected: boolean;
  selectable: boolean;
}
export interface SuperTableCardActionsScope {
  overflow: boolean;
  close: () => void;
}
export type SuperTableCardActionsContext<Row = Record<string, unknown>> =
  SuperTableCardContext<Row> & SuperTableCardActionsScope;
export interface SuperTableCardSwitchChange<Row = Record<string, unknown>> {
  row: Row;
  index: number;
  prop: string;
  value: boolean | string | number;
  previousValue: unknown;
}
