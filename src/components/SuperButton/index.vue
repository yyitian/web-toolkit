<script lang="ts">
import { ElButton, buttonProps } from 'element-plus';
import type { ButtonProps } from 'element-plus';
import {
  mergeProps,
  type Component,
  type CSSProperties,
  type PropType,
} from 'vue';
import SuperIcon from '../SuperIcon/index.vue';
import SuperPopover from '../SuperPopover/index.vue';

const SUPER_BUTTON_PROP_KEYS = new Set([
  'icon',
  'label',
  'square',
  'active',
  'loading',
]);

export interface SuperButtonProps extends Omit<
  ButtonProps,
  'icon' | 'loading'
> {
  icon?: string | Component;
  label?: string;
  square?: number;
  active?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

export default defineComponent({
  inheritAttrs: false,
  props: {
    ...buttonProps,
    icon: {
      type: [String, Object, Function] as PropType<string | Component>,
      default: '',
    },
    label: { type: String, default: '' },
    square: { type: Number, default: undefined },
    active: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  setup(props, { attrs, slots }) {
    function renderButton(setReference?: (value: unknown) => void) {
      const elButtonProps = Object.fromEntries(
        Object.entries(props).filter(
          ([propName]) => !SUPER_BUTTON_PROP_KEYS.has(propName),
        ),
      );
      const hasIcon = Boolean(props.icon || slots.icon);
      const hasDefaultSlot = Boolean(slots.default);
      const isIconOnly = hasIcon && !hasDefaultSlot;
      const normalizedSquare =
        typeof props.square === 'number' &&
        Number.isFinite(props.square) &&
        props.square > 0
          ? props.square
          : undefined;
      const isSquare = isIconOnly && normalizedSquare != null;

      const internalStyle: CSSProperties = isSquare
        ? {
            '--wt-button-square': `${normalizedSquare}px`,
            width: 'var(--wt-button-square)',
            minWidth: 'var(--wt-button-square)',
            height: 'var(--wt-button-square)',
            padding: '0',
          }
        : {};

      const ariaLabel =
        attrs['aria-label'] ??
        (isIconOnly && props.label ? props.label : undefined);
      const buttonAttrs = mergeProps(elButtonProps, attrs, {
        ref: setReference,
        class: [
          'super-button',
          {
            'super-button--icon-only': isIconOnly,
            'super-button--square': isSquare,
            'super-button-loading': props.loading,
          },
        ],
        style: internalStyle,
        disabled: props.disabled || props.loading,
        'aria-label': ariaLabel,
        'aria-busy': props.loading || undefined,
      });

      const resolvedSlots: Record<string, () => unknown> = {};
      if (hasIcon || props.loading) {
        resolvedSlots.icon = () => {
          if (props.loading) {
            return h(SuperIcon, { loading: true });
          }
          if (slots.icon) return slots.icon();
          return h(SuperIcon, { icon: props.icon, active: props.active });
        };
      }
      if (hasDefaultSlot) {
        resolvedSlots.default = () => slots.default?.();
      } else if (!hasIcon && props.label) {
        resolvedSlots.default = () => props.label;
      }

      return h(ElButton, buttonAttrs, resolvedSlots);
    }

    return () => {
      const hasIcon = Boolean(props.icon || slots.icon);
      const isIconOnly = hasIcon && !slots.default;

      if (isIconOnly && props.label) {
        return h(
          SuperPopover,
          { title: props.label },
          {
            reference: ({
              setReference,
            }: {
              setReference: (value: unknown) => void;
            }) => renderButton(setReference),
          },
        );
      }

      return renderButton();
    };
  },
});
</script>

<style lang="scss" scoped>
.super-button--icon-only {
  --wt-button-icon-size: 20px;

  :deep(.el-icon) {
    width: var(--wt-button-icon-size);
    height: var(--wt-button-icon-size);
    font-size: var(--wt-button-icon-size);

    > svg,
    .super-icon,
    .super-icon > svg {
      width: var(--wt-button-icon-size);
      height: var(--wt-button-icon-size);
    }
  }

  &:focus-visible {
    outline: none;
  }
}

.super-button--icon-only:not(.super-button--square) {
  width: var(--wt-button-icon-size);
  min-width: var(--wt-button-icon-size);
  height: var(--wt-button-icon-size);
  border: 0;
  padding: 0;
  background: transparent;

  &:hover,
  &:focus,
  &:active {
    border-color: transparent;
    background: transparent;
  }
}

.super-button--square {
  --wt-button-icon-size: calc(var(--wt-button-square) * 0.5);
}
</style>
