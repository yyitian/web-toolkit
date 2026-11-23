<script lang="ts">
import { hasSlotContent } from './SlotRegion.vue';
import CardFooterActions from './CardFooterActions.vue';
import { useCardFooterLayout } from './useCardFooterLayout.ts';
import type { CardActionSize } from './useCardFooterLayout.ts';
import type { SuperTableCardActionsScope } from './card-types.ts';

export default defineComponent({
  props: { always: Boolean, blocked: Boolean },
  setup(props, { slots }) {
    const footer = ref<HTMLElement>();
    const time = ref<HTMLElement>();
    const size = ref<CardActionSize>({ width: 0, height: 32 });
    const { collapsed, stacked } = useCardFooterLayout(footer, time, size);
    return () => {
      const content = slots.default?.() ?? [];
      const hasTime = hasSlotContent(content);
      const hasActions = hasSlotContent(
        slots.actions?.({ overflow: false, close: () => {} }) ?? [],
      );
      if (!hasTime && !hasActions) return null;
      return h(
        'div',
        {
          ref: footer,
          class: ['super-table-card__footer', { 'is-stacked': stacked.value }],
          style: {
            minHeight: `${hasActions ? (collapsed.value ? 32 : Math.max(32, size.value.height)) : 24}px`,
          },
        },
        [
          hasTime
            ? h('div', { class: 'super-table-card__time' }, [
                h(
                  'div',
                  { ref: time, class: 'super-table-card__time-content' },
                  content,
                ),
              ])
            : null,
          hasActions
            ? h(
                CardFooterActions,
                {
                  always: props.always,
                  blocked: props.blocked,
                  collapsed: collapsed.value,
                  onSize: (value: CardActionSize) => {
                    size.value = value;
                  },
                },
                {
                  default: (scope: SuperTableCardActionsScope) =>
                    slots.actions?.(scope),
                },
              )
            : null,
        ],
      );
    };
  },
});
</script>

<style scoped lang="scss">
@use '../../styles/typography' as typography;
.super-table-card__footer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px 8px;
  box-sizing: border-box;
  min-width: 0;
  min-height: 24px;
  margin-top: auto;
}
.super-table-card__time {
  @include typography.text(caption);
  flex: 1;
  min-width: 0;
}
.super-table-card__time-content {
  width: max-content;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.super-table-card__footer.is-stacked {
  flex-wrap: wrap;
  .super-table-card__time {
    flex-basis: 100%;
  }
  .super-table-card__time-content {
    width: auto;
    white-space: normal;
    overflow-wrap: anywhere;
  }
}
</style>
