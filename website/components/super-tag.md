<script setup>
import TagBasicDemo from '../examples/demos/TagBasicDemo.vue';
import TagAppearanceDemo from '../examples/demos/TagAppearanceDemo.vue';
import TagEventsDemo from '../examples/demos/TagEventsDemo.vue';
import TagContentDemo from '../examples/demos/TagContentDemo.vue';
</script>

# SuperTag

展示单个标签，支持语义颜色、自定义内容和关闭操作。多标签折叠使用 [SuperTags](./super-tags.md)。

## 基础用法

使用 `type` 设置语义颜色。未指定 `effect` 时，浅色主题使用 `light`，深色主题使用 `dark`；未初始化主题时使用 `light`。

<ClientOnly><DemoBlock><TagBasicDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { SuperTag } from '@yyitian/web-toolkit';
import type { SuperTagProps } from '@yyitian/web-toolkit';

const types = [
  'primary',
  'success',
  'info',
  'warning',
  'danger',
] as const satisfies readonly SuperTagProps['type'][];
</script>

<template>
  <div class="tag-basic">
    <SuperTag v-for="type in types" :key="type" :type="type">{{
      type
    }}</SuperTag>
  </div>
</template>

<style scoped>
.tag-basic {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
```

:::

## 设置外观

使用 `effect` 固定外观，不随主题切换；`size/round` 调整尺寸与圆角，`color/style` 定制颜色。

<ClientOnly><DemoBlock><TagAppearanceDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { SuperTag } from '@yyitian/web-toolkit';
</script>

<template>
  <div class="tag-appearance">
    <div>
      <SuperTag effect="light">固定 light</SuperTag>
      <SuperTag effect="dark">固定 dark</SuperTag>
      <SuperTag effect="plain">固定 plain</SuperTag>
    </div>
    <div>
      <SuperTag size="small">小尺寸</SuperTag>
      <SuperTag>默认尺寸</SuperTag>
      <SuperTag size="large">大尺寸</SuperTag>
      <SuperTag round>圆角</SuperTag>
    </div>
    <div>
      <SuperTag
        color="#475569"
        :style="{ color: '#fff', borderColor: '#475569' }"
        >自定义底色</SuperTag
      >
    </div>
  </div>
</template>

<style scoped>
.tag-appearance {
  display: grid;
  gap: 12px;
}
.tag-appearance > div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
```

:::

## 点击与关闭

通过 `click/close` 接收原始鼠标事件。关闭时由调用方移除标签，组件不会自行隐藏。

<ClientOnly><DemoBlock><TagEventsDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SuperButton, SuperTag } from '@yyitian/web-toolkit';

const initial = ['研发', '运维', '安全'];
const tags = ref([...initial]);
const message = ref('点击标签或关闭图标查看结果');
function remove(tag: string) {
  tags.value = tags.value.filter((value) => value !== tag);
  message.value = `已移除：${tag}`;
}
function reset() {
  tags.value = [...initial];
  message.value = '已恢复标签';
}
</script>

<template>
  <section>
    <div><SuperButton size="small" @click="reset">恢复标签</SuperButton></div>
    <div class="tag-events">
      <SuperTag
        v-for="tag in tags"
        :key="tag"
        closable
        @click="message = `点击：${tag}`"
        @close="remove(tag)"
        >{{ tag }}</SuperTag
      >
    </div>
    <p>{{ message }}</p>
  </section>
</template>

<style scoped>
.tag-events {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
```

:::

## 自定义内容

通过默认插槽组合图标与文字。

<ClientOnly><DemoBlock><TagContentDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { CircleCheck } from '@lucide/vue';
import { SuperIcon, SuperTag } from '@yyitian/web-toolkit';
</script>

<template>
  <SuperTag type="success">
    <span class="tag-content"
      ><SuperIcon :icon="CircleCheck" :size="14" />已完成</span
    >
  </SuperTag>
</template>

<style scoped>
.tag-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
```

:::

## API

### Props

支持 [ElTag 属性](https://element-plus.org/zh-CN/component/tag#tag-attributes)，直接在组件上设置。`effect` 的默认值如下：

| 属性     | 类型                           | 默认值 | 说明                                   |
| -------- | ------------------------------ | ------ | -------------------------------------- |
| `effect` | `'light' \| 'dark' \| 'plain'` | 随主题 | 显式设置后固定外观；移除后恢复跟随主题 |

### Events

| 事件    | 参数         | 说明                               |
| ------- | ------------ | ---------------------------------- |
| `click` | `MouseEvent` | 点击标签                           |
| `close` | `MouseEvent` | 点击关闭图标，由调用方决定是否移除 |

### Slots

| 插槽      | 说明           |
| --------- | -------------- |
| `default` | 自定义标签内容 |

### 实例

组件 ref 类型为 `SuperTagInstance`，可通过 `$el` 访问标签元素。

### 类型

从包入口导出 `SuperTagProps`、`SuperTagInstance`，分别与 Element Plus 的 `TagProps`、`TagInstance` 一致。

### 样式变量

| 变量                       | 默认值 | 说明     |
| -------------------------- | ------ | -------- |
| `--wt-font-size-caption`   | `12px` | 标签字号 |
| `--wt-font-weight-regular` | `400`  | 标签字重 |

其他外观可使用 ElTag 的 CSS 变量和 `style` 定制。
