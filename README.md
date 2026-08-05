# @yyitian/web-toolkit

公开发布的 Vue 3 组件工具库，提供图标、按钮、浮层、配置式表单与弹窗组件，附带 Vite 插件（SVG sprite 注入 + SCSS mixin 自动注入）。

## 消费方安装

```bash
pnpm add @yyitian/web-toolkit
# 或
npm install @yyitian/web-toolkit

# 使用 SuperButton、SuperDialog、SuperForm 或 SuperFormDialog
pnpm add element-plus
# 使用 lucide 组件图标或 dynamic-icons
pnpm add @lucide/vue
```

**依赖矩阵**(用到哪个能力,才需装对应 peer):

| peer           | 必需性   | 用到以下能力时必须安装                                             |
| -------------- | -------- | ------------------------------------------------------------------ |
| `vue` (^3.5)   | **必需** | 全部                                                               |
| `element-plus` | 可选     | `SuperButton`、`SuperDialog`、`SuperForm`、`SuperFormDialog`       |
| `@lucide/vue`  | 可选     | 给 `:icon` 传 lucide 组件、或使用 `dynamic-icons` 子路径的成品图标 |

只安装实际使用组件对应的可选 peer；`vue` 为所有组件的必需依赖。

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
// 在应用入口引入一次样式
import '@yyitian/web-toolkit/style.css';
```

组件样式和 `--wt-*` 默认主题变量由 `style.css` 提供，消费方需要在应用入口引入一次。

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

/* 与 Element Plus 主题色同步 */
:root {
  --wt-color-primary: var(--el-color-primary);
}
```

### SuperButton

`SuperButton` 支持 Element Plus 按钮属性，并提供 `icon`、`label`、`square`、`active` 和 `loading`。只有图标且未声明默认插槽时显示为纯图标按钮；此时 `label` 用作 tooltip 和默认 `aria-label`。

```vue
<SuperButton label="保存" />
<SuperButton :icon="Save">保存</SuperButton>
<SuperButton :icon="Settings" label="设置" />
<SuperButton :icon="Settings" :square="32" label="设置" />
```

`square` 接受大于 `0` 的数字，单位为 px，图标尺寸为边长的一半。纯图标按钮默认宽高和图标尺寸均为 `20px`；传入 `square` 可设置固定的正方形点击区域。`#icon` 的优先级高于 `icon`；声明默认插槽后，`square` 和 `label` 不生效。`loading` 显示加载图标并禁用按钮。

### SuperPopover

`SuperPopover` 支持 `hover`、`click` 和 `manual` 三种触发方式。通过 `#reference="{ setReference }"` 指定参考元素，浮层内容写在 `#content`；浮层默认挂载到 `body`。

使用 `popperClass`、`popperStyle` 和 `--wt-popover-*` 变量自定义浮层样式：

```vue
<SuperPopover
  popper-class="my-rich-tip"
  :popper-style="{ '--wt-popover-z-index': 3000 }"
  :arrow="false"
>
  <template #reference="{ setReference }">
    <button :ref="setReference">hover</button>
  </template>
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
  <template #reference="{ setReference }">
    <button :ref="setReference">点击打开</button>
  </template>
  <template #content>点击浮层内部不会关闭</template>
</SuperPopover>

<SuperPopover
  v-model="visible"
  trigger="manual"
  :close-on-click-outside="false"
>
  <template #reference="{ setReference }">
    <button :ref="setReference">外部控制</button>
  </template>
  <template #content>完全手动关闭</template>
</SuperPopover>
```

将 `teleportTo` 设为 CSS 选择器或目标元素可指定挂载位置，设为 `false` 可在组件当前位置渲染浮层。

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
