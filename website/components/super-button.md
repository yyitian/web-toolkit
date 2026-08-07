<script setup>
import ButtonBasicDemo from '../examples/demos/ButtonBasicDemo.vue';
import ButtonIconDemo from '../examples/demos/ButtonIconDemo.vue';
</script>

# SuperButton

在 Element Plus `ElButton` 基础上统一接入 `SuperIcon`、纯图标形态、tooltip、精确正方形
尺寸和组件自有 loading 状态。

## 基础内容

<ClientOnly><DemoBlock><ButtonBasicDemo /></DemoBlock></ClientOnly>

```vue
<script setup lang="ts">
import { Save } from '@lucide/vue';
import { SuperButton } from '@yyitian/web-toolkit';

const loading = ref(false);

function startLoading() {
  loading.value = true;
  window.setTimeout(() => {
    loading.value = false;
  }, 2000);
}
</script>

<template>
  <!-- 文字 -->
  <SuperButton type="primary">普通按钮</SuperButton>

  <!-- 文字 + icon -->
  <SuperButton type="primary" :icon="Save">保存</SuperButton>

  <!-- Disabled -->
  <SuperButton type="primary" disabled>禁用按钮</SuperButton>

  <!-- Loading -->
  <SuperButton
    type="primary"
    :icon="Save"
    :loading="loading"
    @click="startLoading"
  >
    保存
  </SuperButton>
  <SuperButton type="primary" :loading="loading" @click="startLoading">
    加载数据
  </SuperButton>
</template>
```

`label` 在没有图标和默认插槽时作为按钮文字；在纯图标形态下则作为 tooltip 和默认
无障碍名称。字符串图标需要先通过[Vite 插件](/guide/vite-plugin)注入。

## 纯图标

<ClientOnly><DemoBlock><ButtonIconDemo /></DemoBlock></ClientOnly>

```vue
<script setup lang="ts">
import {
  Bell,
  BellOff,
  Download,
  RefreshCw,
  Search,
  Settings,
  Upload,
} from '@lucide/vue';
import { SuperButton } from '@yyitian/web-toolkit';

const loading = ref(false);

function startLoading() {
  loading.value = true;
  window.setTimeout(() => {
    loading.value = false;
  }, 2000);
}
</script>

<template>
  <!-- 裸 icon -->
  <SuperButton :icon="Search" />

  <!-- icon + label -->
  <SuperButton :icon="Settings" label="设置" />

  <!-- Square -->
  <SuperButton :icon="Bell" label="通知" :square="36" />

  <!-- Disabled -->
  <SuperButton :icon="BellOff" label="禁用通知" disabled />

  <!-- Loading -->
  <SuperButton :icon="RefreshCw" :loading="loading" @click="startLoading" />
  <SuperButton
    :icon="Download"
    label="下载"
    :loading="loading"
    @click="startLoading"
  />
  <SuperButton
    :icon="Upload"
    label="上传"
    :square="36"
    :loading="loading"
    @click="startLoading"
  />
</template>
```

未设置 `square` 的纯图标按钮使用无边框紧凑形态；设置后，`square` 就是按钮的精确
边长。spinner 只替换图标，不会改变既有按钮形态。

## 自有 Props

除下表外，组件支持 Element Plus Button 的其他属性。

| 属性       | 类型                  | 默认值      | 说明                                                      |
| ---------- | --------------------- | ----------- | --------------------------------------------------------- |
| `icon`     | `string \| Component` | `''`        | 直接透传给 `SuperIcon`                                    |
| `label`    | `string`              | `''`        | 无默认插槽时可作为文字；纯图标时作为 tooltip 和无障碍名称 |
| `square`   | `number`              | `undefined` | 纯图标按钮的精确正方形边长，必须大于 0                    |
| `active`   | `boolean`             | `false`     | 透传给动态图标                                            |
| `loading`  | `boolean`             | `false`     | 显示内置 spinner、设置 `aria-busy` 并禁用点击             |
| `disabled` | `boolean`             | `false`     | 禁用按钮                                                  |

## Slots

| 插槽      | 说明                                      |
| --------- | ----------------------------------------- |
| `default` | 按钮文字；存在时不进入纯图标形态          |
| `icon`    | 自定义图标，优先于 `icon` prop 的渲染内容 |

## 纯图标规则

- 有图标且没有默认插槽时进入纯图标形态。
- loading 只替换或补充内部图标，不参与按钮形态判断。
- 设置 `square` 后才获得精确正方形尺寸；未设置时为无边框紧凑图标按钮。
- 纯图标按钮建议始终提供 `label`。
- 原生事件和 attrs 会继续传给底层 `ElButton`。
