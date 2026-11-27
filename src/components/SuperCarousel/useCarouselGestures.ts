import type { Ref } from 'vue';
import type { SuperCarouselProps } from './types.ts';

export function useCarouselGestures(
  props: Readonly<SuperCarouselProps>,
  reduced: Ref<boolean>,
  prev: () => void,
  next: () => void,
  select: (index: number) => void,
) {
  let start: { x: number; y: number; id: number } | undefined;
  let suppressUntil = 0;
  const interactive = (target: EventTarget | null) =>
    target instanceof Element &&
    Boolean(
      target.closest(
        'button, a, input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="button"]:not(.super-carousel__content), [data-carousel-no-swipe]',
      ),
    );
  function keydown(event: KeyboardEvent) {
    if (
      props.disabled ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      interactive(event.target)
    )
      return;
    const vertical = props.direction === 'vertical';
    const action =
      event.key === (vertical ? 'ArrowUp' : 'ArrowLeft')
        ? prev
        : event.key === (vertical ? 'ArrowDown' : 'ArrowRight')
          ? next
          : event.key === 'Home'
            ? () => select(0)
            : event.key === 'End'
              ? () => select(props.items.length - 1)
              : undefined;
    if (action) {
      event.preventDefault();
      action();
    }
  }
  return {
    keydown,
    pointerdown(event: PointerEvent) {
      if (
        props.disabled ||
        event.button !== 0 ||
        !event.isPrimary ||
        interactive(event.target)
      )
        return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
    },
    pointerup(event: PointerEvent) {
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x,
        dy = event.clientY - start.y;
      start = undefined;
      const main = props.direction === 'vertical' ? dy : dx;
      const cross = props.direction === 'vertical' ? dx : dy;
      if (
        props.disabled ||
        Math.abs(main) < 40 ||
        Math.abs(main) < Math.abs(cross) * 1.3
      )
        return;
      suppressUntil = Date.now() + (reduced.value ? 100 : 400);
      if (main < 0) next();
      else prev();
    },
    cancel() {
      start = undefined;
    },
    click(event: MouseEvent) {
      if (Date.now() < suppressUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
  };
}
