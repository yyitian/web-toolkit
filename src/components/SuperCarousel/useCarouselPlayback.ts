import type { ComputedRef, Ref } from 'vue';
import type { SuperCarouselProps } from './types.ts';

export function useCarouselPlayback(
  props: Readonly<SuperCarouselProps>,
  root: Ref<HTMLElement | undefined>,
  previewing: Ref<boolean>,
  advance: () => void,
  activeIndex: Ref<number>,
): {
  hovered: Ref<boolean>;
  focused: Ref<boolean>;
  reduced: Ref<boolean>;
  paused: Ref<boolean>;
  playing: ComputedRef<boolean>;
  togglePlay: () => void;
} {
  const mounted = ref(false);
  const hovered = ref(false);
  const focused = ref(false);
  const hidden = ref(false);
  const visible = ref(true);
  const reduced = ref(false);
  const paused = ref(false);
  const playing = computed(() =>
    Boolean(
      mounted.value &&
      props.autoplay &&
      !paused.value &&
      !props.disabled &&
      props.items.length > 1 &&
      Number.isFinite(props.interval ?? 5000) &&
      (props.interval ?? 5000) > 0 &&
      !previewing.value &&
      !hidden.value &&
      visible.value &&
      !reduced.value &&
      !focused.value &&
      !(props.pauseOnHover !== false && hovered.value) &&
      (props.loop !== false || activeIndex.value < props.items.length - 1),
    ),
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  function clear() {
    clearTimeout(timer);
    timer = undefined;
  }
  watch([playing, () => props.interval, activeIndex], () => {
    clear();
    if (playing.value) timer = setTimeout(advance, props.interval ?? 5000);
  });
  let observer: IntersectionObserver | undefined;
  let media: MediaQueryList | undefined;
  const updateHidden = () => {
    hidden.value = document.hidden;
  };
  const updateMotion = () => {
    reduced.value = Boolean(media?.matches);
  };
  onMounted(() => {
    updateHidden();
    document.addEventListener('visibilitychange', updateHidden);
    media = window.matchMedia('(prefers-reduced-motion: reduce)');
    updateMotion();
    media.addEventListener('change', updateMotion);
    if (typeof IntersectionObserver !== 'undefined' && root.value) {
      observer = new IntersectionObserver((entries) => {
        visible.value = entries[0]?.isIntersecting ?? true;
      });
      observer.observe(root.value);
    }
    mounted.value = true;
  });
  onBeforeUnmount(() => {
    clear();
    observer?.disconnect();
    if (typeof document !== 'undefined')
      document.removeEventListener('visibilitychange', updateHidden);
    media?.removeEventListener('change', updateMotion);
  });
  return {
    hovered,
    focused,
    reduced,
    paused,
    playing,
    togglePlay: () => {
      paused.value = !paused.value;
    },
  };
}
