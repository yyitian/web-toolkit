import type { LabelValue } from '../SuperForm/types.ts';

export type SuperStatusValue = string | number;
export type SuperStatusTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';
export interface SuperStatusOption {
  value: SuperStatusValue;
  label?: LabelValue;
  type?: SuperStatusTone;
  color?: string;
}
export interface SuperStatusProps {
  value?: SuperStatusValue | null;
  options?: readonly SuperStatusOption[];
  label?: LabelValue;
  color?: string;
}
