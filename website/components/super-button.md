<script setup>
import ButtonBasicDemo from '../examples/demos/ButtonBasicDemo.vue';
import ButtonIconDemo from '../examples/demos/ButtonIconDemo.vue';
</script>

# SuperButton

提供文字、图标和纯图标按钮，支持提示、精确正方形尺寸与加载状态。

## 基础用法

通过 `label` 或默认插槽设置文字，使用 `type`、`plain`、`text` 等属性设置外观。

<ClientOnly><DemoBlock><ButtonBasicDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Save } from '@lucide/vue';
import { SuperButton } from '@yyitian/web-toolkit';

const loading = ref(false);
function save() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 1500);
}
</script>

<template>
  <SuperButton label="普通按钮" />
  <SuperButton :icon="Save" type="primary" :loading="loading" @click="save">
    {{ loading ? '保存中' : '模拟保存' }}
  </SuperButton>
  <SuperButton type="primary" :loading="loading" @click="save">
    {{ loading ? '保存中' : '模拟保存' }}
  </SuperButton>
  <SuperButton type="danger" disabled>禁用</SuperButton>

  <SuperButton type="primary">默认按钮</SuperButton>
  <SuperButton type="success" plain>朴素按钮</SuperButton>
  <SuperButton type="warning" dashed>虚线按钮</SuperButton>
  <SuperButton type="danger" round>圆角按钮</SuperButton>
  <SuperButton type="primary" text>文字按钮</SuperButton>
  <SuperButton type="primary" link>链接按钮</SuperButton>
</template>
```

:::

## 图标模式

传入 `icon` 且不提供默认插槽时显示纯图标按钮，`label` 提供提示与无障碍名称。
使用 `square` 设置边长，配合 `circle` 显示圆形按钮。

表格操作列和卡片操作栏推荐使用 `:square="32"` 的纯图标按钮，图标默认 16px，并通过 `label` 提供提示与无障碍名称。无需显式设置 `size`，继续继承 Element Plus 默认尺寸和外层配置；`square` 决定按钮的精确边长。

```vue
<SuperButton :icon="Settings" :square="32" label="配置" />
```

::: tip 提示
字符串图标需要先通过 [Vite 插件](/guide/vite-plugin)注入。
:::

<ClientOnly><DemoBlock><ButtonIconDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import {
  Bell,
  Download,
  RefreshCw,
  Search,
  Settings,
  Upload,
} from '@lucide/vue';
import { SuperButton } from '@yyitian/web-toolkit';
</script>

<template>
  <SuperButton :icon="Search" label="搜索" />
  <SuperButton :icon="RefreshCw" label="loading" loading />
  <SuperButton :icon="Search" label="禁用" disabled />

  <SuperButton type="primary" :icon="Settings" label="设置" :square="36" />
  <SuperButton
    type="success"
    :icon="Upload"
    label="上传中"
    :square="36"
    loading
  />
  <SuperButton type="warning" :icon="Bell" label="通知" :square="36" circle />
  <SuperButton
    type="danger"
    :icon="Download"
    label="禁用"
    :square="36"
    disabled
    circle
  />
</template>
```

:::

## API

### 自有 Props

除下表外，组件支持 Element Plus Button 的其他属性。

| 属性       | 类型                  | 默认值      | 说明                                                      |
| ---------- | --------------------- | ----------- | --------------------------------------------------------- |
| `icon`     | `string \| Component` | `''`        | sprite 名称或 Vue 图标组件                                |
| `label`    | `string`              | `''`        | 无默认插槽时可作为文字；纯图标时作为 tooltip 和无障碍名称 |
| `square`   | `number`              | `undefined` | 纯图标按钮的精确正方形边长，必须大于 0                    |
| `active`   | `boolean`             | `false`     | 动态图标的激活状态                                        |
| `loading`  | `boolean`             | `false`     | 显示加载状态并禁用点击                                    |
| `disabled` | `boolean`             | `false`     | 禁用按钮                                                  |

### Slots

| 插槽      | 说明                                      |
| --------- | ----------------------------------------- |
| `default` | 按钮文字；存在时不进入纯图标形态          |
| `icon`    | 自定义图标，优先于 `icon` prop 的渲染内容 |

支持 Element Plus Button 事件和其他原生属性。

### 文字主题

字号与颜色定制参阅[文字层级与排版](/guide/theming#文字层级与排版)。
`square` 设置的图标按钮尺寸不随文字字号变化。
