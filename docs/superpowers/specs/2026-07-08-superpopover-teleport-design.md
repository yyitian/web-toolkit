# SuperPopover Teleport 与交互增强设计

> 状态:已确认设计,待实现计划

## 背景

`SuperPopover` 当前把 floating 节点渲染在组件根节点后代中,并依赖 DOM 继承让消费方通过根节点 class 覆盖 `--wt-popover-*` 变量。这保留了简单的二次开发能力,但在实际使用中已经遇到父组件 `overflow:hidden` 导致浮层内容被裁剪的问题。

现有 `strategy: 'fixed'` 只能缓解部分定位与裁剪场景,无法从根本上逃离父级 overflow、transform、filter、perspective 或局部 stacking context。组件需要默认 Teleport 到页面级容器,同时重新定义自定义 UI 的正式入口。

本次接受破坏式更新:不再把根节点 class/变量继承作为 floating 样式定制的正式能力。Teleport 后,样式入口必须作用在 floating 节点自身或它的真实 DOM 祖先上。

## 目标

1. 默认将 floating 节点 Teleport 到 `body`,避免被父组件裁剪。
2. 提供直接作用于 floating 节点的自定义入口,保留 `--wt-popover-*` 变量体系。
3. 支持禁用箭头,解决半透明浮层中箭头遮挡区可见的问题。
4. 支持 `disabled`,并定义它与 `v-model`、交互触发之间的优先级。
5. 支持 hover、click、manual 三种触发方式。
6. 支持可配置 open/close delay。
7. 通过 CSS 变量提供默认 z-index 与 max-width,不增加专用 prop。

## 非目标

1. 不做根节点 CSS 变量到 floating 节点的运行时桥接。
2. 不保证 `<SuperPopover class="rich-tip">` 在默认 Teleport 模式下继续影响 floating 样式。
3. 不做 focus trap、菜单键盘导航、复杂 ARIA 菜单模式。
4. 不开放 Floating UI middleware 自定义。
5. 不做 transition 动画 prop。
6. 不做嵌套 popover 协调。
7. 不做 `enterable` prop,hover 模式保持当前 floating 可进入的行为。
8. 不做单独的 `zIndex` 或 `maxWidth` prop。

## 对外 API

保留现有基础 props:

```ts
placement?: Placement;
offset?: number;
effect?: 'dark' | 'light';
title?: string;
```

新增或调整 props:

```ts
teleportTo?: string | HTMLElement | false;
trigger?: 'hover' | 'click' | 'manual';
disabled?: boolean;
arrow?: boolean;
delay?: number | { open?: number; close?: number };
closeOnClickOutside?: boolean;
popperClass?: unknown;
popperStyle?: StyleValue;
```

默认值:

```ts
{
  teleportTo: 'body',
  trigger: 'hover',
  disabled: false,
  arrow: true,
  delay: () => ({ open: 0, close: 120 }),
  closeOnClickOutside: true,
}
```

`teleportTo` 合并“是否 Teleport”和“Teleport 到哪里”两个概念:

- `'body'`:默认行为,Teleport 到 `body`。
- `string | HTMLElement`:Teleport 到指定目标。
- `false`:不 Teleport,floating 保留在组件当前位置渲染。

`popperClass` 和 `popperStyle` 是默认 Teleport 模式下的正式自定义入口:

```vue
<SuperPopover
  popper-class="rich-tip"
  :popper-style="{ '--wt-popover-z-index': 3000 }"
>
  <button>hover</button>
  <template #content>...</template>
</SuperPopover>
```

旧写法不再作为默认推荐:

```vue
<!-- 破坏式变化:默认 Teleport 后,这个 class 不再作为 floating 样式入口 -->
<SuperPopover class="rich-tip" />
```

## 样式变量

`--wt-popover-*` 变量继续存在,但语义调整为:必须作用在 `.super-popover-floating` 自身或它的真实 DOM 祖先上。

默认变量声明在 `.super-popover-floating` 上:

```scss
.super-popover-floating {
  --wt-popover-bg: var(--wt-color-bg-inverse);
  --wt-popover-color: var(--wt-color-text-inverse);
  --wt-popover-border-color: var(--wt-popover-bg);
  --wt-popover-radius: var(--wt-radius);
  --wt-popover-padding: 4px 6px;
  --wt-popover-shadow: none;
  --wt-popover-z-index: 2000;
  --wt-popover-max-width: 400px;

  z-index: var(--wt-popover-z-index);
  max-width: var(--wt-popover-max-width);
}
```

`effect="light"` 继续通过修饰类覆盖 floating 自身变量:

```scss
.super-popover-floating--light {
  --wt-popover-bg: var(--wt-color-bg);
  --wt-popover-color: var(--wt-color-text);
  --wt-popover-shadow: 0 2px 8px rgb(0 0 0 / 12%);
}
```

消费方自定义示例:

```vue
<SuperPopover popper-class="rich-tip" :arrow="false">
  <button>hover</button>
  <template #content>
    <div>半透明浮层内容</div>
  </template>
</SuperPopover>
```

```css
.rich-tip {
  --wt-popover-bg: rgb(0 0 0 / 70%);
  --wt-popover-color: #fff;
  --wt-popover-border-color: rgb(255 255 255 / 20%);
  --wt-popover-padding: 8px 12px;
  --wt-popover-z-index: 3000;
  --wt-popover-max-width: 520px;
}
```

## 模板结构

目标结构:

```vue
<div class="super-popover">
  <div ref="reference" class="super-popover-reference">
    <slot><span>hover</span></slot>
  </div>

  <Teleport v-if="teleportTo !== false" :to="teleportTo">
    <div ref="floating" class="super-popover-floating">
      ...
    </div>
  </Teleport>

  <div v-else ref="floating" class="super-popover-floating">
    ...
  </div>
</div>
```

结构规则:

1. `.super-popover` 仍是组件单根,继续接收普通 attrs/class,但不再承担 floating 主题变量承载职责。
2. `.super-popover-reference` 包裹默认 slot,作为 Floating UI 的 reference。
3. `.super-popover-floating` 合并内部基础 class、effect 修饰 class 与 `popperClass`。
4. `floatingStyles` 与 `popperStyle` 合并到 floating 节点。定位样式来自 Floating UI;外观变量和自定义样式来自 `popperStyle`。
5. 文档不鼓励消费方通过 `popperStyle` 覆盖 `position`、`left`、`top`、`transform` 等定位属性。

## 箭头行为

`arrow=true`:

1. 渲染 `.super-popover-arrow`。
2. middleware 中启用 `useArrow({ element: floatingArrow })`。
3. 继续根据实际 placement 计算箭头位置和内侧边框隐藏样式。

`arrow=false`:

1. 不渲染箭头节点。
2. middleware 中不加入 `useArrow`。
3. 不计算或应用箭头内侧边框隐藏样式。
4. 不自动调整 `offset`。关闭箭头只影响箭头显示,不隐式改变浮层与 reference 的距离。

## 状态与触发行为

`v-model` 继续表示浮层可见状态。`disabled` 具有最高优先级。

### disabled

`disabled=true` 时:

1. 当前打开的浮层立即关闭。
2. hover、click、manual 外部打开都不能让浮层保持打开。
3. 外部设置 `v-model=true` 时,组件会压回 `false`。
4. 不渲染 floating 节点。

### hover

`trigger="hover"` 是默认模式:

1. reference `mouseenter` 按 `delay.open` 打开。
2. reference `mouseleave` 按 `delay.close` 关闭。
3. floating 自身可进入:鼠标进入 floating 会取消关闭,离开 floating 后按 `delay.close` 关闭。
4. `closeOnClickOutside` 不作为 hover 模式的主要关闭机制。

### click

`trigger="click"`:

1. 点击 reference 切换打开/关闭。
2. 打开后,`closeOnClickOutside=true` 时点击 reference 和 floating 之外关闭。
3. 点击 floating 内部不关闭。
4. delay 不影响 click 切换,避免点击反馈迟滞。

### manual

`trigger="manual"`:

1. 组件不绑定打开/关闭交互。
2. 可见状态只接受外部 `v-model`。
3. 仍应用 `disabled` 压制。
4. `closeOnClickOutside=true` 时,如果外部打开了 floating,点击外部也会关闭。
5. 需要完全手动关闭时,消费方传 `:close-on-click-outside="false"`。

## delay 归一化

`delay` 支持数字或对象:

```ts
delay?: number | { open?: number; close?: number };
```

归一化规则:

1. 缺省为 `{ open: 0, close: 120 }`。
2. 传数字时,同时作为 open 和 close delay。
3. 传对象时,只覆盖提供的字段,未提供字段回退默认值。
4. `disabled` 或 `trigger !== 'hover'` 时,delay 不参与交互。

## 点击外部关闭

`closeOnClickOutside` 默认 `true`。

应判断点击目标是否同时不在 reference 和 floating 内:

1. 点击 reference:由 click trigger 自身处理切换,不作为外部点击。
2. 点击 floating 内部:不关闭。
3. 点击其他位置:在 `trigger="click"` 或 `trigger="manual"` 且 `closeOnClickOutside=true` 时关闭。

监听器仅在浮层打开且需要点外关闭时绑定,关闭后移除。

## 文档与演示

README 需要更新:

1. 删除“给 `<SuperPopover>` 加 class 覆盖变量”的推荐说法。
2. 改为说明 `popperClass` / `popperStyle` 是 Teleport 后的正式自定义入口。
3. 明确 `teleportTo=false` 时可以利用真实 DOM 继承,但这不是默认推荐路径。
4. 保留 `style.css` 必须引入的说明。`style.css` 仍提供 `--wt-*` 主题变量默认值,漏引会导致 popover 背景、文字、边框等异常。

`src/App.vue` 演示需要覆盖:

1. 默认 hover + Teleport,放在 `overflow:hidden` 容器内仍能显示。
2. `arrow=false`,半透明背景下不出现箭头遮挡问题。
3. `trigger="click"`,点击打开、点外关闭、点 floating 内部不关闭。
4. `disabled`,hover/click/manual 外部打开都被压制。

## 验证

仓库当前没有测试框架,也没有 `test` 脚本。本次实现后优先运行:

```bash
pnpm lint
pnpm build
```

人工验证本地 demo 中的四个场景:

1. `overflow:hidden` 容器内的默认 popover 不被裁剪。
2. 半透明 popover 关闭箭头后没有箭头遮挡残影。
3. click trigger 的打开、点外关闭、内部点击保持打开符合预期。
4. disabled 会压制所有触发方式和外部 `v-model=true`。

