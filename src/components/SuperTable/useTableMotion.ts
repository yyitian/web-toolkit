import { cloneDeep, isEqual } from 'es-toolkit';
import type { Ref } from 'vue';
import type { SuperTableQuery } from './types.ts';
import type { SuperTableView } from './card-types.ts';

export interface TableMotion {
  version: number;
  x: number;
}
/** 动画由已接受的查询结果驱动，与行对象回写、选中及网格宽度无关。 */
export function useTableMotion(view: Ref<SuperTableView>) {
  const state = ref<TableMotion>({ version: 0, x: 0 });
  let version = 0;
  let pagination = false;
  let pending: SuperTableQuery | undefined;
  let previous: { view: SuperTableView; query: SuperTableQuery } | undefined;
  function begin(query: SuperTableQuery, pageChange = true) {
    pagination = pageChange;
    pending = cloneDeep(query);
    state.value = { version: 0, x: 0 };
  }
  function commit(hasRows: boolean, query = pending) {
    if (!query) return;
    pending = undefined;
    if (!hasRows) {
      state.value = { version: 0, x: 0 };
      return;
    }
    const pageOnly =
      pagination &&
      previous &&
      previous.view === view.value &&
      previous.query.page !== query.page &&
      previous.query.pageSize === query.pageSize &&
      isEqual(previous.query.search, query.search) &&
      isEqual(previous.query.sort, query.sort);
    const x =
      view.value === 'card' && pageOnly
        ? query.page > previous!.query.page
          ? 12
          : -12
        : 0;
    state.value = { version: ++version, x };
    previous = { view: view.value, query: cloneDeep(query) };
  }
  return { state, begin, commit };
}
