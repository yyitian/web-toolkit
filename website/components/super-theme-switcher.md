<script setup>
import ThemeSwitcherDemo from '../examples/demos/ThemeSwitcherDemo.vue';
</script>

# SuperThemeSwitcher

切换浅色／暗色和实体／玻璃主题。

## 示例

默认悬停展开主题选项，设置 `variant="inline"` 可直接显示选项。

::: tip 提示
使用前[初始化主题插件](/guide/theming#初始化)。
:::

<ClientOnly><DemoBlock><ThemeSwitcherDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { SuperThemeSwitcher } from '@yyitian/web-toolkit';
</script>

<template>
  <SuperThemeSwitcher />
  <SuperThemeSwitcher variant="inline" />
</template>
```

:::

## API

### Props

| 属性        | 类型                    | 默认值         | 说明                   |
| ----------- | ----------------------- | -------------- | ---------------------- |
| `variant`   | `'popover' \| 'inline'` | `'popover'`    | 浮层或行内形态         |
| `disabled`  | `boolean`               | `false`        | 禁用按钮、浮层和选项组 |
| `placement` | `Placement`             | `'bottom-end'` | Popover 定位方向       |
