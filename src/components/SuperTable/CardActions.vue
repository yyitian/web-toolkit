<script lang="ts">
import { hasSlotContent } from './SlotRegion.vue';

export default defineComponent({
  inheritAttrs: false,
  props: { image: Boolean, always: Boolean },
  setup(props, { slots, attrs }) {
    return () => {
      const nodes = slots.default?.() ?? [];
      return hasSlotContent(nodes)
        ? h(
            'div',
            {
              ...attrs,
              class: [
                'super-table-card__actions',
                attrs.class,
                { 'is-image': props.image, 'is-always': props.always },
              ],
            },
            nodes,
          )
        : null;
    };
  },
});
</script>

<style>
.super-table-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 24px;
  padding: 4px 12px;
  box-sizing: border-box;
  border: 0;
  border-radius: var(
    --wt-table-card-actions-radius,
    var(--wt-radius-large, 8px)
  );
  background: var(--wt-table-card-actions-bg, transparent);
  box-shadow: var(--wt-table-card-actions-shadow, none);
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scrollbar-width: thin;
  opacity: 0;
  transform: translateY(2px);
  visibility: hidden;
  transition:
    transform var(--wt-motion-duration-fast, 120ms) ease,
    opacity var(--wt-motion-duration-fast, 120ms) ease,
    visibility var(--wt-motion-duration-fast, 120ms);
}
.super-table-card__actions > * {
  flex: none;
}
.super-table-card__actions > .el-button + .el-button {
  margin-left: 0;
}
.super-table-card__actions.is-image {
  position: absolute;
  right: 12px;
  bottom: 12px;
  max-width: calc(100% - 24px);
  background: var(
    --wt-table-card-actions-bg,
    var(--wt-table-card-overlay-bg, var(--wt-surface-overlay))
  );
  box-shadow: var(--wt-table-card-actions-shadow, var(--wt-shadow-overlay));
  backdrop-filter: var(--wt-backdrop-filter, none);
}
.super-table-card__actions.is-always,
.super-table-card:hover .super-table-card__actions,
.super-table-card:focus-within .super-table-card__actions {
  opacity: 1;
  transform: none;
  visibility: visible;
}
@media (hover: none) {
  .super-table-card__actions {
    opacity: 1;
    transform: none;
    visibility: visible;
  }
}
@media (prefers-reduced-motion: reduce) {
  .super-table-card__actions {
    transition: none;
    transform: none;
  }
}
</style>
