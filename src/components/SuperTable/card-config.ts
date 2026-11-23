import { get } from 'es-toolkit/compat';
import { formatLabel } from '../SuperForm/config.ts';
import type {
  SuperTableCardRowOption,
  SuperTableCardText,
  SuperTableCardValue,
  SuperTableCardSwitch,
} from './card-types.ts';

export function getCardValue<Row, Value>(
  row: Row,
  index: number,
  source?: false | SuperTableCardValue<Row, Value>,
): Value | undefined {
  return typeof source === 'function'
    ? source(row, index)
    : source === undefined || source === false
      ? undefined
      : (get(row, source) as Value);
}
export function getCardOption<Row, Value>(
  row: Row,
  index: number,
  source: SuperTableCardRowOption<Row, Value> | undefined,
): Value | undefined {
  return typeof source === 'function'
    ? (source as (row: Row, index: number) => Value)(row, index)
    : source;
}
export function cardText(value: SuperTableCardText): string {
  if (value === null || value === undefined || value === '') return '—';
  return typeof value === 'boolean' || typeof value === 'number'
    ? String(value)
    : String(formatLabel(value));
}
export function getSwitchValues<Row>(config: SuperTableCardSwitch<Row>) {
  return {
    active: config.activeValue ?? true,
    inactive: config.inactiveValue ?? false,
  };
}

/** false 只在映射配置中表示关闭，读取到的 false 仍是有效内容。 */
export function hasCardContent(value: unknown) {
  return (
    value !== null &&
    value !== undefined &&
    value !== '' &&
    (!Array.isArray(value) || value.length > 0)
  );
}
