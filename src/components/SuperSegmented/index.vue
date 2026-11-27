<script lang="ts">
import { ElSegmented, segmentedProps } from 'element-plus';
import { mergeProps } from 'vue';
import { revealSegmentedItem } from './scroll.ts';
import type { SuperSegmentedInstance } from './types.ts';

const SuperSegmented = defineComponent({
  name: 'SuperSegmented',
  inheritAttrs: false,
  props: segmentedProps,
  setup(props, { attrs, slots, expose }) {
    const segmented = shallowRef<SuperSegmentedInstance>();
    let observer: ResizeObserver | undefined;
    let observedRoot: HTMLElement | undefined;
    let observedGroup: Element | null | undefined;

    expose(
      new Proxy({} as SuperSegmentedInstance, {
        get(target, key, receiver) {
          if (Reflect.has(target, key))
            return Reflect.get(target, key, receiver);
          const instance = segmented.value;
          const value = instance && Reflect.get(instance, key, instance);
          return typeof value === 'function' ? value.bind(instance) : value;
        },
        has(target, key) {
          return (
            Reflect.has(target, key) ||
            Boolean(segmented.value && key in segmented.value)
          );
        },
        set(target, key, value) {
          if (Reflect.has(target, key)) return Reflect.set(target, key, value);
          return Boolean(
            segmented.value && Reflect.set(segmented.value, key, value),
          );
        },
      }),
    );

    function rootElement(): HTMLElement | undefined {
      const element = segmented.value?.$el;
      return element?.nodeType === 1 ? element : undefined;
    }

    function revealSelected() {
      const root = rootElement();
      if (root && props.direction !== 'vertical') revealSegmentedItem(root);
    }

    function syncLayout() {
      const root = rootElement();
      const group = root?.querySelector('.el-segmented__group');
      if (root !== observedRoot || group !== observedGroup) {
        observer?.disconnect();
        observedRoot = root;
        observedGroup = group;
        if (root && typeof ResizeObserver !== 'undefined') {
          observer ??= new ResizeObserver(revealSelected);
          observer.observe(root);
          if (group) observer.observe(group);
        }
      }
      revealSelected();
    }

    onMounted(syncLayout);
    onUpdated(syncLayout);
    onBeforeUnmount(() => {
      observer?.disconnect();
      observedRoot = undefined;
      observedGroup = undefined;
    });

    function revealFocus(event: FocusEvent) {
      const root = rootElement();
      const target = event.target as HTMLElement | null;
      if (root && props.direction !== 'vertical')
        revealSegmentedItem(
          root,
          target?.closest('.el-segmented__item') ?? null,
        );
    }

    return () =>
      h(
        ElSegmented,
        mergeProps(props, attrs, {
          ref: segmented,
          class: [
            'super-segmented',
            { 'super-segmented--vertical': props.direction === 'vertical' },
          ],
          onFocusin: revealFocus,
        }),
        slots,
      );
  },
});

// 保留原生泛型选项及插槽推导，不声明底层没有提供的业务方法。
export default SuperSegmented as unknown as typeof ElSegmented;
</script>

<style scoped lang="scss">
@use '../../styles/typography' as typography;

.super-segmented.el-segmented {
  @include typography.context;
  --el-segmented-bg-color: var(
    --wt-segmented-bg,
    var(--wt-surface-raised, var(--el-fill-color-light, #f5f7fa))
  );
  --el-segmented-color: var(
    --wt-segmented-color,
    var(--wt-text-regular, #475569)
  );
  --el-segmented-item-hover-color: var(
    --wt-segmented-hover-color,
    var(--wt-text-primary, #303133)
  );
  --el-segmented-item-hover-bg-color: var(
    --wt-segmented-hover-bg,
    var(--el-fill-color-dark, #ebedf0)
  );
  --el-segmented-item-active-bg-color: var(
    --wt-segmented-active-bg,
    var(--el-fill-color-darker, #e6e8eb)
  );
  --el-segmented-item-selected-bg-color: var(
    --wt-segmented-selected-bg,
    var(--wt-color-primary, var(--el-color-primary, #3156ff))
  );
  --el-segmented-item-selected-color: var(
    --wt-segmented-selected-color,
    var(--wt-text-inverse, #fff)
  );
  --el-segmented-item-disabled-color: var(
    --wt-segmented-disabled-color,
    var(--wt-text-disabled, var(--el-disabled-text-color, #a8abb2))
  );
  --el-segmented-item-selected-disabled-bg-color: var(
    --wt-segmented-selected-disabled-bg,
    var(--el-color-primary-light-5, #98abff)
  );
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  box-shadow: inset 0 0 0 1px
    var(
      --wt-segmented-border-color,
      var(
        --_wt-control-border,
        var(--wt-border-color-strong, var(--el-border-color, #cdd0d6))
      )
    );
  backdrop-filter: var(
    --wt-segmented-backdrop-filter,
    var(--wt-backdrop-filter, none)
  );
  font-size: var(--wt-segmented-font-size, var(--el-font-size-base, 14px));
  font-weight: var(--wt-font-weight-regular, 400);

  &.is-block {
    width: 100%;
  }

  :deep(.el-segmented__group) {
    flex: 0 0 auto;
    width: max-content;
    min-width: 100%;
    flex-wrap: nowrap;
  }

  :deep(.el-segmented__item) {
    min-width: max-content;
    white-space: nowrap;
  }

  // 等宽轨道由最长选项确定最小宽度，空间不足时整体滚动，不压缩文字。
  &.is-block:not(.super-segmented--vertical) :deep(.el-segmented__group) {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(max-content, 1fr);
  }

  :deep(.el-segmented__item:has(.el-segmented__item-input:focus-visible)) {
    outline: 2px solid
      var(
        --wt-segmented-focus-color,
        var(--el-segmented-item-selected-bg-color)
      );
    outline-offset: -2px;
  }

  &.el-segmented--small {
    font-size: var(--wt-segmented-font-size, var(--el-font-size-small, 12px));
  }

  &.el-segmented--large {
    font-size: var(--wt-segmented-font-size, var(--el-font-size-large, 16px));
  }

  &.super-segmented--vertical {
    overflow: visible;
    :deep(.el-segmented__group) {
      width: 100%;
      min-width: 0;
    }
    :deep(.el-segmented__item) {
      min-width: 0;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .super-segmented :deep(.el-segmented__item-selected),
  .super-segmented :deep(.el-segmented__item-label) {
    transition: none;
  }
}
</style>
