<script lang="ts">
import { ElTag, tagProps } from 'element-plus';
import { mergeProps } from 'vue';
import { useOptionalWtTheme } from '../../theme/index.ts';
import type { SuperTagInstance } from './types.ts';

const SuperTag = defineComponent({
  name: 'SuperTag',
  inheritAttrs: false,
  props: {
    ...tagProps,
    effect: {
      ...tagProps.effect,
      type: tagProps.effect.type,
      default: undefined,
    },
  },
  setup(props, { attrs, slots, expose }) {
    const theme = useOptionalWtTheme();
    const elTag = shallowRef<SuperTagInstance>();

    // 实时访问底层实例，避免挂载前复制空引用或丢失方法的 this。
    expose(
      new Proxy({} as SuperTagInstance, {
        get(target, key, receiver) {
          if (Reflect.has(target, key))
            return Reflect.get(target, key, receiver);
          const instance = elTag.value;
          const value = instance && Reflect.get(instance, key, instance);
          return typeof value === 'function' ? value.bind(instance) : value;
        },
        has(target, key) {
          return (
            Reflect.has(target, key) ||
            Boolean(elTag.value && key in elTag.value)
          );
        },
        set(target, key, value) {
          if (Reflect.has(target, key)) return Reflect.set(target, key, value);
          return Boolean(elTag.value && Reflect.set(elTag.value, key, value));
        },
      }),
    );

    return () =>
      h(
        ElTag,
        mergeProps(props, attrs, {
          ref: elTag,
          class: 'super-tag',
          effect:
            props.effect ?? (theme?.scheme.value === 'dark' ? 'dark' : 'light'),
        }),
        slots,
      );
  },
});

// 保留底层属性、事件、插槽及公开实例的消费方类型。
export default SuperTag as typeof ElTag;
</script>

<style scoped lang="scss">
@use '../../styles/typography' as typography;
.super-tag.el-tag {
  @include typography.context;
  --el-tag-font-size: var(--wt-font-size-caption, 12px);
  font-weight: var(--wt-font-weight-regular, 400);
}
</style>
