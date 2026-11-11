<script lang="ts">
import { Comment, Fragment, Text } from 'vue';
import type { VNode } from 'vue';

function hasContent(nodes: VNode[]): boolean {
  return nodes.some((node) => {
    if (node.type === Comment) return false;
    if (node.type === Text) return String(node.children ?? '').trim() !== '';
    if (node.type === Fragment)
      return (
        Array.isArray(node.children) && hasContent(node.children as VNode[])
      );
    return true;
  });
}

export default defineComponent({
  setup(_, { slots }) {
    return () => {
      const nodes = slots.default?.() ?? [];
      return hasContent(nodes)
        ? h('div', { class: 'super-table__before-header' }, nodes)
        : null;
    };
  },
});
</script>
