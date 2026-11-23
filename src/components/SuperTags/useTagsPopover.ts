import type { Ref } from 'vue';

/** 只管理标签局部交互，不改变 SuperPopover 的全局触发协议。 */
export function useTagsPopover(hasOverflow: Ref<boolean>) {
  const visible = ref(false);
  const reference = shallowRef<HTMLElement>();
  const content = shallowRef<HTMLElement>();
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  const hovered = new Set<'reference' | 'content'>();
  let restoringFocus = false;

  function clearTimer() {
    if (closeTimer !== undefined) clearTimeout(closeTimer);
    closeTimer = undefined;
  }
  function contains(target: EventTarget | null) {
    return (
      typeof Node !== 'undefined' &&
      target instanceof Node &&
      (reference.value?.contains(target) || content.value?.contains(target))
    );
  }
  function focusInside() {
    return typeof document !== 'undefined' && contains(document.activeElement);
  }
  function open() {
    clearTimer();
    if (hasOverflow.value && !restoringFocus) visible.value = true;
  }
  function close(restoreFocus = false) {
    clearTimer();
    if (
      restoreFocus &&
      typeof document !== 'undefined' &&
      content.value?.contains(document.activeElement)
    ) {
      restoringFocus = true;
      reference.value?.focus();
      restoringFocus = false;
    }
    visible.value = false;
    hovered.delete('content');
  }
  function enter(area: 'reference' | 'content') {
    hovered.add(area);
    open();
  }
  function leave(area: 'reference' | 'content') {
    hovered.delete(area);
    scheduleClose();
  }
  function scheduleClose() {
    clearTimer();
    closeTimer = setTimeout(() => {
      closeTimer = undefined;
      if (!hovered.size && !focusInside()) close();
    }, 120);
  }
  function focusOut(event: FocusEvent) {
    if (contains(event.relatedTarget)) clearTimer();
    else scheduleClose();
  }
  async function focusContent() {
    open();
    await nextTick();
    content.value?.focus();
  }
  function onEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && visible.value && !event.defaultPrevented) {
      event.preventDefault();
      close(true);
    }
  }
  watch(
    hasOverflow,
    (has) => {
      if (!has) {
        hovered.clear();
        close();
      }
    },
    { flush: 'sync' },
  );
  watch(
    visible,
    (isOpen) => {
      if (!isOpen) {
        clearTimer();
        hovered.delete('content');
      }
      if (typeof document === 'undefined') return;
      if (isOpen) document.addEventListener('keydown', onEscape);
      else document.removeEventListener('keydown', onEscape);
    },
    { flush: 'sync' },
  );
  onBeforeUnmount(() => {
    clearTimer();
    if (typeof document !== 'undefined')
      document.removeEventListener('keydown', onEscape);
  });
  return {
    visible,
    reference,
    content,
    open,
    close,
    enter,
    leave,
    focusOut,
    focusContent,
  };
}
