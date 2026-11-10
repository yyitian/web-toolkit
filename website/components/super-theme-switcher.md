<script setup>
import ThemeSwitcherDemo from '../examples/demos/ThemeSwitcherDemo.vue';
</script>

# SuperThemeSwitcher

提供开箱即用的双轴主题切换界面。组件读取 `createWtTheme()` 注入的状态，不自行创建或
持久化主题。

## 示例

<ClientOnly><DemoBlock><ThemeSwitcherDemo /></DemoBlock></ClientOnly>

```vue
<SuperThemeSwitcher />
<SuperThemeSwitcher variant="inline" />
```

Popover 形态通过桌面鼠标 hover 打开，内容使用两个 Radio group 分别控制色系和材质。
需要安装 `element-plus` 和 `@lucide/vue`；主题插件初始化参阅[主题定制](/guide/theming)。

## Props

| 属性        | 类型                    | 默认值         | 说明                   |
| ----------- | ----------------------- | -------------- | ---------------------- |
| `variant`   | `'popover' \| 'inline'` | `'popover'`    | 浮层或行内形态         |
| `disabled`  | `boolean`               | `false`        | 禁用按钮、浮层和选项组 |
| `placement` | `Placement`             | `'bottom-end'` | Popover 定位方向       |
