import type { Ref } from 'vue';

export interface CardActionSize {
  width: number;
  height: number;
}

export function getCardFooterLayout(
  width: number,
  timeWidth: number,
  actionWidth: number,
) {
  const gap = timeWidth > 0 && actionWidth > 0 ? 8 : 0;
  const collapsed =
    width > 0 && actionWidth > 0 && timeWidth + gap + actionWidth > width;
  return {
    collapsed,
    stacked: collapsed && timeWidth > 0 && timeWidth + 8 + 32 > width,
  };
}

function naturalWidth(element: HTMLElement | undefined) {
  if (!element) return 0;
  // 同一份时间内容在窄屏可能换行；同步测量其单行宽度，不复制业务组件。
  if (typeof element.style.setProperty !== 'function')
    return element.getBoundingClientRect().width;
  const previous = element.style.cssText;
  try {
    element.style.position = 'absolute';
    element.style.width = 'max-content';
    element.style.maxWidth = 'none';
    element.style.whiteSpace = 'nowrap';
    return Math.max(element.scrollWidth, element.getBoundingClientRect().width);
  } finally {
    element.style.cssText = previous;
  }
}

export function useCardFooterLayout(
  footer: Ref<HTMLElement | undefined>,
  time: Ref<HTMLElement | undefined>,
  actions: Ref<CardActionSize>,
) {
  const collapsed = ref(false);
  const stacked = ref(false);
  let observer: ResizeObserver | undefined;
  let mutations: MutationObserver | undefined;
  let observed: HTMLElement[] = [];
  function measure() {
    const nodes = [footer.value, time.value].filter(
      (node): node is HTMLElement => Boolean(node),
    );
    if (
      nodes.some((node, index) => node !== observed[index]) ||
      nodes.length !== observed.length
    ) {
      observer?.disconnect();
      mutations?.disconnect();
      observed = nodes;
      nodes.forEach((node) => observer?.observe(node));
      if (time.value)
        mutations?.observe(time.value, {
          childList: true,
          characterData: true,
          subtree: true,
        });
      if (typeof document !== 'undefined' && document.documentElement)
        mutations?.observe(document.documentElement, { attributes: true });
    }
    const width = footer.value?.getBoundingClientRect().width ?? 0;
    if (width <= 0) return;
    const next = getCardFooterLayout(
      width,
      naturalWidth(time.value),
      actions.value.width,
    );
    collapsed.value = next.collapsed;
    stacked.value = next.stacked;
  }
  onMounted(() => {
    if (typeof ResizeObserver !== 'undefined')
      observer = new ResizeObserver(measure);
    if (typeof MutationObserver !== 'undefined')
      mutations = new MutationObserver(measure);
    document.fonts?.addEventListener('loadingdone', measure);
    measure();
  });
  onUpdated(measure);
  watch(actions, measure, { flush: 'post' });
  onBeforeUnmount(() => {
    observer?.disconnect();
    mutations?.disconnect();
    document.fonts?.removeEventListener('loadingdone', measure);
  });
  return { collapsed, stacked };
}
