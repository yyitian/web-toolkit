import { cloneDeep } from 'es-toolkit';
import type { Ref } from 'vue';
import { compactSearch } from './config.ts';
import type {
  SuperTableQuery,
  SuperTableRequest,
  SuperTableResult,
} from './types.ts';

interface QueryOptions<Row> {
  page: Ref<number>;
  pageSize: Ref<number>;
  request: () => SuperTableRequest<Row> | undefined;
  immediate: () => boolean;
  initialSort?: SuperTableQuery['sort'];
  beforeQuery: () => void;
  onQuery: (query: SuperTableQuery, reason: 'page' | 'refresh') => void;
  onLoad: (result: SuperTableResult<Row>) => void;
}

export function useTableQuery<Row>(options: QueryOptions<Row>) {
  const search = shallowRef<Record<string, unknown>>({});
  const sort = shallowRef<SuperTableQuery['sort']>(
    cloneDeep(options.initialSort ?? null),
  );
  const result = shallowRef<SuperTableResult<Row>>({ data: [], total: 0 });
  const loading = ref(false);
  let mounted = false;
  let active = true;
  let sequence = 0;
  let controller: AbortController | undefined;
  let scheduled: Promise<void> | undefined;
  let scheduledReason: 'page' | 'refresh' = 'page';

  function getQuery(): SuperTableQuery {
    return cloneDeep({
      page: options.page.value,
      pageSize: options.pageSize.value,
      search: search.value,
      sort: sort.value,
    });
  }

  async function execute(reason: 'page' | 'refresh') {
    const id = ++sequence;
    controller?.abort();
    controller = undefined;
    options.beforeQuery();
    const query = getQuery();
    options.onQuery(cloneDeep(query), reason);
    const request = options.request();
    if (!request) {
      loading.value = false;
      return;
    }
    const currentController = new AbortController();
    controller = currentController;
    loading.value = true;
    try {
      const next = await request(query, { signal: currentController.signal });
      if (!active || id !== sequence) return;
      result.value = next;
      options.onLoad(next);
    } catch {
      // 调用方的返回拦截器负责错误处理，表格静默收尾，避免重复提示。
    } finally {
      if (active && id === sequence) loading.value = false;
    }
  }

  // 同步修改页码与查询条件时合并为一次执行。
  function schedule(reason: 'page' | 'refresh'): Promise<void> {
    if (!active) return Promise.resolve();
    if (reason === 'refresh') scheduledReason = 'refresh';
    scheduled ??= Promise.resolve().then(() => {
      const reason = scheduledReason;
      scheduled = undefined;
      scheduledReason = 'page';
      if (active) return execute(reason);
    });
    return scheduled;
  }
  function refresh(): Promise<void> {
    return schedule('refresh');
  }
  function reload(): Promise<void> {
    const pending = schedule('refresh');
    options.page.value = 1;
    return pending;
  }

  function initializeSearch(data: Record<string, unknown>) {
    search.value = compactSearch(data);
  }

  function submitSearch(data: Record<string, unknown>) {
    search.value = compactSearch(data);
    return reload();
  }

  function setSort(value: SuperTableQuery['sort']) {
    sort.value = cloneDeep(value);
    void reload();
  }

  watch(options.pageSize, () => (options.page.value = 1), { flush: 'sync' });
  watch(
    [options.page, options.pageSize],
    () => {
      if (mounted) void schedule('page');
    },
    { flush: 'sync' },
  );
  watch(options.request, () => {
    ++sequence;
    controller?.abort();
    loading.value = false;
    if (mounted && options.request() && options.immediate()) void refresh();
  });
  onMounted(() => {
    mounted = true;
    if (options.request() && options.immediate()) void refresh();
  });
  onBeforeUnmount(() => {
    active = false;
    ++sequence;
    controller?.abort();
  });

  return {
    sort,
    result,
    loading,
    refresh,
    reload,
    getQuery,
    initializeSearch,
    submitSearch,
    setSort,
  };
}
