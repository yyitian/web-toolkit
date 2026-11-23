import type { Ref } from 'vue';

/** 图片事件和缓存检查均只处理当前资源，不把旧节点的结果写入新图片。 */
export function useCardImage(
  src: Ref<string | null | undefined>,
  image: Ref<HTMLImageElement | undefined>,
) {
  const phase = ref<'empty' | 'loading' | 'ready' | 'error'>('empty');
  const skeleton = ref(false);
  let sequence = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function clear() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }
  function finish(next: 'ready' | 'error', event?: Event) {
    const target = (event?.currentTarget ?? image.value) as
      | HTMLImageElement
      | undefined;
    if (
      phase.value !== 'loading' ||
      (event?.currentTarget && event.currentTarget !== image.value) ||
      (typeof target?.getAttribute === 'function' &&
        target.getAttribute('src') !== src.value)
    )
      return;
    clear();
    skeleton.value = false;
    phase.value = next;
  }
  watch(
    src,
    (value, _previous, onCleanup) => {
      const current = ++sequence;
      clear();
      skeleton.value = false;
      phase.value = value ? 'loading' : 'empty';
      if (value) {
        timer = setTimeout(() => {
          timer = undefined;
          if (current === sequence && phase.value === 'loading')
            skeleton.value = true;
        }, 150);
        void nextTick(() => {
          if (current === sequence && image.value?.complete)
            finish(image.value.naturalWidth > 0 ? 'ready' : 'error');
        });
      }
      onCleanup(clear);
    },
    { immediate: true, flush: 'sync' },
  );
  onBeforeUnmount(() => {
    sequence++;
    clear();
  });
  return {
    phase,
    skeleton,
    loaded: (event?: Event) => finish('ready', event),
    failed: (event?: Event) => finish('error', event),
  };
}
