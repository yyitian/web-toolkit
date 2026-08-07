# 主题定制

组件库使用 `--wt-*` CSS 变量提供基础主题。先确保应用入口已经引入：

```ts
import '@yyitian/web-toolkit/style.css';
```

## 默认变量

```css
:root {
  --wt-color-primary: #409eff;
  --wt-color-success: #67c23a;
  --wt-color-warning: #e6a23c;
  --wt-color-danger: #f56c6c;
  --wt-color-info: #909399;
  --wt-color-text: #222;
  --wt-color-text-inverse: #fff;
  --wt-color-bg: #fff;
  --wt-color-bg-inverse: #222;
  --wt-color-border: #e5e7eb;
  --wt-radius: 4px;
}
```

在应用自己的全局样式中覆盖即可：

```css
:root {
  --wt-color-primary: #7c3aed;
  --wt-radius: 8px;
}
```

## Popover 变量

`SuperPopover` 的浮层默认 Teleport 到 `body`。局部容器上的 CSS 变量不会自动传到浮层，
需要通过 `popperClass` 把样式类加到浮层本身：

```vue
<SuperPopover popper-class="project-popover" title="详情">
  <template #reference="{ setReference }">
    <button :ref="setReference">查看</button>
  </template>
</SuperPopover>
```

```css
.project-popover {
  --wt-popover-bg: #172554;
  --wt-popover-color: #eff6ff;
  --wt-popover-border-color: #3b82f6;
  --wt-popover-radius: 8px;
  --wt-popover-padding: 8px 12px;
  --wt-popover-shadow: 0 8px 24px rgb(15 23 42 / 20%);
  --wt-popover-z-index: 2600;
  --wt-popover-max-width: 320px;
}
```

也可以通过 `popperStyle` 直接传入变量。只有明确需要让浮层留在参考节点旁边时，才使用
`:teleport-to="false"`。

## 与 Element Plus 协作

`SuperButton`、`SuperDialog` 和表单组件复用 Element Plus。`--wt-*` 不会覆盖 Element
Plus 的全部变量；如果项目需要统一品牌色，应同时配置 `--el-color-primary` 等变量。
