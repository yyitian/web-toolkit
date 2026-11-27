---
pageClass: super-carousel-doc
---

<script setup>
import CarouselImageDemo from '../examples/demos/CarouselImageDemo.vue';
import CarouselBasicDemo from '../examples/demos/CarouselBasicDemo.vue';
import CarouselConfigDemo from '../examples/demos/CarouselConfigDemo.vue';
import CarouselSelectionDemo from '../examples/demos/CarouselSelectionDemo.vue';
import CarouselCardsDemo from '../examples/demos/CarouselCardsDemo.vue';
</script>

# SuperCarousel

以 3D 透视卡片展示图片或自定义内容，支持循环、垂直排列、自动播放和大图预览。

## 基础图片

为每项提供唯一 `id` 和图片 `src`，通过 `v-model:active-id` 绑定当前项的 ID。`label` 仅用于导航辅助名称，标题内容可在插槽内自行展示。

<ClientOnly><DemoBlock><CarouselBasicDemo /></DemoBlock></ClientOnly>

::: details 查看代码

示例图片地址请替换为自己的资源。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SuperCarousel } from '@yyitian/web-toolkit';
const activeId = ref<string | number | null>('alpine');
const items = [
  {
    id: 'alpine',
    src: '/carousel/alpine.svg',
    alt: '青色天空中的山峰',
    label: '山峦',
  },
  {
    id: 'dunes',
    src: '/carousel/dunes.svg',
    alt: '暖色日落与沙丘',
    label: '落日',
  },
  {
    id: 'ocean',
    src: '/carousel/ocean.svg',
    alt: '蓝色海岸与远山',
    label: '海岸',
  },
  { id: 'forest', src: '/carousel/forest.svg', alt: '绿色山林', label: '山林' },
];
</script>
<template>
  <SuperCarousel v-model:active-id="activeId" :items="items" />
</template>
```

:::

## 轮播配置

通过 `direction` 切换排列方向，`height` 设置高度，`autoplay` 开启自动播放。使用切换按钮、方向键、Home/End 或滑动手势浏览。

::: tip 自动播放
聚焦、打开预览、页面隐藏或轮播离屏时暂停；悬停暂停由 `pauseOnHover` 控制。系统启用减少动态效果时，关闭自动播放和切换动画。
:::

<ClientOnly><DemoBlock><CarouselConfigDemo /></DemoBlock></ClientOnly>

::: details 查看配置片段

以下为演示的初始配置，省略控制区；`items` 与基础图片示例相同。

```vue
<SuperCarousel
  :items="items"
  direction="horizontal"
  height="auto"
  :autoplay="false"
  :interval="2000"
  :loop="true"
  :disabled="false"
  arrow="always"
  indicator-position="outside"
  :motion-blur="false"
/>
```

:::

## 图片预览与勾选

设置 `preview` 后点击主图打开预览，`previewSrc` 可指定原图。设置 `selectable` 并绑定 `v-model:selected-ids` 管理勾选结果。

::: tip 点击行为
未开启预览时，点击主卡也可勾选；开启预览后，使用勾选框选择。预览勾选合并在底部操作栏中，与轮播同步；预览切图不改变轮播当前项。
:::

<ClientOnly><DemoBlock><CarouselSelectionDemo /></DemoBlock></ClientOnly>

::: details 查看配置片段

复用基础示例的 `items`，省略切换 `preview/selectable` 的控制区及结果展示。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SuperCarousel } from '@yyitian/web-toolkit';
import type { SuperCarouselId } from '@yyitian/web-toolkit';

const preview = ref(false);
const selectable = ref(true);
const selectedIds = ref<SuperCarouselId[]>(['alpine']);
</script>

<template>
  <SuperCarousel
    v-model:selected-ids="selectedIds"
    :items="items"
    :preview="preview"
    :selectable="selectable"
    :image-props="{
      showProgress: true,
      hideOnClickModal: true,
      minScale: 0.5,
      maxScale: 4,
    }"
  />
</template>
```

:::

## 自定义卡片与样式

使用默认插槽展示业务内容，通过 `active` 判断当前卡片。外观定制参见[样式变量](#样式变量)。

<ClientOnly><DemoBlock><CarouselCardsDemo /></DemoBlock></ClientOnly>

::: details 查看代码

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SuperCarousel, SuperButton } from '@yyitian/web-toolkit';
const items = [
  { id: 1, label: '巡检', description: '检查服务状态与近期变更' },
  { id: 2, label: '分析', description: '汇总运行数据，发现异常趋势' },
  { id: 3, label: '报告', description: '整理结论并生成报告' },
];
const selected = ref<number>();
</script>
<template>
  <SuperCarousel
    :items="items"
    style="
      --wt-carousel-card-width: 360px;
      --wt-carousel-ratio: auto;
      --wt-carousel-angle: 24deg;
    "
  >
    <template #default="{ item, active }">
      <div class="carousel-business-card">
        <span class="wt-text-caption">工作台</span
        ><strong class="wt-text-title">{{ item.label }}</strong>
        <p>{{ item.description }}</p>
        <SuperButton
          :type="selected === item.id ? 'success' : 'primary'"
          :disabled="!active"
          @click="selected = Number(item.id)"
          >{{ selected === item.id ? '已选择' : '选择任务' }}</SuperButton
        >
      </div>
    </template>
  </SuperCarousel>
</template>
<style scoped>
.carousel-business-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  min-height: 210px;
  padding: 24px;
}
p {
  margin: 0 0 8px;
}
</style>
```

:::

## 图片加载状态

通过 `placeholder/error` 插槽设置加载和失败内容，更新 `src` 重新加载。示例使用无效图片，可替换图片后重现失败。

<ClientOnly><DemoBlock><CarouselImageDemo /></DemoBlock></ClientOnly>

::: details 查看代码

图片地址请替换为自己的资源。

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { SuperCarousel, SuperButton } from '@yyitian/web-toolkit';
const restored = ref(false);
const items = computed(() => [
  {
    id: 'retry',
    src: restored.value
      ? '/carousel/alpine.svg'
      : 'data:image/png;base64,aW52YWxpZA==',
    alt: '可恢复的图片示例',
  },
  { id: 'dunes', src: '/carousel/dunes.svg', alt: '暖色日落与沙丘' },
]);
</script>
<template>
  <section class="carousel-image-example">
    <SuperButton @click="restored = false">重现加载失败</SuperButton>
    <SuperCarousel class="carousel-image-example__carousel" :items="items">
      <template #error>
        <div
          style="display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 12px; height: 100%"
        >
          <span>图片加载失败</span>
          <SuperButton @click.stop="restored = true">替换图片</SuperButton>
        </div>
      </template>
    </SuperCarousel>
  </section>
</template>

<style scoped>
.carousel-image-example {
  display: grid;
  justify-items: start;
  gap: 16px;
  width: 100%;
}
.carousel-image-example__carousel {
  width: 100%;
}
</style>
```

:::

## API

### Props

| 属性                                   | 说明                                                                                 | 默认值                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------- |
| `items`                                | `readonly SuperCarouselItem[]`，ID 按类型精确匹配且必须唯一                          | 必填                                        |
| `activeId` / `v-model:active-id`       | 当前 ID；删除当前项后选择原位置附近的项目，空数组为 `null`                           | 第一项                                      |
| `initialIndex`                         | 初始索引，有效 `activeId` 优先；不用于后续数据更新时重置                             | `0`                                         |
| `height`                               | 舞台高度，`auto` 按当前卡片尺寸计算                                                  | `'auto'`                                    |
| `direction`                            | `'horizontal' \| 'vertical'`                                                         | `'horizontal'`                              |
| `trigger`                              | `'hover' \| 'click'`；保留的兼容配置，不改变序号导航行为                             | `'hover'`                                   |
| `autoplay`                             | 开启自动播放与播放控制按钮                                                           | `false`                                     |
| `interval`                             | 自动播放间隔，毫秒；非正值停止播放                                                   | `5000`                                      |
| `pauseOnHover`                         | 悬停时暂停                                                                           | `true`                                      |
| `loop`                                 | 循环；关闭后边界禁止继续切换                                                         | `true`                                      |
| `arrow`                                | `'always' \| 'hover' \| 'never'`；`hover` 包含键盘聚焦，触屏始终可见                 | `'always'`                                  |
| `indicatorPosition`                    | `'' \| 'outside' \| 'none'`；前两者均在主卡底部显示序号，`none` 隐藏                 | `'outside'`                                 |
| `cardScale`                            | 邻卡缩放，限制到 `0.1–1`                                                             | `0.78`                                      |
| `motionBlur`                           | 切换期间的动态模糊                                                                   | `false`                                     |
| `disabled`                             | 禁用轮播操作和内容交互                                                               | `false`                                     |
| `lazy`                                 | 主卡及邻卡首次可见时渲染，随后保留到数据删除                                         | `true`                                      |
| `selectable`                           | 启用普通与预览视图的勾选                                                             | `false`                                     |
| `selectedIds` / `v-model:selected-ids` | ID 数组，按类型精确匹配；不传时内部维护，不修改输入数组，不自动删除当前数据之外的 ID | `[]`                                        |
| `preview`                              | 开启图片预览                                                                         | `false`                                     |
| `imageProps`                           | 图片和预览配置；`src`、`previewSrcList`、`initialIndex` 由组件管理                   | `{ fit: 'cover', previewTeleported: true }` |
| `emptyText`                            | 空内容文案                                                                           | `'暂无内容'`                                |

### 事件

| 事件                             | 参数                                                                     |
| -------------------------------- | ------------------------------------------------------------------------ |
| `update:activeId`                | `id: string \| number \| null`                                           |
| `update:selectedIds`             | 更新后的 ID 数组                                                         |
| `selection-change`               | `{ item, index, selected, selectedIds }`；仅主动勾选触发，外部赋值不触发 |
| `change`                         | 当前索引、之前索引；初始化不触发，空数组索引为 `-1`                      |
| `item-click`                     | `{ item, index }`、鼠标事件；当前卡片内容点击                            |
| `image-load` / `image-error`     | `{ item, index }`、原始事件                                              |
| `preview-show` / `preview-close` | 打开预览的 `{ item, index }`                                             |
| `preview-switch`                 | 预览图片对应的 `{ item, index }`、预览列表索引                           |

### 插槽

| 插槽                    | 参数                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `default`               | `{ item, index, active, preview, selected, toggleSelected }`                                                     |
| `empty`                 | 无                                                                                                               |
| `placeholder` / `error` | 图片对应的 `{ item, index }`                                                                                     |
| `navigation`            | `{ activeIndex, total, canPrev, canNext, prev, next, setActiveItem, playing, togglePlay }`，替换主卡底部悬浮导航 |
| `toolbar`               | ElImage 预览工具栏参数；启用勾选时，勾选入口自动附在自定义操作后                                                 |

自定义卡片可调用插槽的 `preview()` 打开预览。按钮等交互控件独立响应操作；其他需要排除整卡勾选或滑动的内容，分别添加 `data-carousel-no-select` 或 `data-carousel-no-swipe`。自定义导航应保留可访问的切换入口。

### 实例

| 成员                   | 说明                                     |
| ---------------------- | ---------------------------------------- |
| `activeIndex`          | 当前索引，空数组为 `-1`                  |
| `prev()` / `next()`    | 切换上一项或下一项                       |
| `setActiveItem(index)` | 按索引切换，循环模式取模，否则限制到边界 |
| `setActiveId(id)`      | 按 ID 切换，未找到时保持当前项           |

### 数据类型

```ts
interface SuperCarouselItem {
  id: string | number;
  src?: string;
  previewSrc?: string;
  alt?: string;
  label?: string | number;
  [key: string]: unknown;
}
```

### 样式变量

| 变量                            | 默认值                                        |
| ------------------------------- | --------------------------------------------- |
| `--wt-carousel-card-width`      | `440px`，随容器缩小                           |
| `--wt-carousel-ratio`           | `16 / 10`，自定义内容可设 `auto` 使用内容高度 |
| `--wt-carousel-step`            | 水平 `82%` / 垂直 `85%`，相对于卡片尺寸       |
| `--wt-carousel-perspective`     | `1100px`                                      |
| `--wt-carousel-angle`           | 水平 `32deg` / 垂直 `-32deg`                  |
| `--wt-carousel-duration`        | `350ms`                                       |
| `--wt-carousel-radius`          | `14px`                                        |
| `--wt-carousel-bg`              | `--wt-surface-base`                           |
| `--wt-carousel-border-color`    | `--wt-border-color`                           |
| `--wt-carousel-active-border`   | `--wt-border-color-strong`                    |
| `--wt-carousel-selected-border` | `--wt-color-primary`                          |
| `--wt-carousel-shadow`          | `--wt-shadow-raised`                          |

<style>
.super-carousel-doc .vp-doc table {
  display: block;
  max-width: 100%;
  overflow-x: auto;
}
</style>
