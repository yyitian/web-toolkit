<script setup>
import PopoverDemo from '../examples/demos/PopoverDemo.vue';
</script>

# SuperPopover

基于 Floating UI 的浮层组件，支持 hover、click 和 manual 三种触发方式。参考节点通过唯一
的 `reference` scoped slot 注册，不会生成额外包装节点。

## 交互示例

<ClientOnly><DemoBlock><PopoverDemo /></DemoBlock></ClientOnly>

```vue
<SuperPopover title="提示内容">
  <template #reference="{ setReference }">
    <button :ref="setReference">Hover</button>
  </template>
</SuperPopover>
```

## Props

| 属性                  | 类型                                          | 默认值                    | 说明                                        |
| --------------------- | --------------------------------------------- | ------------------------- | ------------------------------------------- |
| `modelValue`          | `boolean`                                     | `false`                   | 浮层可见状态                                |
| `placement`           | `Placement`                                   | `'top'`                   | Floating UI 定位方向                        |
| `offset`              | `number`                                      | `12`                      | 浮层与参考节点的距离                        |
| `effect`              | `'dark' \| 'light'`                           | `'dark'`                  | 默认外观                                    |
| `title`               | `string`                                      | `''`                      | 无 `content` 插槽时的内容                   |
| `teleportTo`          | `string \| HTMLElement \| false`              | `'body'`                  | Teleport 目标；`false` 时渲染为真实兄弟节点 |
| `trigger`             | `'hover' \| 'click' \| 'manual'`              | `'hover'`                 | 触发方式                                    |
| `disabled`            | `boolean`                                     | `false`                   | 禁止打开并关闭现有浮层                      |
| `arrow`               | `boolean`                                     | `true`                    | 是否显示箭头                                |
| `delay`               | `number \| { open?: number; close?: number }` | `{ open: 0, close: 120 }` | 打开和关闭延迟                              |
| `closeOnClickOutside` | `boolean`                                     | `true`                    | click/manual 模式下点击外部关闭             |
| `popperClass`         | 任意 class 值                                 | `undefined`               | 应用到浮层自身的 class                      |
| `popperStyle`         | `StyleValue`                                  | `undefined`               | 应用到浮层自身的样式                        |

## Events

| 事件                | 参数                 | 说明         |
| ------------------- | -------------------- | ------------ |
| `update:modelValue` | `(visible: boolean)` | 可见状态变化 |

## Slots

| 插槽        | 参数               | 说明                                             |
| ----------- | ------------------ | ------------------------------------------------ |
| `reference` | `{ setReference }` | 必须把 `setReference` 绑定到真实参考元素的 `ref` |
| `content`   | —                  | 自定义浮层内容，优先于 `title`                   |

## Teleport 与样式

默认浮层位于 `body`，不要依赖触发器祖先的 scoped 样式。使用 `popperClass` 或
`popperStyle` 把变量应用到浮层自身，详情参阅[主题定制](/guide/theming)。
