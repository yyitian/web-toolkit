import type { SuperTableView } from './card-types.ts';

export function getPageOptions(
  view: SuperTableView,
  options?: readonly number[],
) {
  const custom = [
    ...new Set(options?.filter((n) => Number.isInteger(n) && n > 0)),
  ];
  return {
    custom: custom.length > 0,
    sizes: custom.length
      ? custom
      : view === 'card'
        ? [12, 24, 36, 48]
        : [10, 20, 50, 100],
    defaultSize: view === 'card' ? 24 : 20,
  };
}
export function normalizePageSize(
  value: number | undefined,
  options: ReturnType<typeof getPageOptions>,
) {
  return value !== undefined && options.sizes.includes(value)
    ? value
    : options.sizes.includes(options.defaultSize)
      ? options.defaultSize
      : options.sizes[0]!;
}
export function getCardColumns(width: number, minWidth = 240, gap = 16) {
  return (
    [12, 8, 6, 4, 3, 2, 1].find(
      (count) => count * minWidth + (count - 1) * gap <= width,
    ) ?? 1
  );
}
