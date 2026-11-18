import type { Ref } from 'vue';

/** 只调整视觉反馈，不延迟请求状态或数据更新。 */
export function useTableLoading(loading: Ref<boolean>) {
  const visible = ref(false);
  let shownAt = 0;

  watch(
    loading,
    (busy, _previous, onCleanup) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      onCleanup(() => {
        if (timer !== undefined) clearTimeout(timer);
      });
      if (busy) {
        if (!visible.value) {
          timer = setTimeout(() => {
            shownAt = Date.now();
            visible.value = true;
          }, 150);
        }
      } else if (visible.value) {
        const remaining = 200 - (Date.now() - shownAt);
        if (remaining > 0)
          timer = setTimeout(() => (visible.value = false), remaining);
        else visible.value = false;
      }
    },
    { immediate: true, flush: 'sync' },
  );

  return readonly(visible);
}
