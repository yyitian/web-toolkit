<script lang="ts">
import { defineComponent, type Component, type PropType } from 'vue';
import SuperPopover from '../SuperPopover/index.vue';

export default defineComponent({
  props: {
    icon: {
      // Component 可为对象(SFC/defineComponent)或函数(lucide 等函数式组件),故须含 Function
      type: [String, Object, Function] as PropType<string | Component>,
      default: '',
    },
    title: { type: String, default: '' },
    size: { type: [String, Number], default: 20 },
    rotate: { type: Number, default: 0 },
    loading: { type: Boolean },
    active: { type: Boolean },
    effect: { type: String as () => 'dark' | 'light', default: 'dark' },
  },
  setup(props) {
    function renderComponentIcon(icon: Component) {
      const isDynamic = (icon as Record<string, unknown>)?.dynamicIcon === true;
      return h(icon, {
        size: props.size,
        ...(isDynamic ? { active: props.active } : {}),
      });
    }

    function renderSpriteIcon(name: string) {
      return h(
        'svg',
        { width: props.size, height: props.size, ariaHidden: true },
        h('use', { href: `#icon-${name}` }),
      );
    }

    // 内联 SVG spinner，沿用 .loading 旋转动画，SuperIcon 不再依赖 lucide Loader
    function renderLoading() {
      return h(
        'svg',
        {
          width: props.size,
          height: props.size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 2,
          'stroke-linecap': 'round',
          ariaHidden: true,
        },
        h('path', { d: 'M21 12a9 9 0 1 1-6.219-8.56' }),
      );
    }

    function renderIcon() {
      const icon =
        typeof props.icon === 'string'
          ? props.icon
            ? renderSpriteIcon(props.icon)
            : undefined
          : renderComponentIcon(props.icon);
      const transform = `rotate(${props.rotate}deg)`;
      return h(
        'span',
        {
          class: ['super-icon', { loading: props.loading }],
          style: {
            // 负角度(如 -90)同样应生效;仅 loading 时让位给旋转动画
            transform: !props.loading && transform,
          },
        },
        props.loading ? renderLoading() : icon,
      );
    }

    function renderPopover() {
      return h(
        SuperPopover,
        { title: props.title, effect: props.effect },
        { default: renderIcon },
      );
    }

    return () => (props.title ? renderPopover() : renderIcon());
  },
});
</script>

<style lang="scss" scoped>
.super-icon {
  @include flex-align-center;
  position: relative;
  cursor: pointer;
  &.loading {
    animation: loading 1.2s linear infinite;
  }
}

@keyframes loading {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
