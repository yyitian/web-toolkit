<script setup>
import DynamicIconDemo from '../examples/demos/DynamicIconDemo.vue';
</script>

# 动态图标

动态图标内部管理状态过渡，由 `SuperIcon` 或 `SuperButton` 自动透传 `active`。

## 交互示例

<ClientOnly><DemoBlock><DynamicIconDemo /></DemoBlock></ClientOnly>

```vue
<script setup lang="ts">
import { SuperButton } from '@yyitian/web-toolkit';
import { DynamicPin } from '@yyitian/web-toolkit/dynamic-icons';

const active = ref(false);
</script>

<template>
  <SuperButton
    :icon="DynamicPin"
    :active="active"
    label="置顶"
    @click="active = !active"
  />
</template>
```

## 可用图标

| 导出名               | 用途               |
| -------------------- | ------------------ |
| `DynamicPin`         | 置顶状态切换       |
| `DynamicAudioLines`  | 音频状态切换       |
| `DynamicChevronLeft` | 展开或方向状态切换 |

动态图标从 `@yyitian/web-toolkit/dynamic-icons` 子路径导入。不要依赖组件源码路径。
