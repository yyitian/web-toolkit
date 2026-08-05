<script lang="ts">
import {
  autoUpdate,
  arrow as useArrow,
  flip as useFlip,
  offset as useOffset,
  shift as useShift,
  useFloating,
} from '@floating-ui/vue';
import type { Placement } from '@floating-ui/vue';
import { createVNode, Teleport, type PropType, type StyleValue } from 'vue';
import { placementMap } from './config.ts';

type PopoverTrigger = 'hover' | 'click' | 'manual';
type PopoverDelay = number | { open?: number; close?: number };
type TeleportTarget = string | HTMLElement | false;
type ReferenceSetter = (target: unknown) => void;

const DEFAULT_DELAY = { open: 0, close: 120 } as const;

export default defineComponent({
  inheritAttrs: false,
  props: {
    modelValue: { type: Boolean, default: false },
    placement: {
      type: String as PropType<Placement>,
      default: 'top',
    },
    offset: { type: Number, default: 12 },
    effect: {
      type: String as PropType<'dark' | 'light'>,
      default: 'dark',
    },
    title: { type: String, default: '' },
    teleportTo: {
      type: [String, Object, Boolean] as PropType<TeleportTarget>,
      default: 'body',
    },
    trigger: {
      type: String as PropType<PopoverTrigger>,
      default: 'hover',
    },
    disabled: { type: Boolean, default: false },
    arrow: { type: Boolean, default: true },
    delay: {
      type: [Number, Object] as PropType<PopoverDelay>,
      default: () => ({ ...DEFAULT_DELAY }),
    },
    closeOnClickOutside: { type: Boolean, default: true },
    popperClass: { type: null, default: undefined },
    popperStyle: {
      type: [String, Array, Object] as PropType<StyleValue>,
      default: undefined,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    const reference = ref<HTMLElement | null>(null);
    const floating = ref<HTMLElement | null>(null);
    const floatingArrow = ref<HTMLElement | null>(null);

    const internalVisible = ref(props.modelValue);
    const visible = computed({
      get: () => internalVisible.value,
      set: (value: boolean) => {
        internalVisible.value = value;
        emit('update:modelValue', value);
      },
    });

    watch(
      () => props.modelValue,
      (modelValue) => {
        internalVisible.value = modelValue;
      },
    );

    const normalizedDelay = computed(() => {
      if (typeof props.delay === 'number') {
        return { open: props.delay, close: props.delay };
      }

      return {
        open: props.delay.open ?? DEFAULT_DELAY.open,
        close: props.delay.close ?? DEFAULT_DELAY.close,
      };
    });

    const isOpen = computed(() => visible.value && !props.disabled);
    const middleware = computed(() => {
      const middlewares = [useOffset(props.offset), useFlip(), useShift()];

      if (props.arrow) {
        middlewares.push(useArrow({ element: floatingArrow }));
      }

      return middlewares;
    });

    const {
      floatingStyles,
      middlewareData,
      placement: resolvedPlacement,
    } = useFloating(reference, floating, {
      placement: computed(() => props.placement),
      middleware,
      strategy: 'fixed',
      whileElementsMounted: autoUpdate,
    });

    let openTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;

    function clearOpenTimer() {
      if (openTimer != null) {
        clearTimeout(openTimer);
        openTimer = undefined;
      }
    }

    function clearCloseTimer() {
      if (closeTimer != null) {
        clearTimeout(closeTimer);
        closeTimer = undefined;
      }
    }

    function clearTimers() {
      clearOpenTimer();
      clearCloseTimer();
    }

    function setOpen(nextVisible: boolean) {
      if (props.disabled) {
        visible.value = false;
        return;
      }

      visible.value = nextVisible;
    }

    function closeImmediately() {
      clearTimers();
      visible.value = false;
    }

    function scheduleOpen() {
      if (props.trigger !== 'hover' || props.disabled) return;

      clearCloseTimer();
      clearOpenTimer();

      if (normalizedDelay.value.open <= 0) {
        setOpen(true);
        return;
      }

      openTimer = setTimeout(() => {
        if (props.trigger === 'hover') setOpen(true);
      }, normalizedDelay.value.open);
    }

    function scheduleClose() {
      if (props.trigger !== 'hover') return;

      clearOpenTimer();
      clearCloseTimer();

      if (normalizedDelay.value.close <= 0) {
        setOpen(false);
        return;
      }

      closeTimer = setTimeout(() => {
        if (props.trigger === 'hover') setOpen(false);
      }, normalizedDelay.value.close);
    }

    function handleReferenceClick() {
      if (props.trigger === 'click' && !props.disabled) {
        setOpen(!isOpen.value);
      }
    }

    function bindReferenceListeners(element: HTMLElement | null) {
      element?.addEventListener('mouseenter', scheduleOpen);
      element?.addEventListener('mouseleave', scheduleClose);
      element?.addEventListener('click', handleReferenceClick);
    }

    function unbindReferenceListeners(element: HTMLElement | null) {
      element?.removeEventListener('mouseenter', scheduleOpen);
      element?.removeEventListener('mouseleave', scheduleClose);
      element?.removeEventListener('click', handleReferenceClick);
    }

    function resolveReferenceElement(target: unknown): HTMLElement | null {
      if (typeof HTMLElement === 'undefined') return null;
      if (target instanceof HTMLElement) return target;
      if (target == null || typeof target !== 'object') return null;

      const exposedReference = (target as { ref?: unknown }).ref;
      if (exposedReference instanceof HTMLElement) return exposedReference;
      if (exposedReference && typeof exposedReference === 'object') {
        const exposedValue = (exposedReference as { value?: unknown }).value;
        if (exposedValue instanceof HTMLElement) return exposedValue;
      }

      const componentElement = (target as { $el?: unknown }).$el;
      return componentElement instanceof HTMLElement ? componentElement : null;
    }

    const setReference: ReferenceSetter = (target) => {
      reference.value = resolveReferenceElement(target);
    };

    watch(reference, (nextReference, previousReference) => {
      unbindReferenceListeners(previousReference);
      bindReferenceListeners(nextReference);
    });

    watch(
      () => props.disabled,
      (disabled) => {
        if (disabled) closeImmediately();
      },
      { immediate: true },
    );

    watch(visible, (nextVisible) => {
      if (props.disabled && nextVisible) visible.value = false;
    });

    watch(
      () => props.trigger,
      () => clearTimers(),
    );

    const clickOutsideListenerOptions = true;
    const shouldBindClickOutside = computed(
      () =>
        isOpen.value &&
        props.closeOnClickOutside &&
        (props.trigger === 'click' || props.trigger === 'manual'),
    );

    function handleDocumentPointerdown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return;
      if (
        reference.value?.contains(event.target) ||
        floating.value?.contains(event.target)
      ) {
        return;
      }
      closeImmediately();
    }

    watch(
      shouldBindClickOutside,
      (shouldBind) => {
        if (typeof document === 'undefined') return;
        if (shouldBind) {
          document.addEventListener(
            'pointerdown',
            handleDocumentPointerdown,
            clickOutsideListenerOptions,
          );
        } else {
          document.removeEventListener(
            'pointerdown',
            handleDocumentPointerdown,
            clickOutsideListenerOptions,
          );
        }
      },
      { immediate: true },
    );

    onBeforeUnmount(() => {
      clearTimers();
      unbindReferenceListeners(reference.value);
      if (typeof document !== 'undefined') {
        document.removeEventListener(
          'pointerdown',
          handleDocumentPointerdown,
          clickOutsideListenerOptions,
        );
      }
    });

    const staticSide = computed(
      () => placementMap[resolvedPlacement.value.split('-')[0]],
    );

    const arrowInnerBorderHidden = computed<Record<string, string>>(() => {
      if (!props.arrow) return {};

      const map: Record<string, Record<string, string>> = {
        bottom: { borderTopWidth: '0', borderLeftWidth: '0' },
        top: { borderBottomWidth: '0', borderRightWidth: '0' },
        left: { borderTopWidth: '0', borderRightWidth: '0' },
        right: { borderBottomWidth: '0', borderLeftWidth: '0' },
      };
      return map[staticSide.value] ?? {};
    });

    function renderFloating() {
      if (!isOpen.value) return null;

      return h(
        'div',
        {
          ref: floating,
          class: [
            'super-popover-floating',
            { 'super-popover-floating--light': props.effect === 'light' },
            props.popperClass,
          ],
          style: [floatingStyles.value, props.popperStyle],
          onMouseenter: () => {
            if (props.trigger === 'hover') clearCloseTimer();
          },
          onMouseleave: scheduleClose,
        },
        [
          slots.content?.() ?? h('span', props.title),
          props.arrow
            ? h('div', {
                ref: floatingArrow,
                class: 'super-popover-arrow',
                style: {
                  left:
                    middlewareData.value.arrow?.x != null
                      ? `${middlewareData.value.arrow.x}px`
                      : '',
                  top:
                    middlewareData.value.arrow?.y != null
                      ? `${middlewareData.value.arrow.y}px`
                      : '',
                  [staticSide.value]: '-4px',
                  ...arrowInnerBorderHidden.value,
                },
              })
            : null,
        ],
      );
    }

    return () => {
      const referenceNode = slots.reference?.({ setReference });
      const floatingNode = renderFloating();
      const renderedFloating =
        props.teleportTo === false
          ? floatingNode
          : createVNode(
              Teleport,
              { to: props.teleportTo },
              floatingNode ? [floatingNode] : [],
            );

      return [referenceNode, renderedFloating];
    };
  },
});
</script>

<style lang="scss" scoped>
:global(:where(.super-popover-floating)) {
  --wt-popover-bg: var(--wt-color-bg-inverse);
  --wt-popover-color: var(--wt-color-text-inverse);
  --wt-popover-border-color: var(--wt-popover-bg);
  --wt-popover-radius: var(--wt-radius);
  --wt-popover-padding: 4px 6px;
  --wt-popover-shadow: none;
  --wt-popover-z-index: 2000;
  --wt-popover-max-width: 400px;
}

.super-popover-floating {
  @include font(12px, $color: var(--wt-popover-color));

  z-index: var(--wt-popover-z-index);
  max-width: var(--wt-popover-max-width);
  background: var(--wt-popover-bg);
  border: 1px solid var(--wt-popover-border-color);
  border-radius: var(--wt-popover-radius);
  padding: var(--wt-popover-padding);
  box-shadow: var(--wt-popover-shadow);
}

:global(:where(.super-popover-floating--light)) {
  --wt-popover-bg: var(--wt-color-bg);
  --wt-popover-color: var(--wt-color-text);
  --wt-popover-shadow: 0 2px 8px rgb(0 0 0 / 12%);
}

.super-popover-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--wt-popover-bg);
  border: 1px solid var(--wt-popover-border-color);
  transform: rotate(45deg);
}
</style>
