# 图标合并 + Popover 主题化 + 主题色 token 设计

> 状态:已实现(Part 2 的 SuperPopover 主题化在实现中由「两层变量」改为「单根 + `:where()` 零权重预设」,本文已据最终实现更新)
> 日期:2026-06-23(2026-06-23 同日修订 Part 2 实现方案)
> 关联 backlog:无直接对应章节(章节一已完成,本次为衍生的 API 清理与主题能力补强)

## 0. 概览

本次三块需求,合并为一份 spec(总改动面小:3 个组件 + 1 个新样式文件):

1. **主题色 token(`--wt-*`)** —— 引入一套可被消费方运行时覆盖的 CSS 变量,作为库的主题身份。Part 1,是 Part 2 的地基。
2. **SuperPopover 主题化** —— 接通已存在却空转的 `effect` prop(新增 light 预设),并把气泡样式全面变量化以支持消费方二次开发(自定义背景/渐变/边框/文字/圆角/内边距)。Part 2。
3. **SuperIcon 合并 `name`/`lucide` → 单个 `icon`** —— 纯 API 清理。Part 3,与 Part 1/2 完全独立。

Part 1↔2 耦合(popover 取 token),Part 3 独立,plan 阶段可分别排序。

---

## 1. 主题色 token(`--wt-*`)

### 1.1 机制与前缀

- 用 **CSS 自定义属性**(运行时可被消费方覆盖;SCSS 变量编译期即消失、无法覆盖,故排除)。
- 前缀 **`wt`**(web-toolkit,对齐包名 `@yyitian/web-toolkit` 的对外身份)。
- **不绑定任何 UI 库**:自有默认值,模仿 element-plus 的语义色板。要与某 UI 库主题同步,由**消费方自行桥接**(库不做到 element-plus 的任何映射)。

### 1.2 Token 定义

新建 `src/styles/theme.css`:

```css
:root {
  /* 语义色板(模仿 element-plus,自有默认值) */
  --wt-color-primary: #409eff;
  --wt-color-success: #67c23a;
  --wt-color-warning: #e6a23c;
  --wt-color-danger: #f56c6c;
  --wt-color-info: #909399;

  /* 中性色(自绘组件用:文字/表面/描边) */
  --wt-color-text: #222;
  --wt-color-text-inverse: #fff;
  --wt-color-bg: #fff;
  --wt-color-bg-inverse: #222;
  --wt-color-border: #e5e7eb;

  /* 几何 */
  --wt-radius: 4px;
}
```

### 1.3 如何进入消费方

在 `lib/main.ts` **顶部** `import '@/styles/theme.css';`。Vite lib 构建会把它抽进 `dist/style.css`。消费方本就要 `import '@yyitian/web-toolkit/style.css'`,于是默认值**自动生效,零额外步骤**。不新增子路径导出。

> **本仓库开发预览**:dev 入口 `src/main.ts` 走 `@/styles/index.scss`(不经 `lib/main.ts`),故 `theme.css` 还需在 `src/styles/index.scss` 里 `@forward './theme.css';`(与 `reset.css` 同范式),否则 `pnpm dev` 下 `--wt-*` 未定义、popover 背景会失效。

### 1.4 消费方覆盖 / 同步(写入 README)

```css
/* 改主题色 */
:root {
  --wt-color-primary: #6d28d9;
}

/* 想跟 element-plus 主题同步,消费端自己桥接(库不做此映射) */
:root {
  --wt-color-primary: var(--el-color-primary);
}
```

### 1.5 现有组件接入边界

- **SuperPopover**:中性 token 接入(见 Part 2)。
- **SuperButton / SuperIcon**:本次**不改取色**(按钮仍由 element-plus 的 `type` 供色;icon 仍 `currentColor`)。
- **语义色板(primary/success/…)本次仅定义、暂未被自有组件消费**——作为库主题身份与消费方可用入口,待 backlog 章节二「SuperButton 脱离 element-plus」时由它供色。spec 明确标注此点,避免误解。
- **诚实取舍**:不绑定 UI 库的前提下,SuperButton 默认仍是 element-plus 原色,与 `--wt-color-primary` 默认值不必逐像素一致;要完全统一需消费方桥接。这是该路线的固有代价,已认可。

---

## 2. SuperPopover 主题化

### 2.1 目标

- 接通 `effect: 'dark' | 'light'`(当前已声明、默认 `dark`,但样式写死 `#222`/`#fff`、prop 空转)。新增 light 预设。
- 气泡样式**全面变量化**,使消费方无需 fork、无需新 props 即可二次开发(自定义背景含渐变、边框、文字色、圆角、内边距)。
- 保留现有 `#content` 具名插槽(承载 title + description 等结构化富内容)。

### 2.2 富 popover 的归属:消费方二次开发

`主题 border + 渐变背景 + 自定义文字 + title/description` 属于「popover 卡片」,不是 tooltip 定位原语该承担的职责。库**不**把这些做成 props;改为:

- 库提供:dark/light 两套预设 + 气泡 CSS 变量化 + `#content` 插槽 + 定位/箭头/flip/shift 中间件(已具备)。
- 消费方二次开发 = **给 `<SuperPopover>` 加一个 class 覆盖 `--wt-popover-*` 变量 + 填 `#content` 插槽**。class 透传落到组件单根、盖过零权重预设(机制见 2.3)。
  ```vue
  <SuperPopover class="my-rich-tip">
    <span>hover</span>
    <template #content>…title + description…</template>
  </SuperPopover>
  ```
  ```css
  .my-rich-tip {
    --wt-popover-bg: linear-gradient(135deg, #6d28d9, #2563eb);
    --wt-popover-color: #fff;
    --wt-popover-border-color: rgb(
      255 255 255 / 30%
    ); /* 直接给边框上色即显形 */
    --wt-popover-padding: 12px 14px;
  }
  ```

### 2.3 单根 + `:where()` 零权重预设(关键实现细节)

> 最初设计用「两层变量」(对外 `--wt-popover-*` / 内部 `--_wt-popover-*` + `var(a, var(b))` fallback)。实现时改为**更简的单层方案** —— 两层每属性变量翻倍、过于冗余。最终实现如下:

- **单根节点**:SuperPopover 改为单根 `<div class="super-popover">`(`display: contents`,不生成盒子、保持原 sibling 布局),CSS 变量挂根上,floating 气泡作为**后代继承**变量。消费方只需把 class 透传到根即可一次性覆盖全部变量。
- **预设用 `:global(:where(.super-popover))` 声明,权重归零**:
  - `:where()` 把预设压到 `0,0,0`,消费方任意一个 class(`0,1,0`)即可盖过;
  - `:global()` 阻止 scoped 编译给选择器尾部外挂 `[data-v-x]`(否则权重又被抬回 `0,1,0`,`:where` 失效)。**两者缺一不可**。
- **气泡只读变量、不自己声明** → 根上(含消费方 class)的值才能继承下来。
- **`--wt-popover-border-color` 默认 = `var(--wt-popover-bg)`**(与背景同色 → 边框隐形);dark/light 各自跟随自己的背景。消费方二次开发**直接设 `--wt-popover-border-color` 即可让边框显形**。

对外可覆盖变量清单:`--wt-popover-bg`、`--wt-popover-color`、`--wt-popover-border-color`、`--wt-popover-radius`、`--wt-popover-padding`、`--wt-popover-shadow`。

### 2.4 样式实现(scoped)

```scss
// 单根:不生成盒子、保持原布局,仅承载变量与 class 透传
.super-popover {
  display: contents;
}

// 预设挂根:`:global(:where())` 让权重归零,消费方一个 class 即可一次性覆盖
:global(:where(.super-popover)) {
  --wt-popover-bg: var(--wt-color-bg-inverse);
  --wt-popover-color: var(--wt-color-text-inverse);
  --wt-popover-border-color: var(
    --wt-popover-bg
  ); // 同背景 → 隐形;二开直接设即显形
  --wt-popover-radius: var(--wt-radius);
  --wt-popover-padding: 4px 6px;
  --wt-popover-shadow: none;
}

:global(:where(.super-popover--light)) {
  --wt-popover-bg: var(--wt-color-bg);
  --wt-popover-color: var(--wt-color-text);
  --wt-popover-shadow: 0 2px 8px rgb(0 0 0 / 12%);
}

.super-popover-floating {
  @include font(12px, $color: var(--wt-popover-color));
  background: var(--wt-popover-bg);
  border: 1px solid var(--wt-popover-border-color);
  border-radius: var(--wt-popover-radius);
  padding: var(--wt-popover-padding);
  box-shadow: var(--wt-popover-shadow);
}

.super-popover-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--wt-popover-bg);
  border: 1px solid var(--wt-popover-border-color);
  transform: rotate(45deg);
}
```

箭头朝向气泡内侧的两条边,需把 `border-width` 置 0,只留外侧两边成三角描边(否则设了可见 `--wt-popover-border-color` 时内侧会露接缝)。哪两条边随 `staticSide` 变化,故由 script 计算后内联:

```ts
// 旋转 45° 后,内侧两条边随 staticSide 变化
const arrowInnerBorderHidden = computed<Record<string, string>>(() => {
  const map: Record<string, Record<string, string>> = {
    bottom: { borderTopWidth: '0', borderLeftWidth: '0' },
    top: { borderBottomWidth: '0', borderRightWidth: '0' },
    left: { borderTopWidth: '0', borderRightWidth: '0' },
    right: { borderBottomWidth: '0', borderLeftWidth: '0' },
  };
  return map[staticSide.value] ?? {};
});
```

### 2.5 模板改动(单根)

根元素持 `super-popover`(及 effect 修饰类);trigger 与 floating 作为其子节点,箭头内联合并 `arrowInnerBorderHidden`:

```vue
<div
  class="super-popover"
  :class="{ 'super-popover--light': effect === 'light' }"
>
  <div ref="reference" @mouseenter="visible = true" @mouseleave="visible = false">
    <slot><span>hover</span></slot>
  </div>
  <div v-if="visible" ref="floating" :style="floatingStyles" class="super-popover-floating">
    <slot name="content"><span>{{ title }}</span></slot>
    <div
      ref="floatingArrow"
      class="super-popover-arrow"
      :style="{ /* …left/top + [staticSide]:'-4px'… */ ...arrowInnerBorderHidden }"
    ></div>
  </div>
</div>
```

`effect` prop 已在 props 中声明,无需新增。effect 修饰类移到根(变量在根,预设也在根切换)。

### 2.6 SuperIcon 透传 effect

SuperIcon 的 tooltip(带 `title` 时用 SuperPopover 包裹)目前写死走默认 dark。新增透传:

- SuperIcon props 增 `effect?: 'dark' | 'light'`,默认 `'dark'`。
- `renderPopover` 由 `h(SuperPopover, { title })` 改为 `h(SuperPopover, { title, effect: props.effect })`。

> SuperIcon **不**透传 `--wt-popover-*` 变量(富内容 tooltip 属罕见场景,YAGNI);消费方要富 tooltip 直接用 SuperPopover。

---

## 3. SuperIcon 合并 `name` / `lucide` → `icon`

### 3.1 动机

重构后 `renderLucideIcon` 实为 `h(props.lucide, ...)`,已不绑定 lucide,是「渲染任意组件」。`lucide` 名不副实,且 `name`(sprite)与 `lucide`(组件)是同一语义槽的两种来源,应合并。

### 3.2 API 变更(SuperIcon)

| 旧                                | 新                               |
| --------------------------------- | -------------------------------- |
| `name: String` + `lucide: Object` | 单个 `icon: string \| Component` |

- prop 运行时校验须为 `[String, Object, Function]`:Vue `Component` 既可是对象(SFC/`defineComponent`),也可是**函数**(lucide 等函数式组件)。漏掉 `Function` 会导致消费方传 lucide 图标时报 `Invalid prop: ... got Function`。
- `typeof icon === 'string'` → sprite `<use href="#icon-${icon}">`;否则组件 → `h(icon, { size, ...(dynamic ? { active } : {}) })`。
- **尺寸策略选 A**:保持 `size` 透传给组件(对 lucide 等认 `size` 的库生效;裸 SVG 组件尺寸不变,属已知取舍,本次不做容器 CSS 控尺寸)。
- `active` / `dynamicIcon` 转发逻辑不变(仅组件分支、且带 `dynamicIcon` 标记者转发 `active`)。
- `icon` 为空/falsy 时不渲染图标。

### 3.3 连带改动

- **SuperButton**:已是 `icon: string | Component`。内部从「`typeof` 分流成 `{ name }`/`{ lucide }`」简化为统一透传到 SuperIcon 的 `icon`(sprite 分支 SuperIcon 会忽略 `active`,故无需再按 `typeof` 分流):
  ```ts
  function renderIcon() {
    if (!props.icon) {
      return;
    }
    if (props.loading) {
      return h(SuperIcon, { loading: true });
    }
    return h(SuperIcon, { icon: props.icon, active: props.active });
  }
  ```
- **App.vue**:`:lucide="X"` → `:icon="X"`;若有 `name="sprite"` → `icon="sprite"`。当前 App 用的是 `:lucide`,改 `:icon` 即可。
- **README**:`:lucide=` 示例改 `:icon=`。

---

## 4. 构建 / 发布影响

- **新增** `src/styles/theme.css`,经 `lib/main.ts` import 抽入 `dist/style.css`。**无新增子路径导出、无 vite/dts/exports 配置改动。**
- Part 2/3 纯组件内代码改动,不影响构建配置。

## 5. 不在本次范围

- backlog 章节二(SuperButton 脱离 element-plus)、章节三(单元测试)不动。
- 语义色板不接入自有组件取色(仅定义)。
- 不做富 popover 卡片组件、不做容器 CSS 控图标尺寸、不做渐变箭头无缝方案。

## 6. 验收标准

1. `pnpm build` 通过;`dist/style.css` 含 `--wt-` token 定义(grep `--wt-color-primary` 命中)。
2. `pnpm exec vue-tsc --noEmit` / `pnpm lint` / `pnpm format:check` 全绿。
3. SuperPopover:`effect="light"` 白底+深字+轻阴影(边框默认隐形),`effect="dark"`(默认)维持原样;消费方给 `<SuperPopover>` 加一个 class 覆盖 `--wt-popover-bg`(含渐变)/`--wt-popover-border-color` 等,能一次性改气泡与箭头外观。
4. SuperIcon:`icon` 传字符串走 sprite、传组件走渲染;`DynamicPin` 的 active 过渡仍在;`effect` 能切 tooltip 主题。
5. SuperButton:`icon` 字符串/组件两路正常;`DynamicPin` active 仍有过渡。
6. App.vue 用新 API 渲染(可视化由用户 `pnpm dev` 自验,执行者不自动起 dev server)。
