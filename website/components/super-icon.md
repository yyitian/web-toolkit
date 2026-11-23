<script setup>
import DynamicIconDemo from '../examples/demos/DynamicIconDemo.vue';
import IconDemo from '../examples/demos/IconDemo.vue';
</script>

# SuperIcon

支持 SVG sprite、Vue 图标组件和加载状态，可通过 `title` 显示提示。

## 基础用法

通过 `icon` 指定图标，`size` 设置尺寸，`rotate` 设置旋转角度。

::: tip 提示
字符串图标需要先通过 [Vite 插件](/guide/vite-plugin)注入。
:::

<ClientOnly><DemoBlock><IconDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { Settings } from '@lucide/vue';
import { SuperIcon } from '@yyitian/web-toolkit';
</script>

<template>
  <SuperIcon icon="example" :size="28" title="SVG sprite 图标" />
  <SuperIcon :icon="Settings" :size="28" title="Lucide 图标" />
  <SuperIcon loading :size="28" title="加载中" />
  <SuperIcon :icon="Settings" :size="28" :rotate="45" title="旋转 45 度" />
</template>
```

:::

## 动态图标

通过 `active` 控制动态图标的激活状态，可与 `SuperIcon` 或 `SuperButton` 一起使用。

`DynamicRunning` 激活时持续旋转，取消激活后立即恢复初始角度，不播放归零动画。

<ClientOnly><DemoBlock><DynamicIconDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ElSwitch } from 'element-plus';
import { SuperButton } from '@yyitian/web-toolkit';
import {
  DynamicPin,
  DynamicAudioLines,
  DynamicChevronLeft,
  DynamicRefresh,
  DynamicFoldLeft,
  DynamicFolder,
  DynamicRunning,
} from '@yyitian/web-toolkit/dynamic-icons';

const active = ref(false);
const icons = [
  { icon: DynamicPin, label: '切换置顶状态' },
  { icon: DynamicAudioLines, label: '切换音频状态' },
  { icon: DynamicChevronLeft, label: '切换箭头状态' },
  { icon: DynamicRefresh, label: '切换刷新状态' },
  { icon: DynamicFoldLeft, label: '切换左侧展开状态' },
  { icon: DynamicFolder, label: '切换文件夹开关状态' },
  { icon: DynamicRunning, label: '切换运行状态' },
];
</script>

<template>
  <ElSwitch v-model="active" aria-label="切换动态图标激活状态" />
  <SuperButton
    v-for="item in icons"
    :key="item.label"
    :icon="item.icon"
    :active="active"
    :label="item.label"
    :aria-pressed="active"
    @click="active = !active"
  />
</template>
```

:::

## API

### Props

| 属性      | 类型                          | 默认值   | 说明                           |
| --------- | ----------------------------- | -------- | ------------------------------ |
| `icon`    | `string \| Component`         | `''`     | sprite 名称或 Vue 图标组件     |
| `title`   | `string`                      | `''`     | 非空时显示 tooltip             |
| `size`    | `string \| number`            | `20`     | 图标宽高                       |
| `rotate`  | `number`                      | `0`      | 旋转角度，支持负数             |
| `loading` | `boolean`                     | `false`  | 使用内置 spinner               |
| `active`  | `boolean`                     | `false`  | 动态图标激活状态               |
| `effect`  | `'auto' \| 'dark' \| 'light'` | `'auto'` | tooltip 跟随主题或固定实体外观 |

### 动态图标导出

| 导出名               | 用途                                   |
| -------------------- | -------------------------------------- |
| `DynamicPin`         | 置顶状态切换                           |
| `DynamicAudioLines`  | 音频状态切换                           |
| `DynamicChevronLeft` | 展开或方向状态切换                     |
| `DynamicRefresh`     | 激活时顺时针持续旋转，取消后平滑归零   |
| `DynamicFoldLeft`    | 左侧展开/收起                          |
| `DynamicFolder`      | 文件夹关闭/打开状态切换                |
| `DynamicRunning`     | 激活时持续旋转，取消后立即恢复初始角度 |

### 注意事项

`loading` 优先于 `icon`。可交互图标应在按钮上提供无障碍名称，`title` 仅用于提示。
