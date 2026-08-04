# @yyitian/web-toolkit

公开发布的 Vue 3 组件工具库，提供图标、按钮、浮层、配置式表单与弹窗组件，附带 Vite 插件（SVG sprite 注入 + SCSS mixin 自动注入）。

## 消费方安装

```bash
pnpm add @yyitian/web-toolkit
# 或
npm install @yyitian/web-toolkit

# 若用到 SuperButton、SuperDialog、SuperForm 或 SuperFormDialog，需自行安装 element-plus（可选 peer）
pnpm add element-plus
# 若用到 lucide 图标(给 SuperIcon :icon 传入 lucide 组件),需自行安装 @lucide/vue(可选 peer)
pnpm add @lucide/vue
```

安装公开包无需 GitHub PAT 或 npm 访问令牌。若曾使用旧版 GitHub Packages，请删除用户级 `~/.npmrc` 中把 `@yyitian` 指向 `https://npm.pkg.github.com` 的配置，避免包管理器继续访问旧私有源。

**依赖矩阵**(用到哪个能力,才需装对应 peer):

| peer           | 必需性   | 用到以下能力时必须安装                                             |
| -------------- | -------- | ------------------------------------------------------------------ |
| `vue` (^3.5)   | **必需** | 全部                                                               |
| `element-plus` | 可选     | `SuperButton`、`SuperDialog`、`SuperForm`、`SuperFormDialog`       |
| `@lucide/vue`  | 可选     | 给 `:icon` 传 lucide 组件、或使用 `dynamic-icons` 子路径的成品图标 |

> 「可选」指**没用到对应组件就无需安装**;一旦用到该组件,对应 peer 即为硬性要求(不装会运行时报错)。只用 `SuperIcon` 的 sprite 图标 + `SuperPopover` 时,两个可选 peer 都不需要。

## 用法

### 组件

```ts
import {
  SuperIcon,
  SuperButton,
  SuperPopover,
  SuperDialog,
  SuperForm,
  SuperFormDialog,
} from '@yyitian/web-toolkit';
// ⚠️ 必须手动引入一次样式(通常在应用入口)
import '@yyitian/web-toolkit/style.css';
```

> **⚠️ `style.css` 不可省略。** 主题变量 `--wt-*`(含 popover 的背景/文字/边框默认值)随它注入。漏引时变量全部 undefined → popover 透明、边框消失,且**不会有任何报错**。务必在应用入口引入一次。

### Dynamic Icon(带状态/过渡动画的图标)

`DynamicPin` 等成品图标经子路径导出,内置「按 `active` 切换 + 过渡动画」(如置顶/取消置顶描边)。使用需安装可选 peer `@lucide/vue`。

```ts
import { SuperIcon } from '@yyitian/web-toolkit';
import { DynamicPin } from '@yyitian/web-toolkit/dynamic-icons';
```

```vue
<SuperIcon :icon="DynamicPin" :active="isPinned" />
<!-- 有状态 -->
<SuperButton :icon="DynamicPin" :active="isPinned" />
<!-- 按钮内同理 -->
```

普通(无状态)lucide 图标直接由消费方静态 import 后传入,自动 tree-shake:

```ts
import { Settings } from '@lucide/vue';
```

```vue
<SuperIcon :icon="Settings" />
<SuperButton :icon="Settings" />
```

### vite 插件(SVG sprite + 自动注入 mixin)

```ts
// vite.config.ts
import { webToolkitPlugin } from '@yyitian/web-toolkit/vite-plugin';

export default defineConfig({
  plugins: [vue(), webToolkitPlugin({ iconDirs: ['./src/icons'] })],
});
```

注册后,所有 `.vue` / `.scss` 中可直接使用 `flex()`、`font()` 等 mixin,**无需手写 `@use`**;`iconDirs` 下的 `.svg` 会被构建成 sprite 注入页面,经 `<SuperIcon icon="文件名" />` 使用。

> 若不使用本插件,也可手动在 scss 中引入 mixin:`@use '@yyitian/web-toolkit/styles/mixin' as *;`。

### 主题色

组件主题色由 `--wt-*` CSS 变量驱动,默认值随 `style.css` 自动引入。消费方可在 `:root`(或任意作用域)覆盖:

```css
:root {
  --wt-color-primary: #6d28d9;
}

/* 想跟 element-plus 主题同步,消费端自行桥接(库不绑定任何 UI 库) */
:root {
  --wt-color-primary: var(--el-color-primary);
}
```

### SuperPopover

`SuperPopover` 默认把浮层 Teleport 到 `body`,避免被父组件的 `overflow:hidden`、局部 stacking context 等影响。消费方仍可通过 `--wt-popover-*` 变量定制 UI,但变量必须作用在浮层节点自身或它的真实 DOM 祖先上。

默认推荐使用 `popperClass` / `popperStyle` 作为浮层自定义入口:

```vue
<SuperPopover
  popper-class="my-rich-tip"
  :popper-style="{ '--wt-popover-z-index': 3000 }"
  :arrow="false"
>
  <button>hover</button>
  <template #content>…title + description…</template>
</SuperPopover>
```

```css
.my-rich-tip {
  --wt-popover-bg: rgb(0 0 0 / 70%);
  --wt-popover-color: #fff;
  --wt-popover-border-color: rgb(255 255 255 / 20%);
  --wt-popover-padding: 8px 12px;
  --wt-popover-shadow: 0 2px 8px rgb(0 0 0 / 12%);
  --wt-popover-z-index: 3000;
  --wt-popover-max-width: 520px;
}
```

常用交互配置:

```vue
<SuperPopover trigger="click" close-on-click-outside>
  <button>点击打开</button>
  <template #content>点击浮层内部不会关闭</template>
</SuperPopover>

<SuperPopover
  v-model="visible"
  trigger="manual"
  :close-on-click-outside="false"
>
  <button>外部控制</button>
  <template #content>完全手动关闭</template>
</SuperPopover>
```

`teleportTo` 默认是 `'body'`;传 `false` 时浮层会保留在组件当前位置渲染,此时可以利用真实 DOM 继承影响浮层变量,但这不是默认推荐路径。

边框默认与背景同色,因此通常不可见;设置 `--wt-popover-border-color` 即可显形。`--wt-popover-max-width` 默认是 `400px`。

### SuperDialog

`SuperDialog` 使用标准 `v-model` 控制显示，默认提供可拖拽、销毁式关闭、挂载到 body 的 Element Plus Dialog，以及“取消 / 确认”footer。确认事件不会自动关闭弹窗。

```vue
<SuperDialog
  v-model="visible"
  title="编辑配置"
  :height="480"
  :max-height="600"
  @confirm="save"
>
  弹窗内容
</SuperDialog>
```

除 `title/footer/width/height/maxHeight/cancel/confirm` 外的属性和事件会透传给 `ElDialog`。`height` 和 `maxHeight` 为像素数；内容超过可用高度时 body 自动滚动。`#header`、默认插槽和 `#footer` 均可替换。

### SuperForm

表单由稳定的 `columns` 配置生成，内部维护数据副本。消费方通过实例读写数据，不使用表单数据 `v-model`。

```ts
import type { SuperFormColumn, SuperFormInstance } from '@yyitian/web-toolkit';

const form = ref<SuperFormInstance>();
const columns: SuperFormColumn[] = [
  {
    prop: 'name',
    label: '名称',
    tips: '必填项',
    formType: 'input',
    rules: { required: true, message: '请输入名称' },
  },
  {
    prop: 'kind',
    label: '类型',
    formType: 'select',
    props: {
      options: [
        { label: '普通', value: 'normal' },
        { label: '高级', value: 'advanced' },
      ],
    },
  },
  {
    prop: 'advancedConfig',
    label: '高级配置',
    formType: 'input',
    show: (data) => data.kind === 'advanced',
  },
];
```

```vue
<SuperForm ref="form" :columns="columns" @submit="save" />
```

内置 `input`、`textarea`、`input-number`、`radio`、`select`、`checkbox`、`switch`、`date-picker` 和 `upload`；`slot` 用 `prop` 查找同名插槽，`custom` 用 `component` 指定自定义组件。实例公开：

- `getFormData()`：返回深复制后的可见字段数据。
- `setFormData(data)`：只写入已声明字段，`null/undefined` 恢复默认值。
- `validate()`：校验并返回 `Promise<boolean>`。
- `submit()`：校验成功后触发 `submit`。
- `elForm`：底层 Element Plus `FormInstance`。

`column.props` 透传给字段组件，`column.slots` 可直接传 slot 函数，或用字符串引用 `SuperForm` 的同名插槽。`change(formData, value)` 仅用于内置字段。

### Upload 字段

是否提供 `props.upload` 决定模式：

- 未提供：local 模式，字段值为原始 `File` / `File[]`，适合最终提交时构造 `FormData`。
- 提供：remote 模式，选择后立即调用上传适配器，字段只保存 `SuperUploadValue` / `SuperUploadValue[]`。

```ts
import type { SuperUploadRequest } from '@yyitian/web-toolkit';

const upload: SuperUploadRequest = async (files, currentFiles) => {
  const response = await uploadFiles(files);
  return response.data.map((item) => ({
    id: item.id,
    url: item.url,
    name: item.name,
    type: item.type,
    size: item.size,
  }));
};

const imageColumn = {
  prop: 'images',
  label: '图片',
  formType: 'upload',
  props: { type: 'image', multiple: true, limit: 5, upload },
} satisfies SuperFormColumn;
```

`action` 事件的 `selected` 分支返回本批新增项和完整列表，`delete` 分支返回删除项和删除后的完整列表。remote 上传失败保持原值；local 图片预览 URL 由组件创建和释放。

### SuperFormDialog

```vue
<SuperFormDialog
  v-model="visible"
  title="编辑配置"
  :form-data="initialData"
  :columns="columns"
  :loading="saving"
  @confirm="save"
/>
```

`formData` 是每次表单挂载时写入的初始化快照。编辑状态默认按钮为“保存”，`disabled` 只读状态默认按钮为“关闭”；编辑提交成功只触发 `confirm`，不会自动关闭。实例接口与 `SuperForm` 相同，其余 Dialog 属性和事件继续透传。

### 文案与日期配置

`formatLabel(label, labelKey?)` 支持字符串、返回字符串的函数和文案记录对象。日期字段同时导出：

```ts
import {
  formatLabel,
  datePickerDefaultTime,
  dateFormat,
  dateFormatSec,
} from '@yyitian/web-toolkit';
```

`dateFormat` 为 `YYYY-MM-DD HH:mm`，`dateFormatSec` 为 `YYYY-MM-DD HH:mm:ss`。
