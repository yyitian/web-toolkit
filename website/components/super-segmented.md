<script setup>
import SegmentedBasicDemo from '../examples/demos/SegmentedBasicDemo.vue';
import SegmentedDisabledDemo from '../examples/demos/SegmentedDisabledDemo.vue';
import SegmentedLayoutDemo from '../examples/demos/SegmentedLayoutDemo.vue';
import SegmentedOverflowDemo from '../examples/demos/SegmentedOverflowDemo.vue';
import SegmentedContentDemo from '../examples/demos/SegmentedContentDemo.vue';
</script>

# SuperSegmented 分段选择

用于在少量互斥选项之间切换，支持禁用、纵向排列和超宽滚动。

## 基础用法

使用 `v-model` 绑定当前选项，选项可为字符串、数字、布尔值或带 `label/value` 的对象，绑定值为对应的字符串、数字或布尔值。

<ClientOnly><DemoBlock><SegmentedBasicDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SuperSegmented } from '@yyitian/web-toolkit';
const view = ref('全部');
const enabled = ref(false);
const options = [
  { label: '停用', value: false },
  { label: '启用', value: true },
];
</script>

<template>
  <div class="segmented-basic">
    <SuperSegmented
      v-model="view"
      :options="['全部', '进行中', '已完成']"
      aria-label="任务状态"
    />
    <SuperSegmented
      v-model="enabled"
      :options="options"
      aria-label="启用状态"
    />
  </div>
</template>

<style scoped>
.segmented-basic {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
</style>
```

:::

## 禁用选项

设置 `disabled` 禁用整个组件，或在选项中设置 `disabled`。

<ClientOnly><DemoBlock><SegmentedDisabledDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SuperSegmented } from '@yyitian/web-toolkit';
const value = ref('daily');
const options = [
  { label: '每日', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly', disabled: true },
];
</script>

<template>
  <div class="segmented-disabled">
    <SuperSegmented v-model="value" :options="options" aria-label="统计周期" />
    <SuperSegmented
      :model-value="value"
      :options="options"
      disabled
      aria-label="只读统计周期"
    />
  </div>
</template>

<style scoped>
.segmented-disabled {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
</style>
```

:::

## 尺寸与布局

省略 `size` 时继承外层配置；`block` 撑满并均分可用宽度，`direction="vertical"` 纵向展示。

<ClientOnly><DemoBlock><SegmentedLayoutDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ElConfigProvider } from 'element-plus';
import { SuperSegmented } from '@yyitian/web-toolkit';
const value = ref('列表');
const options = ['列表', '卡片', '时间线'];
</script>

<template>
  <div class="segmented-layout">
    <div class="segmented-layout__sizes">
      <ElConfigProvider size="small"
        ><SuperSegmented
          v-model="value"
          :options="options"
          aria-label="小尺寸视图"
      /></ElConfigProvider>
      <SuperSegmented
        v-model="value"
        :options="options"
        aria-label="默认尺寸视图"
      />
      <SuperSegmented
        v-model="value"
        :options="options"
        size="large"
        aria-label="大尺寸视图"
      />
    </div>
    <SuperSegmented
      v-model="value"
      :options="options"
      block
      class="segmented-layout__block"
      aria-label="均分宽度视图"
    />
    <SuperSegmented
      v-model="value"
      :options="options"
      direction="vertical"
      aria-label="纵向视图"
    />
  </div>
</template>

<style scoped>
.segmented-layout {
  display: grid;
  justify-items: start;
  gap: 16px;
}
.segmented-layout__block {
  justify-self: stretch;
}
.segmented-layout__sizes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
</style>
```

:::

## 超宽滚动

水平选项保持单行，超宽时在组件内部滚动；切换到不可见的选项时自动滚动显示。

<ClientOnly><DemoBlock><SegmentedOverflowDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SuperButton, SuperSegmented } from '@yyitian/web-toolkit';
const value = ref('全部分类');
const options = [
  '全部分类',
  '自然风景',
  '建筑与城市',
  '插画与艺术',
  '星空与宇宙',
  '动物与植物',
];
</script>

<template>
  <div class="segmented-overflow">
    <SuperButton
      @click="value = value === options.at(-1) ? options[0] : options.at(-1)!"
      >切换首尾选项</SuperButton
    >
    <div class="segmented-overflow__viewport">
      <SuperSegmented
        v-model="value"
        :options="options"
        block
        aria-label="图片分类"
      />
    </div>
  </div>
</template>

<style scoped>
.segmented-overflow {
  display: grid;
  justify-items: start;
  gap: 16px;
}
.segmented-overflow__viewport {
  width: 320px;
  max-width: 100%;
  min-width: 0;
}
</style>
```

:::

## 字段映射与自定义内容

通过 `props` 映射选项字段，默认插槽可组合图标或自定义内容。

<ClientOnly><DemoBlock><SegmentedContentDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Grid2x2, List, Rows3 } from '@lucide/vue';
import { SuperIcon, SuperSegmented } from '@yyitian/web-toolkit';
const value = ref(0);
const options = [
  { title: '列表', id: 0, icon: List },
  { title: '卡片', id: 1, icon: Grid2x2 },
  { title: '紧凑', id: 2, icon: Rows3, unavailable: true },
];
const fields = { label: 'title', value: 'id', disabled: 'unavailable' };
</script>

<template>
  <SuperSegmented
    v-model="value"
    :options="options"
    :props="fields"
    aria-label="内容视图"
  >
    <template #default="{ item }">
      <span class="segmented-content"
        ><SuperIcon :icon="item.icon" :size="16" />{{ item.title }}</span
      >
    </template>
  </SuperSegmented>
</template>

<style scoped>
.segmented-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
</style>
```

:::

## API

### Props

支持 [ElSegmented 属性](https://element-plus.org/zh-CN/component/segmented#属性)。

- 使用 `aria-label` 提供可识别名称；置于 ElFormItem 时沿用表单标签关联。
- 初始值与选项变化不会自动选择首项或修正绑定值；当前值失效时由调用方更新。

### Events

| 事件                | 参数                          | 说明           |
| ------------------- | ----------------------------- | -------------- |
| `update:modelValue` | `string \| number \| boolean` | 更新受控绑定值 |
| `change`            | `string \| number \| boolean` | 用户切换选项   |

### Slots

| 插槽      | 参数       | 说明                              |
| --------- | ---------- | --------------------------------- |
| `default` | `{ item }` | 自定义选项内容，`item` 为原始选项 |

### 实例与类型

组件 ref 类型为 `SuperSegmentedInstance`，可通过 `$el` 访问控件元素。

包入口导出 `SuperSegmentedProps<T>`、`SuperSegmentedOption`、`SuperSegmentedValue`、`SuperSegmentedInstance`。

### 样式变量

| 变量                                  | 默认值                    | 说明         |
| ------------------------------------- | ------------------------- | ------------ |
| `--wt-segmented-bg`                   | 主题抬高表面              | 控件背景     |
| `--wt-segmented-color`                | 主题常规文字              | 未选中文字   |
| `--wt-segmented-border-color`         | 主题控件边框              | 控件边框     |
| `--wt-segmented-hover-bg`             | Element Plus 深填充色     | 悬停背景     |
| `--wt-segmented-hover-color`          | 主题主要文字              | 悬停文字     |
| `--wt-segmented-active-bg`            | Element Plus 更深填充色   | 按下背景     |
| `--wt-segmented-selected-bg`          | 主题主色                  | 选中滑块     |
| `--wt-segmented-selected-color`       | 主题反色文字              | 选中文字     |
| `--wt-segmented-disabled-color`       | 主题禁用文字              | 禁用文字     |
| `--wt-segmented-selected-disabled-bg` | Element Plus 主色 light-5 | 已选禁用背景 |
| `--wt-segmented-focus-color`          | 选中滑块色                | 焦点轮廓     |
| `--wt-segmented-font-size`            | 按尺寸继承排版字号        | 控件字号     |
| `--wt-segmented-backdrop-filter`      | 主题材质效果              | 背景滤镜     |

通过 `style` 设置以上变量或 Element Plus 的 `--el-segmented-*` 变量定制外观。
