import type { ComputedRef } from 'vue';
import type {
  SuperCarouselId,
  SuperCarouselItem,
  SuperCarouselProps,
  SuperCarouselSelectionChange,
} from './types.ts';

export function useCarouselSelection(
  props: Readonly<SuperCarouselProps>,
  update: (ids: SuperCarouselId[]) => void,
  change: (context: SuperCarouselSelectionChange) => void,
): {
  selectedIds: ComputedRef<readonly SuperCarouselId[]>;
  selected: ComputedRef<ReadonlySet<SuperCarouselId>>;
  setSelected: (
    item: SuperCarouselItem,
    index: number,
    checked: boolean,
  ) => void;
  toggleSelected: (item: SuperCarouselItem, index: number) => void;
} {
  const local = ref<SuperCarouselId[]>([]);
  const selectedIds = computed(() => props.selectedIds ?? local.value);
  const selected = computed(() => new Set(selectedIds.value));
  function setSelected(
    item: SuperCarouselItem,
    index: number,
    checked: boolean,
  ) {
    if (
      !props.selectable ||
      props.disabled ||
      selected.value.has(item.id) === checked
    )
      return;
    const next = new Set(selected.value);
    if (checked) next.add(item.id);
    else next.delete(item.id);
    const ids = [...next];
    if (props.selectedIds === undefined) local.value = ids;
    update([...ids]);
    change({ item, index, selected: checked, selectedIds: [...ids] });
  }
  return {
    selectedIds,
    selected,
    setSelected,
    toggleSelected: (item, index) =>
      setSelected(item, index, !selected.value.has(item.id)),
  };
}
