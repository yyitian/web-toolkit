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
      type: String as PropType<'auto' | 'dark' | 'light'>,
      default: 'auto',
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
            `super-popover-floating--${props.effect}`,
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
.super-popover-floating {
  @include font(
    12px,
    $color: var(--wt-popover-color, var(--_wt-popover-color, #fff))
  );

  z-index: var(--wt-popover-z-index, 2000);
  max-width: var(--wt-popover-max-width, 400px);
  background: var(--wt-popover-bg, var(--_wt-popover-bg, #222));
  border: 1px solid
    var(--wt-popover-border-color, var(--_wt-popover-border-color, #222));
  border-radius: var(--wt-popover-radius, var(--wt-radius-base, 4px));
  padding: var(--wt-popover-padding, 4px 6px);
  box-shadow: var(--wt-popover-shadow, var(--_wt-popover-shadow, none));
  backdrop-filter: var(
    --wt-popover-backdrop-filter,
    var(--_wt-popover-backdrop-filter, none)
  );
}

:global(:where(.super-popover-floating--auto, .super-popover-floating--dark)) {
  --_wt-popover-bg: #222;
  --_wt-popover-color: #fff;
  --_wt-popover-border-color: #222;
  --_wt-popover-shadow: none;
  --_wt-popover-backdrop-filter: none;
}

:global(:where(.super-popover-floating--light)) {
  --_wt-popover-bg: #fff;
  --_wt-popover-color: #303133;
  --_wt-popover-border-color: #e4e7ed;
  --_wt-popover-shadow: 0 2px 8px rgb(0 0 0 / 12%);
  --_wt-popover-backdrop-filter: none;
}

:global(:where(:root[data-wt-scheme] .super-popover-floating--auto)) {
  --_wt-popover-bg: var(--wt-surface-overlay, #fff);
  --_wt-popover-color: var(--wt-text-regular, #606266);
  --_wt-popover-border-color: var(--wt-border-color-light, #e4e7ed);
  --_wt-popover-shadow: var(--wt-shadow-overlay, none);
  --_wt-popover-backdrop-filter: var(--wt-backdrop-filter, none);
}

:global(:where(:root[data-wt-material='glass'] .super-popover-floating--auto)) {
  --_wt-popover-bg:
    radial-gradient(
      circle at 20% 0%,
      var(--wt-glass-highlight),
      transparent 34%
    ),
    var(--wt-surface-overlay);
}

.super-popover-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--wt-popover-bg, var(--_wt-popover-bg, #222));
  border: 1px solid
    var(--wt-popover-border-color, var(--_wt-popover-border-color, #222));
  transform: rotate(45deg);
}
</style>
