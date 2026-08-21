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
.super-button.el-button {
  color: var(--wt-button-color, var(--el-button-text-color));
  background: var(--wt-button-bg, var(--el-button-bg-color));
  border-color: var(--wt-button-border-color, var(--el-button-border-color));
  border-radius: var(--wt-button-radius, var(--el-border-radius-base, 4px));
  box-shadow: var(--wt-button-shadow, none);
  backdrop-filter: var(
    --wt-button-backdrop-filter,
    var(--wt-backdrop-filter, none)
  );

  &:hover,
  &:focus {
    color: var(--wt-button-hover-color, var(--el-button-hover-text-color));
    background: var(--wt-button-hover-bg, var(--el-button-hover-bg-color));
    border-color: var(
      --wt-button-hover-border-color,
      var(--el-button-hover-border-color)
    );
  }

  &:active {
    color: var(--wt-button-active-color, var(--el-button-active-text-color));
    background: var(--wt-button-active-bg, var(--el-button-active-bg-color));
    border-color: var(
      --wt-button-active-border-color,
      var(--el-button-active-border-color)
    );
  }

  &.is-disabled,
  &.super-button-loading {
    color: var(
      --wt-button-disabled-color,
      var(--el-button-disabled-text-color)
    );
    background: var(
      --wt-button-disabled-bg,
      var(--el-button-disabled-bg-color)
    );
    border-color: var(
      --wt-button-disabled-border-color,
      var(--el-button-disabled-border-color)
    );
  }

  &.is-circle {
    border-radius: var(--wt-button-radius, 50%);
  }

  &.is-round {
    border-radius: var(--wt-button-radius, var(--el-border-radius-round, 20px));
  }

  &.is-text {
    background: var(--wt-button-bg, transparent);
    border-color: var(--wt-button-border-color, transparent);

    &:not(.is-disabled, .super-button-loading):hover,
    &:not(.is-disabled, .super-button-loading):focus {
      color: var(--wt-button-hover-color, var(--el-button-text-color));
      background: var(--wt-button-hover-bg, var(--el-fill-color-light));
      border-color: var(--wt-button-hover-border-color, transparent);
    }

    &:not(.is-disabled, .super-button-loading):active {
      color: var(--wt-button-active-color, var(--el-button-text-color));
      background: var(--wt-button-active-bg, var(--el-fill-color));
      border-color: var(--wt-button-active-border-color, transparent);
    }

    &.is-has-bg {
      background: var(--wt-button-bg, var(--el-fill-color-light));
    }
  }

  &.is-link {
    background: var(--wt-button-bg, transparent);
    border-color: var(--wt-button-border-color, transparent);

    &:not(.is-disabled, .super-button-loading):hover,
    &:not(.is-disabled, .super-button-loading):focus {
      color: var(
        --wt-button-hover-color,
        var(--el-button-hover-link-text-color)
      );
    }

    &:not(.is-disabled, .super-button-loading):active {
      color: var(--wt-button-active-color, var(--el-button-active-color));
    }

    &:hover,
    &:focus,
    &:active,
    &.is-disabled,
    &.super-button-loading {
      background: var(--wt-button-bg, transparent);
      border-color: var(--wt-button-border-color, transparent);
    }
  }

  &:is(.is-plain, .is-dashed):is(.is-disabled, .super-button-loading) {
    color: var(--wt-button-disabled-color, var(--el-button-disabled-bg-color));
    background: var(--wt-button-disabled-bg, var(--el-button-bg-color));
    border-color: var(
      --wt-button-disabled-border-color,
      color-mix(
        in srgb,
        var(--el-button-disabled-bg-color) 25%,
        var(--el-button-bg-color)
      )
    );
  }

  &:is(.is-text, .is-link):is(.is-disabled, .super-button-loading) {
    color: var(
      --wt-button-disabled-color,
      var(--el-button-disabled-text-color)
    );
    background: var(--wt-button-disabled-bg, transparent);
    border-color: var(--wt-button-disabled-border-color, transparent);
  }

  &:is(
      .el-button--primary,
      .el-button--success,
      .el-button--warning,
      .el-button--danger,
      .el-button--info
    ):is(.is-text, .is-link):is(.is-disabled, .super-button-loading) {
    color: var(--wt-button-disabled-color, var(--el-button-disabled-bg-color));
  }
}

.super-button--icon-only {
  :deep(.el-icon) {
    width: var(--wt-button-icon-size, 20px);
    height: var(--wt-button-icon-size, 20px);
    font-size: var(--wt-button-icon-size, 20px);

    > svg,
    .super-icon,
    .super-icon > svg {
      width: var(--wt-button-icon-size, 20px);
      height: var(--wt-button-icon-size, 20px);
    }
  }

  &:focus-visible {
    outline: none;
  }
}

.super-button--icon-only:not(.super-button--square) {
  width: var(--wt-button-icon-size, 20px);
  min-width: var(--wt-button-icon-size, 20px);
  height: var(--wt-button-icon-size, 20px);
  border: 0;
  padding: 0;
  background: var(--wt-button-icon-only-bg, transparent);
  backdrop-filter: var(--wt-button-icon-only-backdrop-filter, none);

  &:hover,
  &:focus,
  &:active {
    border-color: transparent;
    background: var(--wt-button-icon-only-hover-bg, transparent);
  }

  &.is-disabled,
  &.super-button-loading {
    background: var(--wt-button-icon-only-bg, transparent);
    border-color: transparent;
  }
}

.super-button--square {
  &:not([class*='el-button--'], .is-circle, .is-plain, .is-text, .is-link) {
    background: var(--wt-button-icon-only-bg, transparent);
    backdrop-filter: var(--wt-button-icon-only-backdrop-filter, none);

    &:hover,
    &:focus,
    &:active,
    &.is-disabled,
    &.super-button-loading {
      background: var(--wt-button-icon-only-hover-bg, transparent);
    }
  }

  :deep(.el-icon) {
    width: var(--wt-button-icon-size, calc(var(--wt-button-square) * 0.5));
    height: var(--wt-button-icon-size, calc(var(--wt-button-square) * 0.5));
    font-size: var(--wt-button-icon-size, calc(var(--wt-button-square) * 0.5));

    > svg,
    .super-icon,
    .super-icon > svg {
      width: var(--wt-button-icon-size, calc(var(--wt-button-square) * 0.5));
      height: var(--wt-button-icon-size, calc(var(--wt-button-square) * 0.5));
    }
  }
}
</style>
