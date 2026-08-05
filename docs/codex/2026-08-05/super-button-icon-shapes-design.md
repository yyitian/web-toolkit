# SuperButton 纯图标与正方形按钮设计

> 状态：设计边界及审查结论已确认，待开始编码
>
> 日期：2026-08-05
>
> 本文只记录设计，不代表组件、演示、文档、构建或浏览器验证已经完成。

## 1. 背景

当前 `SuperButton` 使用 Element Plus `ElButton` 的 `#icon` 插槽渲染 `SuperIcon`。实际体验发现：

1. 旧实现即使没有默认插槽，也会向 `ElButton` 提供默认插槽，导致 Element Plus 生成文字容器，纯图标场景下图标不能按其原生 icon-only 结构居中。
2. 业务存在视觉上接近 `SuperIcon`、但需要原生按钮语义和 `disabled` 能力的纯图标操作。
3. 业务还需要边长可精确控制、图标居中的正方形按钮，不希望使用 Element Plus 的 `small/default/large` 离散尺寸。
4. `SuperIcon title` 依赖 `SuperPopover` 包装触发节点；若在按钮中复用旧包装结构，会让包装层成为 flex item，导致 `margin-left: auto` 等布局规则失效。

本次强化 `SuperButton`，同时重构 `SuperPopover` 的参考节点机制。组件 API 保持克制，不新增 `iconOnly`、`iconSize`、`title` 等按钮专用属性。

## 2. 目标

1. 修复只有图标时的实际 DOM 结构，让 Element Plus 正确按 icon-only 按钮渲染。
2. 自动识别普通按钮、纯图标按钮和带数值尺寸的正方形按钮。
3. 纯图标按钮视觉紧贴图标，同时具备原生按钮的禁用、加载、点击拦截和键盘能力。
4. 通过 `square?: number` 精确控制正方形按钮边长，并自动计算图标尺寸。
5. 通过可选 `label` 同时支持普通文字按钮简写，以及纯图标按钮的 tooltip 和无障碍名称。
6. 保留字符串 sprite、Vue/Lucide 组件图标、动态图标 `active` 和 `#icon` slot。
7. 重写 `SuperPopover` 为无参考节点包装的结构，确保 tooltip 不改变按钮在 flex、grid、相邻选择器和按钮组中的 DOM 层级。
8. 保留正式支持的 Popover 浮层自定义样式能力。

## 3. 非目标

1. 不新增 `iconOnly`、`iconMode`、`iconSize` 或 `title` 等 `SuperButton` prop。
2. 不强制纯图标按钮必须提供 `label`，也不因缺少 `label` 输出警告。
3. 不为 `#icon` 中任意 HTML、图片、canvas 或写死内联尺寸的自定义组件保证自动缩放。
4. 不递归检查默认插槽本次实际渲染出的 VNode 是否为空。
5. 不新增 `#loading`，也不复用 Element Plus 的 `loadingIcon`、`.is-loading` 和 loading 遮罩；加载状态由 `SuperButton` 自行实现。
6. 不扩展 `SuperPopover` 的触发状态机，不新增键盘焦点触发、Escape 关闭或新的 ARIA 状态管理。
7. 不保留 `SuperPopover` 旧的默认插槽触发节点协议和参考节点包装 DOM。
8. 本设计阶段不修改组件代码、演示、README、版本或 Git 历史。

## 4. SuperButton 公共 API

### 4.1 Props

```ts
interface SuperButtonProps
  extends Omit<ButtonProps, 'icon' | 'loading'> {
  icon?: string | Component;
  label?: string;
  square?: number;
  active?: boolean;
  loading?: boolean;
  disabled?: boolean;
}
```

`ButtonProps` 使用 `import type` 从 `element-plus` 导入。组件实际导出的 Vue props 类型必须与 `SuperButtonProps` 一致，不能只在旁侧声明接口而让模板/TSX 仍只识别六个自有 props。`SuperButtonProps` 作为公共类型从 `lib/main.ts` 导出，供消费方二次封装。

- `icon`：继续接受 sprite 名称或 Vue 组件。
- `label`：表示按钮名称；是否可见由按钮形态决定。
- `square`：纯图标按钮的边长，单位固定为 `px`。
- `active`：继续只透传给支持 `dynamicIcon` 的图标。
- `loading`：由 `SuperButton` 自行渲染 spinner，并把真实按钮置为 disabled。
- `disabled`：直接传给 `ElButton`。

不声明 `title` prop。调用方传入的原生 HTML `title` 仍随 `$attrs` 透传给 `ElButton`，但不参与自定义 tooltip 设计。原生 `title` 与 `label` 同时存在时两者都保留，可能出现浏览器原生提示与 `SuperPopover` 双重提示，由消费方承担。

### 4.2 Slots

- `#icon`：自定义图标，优先于 `icon` prop。
- 默认插槽：可见按钮内容，优先于 `label`。

不新增 `#loading`，也不向 `#icon` 暴露额外 slot 参数。

### 4.3 Element Plus 属性透传

除上述自有 props 外，其余属性、原生属性和事件继续透传给 `ElButton`，包括但不限于：

- `type`
- `plain`
- `text`
- `link`
- `circle`
- `round`
- `native-type`
- `autofocus`
- `class`
- `style`
- `aria-*`
- 事件监听器

`class`、`style` 和事件必须合并，不得被内部 props 覆盖。

## 5. 按钮形态判断

只判断插槽是否声明，不检查其实际 VNode 内容：

```ts
const hasIcon = Boolean(props.icon || slots.icon);
const hasDefaultSlot = Boolean(slots.default);
const isIconOnly = hasIcon && !hasDefaultSlot;
const isSquare = isIconOnly && normalizedSquare != null;
```

`label` 只按 JavaScript truthy 判断：

```ts
const hasLabel = Boolean(props.label);
```

组件不执行 `trim()` 或其他内容规范化。空字符串不生效，纯空白字符串会被视为有效 `label`；由此产生的空白文字、tooltip 或 `aria-label` 由消费方承担。

条件插槽即使本轮输出为空，只要声明了默认插槽，仍按图标加文字按钮处理。由此造成的空内容、square 不生效或形态切换不符合预期，由消费方负责。

### 5.1 形态矩阵

| 图标 | 默认插槽 | `square` | `label` | 结果 |
| --- | --- | ---: | --- | --- |
| 无 | 无 | 无 | `保存` | `label` 作为可见文字 |
| 无 | `保存` | 无 | 任意 | 默认插槽作为可见内容，忽略 `label` |
| 有 | 无 | 无 | 无 | 紧贴图标的纯图标按钮，无 tooltip |
| 有 | 无 | 无 | `设置` | 纯图标按钮，`label` 作为 tooltip 和默认 `aria-label` |
| 有 | 无 | `32` | 无 | 32px 正方形按钮，无 tooltip |
| 有 | 无 | `32` | `设置` | 32px 正方形按钮，`label` 作为 tooltip 和默认 `aria-label` |
| 有 | 有 | 任意 | 任意 | 图标加文字按钮，忽略 `square` 和 `label` |

带图标时，`label` 永远不作为可见文字。图标加文字必须使用默认插槽：

```vue
<SuperButton :icon="Save">保存</SuperButton>
```

## 6. 纯图标按钮

```vue
<SuperButton :icon="Settings" />
```

纯图标按钮采用紧贴图标的点击区域：

- 默认标准图标尺寸为 `20px`。
- 按钮本体的 `width`、`min-width` 和 `height` 均固定为 `20px`，确保实际点击区域为 `20px × 20px`，而不是只缩小图标后继续继承 Element Plus 的默认按钮高度。
- 无边框、无背景、无额外 padding。
- 点击区域不自动扩张到 `28px`、`32px` 或其他隐式尺寸。
- 需要更大、精确点击区域时由消费方显式传入 `square`。
- hover 只改变图标/文字颜色，不额外增加背景。
- 仅在纯图标形态移除 Element Plus 默认的 `focus-visible` outline，避免外轮廓破坏消费方既有 UI 氛围。
- 不取消 `focus-visible` 状态，不额外覆盖 box-shadow、颜色、背景、边框或尺寸；消费方已有的其他焦点样式仍可正常生效。
- 保留真实按钮的 Tab 聚焦和键盘操作语义；普通文字按钮不受该 outline 重置影响。
- 纯图标及 square 按钮有意不提供默认可见焦点反馈，因此不保证开箱即用的键盘焦点可辨识性；有无障碍规范要求的消费方需要自行提供符合其 UI 的 `:focus-visible` 样式，并显式覆盖内部的 `outline: none`。
- disabled 使用 Element Plus 的禁用色和 `cursor: not-allowed`。
- loading 使用 `SuperButton` 自有的 `super-button-loading` 状态和内部 spinner。

普通纯图标按钮的最小几何与焦点样式覆盖为：

```scss
.super-button--icon-only:not(.super-button--square) {
  width: var(--wt-button-icon-size);
  min-width: var(--wt-button-icon-size);
  height: var(--wt-button-icon-size);
  padding: 0;
}

.super-button--icon-only:focus-visible {
  outline: none;
}
```

纯图标按钮是一个真实 `ElButton`，不是给 `SuperIcon` 增加 disabled 模拟状态。

## 7. square 数值与组合规则

### 7.1 有效值

`square` 只接受有限正数：

```ts
const normalizedSquare =
  typeof props.square === 'number' &&
  Number.isFinite(props.square) &&
  props.square > 0
    ? props.square
    : undefined;
```

- 允许小数和任意正数，不设置最小值、最大值或整数限制。
- `0`、负数、`NaN`、`Infinity` 和字符串均无效。
- 无效值降级为普通纯图标按钮，不抛异常。
- 数字必须通过绑定传入：`<SuperButton :square="32" />`。

### 7.2 square 职责

`square` 是几何尺寸修饰符，不是严格的视觉 variant。它只接管：

- `width`
- `min-width`
- `height`
- `padding`
- 图标尺寸

默认 `ElButton` 仍表现为带边框正方形按钮，但允许继续组合：

```vue
<SuperButton :icon="Settings" :square="32" text />
<SuperButton :icon="Settings" :square="32" circle />
<SuperButton :icon="Settings" :square="32" plain />
```

组合优先级：

1. `square` 最终决定宽度、高度和图标尺寸。
2. square 模式固定 `padding: 0`。
3. Element Plus `size` 不能覆盖 square 的几何尺寸。
4. `text`、`link`、`plain`、`circle`、`round` 只改变外观。
5. `type`、`disabled`、`loading` 正常生效。
6. 存在默认插槽时忽略 `square`。

## 8. 图标来源、尺寸与 loading

### 8.1 来源优先级

非 loading 状态下：

1. `#icon` slot；
2. `icon` prop；
3. 无图标。

`icon` prop 必须继续通过 `SuperIcon` 渲染，不能原样传给 `ElButton.icon`，否则会破坏 sprite 字符串和动态图标 `active`。

### 8.2 自动尺寸

- 普通纯图标按钮：`20px`。
- square 按钮：`square / 2`。
- 图标加文字按钮：沿用 Element Plus 普通按钮图标尺寸。
- square 小数边长产生的小数图标尺寸不取整。

通过按钮 CSS 变量和 Element Plus `.el-icon` 容器统一控制标准图标：

```scss
.super-button--icon-only {
  --wt-button-icon-size: 20px;
}

.super-button--square {
  --wt-button-square: /* square px */;
  --wt-button-icon-size: calc(var(--wt-button-square) * 0.5);
}
```

组件保证以下内容自动缩放：

- `icon` prop 生成的 `SuperIcon`；
- `#icon` 中的 `SuperIcon`；
- Lucide 图标；
- 标准 SVG；
- `SuperButton` 内部 loading spinner。

任意 HTML、图片、canvas、自定义非 SVG 组件或写死内联尺寸的内容不作强制保证。

### 8.3 loading

- `loading` 不传给 `ElButton`，避免生成带 `pointer-events: none` 的 Element Plus `.is-loading`。
- loading 时给真实按钮增加 `super-button-loading` 状态类。
- 实际传给 `ElButton` 的 disabled 为 `props.disabled || props.loading`，继续使用原生按钮禁用语义和 Element Plus 的点击拦截。
- loading 时由 `SuperButton` 在 `#icon` 位置渲染内部 spinner，覆盖正常 `#icon`/`icon`；spinner 可复用 `SuperIcon loading` 的现有实现。
- 不提供内部或消费方 `#loading` slot，Element Plus 的 `loadingIcon`/`loading-icon` 也不参与该状态。
- 普通纯图标按钮的 spinner 为 `20px`，square 模式的 spinner 为 `square / 2`，图标加文字按钮沿用普通图标尺寸。
- `loading` 本身不计入 `hasIcon`：文字按钮仍是文字按钮，原本的纯图标按钮仍保持纯图标形态，不为空按钮设计特殊 loading-only 形态。
- 不复用 Element Plus 的 loading 遮罩和 `.is-loading` 样式；颜色、disabled 和其他基础按钮主题仍由 Element Plus 提供。
- 由于 reference 不再被 `.is-loading { pointer-events: none }` 排除，loading tooltip 与普通 disabled tooltip 归为同一个原生 disabled 按钮 hover 兼容性问题，在 Chrome、Firefox 中统一实测。

## 9. label、tooltip 与无障碍名称

`label` 是可选增强，不是纯图标按钮必填项：

```vue
<SuperButton :icon="Settings" />
<SuperButton :icon="Settings" label="设置" />
<SuperButton :icon="Settings" :square="32" />
<SuperButton :icon="Settings" :square="32" label="设置" />
```

规则：

- 无图标且无默认插槽时，`label` 是可见文字。
- 纯图标或 square 按钮存在非空 `label` 时，创建 `SuperPopover` tooltip。
- 纯图标或 square 按钮没有 `label` 时，不创建 Popover。
- 调用方没有提供 `aria-label` 时，以 `label` 自动补充。
- 调用方提供的 `aria-label` 优先。
- 默认插槽存在时，默认插槽优先，`label` 不显示且不创建 tooltip。
- 不提供 `SuperButton.title` 自定义 tooltip API。
- 原生 `title` 始终按 `$attrs` 透传；与 `label` 同时存在时不去重、不设优先级。

按钮的 disabled/loading 只影响按钮操作，不透传为 `SuperPopover.disabled`；有 `label` 时仍允许鼠标触发 tooltip。

## 10. SuperPopover 破坏性重构

### 10.1 新 reference 协议

删除旧的默认插槽触发节点与包装结构：

```html
<div class="super-popover">
  <div class="super-popover-reference">...</div>
</div>
```

改为唯一的 `#reference` scoped slot：

```vue
<SuperPopover title="设置">
  <template #reference="{ setReference }">
    <button :ref="setReference">设置</button>
  </template>
</SuperPopover>
```

`SuperPopover` 使用 Fragment 输出 reference slot 和 Teleport，不生成真实参考节点包装元素。默认 Teleport 场景下，最终 reference 直接参与消费方 flex、grid、相邻选择器和按钮组布局。

保留 `teleportTo=false`。显式关闭 Teleport 时，floating 会在打开后成为 reference 后方的真实兄弟节点，组件不保证 `.el-button + .el-button`、按钮组直接子级等 DOM 关系不受影响，也不为该模式增加包装、占位或特殊插入策略。该特殊配置导致的展示差异由消费方承担。

该协议分为两层：

- `@floating-ui/vue` 的 `useFloating(reference, floating, ...)` 接收真实 DOM reference 并负责浮层定位。
- `#reference` scoped slot、`setReference`、组件实例解析和触发事件迁移由 `SuperPopover` 自己提供，用于在不生成包装节点的前提下把真实 DOM 交给 Floating UI。

`setReference` 不是 Floating UI 提供的 `Reference` 组件或公共插槽协议，而是 `SuperPopover` 对 Vue template ref 和 Floating UI reference ref 的适配层。

### 10.2 内部 reference 复用

继续保留现有：

```ts
const reference = ref<HTMLElement | null>(null);
```

新增 setter，把原生元素或组件实例解析为 HTMLElement：

```ts
function setReference(target: unknown) {
  reference.value = resolveReferenceElement(target);
}
```

`resolveReferenceElement()` 固定按以下顺序解析：

1. SSR 等不存在 `HTMLElement` 的环境直接返回 `null`；
2. `target` 本身是 `HTMLElement` 时直接返回；
3. 目标为对象时读取公开的 `ref`，兼容已解包的 `HTMLElement` 和仍为 Ref 的 `ref.value`；
4. 最后读取普通 Vue 组件实例的 `$el`，仅接受 `HTMLElement`；
5. 其他情况返回 `null`。

每个候选值都必须通过 `instanceof HTMLElement` 类型守卫。Fragment 的 Text/Comment `$el`、任意对象或无法解析为单一 HTMLElement 的组件不绑定触发事件，也不打开浮层。reference 变化时先清理旧元素监听器，再绑定新元素。

### 10.3 触发方式

维持现有三种触发方式，不扩展状态机：

- `hover`：reference 鼠标进入时打开，离开时按延迟关闭；鼠标进入浮层可阻止关闭。
- `click`：点击 reference 切换，点击外部关闭。
- `manual`：由 `v-model` 控制。

保留现有：

- `delay`
- `disabled`
- `closeOnClickOutside`
- `placement`
- `offset`
- `arrow`
- `effect`
- `teleportTo`

不新增焦点触发、Escape 关闭或额外 ARIA 状态管理。事件监听对象从旧包装层迁移到 `reference.value`，reference 变化和组件卸载时必须清理监听器。

### 10.4 自定义样式

保留正式支持的浮层样式入口：

- `popperClass`
- `popperStyle`
- `effect`
- `--wt-popover-*` 变量
- `.super-popover-floating`
- `.super-popover-arrow`
- `#content`

reference 样式直接写在 `#reference` 中的真实节点上。

删除并不再兼容：

- `.super-popover`
- `.super-popover-reference`
- 给 `<SuperPopover class="...">` 设置真实根节点样式

`SuperPopover` 与 `SuperButton` 一样属于包含多种渲染分支和生命周期管理的复杂组件，重构时统一使用 `defineComponent` 和 render function，不继续混用多段 `<script setup>` 与模板。组件配置使用：

```ts
export default defineComponent({
  inheritAttrs: false,
  // props、setup 与 render
});
```

浮层自定义继续使用 `popperClass`/`popperStyle`，reference 自定义由 reference 节点自身承担。

## 11. SuperIcon 职责调整

独立 `SuperIcon` 不再默认假设可点击，只保留继承规则：

```scss
.super-icon {
  cursor: inherit;
}
```

`SuperButton` 不重复声明 cursor，也不再增加 `.super-button .super-icon { cursor: inherit; }`。按钮内部图标自然继承真实 `ElButton` 的 cursor；enabled/disabled 的 `pointer`、`not-allowed` 继续由 Element Plus 负责。纯图标视觉重置不得覆盖该 cursor 链路。

职责边界：

- `SuperIcon`：图标渲染、动态状态、旋转、独立 loading 和 `title` tooltip。
- `SuperButton`：可点击图标、disabled、按钮 loading、无额外可见轮廓的 focus 和键盘语义。

`SuperIcon title` 公共用法保持不变，但内部迁移到新的 `SuperPopover #reference` 协议。

## 12. SuperButton 实现结构

`SuperButton` 改为完整的 `defineComponent` render function，不保留当前实验性的：

```vue
<Component :is="renderButton" />
```

实现原则：

1. `inheritAttrs: false`，统一控制属性落点。
2. 使用 `mergeProps` 合并外部 `$attrs`、内部 class/style 和事件。
3. 每次 render 先判断按钮形态，再组装 `ElButton` slots。
4. `#icon` 优先，否则用 `SuperIcon` 渲染 `icon` prop。
5. 默认插槽存在时原样透传；否则仅在无图标时把 `label` 作为默认内容。
6. `disabled` 直接交给 `ElButton`；`loading` 由内部 spinner 和 `super-button-loading` 实现，并把传给 `ElButton` 的 disabled 合并为 `props.disabled || props.loading`。
7. square 内部几何 style 后合并，确保宽高、min-width 和 padding 不被外部同名 style 覆盖。
8. tooltip 生效时，使用 `SuperPopover #reference` 的 `setReference` 创建同一个真实 `ElButton`。

概念结构：

```ts
export default defineComponent({
  inheritAttrs: false,
  props: {
    icon: /* string | Component */,
    label: String,
    square: Number,
    active: Boolean,
    loading: Boolean,
    disabled: Boolean,
  },
  setup(props, { attrs, slots }) {
    function renderButton(setReference?: (value: unknown) => void) {
      return h(ElButton, mergedButtonProps, resolvedButtonSlots);
    }

    return () => {
      if (isIconOnly && props.label) {
        return h(
          SuperPopover,
          { title: props.label },
          {
            reference: ({ setReference }) => renderButton(setReference),
          },
        );
      }

      return renderButton();
    };
  },
});
```

## 13. 预计修改范围

实施阶段预计修改：

- `src/components/SuperButton/index.vue`
- `src/components/SuperIcon/index.vue`
- `src/components/SuperPopover/index.vue`
- `src/App.vue`
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `lib/main.ts`（导出 `SuperButtonProps`）

实施时迁移源码、演示和当前有效说明中的全部旧 SuperPopover reference 用法，同时删除 README 原第 18 行已经过时的 GitHub Packages/PAT 迁移提示。`AGENTS.md`、`CLAUDE.md` 中“不 Teleport、依赖根节点变量继承”的旧说明改为新 reference、默认 Teleport 和 `popperClass`/`popperStyle` 规则。

带日期的历史设计、历史实施计划、旧版本发布记录和 `docs/审查结论.md` 保留原貌，不追溯改写。

## 14. 兼容性与迁移

### 14.1 SuperButton

- 普通文字按钮和图标加文字按钮保持既有调用方式。
- 旧 icon-only 偏心行为修复，外观和 DOM 会变化。
- `label` 是新增能力。
- `square` 是新增能力。
- `#icon` 明确优先于 `icon` prop。
- 直接依赖 `SuperIcon cursor: pointer` 的交互图标应迁移为 `SuperButton`。

### 14.2 SuperPopover

这是明确的破坏性 slot 迁移：

```vue
<!-- 旧 -->
<SuperPopover title="设置">
  <button>设置</button>
</SuperPopover>

<!-- 新 -->
<SuperPopover title="设置">
  <template #reference="{ setReference }">
    <button :ref="setReference">设置</button>
  </template>
</SuperPopover>
```

仓库内调用全部迁移；发布说明必须明确旧默认插槽触发协议不再支持。

## 15. 演示与验收场景

`src/App.vue` 至少覆盖：

1. 文字按钮：默认插槽与 `label` 两种方式。
2. 图标加文字按钮。
3. 无 `label` 纯图标按钮。
4. 有 `label` 纯图标 tooltip。
5. disabled 纯图标按钮。
6. loading 纯图标按钮，确认使用 `super-button-loading` 而非 Element Plus `.is-loading`。
7. 24、32、40、35.5 等 square 尺寸。
8. square + `text`、`circle`、`plain` 组合。
9. `icon` prop 的 sprite、Lucide、动态图标。
10. `#icon` slot 优先于 `icon` prop。
11. square loading spinner 自动缩放并覆盖正常图标。
12. flex 容器中 `margin-left: auto` 对有 label tooltip 的按钮正常生效。
13. `SuperPopover` hover、click、manual 三种触发方式。
14. `popperClass`、`popperStyle`、effect、箭头和 Teleport 样式正常。
15. `SuperIcon title` 在 Popover 重构后正常。
16. `teleportTo=false` 的实际 DOM 与已声明限制一致，默认 Teleport 下按钮相邻关系不受影响。
17. 空字符串 `label` 不生效，纯空白 `label` 按有效值原样处理。
18. `label` 与原生 `title` 同时提供时两者都保留。
19. 构建声明产物和消费方模板/TSX 可识别完整 Element Plus 按钮 props，并能从包入口导入 `SuperButtonProps`。

## 16. 验证要求

实施完成后至少运行：

```bash
pnpm lint
pnpm build
```

还需要进行真实浏览器验证，重点检查：

- icon-only 居中和实际 DOM；
- square 精确宽高与图标比例；
- disabled/loading cursor 和点击拦截；
- tooltip 对 disabled/loading 按钮的鼠标触发，并在 Chrome、Firefox 中验证原生 disabled hover 行为；
- loading DOM 不出现 Element Plus `.is-loading`，且 `super-button-loading` spinner 正确覆盖正常图标；
- 纯图标和 square 只移除 Element Plus 的 focus-visible outline，不提供默认可见焦点反馈；普通文字按钮不受影响，并确认消费方能够通过显式覆盖提供自己的焦点样式；
- flex `margin-left: auto`；
- `ElButtonGroup` 和 `.el-button + .el-button`；
- Popover reference 事件绑定、切换与卸载清理；
- Teleport 后的主题变量、自定义 class/style 和箭头定位。
- `teleportTo=false` 的已声明 DOM 边界；
- `SuperButtonProps` 公共导出和消费方类型提示；
- README、AGENTS、CLAUDE 与源码中不再保留当前有效的旧 reference 协议或旧变量继承说明。

在 lint、build 和上述浏览器关键路径未完成前，不宣称本次重构完成。
