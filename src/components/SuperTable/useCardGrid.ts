import type { Ref } from 'vue';
import { getCardColumns } from './pagination.ts';

export function useCardGrid(
  grid: Ref<HTMLElement | undefined>,
  measure: Ref<HTMLElement | undefined>,
) {
  const columns = ref(1);
  let observer: ResizeObserver | undefined;
  function update() {
    if (!grid.value || !measure.value) return;
    const width = grid.value.getBoundingClientRect().width;
    if (width <= 0) return;
    const min = measure.value.getBoundingClientRect().width;
    const gap = measure.value.getBoundingClientRect().height;
    const next = getCardColumns(
      width,
      min > 0 ? min : 240,
      gap >= 0 ? gap : 16,
    );
    if (next !== columns.value) columns.value = next;
  }
  onMounted(() => {
    update();
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(update);
      if (grid.value) observer.observe(grid.value);
      if (measure.value) observer.observe(measure.value);
    }
  });
  onBeforeUnmount(() => observer?.disconnect());
  return columns;
}
