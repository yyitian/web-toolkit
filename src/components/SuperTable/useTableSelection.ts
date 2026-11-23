import { get } from 'es-toolkit/compat';
import type { SuperTableConfig, SuperTableSelection } from './types.ts';

export function useTableSelection<Row>(options: {
  rows: () => Row[];
  selection: () => boolean | SuperTableSelection<Row>;
  rowKey: () => NonNullable<SuperTableConfig<Row>['rowKey']>;
  onChange: (rows: Row[]) => void;
}) {
  const selections = shallowRef<Row[]>([]);
  const reserve = computed(
    () =>
      typeof options.selection() === 'object' &&
      (options.selection() as SuperTableSelection<Row>).reserveSelection ===
        true,
  );
  const key = (row: Row) => {
    const source = options.rowKey();
    return String(
      typeof source === 'function' ? source(row) : get(row, source),
    );
  };
  const selectedKeys = computed(() => new Set(selections.value.map(key)));
  function selectable(row: Row, index: number) {
    const config = options.selection();
    return (
      Boolean(config) &&
      (typeof config !== 'object' || config.selectable?.(row, index) !== false)
    );
  }
  function replace(next: Row[], notify = true) {
    const unique = [...new Map(next.map((row) => [key(row), row])).values()];
    const changed =
      unique.length !== selections.value.length ||
      unique.some((row) => !selectedKeys.value.has(key(row)));
    selections.value = unique;
    if (changed && notify) options.onChange(unique.slice());
  }
  function clearSelection() {
    replace([]);
  }
  function toggleRowSelection(row: Row, selected?: boolean) {
    const index = options.rows().findIndex((item) => key(item) === key(row));
    const current = options.rows()[index];
    if (index < 0 || !current || !selectable(current, index)) return;
    const checked = selected ?? !selectedKeys.value.has(key(current));
    replace(
      checked
        ? [...selections.value, current]
        : selections.value.filter((item) => key(item) !== key(current)),
    );
  }
  const selectableRows = computed(() => options.rows().filter(selectable));
  const checked = computed(
    () =>
      selectableRows.value.length > 0 &&
      selectableRows.value.every((row) => selectedKeys.value.has(key(row))),
  );
  const indeterminate = computed(
    () =>
      !checked.value &&
      selectableRows.value.some((row) => selectedKeys.value.has(key(row))),
  );
  function togglePage(selected: boolean) {
    const keys = new Set(selectableRows.value.map(key));
    replace(
      selected
        ? [...selections.value, ...selectableRows.value]
        : selections.value.filter((row) => !keys.has(key(row))),
    );
  }
  function fromTable(rows: Row[]) {
    if (!options.selection()) return;
    replace(rows);
  }
  watch(
    () => options.rows().slice(),
    (rows) => {
      if (!reserve.value) {
        clearSelection();
        return;
      }
      const fresh = new Map(rows.map((row) => [key(row), row]));
      replace(
        selections.value.map((row) => fresh.get(key(row)) ?? row),
        false,
      );
    },
  );
  watch(options.rowKey, clearSelection);
  watch(options.selection, (value) => {
    if (!value) clearSelection();
  });
  return {
    selections,
    reserve,
    key,
    selectedKeys,
    selectable,
    selectableRows,
    checked,
    indeterminate,
    clearSelection,
    toggleRowSelection,
    togglePage,
    fromTable,
  };
}
