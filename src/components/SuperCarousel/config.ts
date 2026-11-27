import type { SuperCarouselItem } from './types.ts';

export function carouselOffset(
  index: number,
  active: number,
  count: number,
  loop: boolean,
) {
  let distance = index - active;
  if (loop && count > 2) {
    if (distance > count / 2) distance -= count;
    if (distance < -count / 2) distance += count;
  }
  return distance;
}
export function carouselIndex(index: number, count: number, loop: boolean) {
  if (!count || !Number.isFinite(index) || !Number.isInteger(index)) return -1;
  return loop
    ? ((index % count) + count) % count
    : Math.max(0, Math.min(count - 1, index));
}
export function carouselPreviews(items: readonly SuperCarouselItem[]) {
  return items.flatMap((item, index) => {
    const src = item.previewSrc || item.src;
    return src ? [{ item, index, src }] : [];
  });
}
