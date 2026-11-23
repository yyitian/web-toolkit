<script lang="ts">
import { Comment, Fragment, Text } from 'vue';
import type { PropType, VNode } from 'vue';

export function hasSlotContent(nodes: VNode[]): boolean {
  return nodes.some((node) => {
    if (node.type === Comment) return false;
    if (node.type === Text) return String(node.children ?? '').trim() !== '';
    if (node.type === Fragment)
      return (
        Array.isArray(node.children) && hasSlotContent(node.children as VNode[])
      );
    return true;
  });
}

export default defineComponent({
  inheritAttrs: false,
  props: {
    scope: {
      type: Object as PropType<Record<string, unknown>>,
      default: () => ({}),
    },
  },
  setup(props, { attrs, slots }) {
    return () => {
      const nodes = slots.default?.(props.scope) ?? [];
      return hasSlotContent(nodes) ? h('div', attrs, nodes) : null;
    };
  },
});
</script>
