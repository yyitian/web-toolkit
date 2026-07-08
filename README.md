# @yyitian/web-toolkit

个人跨项目复用的 Vue 3 组件工具库:`SuperIcon` / `SuperButton` / `SuperPopover`,附带 vite 插件(SVG sprite 注入 + scss mixin 自动注入)。私有发布于 GitHub Packages。

## 消费方安装

### 1. 配置 GitHub Packages 认证(每台机器一次)

在 `~/.npmrc` 添加(`<TOKEN>` 为具备 `read:packages` 权限的 GitHub PAT):

```
@yyitian:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<TOKEN>
```

### 2. 安装

```bash
pnpm add @yyitian/web-toolkit
# 若用到 SuperButton,需自行安装 element-plus(可选 peer)
pnpm add element-plus
# 若用到 lucide 图标(给 SuperIcon :icon 传入 lucide 组件),需自行安装 @lucide/vue(可选 peer)
pnpm add @lucide/vue
```

**依赖矩阵**(用到哪个能力,才需装对应 peer):

| peer           | 必需性   | 用到以下能力时必须安装                                             |
| -------------- | -------- | ------------------------------------------------------------------ |
| `vue` (^3.5)   | **必需** | 全部                                                               |
| `element-plus` | 可选     | `SuperButton`(内部硬依赖 `ElButton`)                               |
| `@lucide/vue`  | 可选     | 给 `:icon` 传 lucide 组件、或使用 `dynamic-icons` 子路径的成品图标 |

> 「可选」指**没用到对应组件就无需安装**;一旦用到该组件,对应 peer 即为硬性要求(不装会运行时报错)。只用 `SuperIcon` 的 sprite 图标 + `SuperPopover` 时,两个可选 peer 都不需要。

## 用法

### 组件

```ts
import { SuperIcon, SuperButton, SuperPopover } from '@yyitian/web-toolkit';
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

## 维护方发布

```bash
export NODE_AUTH_TOKEN=<具备 write:packages 的 PAT>
# 修改后先 bump 版本
npm version patch   # 或 minor / major
pnpm publish        # prepublishOnly 会自动先构建
```
