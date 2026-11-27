# @yyitian/web-toolkit

面向 Vue 3 的组件工具库，提供图标、按钮、浮层、折叠标签、配置式表单、标准表格、弹窗与主题能力，以及 SVG sprite 和 SCSS mixin 集成能力。

完整使用说明、组件示例与 API 请访问：[wt.yyitian.top](https://wt.yyitian.top/)。

## 安装

```bash
pnpm add @yyitian/web-toolkit
```

`vue` 是必需的 peer dependency。使用标签、表单、表格、弹窗或按钮组件时需要安装 `element-plus`；使用 Lucide 图标或动态图标时需要安装 `@lucide/vue`。

```bash
pnpm add element-plus @lucide/vue
```

## 基础接入

在应用入口引入组件库样式：

```ts
import '@yyitian/web-toolkit/style.css';
```

通过插件初始化主题，再按需导入组件：

```ts
import { createApp } from 'vue';
import { createWtTheme } from '@yyitian/web-toolkit';
import App from './App.vue';

createApp(App)
  .use(createWtTheme({ scheme: 'light', material: 'solid', storage: true }))
  .mount('#app');
```

组件内可以使用现成切换器，也可以通过组合式函数自定义切换界面：

```vue
<script setup lang="ts">
import {
  SuperButton,
  SuperThemeSwitcher,
  useWtTheme,
} from '@yyitian/web-toolkit';

const { setTheme } = useWtTheme();
</script>

<template>
  <SuperThemeSwitcher />
  <SuperButton @click="setTheme('dark', 'glass')">暗色毛玻璃</SuperButton>
</template>
```

`SuperTable` 支持外部数据和 Promise 请求函数两种模式，通过列配置生成搜索、展示、
排序及勾选，通过 `config` 控制首次加载、行标识和区域显隐。独立导出的
`DATE_FORMATS` 提供日期、分钟和秒三种格式；日期搜索默认使用
`datePickerDefaultTime` 和 `DATE_FORMATS.dateTimeSeconds`，列级配置可分别覆盖。
日期列默认宽 180px 并关闭溢出提示；显式宽度和提示配置优先。
表格默认填满父容器高度，表体内部滚动、分页固定底部；表体至少预留列头和 10 行常规数据空间。
`before-header` 插槽可在搜索与标题之间加入内容，空时不占位。父容器应设置确定高度，
可通过 `--wt-table-body-min-height` 调整默认的 440px 表体最小高度。

`SuperTable view="card"` 复用相同的搜索、插槽、查询和分页布局，提供图片、状态、受控开关、
标签、自定义内容与浮动操作。网格在 1/2/3/4/6/8/12 列间自适应，默认每页 24 条，
选项 12/24/36/48；通过 `config.pageSizes` 自定义。两视图共用勾选状态，
`toggleRowSelection()` 可跨视图操作当前页。卡片默认读取同名字段，可用映射值 `false` 关闭可选区域；图片支持加载骨架、失败占位和悬停缩放。底部操作与时间冲突时自动收起到更多菜单，插槽通过 `overflow/close` 复用操作内容。详见[卡片视图](https://wt.yyitian.top/components/super-table#卡片视图)。

`SuperStatus` 以主题色圆点与文字展示多状态，内置待处理、启动中、运行中、成功、失败、
已停用与未知状态，支持精确值匹配、自定义文案和颜色，与布尔激活开关独立。

`SuperSegmented` 兼容 ElSegmented 属性与插槽，提供主题色滑块、排版适配和超宽横向滚动。
详见 [SuperSegmented](https://wt.yyitian.top/components/super-segmented)。

`SuperTag` 兼容 ElTag 属性、事件、插槽和公开实例，未指定 `effect` 时随明暗主题切换，
显式配置优先。`SuperTags` 的标签及轻量 `+N` 计数入口复用相同外观。

`SuperTags` 默认展示前 2 个标签，其余通过 `+N` 悬停浮层展示；`limit` 可指定数量、
设为 `0` 仅展示计数，或设为 `'all'` 全部展示。普通表格的 `tableType: 'tag'` 同样默认
折叠为 2 个，可通过 `cellProps.limit` 调整，原有 ElTag 属性及回调继续透传实际标签。

`SuperCarousel` 提供水平与垂直 3D 透视轮播，支持图片、自定义卡片、按 ID 定位、
懒渲染和自动播放。`selectable` 配合 `v-model:selected-ids` 可在普通与预览视图同步勾选。开启 `preview` 可使用 ElImage 大图预览，原图地址通过 `previewSrc` 配置；
详见 [SuperCarousel](https://wt.yyitian.top/components/super-carousel)。

此外可直接导入 `formatDate`、`openConfirm`、`openDeleteConfirm` 工具方法：

```ts
import {
  formatDate,
  DATE_FORMATS,
  openConfirm,
  openDeleteConfirm,
} from '@yyitian/web-toolkit';

formatDate('2026-11-10 14:05:09'); // '2026-11-10'
formatDate('2026-11-10 14:05:09', DATE_FORMATS.dateTimeSeconds);
formatDate('2026-11-10', 'YYYY年MM月DD日'); // '2026年11月10日'

if ((await openConfirm('确认提交吗？')) === 'confirm') {
  // 执行提交
}
if (await openDeleteConfirm('示例任务')) {
  // 执行删除
}
```

日期空值或无效值返回空字符串。确认弹窗需要安装 `element-plus`，支持覆盖文案和原生
弹窗选项；取消、关闭统一返回取消结果，实际异常仍会抛出。

Vite 插件、主题定制、各组件用法及完整 API 均以[在线文档](https://wt.yyitian.top/)为准。

## 相关链接

文档维护请参阅[文档内容规范](./docs/documentation-guidelines.md)，统一使用说明、示例交互与主题展示。

维护者请参阅[版本发布与恢复](./docs/releasing.md)：代码按功能提交，版本标签联动发布 npm 与在线文档。

- [在线文档](https://wt.yyitian.top/)
- [npm](https://www.npmjs.com/package/@yyitian/web-toolkit)
- [GitHub](https://github.com/yyitian/web-toolkit)

## License

[MIT](./LICENSE)
