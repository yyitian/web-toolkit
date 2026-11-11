# @yyitian/web-toolkit

面向 Vue 3 的组件工具库，提供图标、按钮、浮层、配置式表单、标准表格、弹窗与主题能力，以及 SVG sprite 和 SCSS mixin 集成能力。

完整使用说明、组件示例与 API 请访问：[wt.yyitian.top](https://wt.yyitian.top/)。

## 安装

```bash
pnpm add @yyitian/web-toolkit
```

`vue` 是必需的 peer dependency。使用表单、表格、弹窗或按钮组件时需要安装 `element-plus`；使用 Lucide 图标或动态图标时需要安装 `@lucide/vue`。

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
import { SuperThemeSwitcher, useWtTheme } from '@yyitian/web-toolkit';

const { setTheme } = useWtTheme();
</script>

<template>
  <SuperThemeSwitcher />
  <button @click="setTheme('dark', 'glass')">暗色毛玻璃</button>
</template>
```

`SuperTable` 支持外部数据和 Promise 请求函数两种模式，通过列配置生成搜索、展示、
排序及勾选，通过 `config` 控制首次加载、行标识和区域显隐。独立导出的
`DATE_FORMATS` 提供日期、分钟和秒三种格式；日期搜索默认使用
`datePickerDefaultTime` 和 `DATE_FORMATS.dateTimeSeconds`，列级配置可分别覆盖。
表格默认填满父容器高度，表体内部滚动、分页固定底部；表体至少预留列头和 10 行常规数据空间。
`before-header` 插槽可在搜索与标题之间加入内容，空时不占位。父容器应设置确定高度，
可通过 `--wt-table-body-min-height` 调整默认的 440px 表体最小高度。

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

维护者请参阅[版本发布与恢复](./docs/releasing.md)：代码按功能提交，版本标签联动发布 npm 与在线文档。

- [在线文档](https://wt.yyitian.top/)
- [npm](https://www.npmjs.com/package/@yyitian/web-toolkit)
- [GitHub](https://github.com/yyitian/web-toolkit)

## License

[MIT](./LICENSE)
