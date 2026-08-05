# 公开 npm 包迁移方案

## 背景

`@yyitian/web-toolkit` 当前发布到 GitHub Packages。项目级 `.npmrc` 将 `@yyitian` scope 强制映射到 `npm.pkg.github.com`，消费方 README 也要求为每台机器配置具备 `read:packages` 权限的 GitHub PAT，导致安装依赖私有密钥。

## 目标

- 包名继续使用 `@yyitian/web-toolkit`。
- 发布目标迁移到 npm 官方仓库。
- 包以 public scoped package 形式发布。
- 消费方可直接使用 `npm install` 或 `pnpm add`，无需配置令牌。
- 发布凭据只保留在发布者本机或 CI，不写入仓库。

## 设计决策

1. 将 `publishConfig.registry` 改为 `https://registry.npmjs.org/`。
2. 将 `publishConfig.access` 显式设为 `public`，避免 scoped package 首次发布被按受限包处理。
3. 删除项目级 `.npmrc`，解除 `@yyitian` scope 对 GitHub Packages 的强制映射。
4. README 删除消费方 PAT 配置，补充 npm/pnpm 安装命令和旧配置迁移提醒。
5. 保留当前包名；配置迁移阶段不擅自修改版本。npm 官方仓库当前未找到该包，但 GitHub Packages 已发布过 `0.2.0`，若首次公开包包含后续功能，必须使用高于 `0.2.0` 的新版本，避免跨仓库出现同版本不同内容。

## 发布边界

仓库配置完成不等于包已经公开。首次发布还需要发布者登录 npm、确定与本次功能交付匹配的新版本，并确保 npm 账号拥有 `@yyitian` scope 的发布权限。发布完成后，应从无凭据的临时环境执行安装验证，并检查主入口、样式和子路径导出。

## 兼容性

已有消费方若在用户级 `~/.npmrc` 中保留 `@yyitian:registry=https://npm.pkg.github.com`，包管理器仍会访问旧私有源。迁移时需要删除该 scope 映射；依赖声明和 import 路径无需修改。
