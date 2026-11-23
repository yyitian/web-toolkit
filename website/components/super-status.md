<script setup>
import StatusBasicDemo from '../examples/demos/StatusBasicDemo.vue';
import StatusPresetsDemo from '../examples/demos/StatusPresetsDemo.vue';
import StatusOptionsDemo from '../examples/demos/StatusOptionsDemo.vue';
import StatusOverrideDemo from '../examples/demos/StatusOverrideDemo.vue';
import StatusThemeDemo from '../examples/demos/StatusThemeDemo.vue';
</script>

# SuperStatus

以主题色标记和文字展示任务、流程等多种状态，通过 `value` 更新展示。

## 基础用法

传入内置状态值即可展示对应文案和语义色。

<ClientOnly><DemoBlock><StatusBasicDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { SuperStatus } from '@yyitian/web-toolkit';
</script>

<template>
  <SuperStatus value="running" />
</template>
```

:::

## 内置状态

`SUPER_STATUS_PRESETS` 可用于生成状态列表或业务选项。待处理显示持续旋转的 `DynamicRunning`，其他状态显示圆点；系统设置减少动态效果时停止旋转。

<ClientOnly><DemoBlock><StatusPresetsDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { SuperStatus, SUPER_STATUS_PRESETS } from '@yyitian/web-toolkit';
</script>

<template>
  <div style="display: flex; flex-wrap: wrap; gap: 16px">
    <SuperStatus
      v-for="status in SUPER_STATUS_PRESETS"
      :key="status.value"
      :value="status.value"
    />
  </div>
</template>
```

:::

## 自定义状态

通过 `options` 配置业务状态，支持数字或字符串值。

::: tip 提示
值按类型精确匹配，数字 `0` 与字符串 `'0'` 不相同。
:::

<ClientOnly><DemoBlock><StatusOptionsDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SuperButton, SuperStatus } from '@yyitian/web-toolkit';
import type { SuperStatusOption, SuperStatusValue } from '@yyitian/web-toolkit';

const value = ref<SuperStatusValue>(0);
const options: SuperStatusOption[] = [
  { value: 0, label: '排队中', type: 'warning' },
  { value: 1, label: '执行中', color: 'var(--wt-color-primary)' },
  { value: 'running', label: () => '正在运行' },
  { value: 'archived', label: '已归档' },
];
const choices: { value: SuperStatusValue; label: string }[] = [
  { value: 0, label: '数字 0' },
  { value: '0', label: '字符串 0' },
  { value: 1, label: '自定义颜色' },
  { value: 'running', label: '覆盖内置文案' },
  { value: 'archived', label: '自定义状态' },
];
</script>

<template>
  <section>
    <div>
      <SuperButton
        v-for="choice in choices"
        :key="`${typeof choice.value}:${choice.value}`"
        size="small"
        :type="value === choice.value ? 'primary' : 'default'"
        :aria-pressed="value === choice.value"
        @click="value = choice.value"
        >{{ choice.label }}</SuperButton
      >
    </div>
    <SuperStatus :value="value" :options="options" />
  </section>
</template>
```

:::

## 覆盖文案与颜色

使用实例 `label`、`color` 覆盖状态配置。

<ClientOnly><DemoBlock><StatusOverrideDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { SuperStatus } from '@yyitian/web-toolkit';
import type { SuperStatusOption } from '@yyitian/web-toolkit';

const options: SuperStatusOption[] = [
  {
    value: 'success',
    label: '自定义完成文案',
    color: 'var(--wt-color-warning)',
  },
];
</script>

<template>
  <SuperStatus
    value="success"
    :options="options"
    label="已完成归档"
    color="var(--wt-color-success)"
  />
</template>
```

:::

## 主题变量

通过 CSS 变量调整圆点大小、标记颜色、间距和文字色。

<ClientOnly><DemoBlock><StatusThemeDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { SuperStatus } from '@yyitian/web-toolkit';
</script>

<template>
  <div
    style="display: flex; flex-wrap: wrap; gap: 16px"
    :style="{
      '--wt-status-dot-size': '8px',
      '--wt-status-gap': '10px',
      '--wt-status-color': 'var(--wt-color-warning)',
      '--wt-status-text-color': 'var(--wt-text-primary)',
    }"
  >
    <SuperStatus value="pending" />
    <SuperStatus value="running" />
  </div>
</template>
```

:::

## 卡片表格中使用

通过 [`card.status`](/components/super-table#卡片配置)映射状态字段与业务枚举。

## API

### Props

| 属性      | 类型                           | 默认值 | 说明             |
| --------- | ------------------------------ | ------ | ---------------- |
| `value`   | `SuperStatusValue \| null`     | —      | 精确匹配状态值   |
| `options` | `readonly SuperStatusOption[]` | —      | 自定义状态项     |
| `label`   | `LabelValue`                   | —      | 覆盖最终展示文案 |
| `color`   | `string`                       | —      | 覆盖状态标记颜色 |

```ts
type SuperStatusValue = string | number;
type SuperStatusTone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface SuperStatusOption {
  value: SuperStatusValue;
  label?: LabelValue;
  type?: SuperStatusTone;
  color?: string;
}
```

`label` 支持字符串、返回字符串的函数或带 `label` 的对象。

### 内置状态值

| `value`     | 文案   | `type`      |
| ----------- | ------ | ----------- |
| `'pending'` | 待处理 | `'info'`    |
| `'running'` | 运行中 | `'primary'` |
| `'success'` | 成功   | `'success'` |
| `'failed'`  | 失败   | `'danger'`  |
| `'stopped'` | 已停用 | `'warning'` |
| `'unknown'` | 未知   | `'info'`    |

未匹配或未提供状态值时显示“未知”。`starting` 不属于内置状态，需要时通过 `options` 自定义。预设列表与其选项均为只读，业务枚举请通过 `options` 提供。

### 状态匹配

自定义项未填写的文案和语义色沿用同值内置项；新状态缺省文案为“未知”，缺省语义色为 `info`。
`color` 支持 CSS 颜色或变量，优先于 `type`。

### 样式变量

| 变量                     | 默认值              | 说明               |
| ------------------------ | ------------------- | ------------------ |
| `--wt-status-dot-size`   | `6px`               | 圆点直径           |
| `--wt-status-gap`        | `6px`               | 状态标记与文字间距 |
| `--wt-status-color`      | 当前状态色          | 样式级标记颜色覆盖 |
| `--wt-status-text-color` | `--wt-text-regular` | 文字颜色           |

待处理图标大小随文字字号变化，`--wt-status-dot-size` 仅影响圆点。

字号、行高和字重的通用配置参阅[文字层级与排版](/guide/theming#文字层级与排版)。
