# Web Toolkit 在线文档站设计方案

## 1. 背景

`@yyitian/web-toolkit` 已具备图标、按钮、浮层、弹窗、配置式表单、表单弹窗、动态
图标和 Vite 插件等可复用能力。当前 `src/App.vue` 只承担本地开发回归演示，缺少面向
使用者、可通过浏览器访问的结构化文档。

本次建设独立在线文档站，并同步创建 Cloudflare Worker 与二级域名：

- 公开地址：`https://wt.yyitian.top`
- Cloudflare 主域名：`yyitian.top`
- Worker 名称：`web-toolkit-docs`
- npm 包发布和文档站发布保持相互独立

## 2. 建设目标

1. 提供可搜索、可导航、适合长期维护的中文使用文档。
2. 在文档中直接运行真实组件示例，避免文档示例与组件实现分叉。
3. 复用仓库现有 Vue、Vite、Element Plus 和组件源码，不新建独立仓库。
4. 使用 Cloudflare Workers Static Assets 托管静态站点。
5. 通过 Wrangler 同步创建 `wt.yyitian.top` 自定义域名并完成首次部署。
6. 保持现有 npm 库构建、导出入口和本地回归演示不受影响。

## 3. 非目标

- 本次不发布新的 npm 版本，也不创建 npm 版本标签。
- 本次不把 `src/App.vue` 直接改造成文档首页。
- 首版不建设多语言、在线代码编辑器、版本切换或远程全文搜索服务。
- 首版不修改其他已部署 Worker，也不复用其脚本名称和资源绑定。

## 4. 技术方案

### 4.1 文档框架

采用 VitePress：

- Markdown 适合维护安装说明、API 说明和代码片段。
- 可以在 Markdown 中直接使用 Vue 组件，满足实时示例需求。
- 自带导航、侧边栏、本地搜索、代码高亮和静态站点构建。
- 文档构建与现有库构建可以使用独立命令，避免发布产物混入 npm 包。

公开文档站使用仓库根目录的 `website/` 专用目录，与内部资料进行物理隔离。现有
`docs/codex/`、`docs/superpowers/`、审查结论和历史记录继续保留在 `docs/`，不进入
VitePress 的扫描与构建范围。该边界不依赖 `srcExclude` 黑名单，后续新增内部 Markdown
也不会被意外发布。

### 4.2 目录规划

```text
website/
├── .vitepress/
│   ├── config.ts
│   └── theme/
│       ├── index.ts
│       └── custom.css
├── public/
├── examples/
│   ├── DemoBlock.vue
│   ├── demos/
│   └── icons/
├── guide/
│   ├── getting-started.md
│   ├── vite-plugin.md
│   └── theming.md
├── components/
│   ├── super-icon.md
│   ├── dynamic-icons.md
│   ├── super-button.md
│   ├── super-popover.md
│   ├── super-dialog.md
│   ├── super-form.md
│   └── super-form-dialog.md
└── index.md
```

公开组件文档使用 `components/`，实时 Vue 示例统一放在 `examples/`，避免文档页面与
演示组件混放。

### 4.3 源码复用

文档实时示例直接引用 `src/components/` 中的组件，不复制一套文档专用实现。主题入口
统一引入：

- `src/styles/theme.css`
- `src/styles/index.scss`
- Element Plus 基础样式

动态图标示例直接引用现有动态图标源码。Vite 插件示例以代码展示为主；SVG sprite
能力在 `website/examples/icons/` 提供一个最小 SVG 演示资源，并由真实
`webToolkitPlugin` 注入，验证“SVG 文件 → symbol 注入 → `SuperIcon` 字符串图标”
的完整渲染链路。

VitePress 不继承根目录的 `vite.config.ts`，因此在 `website/.vitepress/config.ts` 的
`vite` 选项中显式配置：

- `@` 路径别名指向根目录 `src/`。
- SCSS `additionalData` 注入 `@use '@/styles/mixin' as *;`。
- `unplugin-auto-import` 注入 Vue API，且不生成新的类型声明文件。
- `unplugin-element-plus` 处理源码直引时的 Element Plus 样式。
- SSR 构建通过 `noExternal` 打包 `element-plus`，避免静态渲染阶段由 Node 直接加载 CSS。
- 主题入口提供 Element Plus 的 SSR ID 与 z-index 上下文，保证静态 HTML 与浏览器
  hydration 使用一致的初始状态。
- `webToolkitPlugin({ iconDirs, injectMixin: false })` 注入演示 SVG sprite；关闭插件自身
  mixin 注入，避免其按已安装 npm 包的消费方路径解析。

VitePress 的静态页面输出通过 `transformHtml` 复用同一插件实例的 HTML 转换逻辑，确保
每个 SSG 页面都带有真实 sprite；实时交互示例使用 `ClientOnly`，避免依赖浏览器布局的
Element Plus 浮层组件产生 SSR hydration 差异，文档正文仍保持完整的静态 HTML。

实时示例从 `src/components/` 导入真实源码；面向使用者展示的安装与使用代码仍从
`@yyitian/web-toolkit` 导入，保持消费方文档语义正确。

### 4.4 首页与导航

视觉层使用 VitePress 标准文档布局和默认交互，不建设自定义品牌化页面框架。仅为组件
实时示例补充必要的容器、间距和状态样式，并保证这些样式同时兼容亮色与暗色模式。

首页首屏包含：

- 项目名称与一句话定位
- “开始使用”和“组件文档”入口
- npm 安装命令
- GitHub 仓库链接
- 当前文档对应的包版本

顶部导航：

- 指南
- 组件
- GitHub
- npm

侧边栏按“基础指南、基础组件、表单组件”分组。本地搜索使用 VitePress 内置搜索，
不引入第三方搜索服务。

VitePress 设置 `cleanUrls: true`，站内链接统一使用无 `.html` 的规范路径，并与
Cloudflare Static Assets 的 HTML 路径处理保持一致。

## 5. 首版文档范围

### 5.1 指南

1. 快速开始：安装、peer 依赖、样式引入、最小示例。
2. Vite 插件：SVG sprite、`iconDirs` 和 SCSS mixin 注入。
3. 主题定制：`--wt-*` 变量、Element Plus 主题联动、Popover Teleport 样式边界。

### 5.2 组件页

每个组件页至少包含：

- 使用场景与依赖要求
- 基础用法
- 关键交互示例
- Props、Events、Slots、Expose API
- 注意事项和常见错误

首版组件页：

- `SuperIcon`
- Dynamic Icons
- `SuperButton`
- `SuperPopover`
- `SuperDialog`
- `SuperForm`
- `SuperFormDialog`

表单页额外覆盖全部内置字段类型、条件显示、自定义字段、local/remote Upload、数据读写
与校验流程。

## 6. 构建与脚本

在 `package.json` 增加独立脚本：

```json
{
  "docs:dev": "vitepress website",
  "docs:build": "vitepress build website",
  "docs:preview": "vitepress preview website",
  "docs:deploy": "pnpm docs:build && wrangler deploy"
}
```

VitePress 和 Wrangler 作为开发依赖固定版本，保证本地与后续 CI 构建一致。现有
`pnpm build` 继续只构建 npm 库，不隐式触发文档构建。

VitePress 构建缓存不纳入版本管理或 ESLint 扫描：

- `.gitignore` 增加 `website/.vitepress/cache`。
- `eslint.config.js` 的 `ignores` 增加 `website/.vitepress/cache/**`。
- 现有通用 `dist` 和 `**/dist/**` 规则继续排除文档站构建产物，无需重复配置。

## 7. Cloudflare 部署

根目录新增 `wrangler.jsonc`，使用 Workers Static Assets：

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "web-toolkit-docs",
  "compatibility_date": "2026-08-07",
  "workers_dev": false,
  "assets": {
    "directory": "website/.vitepress/dist",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page",
  },
  "routes": [
    {
      "pattern": "wt.yyitian.top",
      "custom_domain": true,
    },
  ],
}
```

文档站是预渲染静态页面，不使用 SPA fallback。Cloudflare 为 HTML 页面处理规范路径；
未知路径返回 VitePress 构建出的 `404.html`，并保持 HTTP 404 状态。不配置 Worker
`main`、静态资源 `binding` 或 `workers.dev` 访问入口。

`wt.yyitian.top` 是新建的 Worker Custom Domain。部署时由 Cloudflare 创建对应 DNS
记录并签发证书，不复用或覆盖其他 Worker 路由。

首次发布顺序：

1. 确认 Wrangler 登录账户与 `yyitian.top` 所在账户一致。
2. 本地执行文档构建并检查产物。
3. 本地预览并完成核心页面与交互验收。
4. 执行 `wrangler deploy`，创建 Worker 和自定义域名。
5. 验证首页、直接访问的深层页面、静态资源、404 和 HTTPS。

首次部署使用当前可用的 Wrangler OAuth 登录，不将凭据写入仓库。后续如需 GitHub
Actions 自动部署，应单独配置最小权限的 `CLOUDFLARE_API_TOKEN` 和账户 ID；自动化
发布不作为首次上线的阻碍。

## 8. 验证标准

### 8.1 静态检查

- `pnpm lint` 通过。
- `pnpm build` 通过。
- `pnpm docs:build` 通过。
- `git diff --check` 通过。

### 8.2 浏览器验收

- 桌面端和移动端导航可用。
- 本地搜索能找到组件、Props 和关键术语。
- 所有实时示例正常渲染，Popover Teleport、Dialog 和 Form 交互正常。
- 代码块可读且复制功能可用。
- 深层页面刷新不会返回 404。
- 站内页面链接使用无 `.html` 的规范路径。

### 8.3 线上验收

- `https://wt.yyitian.top` 返回成功状态并展示首页。
- HTTPS 证书有效。
- 组件文档深层链接可直接打开。
- 带 `.html` 或非规范尾斜杠的地址会重定向到规范路径。
- 不存在的地址返回 HTTP 404，并展示文档站 404 页面。
- JS、CSS、字体和图标资源无 404。
- Cloudflare 部署记录指向本次构建版本。

## 9. 实施顺序

1. 安装 VitePress 与 Wrangler，建立文档站骨架和主题。
2. 完成首页、快速开始、主题与 Vite 插件指南。
3. 建立实时示例容器和组件文档模板。
4. 按基础组件、表单组件顺序补齐页面。
5. 完成本地静态检查、构建和浏览器验收。
6. 创建 `web-toolkit-docs` Worker，绑定 `wt.yyitian.top` 并部署。
7. 执行线上 HTTP、深层链接和浏览器验收。

## 10. 风险与处理

- **文档与实现漂移**：示例复用源码，API 表以真实类型定义为依据；组件变更时同步文档。
- **Vite 配置冲突**：文档使用 `.vitepress/config.ts` 独立配置，不修改库构建入口。
- **Teleport 样式丢失**：主题样式全局注册，浮层定制使用真实 `popperClass` 和 CSS 变量。
- **表单示例过重**：拆分小型场景示例，完整综合示例只保留一个。
- **内部资料公开**：公开站点物理隔离在 `website/`，VitePress 不扫描 `docs/`。
- **域名覆盖**：部署前查询 Worker 与路由状态，确认 `wt.yyitian.top` 尚未绑定其他资源。
- **凭据泄露**：只使用 Wrangler 已配置的 OAuth 或部署环境 Secret，不写入代码、文档和日志。
