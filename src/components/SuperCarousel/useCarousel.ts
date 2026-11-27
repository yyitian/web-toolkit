import type { ComputedRef, ShallowRef } from 'vue';
import type { SuperCarouselId, SuperCarouselProps } from './types.ts';
import { carouselIndex, carouselOffset } from './config.ts';

interface CarouselState {
  activeIndex: ComputedRef<number>;
  visited: ShallowRef<Set<SuperCarouselId>>;
  offset: (index: number) => number;
  canPrev: ComputedRef<boolean>;
  canNext: ComputedRef<boolean>;
  setActiveItem: (index: number) => void;
  setActiveId: (id: SuperCarouselId) => void;
  prev: () => void;
  next: () => void;
}

export function useCarousel(
  props: Readonly<SuperCarouselProps>,
  update: (id: SuperCarouselId | null) => void,
  change: (index: number, previous: number) => void,
): CarouselState {
  const current = ref<SuperCarouselId | null>(null);
  const activeIndex = computed(() =>
    props.items.findIndex((item) => item.id === current.value),
  );
  const visited = shallowRef(new Set<SuperCarouselId>());
  let previousIndex = -1;
  let initialized = false;
  let hasItems = false;
  function select(index: number) {
    if (props.disabled) return;
    const next = carouselIndex(index, props.items.length, props.loop ?? true);
    if (next >= 0) commit(props.items[next].id, next);
  }
  function commit(id: SuperCarouselId | null, index: number) {
    const changed = current.value !== id;
    current.value = id;
    if (props.activeId !== id) update(id);
    if (initialized && changed) change(index, previousIndex);
    previousIndex = index;
  }
  watch(
    () => [props.items.map((item) => item.id), props.activeId] as const,
    () => {
      const external = props.items.findIndex(
        (item) => item.id === props.activeId,
      );
      const retained = props.items.findIndex(
        (item) => item.id === current.value,
      );
      const fallback = hasItems
        ? Math.max(previousIndex, 0)
        : (props.initialIndex ?? 0);
      const index =
        external >= 0
          ? external
          : retained >= 0
            ? retained
            : carouselIndex(
                Number.isInteger(fallback) ? fallback : 0,
                props.items.length,
                false,
              );
      commit(index < 0 ? null : props.items[index].id, index);
      initialized = true;
      if (index >= 0) hasItems = true;
    },
    { immediate: true },
  );
  function offset(index: number) {
    return carouselOffset(
      index,
      activeIndex.value,
      props.items.length,
      props.loop ?? true,
    );
  }
  watchEffect(() => {
    const next = new Set(
      [...visited.value].filter((id) =>
        props.items.some((item) => item.id === id),
      ),
    );
    props.items.forEach((item, index) => {
      if (Math.abs(offset(index)) <= 1) next.add(item.id);
    });
    // 只在可见集合变化时更新，已访问项目保持挂载。
    if (
      next.size !== visited.value.size ||
      [...next].some((id) => !visited.value.has(id))
    )
      visited.value = next;
  });
  const canPrev = computed(
    () =>
      !props.disabled &&
      props.items.length > 1 &&
      (props.loop !== false || activeIndex.value > 0),
  );
  const canNext = computed(
    () =>
      !props.disabled &&
      props.items.length > 1 &&
      (props.loop !== false || activeIndex.value < props.items.length - 1),
  );
  return {
    activeIndex,
    visited,
    offset,
    canPrev,
    canNext,
    setActiveItem: select,
    setActiveId: (id: SuperCarouselId) => {
      const index = props.items.findIndex((item) => item.id === id);
      if (index >= 0) select(index);
    },
    prev: () => {
      if (canPrev.value) select(activeIndex.value - 1);
    },
    next: () => {
      if (canNext.value) select(activeIndex.value + 1);
    },
  };
}
