<script setup>
import TagsBasicDemo from '../examples/demos/TagsBasicDemo.vue';
import TagsLimitDemo from '../examples/demos/TagsLimitDemo.vue';
import TagsAppearanceDemo from '../examples/demos/TagsAppearanceDemo.vue';
import TagsValuesDemo from '../examples/demos/TagsValuesDemo.vue';
import TagsEventsDemo from '../examples/demos/TagsEventsDemo.vue';
import TagsSlotDemo from '../examples/demos/TagsSlotDemo.vue';
import TagsPopoverDemo from '../examples/demos/TagsPopoverDemo.vue';
</script>

# SuperTags

展示标签列表，超出指定数量时通过浮层查看。

## 基础用法

传入 `tags`，默认显示前两个标签；悬停或聚焦 `+N` 查看剩余项。

<ClientOnly><DemoBlock><TagsBasicDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { SuperTags } from '@yyitian/web-toolkit';
</script>

<template>
  <SuperTags :tags="['研发', '运维', '审计', '安全']" />
</template>
```

:::

## 控制展示数量

使用 `limit` 设置展示数量，`0` 仅显示计数，`'all'` 显示全部。

<ClientOnly><DemoBlock><TagsLimitDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SuperButton, SuperTags } from '@yyitian/web-toolkit';
import type { SuperTagsLimit } from '@yyitian/web-toolkit';

const limit = ref<SuperTagsLimit>(2);
const options: { value: SuperTagsLimit; label: string }[] = [
  { value: 1, label: '显示 1 个' },
  { value: 2, label: '显示 2 个' },
  { value: 0, label: '仅计数' },
  { value: 'all', label: '全部展示' },
];
</script>

<template>
  <section>
    <div>
      <SuperButton
        v-for="option in options"
        :key="option.value"
        size="small"
        :type="limit === option.value ? 'primary' : 'default'"
        :aria-pressed="limit === option.value"
        @click="limit = option.value"
        >{{ option.label }}</SuperButton
      >
    </div>
    <SuperTags :tags="['研发', '运维', '审计', '安全']" :limit="limit" />
  </section>
</template>
```

:::

## 设置标签外观

通过 `props` 设置标签外观，单个标签的 `props` 优先。

<ClientOnly><DemoBlock><TagsAppearanceDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { SuperTags } from '@yyitian/web-toolkit';
import type { SuperTagValue } from '@yyitian/web-toolkit';

const tones = [
  { label: '主要', props: { type: 'primary' } },
  { label: '成功', props: { type: 'success' } },
  { label: '信息', props: { type: 'info' } },
  { label: '警告', props: { type: 'warning' } },
  { label: '危险', props: { type: 'danger' } },
] satisfies SuperTagValue[];
const effects = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'plain', label: '描边' },
] as const;
const sizes: SuperTagValue[] = [
  { label: '小尺寸', props: { size: 'small' } },
  { label: '默认尺寸' },
  { label: '大尺寸', props: { size: 'large' } },
  { label: '圆角', props: { round: true } },
];
</script>

<template>
  <div class="tags-appearance" data-demo="tags-appearance">
    <div
      v-for="effect in effects"
      :key="effect.value"
      class="tags-appearance__row"
    >
      <span class="wt-text-caption">{{ effect.label }}</span>
      <SuperTags :tags="tones" limit="all" :props="{ effect: effect.value }" />
    </div>
    <div class="tags-appearance__row">
      <span class="wt-text-caption">尺寸与圆角</span>
      <SuperTags :tags="sizes" limit="all" />
    </div>
  </div>
</template>
```

:::

## 混合标签数据

支持字符串、数字、布尔值和对象标签，保留 `0`、`false` 与重复项。

<ClientOnly><DemoBlock><TagsValuesDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { SuperTags } from '@yyitian/web-toolkit';
import type { SuperTagValue } from '@yyitian/web-toolkit';

const tags: SuperTagValue[] = [
  '字符串',
  0,
  false,
  '重复',
  '重复',
  { key: 'custom', label: () => '动态文案', props: { type: 'success' } },
];
</script>

<template>
  <SuperTags :tags="tags" limit="all" data-demo="tags-values" />
</template>
```

:::

## 点击与关闭

通过 `tag-click` 和 `tag-close` 处理点击与关闭，示例支持添加和恢复标签。

::: tip 提示
关闭事件不自动删除标签，需要调用方更新数组。
:::

<ClientOnly><DemoBlock><TagsEventsDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SuperButton, SuperTags } from '@yyitian/web-toolkit';
import type { SuperTagEvent } from '@yyitian/web-toolkit';

const initialTags = ['研发', '运维', '审计', '安全'];
const tags = ref([...initialTags]);
const nextNumber = ref(5);
const message = ref('点击标签查看事件，点击关闭图标移除标签。');
function click({ index }: SuperTagEvent) {
  message.value = `点击了源数组第 ${index + 1} 项`;
}
function remove({ index }: SuperTagEvent) {
  tags.value = tags.value.filter((_, sourceIndex) => sourceIndex !== index);
  message.value = `已移除源数组第 ${index + 1} 项，剩余 ${tags.value.length} 项`;
}
function add() {
  tags.value = [...tags.value, `新增标签 ${nextNumber.value++}`];
  message.value = `已添加标签，共 ${tags.value.length} 项`;
}
function reset() {
  tags.value = [...initialTags];
  nextNumber.value = 5;
  message.value = '已恢复示例标签';
}
</script>

<template>
  <section>
    <div>
      <SuperButton size="small" @click="add">添加标签</SuperButton>
      <SuperButton size="small" @click="reset">恢复标签</SuperButton>
    </div>
    <SuperTags
      :tags="tags"
      :props="{ closable: true, size: 'small' }"
      @tag-click="click"
      @tag-close="remove"
    />
    <p role="status">{{ message }}</p>
  </section>
</template>
```

:::

## 自定义标签内容

通过 `tag` 插槽自定义标签内容，`overflow` 可区分内联与浮层标签。

<ClientOnly><DemoBlock><TagsSlotDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { SuperTags } from '@yyitian/web-toolkit';
</script>

<template>
  <SuperTags :tags="['研发', '运维', '审计', '安全']" :limit="1">
    <template #tag="{ label, index, overflow }">
      {{ index + 1 }} · {{ label }}{{ overflow ? '（其余）' : '' }}
    </template>
  </SuperTags>
</template>
```

:::

## 浮层配置与交互

通过 `popover` 设置浮层位置与样式。支持悬停、键盘聚焦和触摸打开，Esc 或点击外部关闭。

::: tip 提示
浮层默认挂载到 `body`，局部样式请通过 `popover.popperClass` 或 `popover.popperStyle` 设置。
:::

<ClientOnly><DemoBlock><TagsPopoverDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { SuperTags } from '@yyitian/web-toolkit';

const tags = Array.from({ length: 20 }, (_, index) =>
  index === 0
    ? '较长标签会在浮层内换行，更多标签可通过内部滚动查看。'
    : `标签 ${index + 1}`,
);
</script>

<template>
  <SuperTags
    :tags="tags"
    :limit="0"
    :popover="{
      placement: 'bottom-start',
      popperStyle: {
        '--wt-popover-max-width': 'min(320px, calc(100vw - 24px))',
        '--wt-tags-popover-max-height': '160px',
        '--wt-tags-gap': '8px',
      },
    }"
  />
</template>
```

:::

## 表格中使用

普通表格通过[标签列配置](/components/super-table#列配置)接入；卡片通过
[`card.fields.tags`](/components/super-table#卡片配置)映射标签。

## API

### Props

| 属性      | 类型                       | 默认值 | 说明                              |
| --------- | -------------------------- | ------ | --------------------------------- |
| `tags`    | `readonly SuperTagValue[]` | `[]`   | 有序标签数组                      |
| `limit`   | `SuperTagsLimit`           | `2`    | 非负整数或 `'all'`，无效值回退 2  |
| `props`   | `Partial<TagProps>`        | `{}`   | 公共 ElTag 属性，单项同名属性优先 |
| `popover` | `SuperTagsPopoverConfig`   | `{}`   | 剩余标签浮层的位置、挂载及样式    |

保留输入顺序、重复标签和 `0/false`。根节点样式使用 `class/style`，标签外观使用 `props`。

### 标签数据

```ts
type SuperTagsLimit = number | 'all';
type SuperTagValue = string | number | boolean | SuperTagItem;

interface SuperTagItem {
  key?: string | number;
  label: LabelValue;
  props?: Partial<TagProps>;
}
```

`label` 支持字符串、返回字符串的函数或带 `label` 的对象。

### 浮层选项

| `popover` 字段 | 类型                             | 默认值   | 说明                            |
| -------------- | -------------------------------- | -------- | ------------------------------- |
| `placement`    | `Placement`                      | `'top'`  | 浮层方向                        |
| `teleportTo`   | `string \| HTMLElement \| false` | `'body'` | 挂载目标，false 表示不 Teleport |
| `popperClass`  | Vue class 值                     | —        | 浮层自身的 class                |
| `popperStyle`  | `StyleValue`                     | —        | 浮层自身的样式                  |

### Events

| 事件        | 参数            | 说明                                     |
| ----------- | --------------- | ---------------------------------------- |
| `tag-click` | `SuperTagEvent` | 点击实际标签，不包含计数入口             |
| `tag-close` | `SuperTagEvent` | 点击标签关闭按钮，调用方决定是否修改数组 |

```ts
interface SuperTagEvent {
  tag: SuperTagValue;
  index: number;
  event: MouseEvent;
}
```

### Slots

| 插槽  | 参数              | 说明                   |
| ----- | ----------------- | ---------------------- |
| `tag` | `SuperTagContext` | 每个实际标签的内部内容 |

```ts
interface SuperTagContext {
  tag: SuperTagValue;
  index: number;
  label: string;
  overflow: boolean;
}
```

### 主题定制

文字定制参阅[文字层级与排版](/guide/theming#文字层级与排版)。

| 变量                           | 默认值                            | 作用位置                               |
| ------------------------------ | --------------------------------- | -------------------------------------- |
| `--wt-tags-gap`                | `4px`                             | 内联标签或浮层标签间距；两处可分别配置 |
| `--wt-tags-popover-max-height` | `min(240px, calc(100dvh - 48px))` | 浮层内部滚动区                         |
| `--wt-popover-max-width`       | `min(400px, calc(100vw - 24px))`  | 浮层宽度上限                           |

内联间距可通过组件 `style` 设置；浮层变量配置见[浮层示例](#浮层配置与交互)。
