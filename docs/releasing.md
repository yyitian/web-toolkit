# 版本发布与恢复

## 固定约定

使用 Node 24.18.0、pnpm 12.18.0 和冻结的 pnpm 锁文件。组件库只发布到 npm 官方仓库，包名为 `@yyitian/web-toolkit`，访问级别为 public。

代码按功能分别提交，示例与公开文档随对应功能提交，最后单独提交版本号和版本说明。内部设计、验收报告及截图默认不提交。禁止覆盖已有 npm 版本、移动历史标签或自动撤包。

`pnpm build` 只构建库。`pnpm release:check` 执行 lint、发布逻辑验证、库构建、主题／表格／工具回归、文档构建、站内链接及包内容检查，产物位于忽略跟踪的 `release-artifacts/`。

## 首次配置

1. 在 npm 包 Settings → Trusted publishing 中添加 GitHub Actions，用户为 `yyitian`，仓库为 `web-toolkit`，工作流文件名为 `release.yml`，不填写 Environment，允许直接 `npm publish`。仅该工作流的 npm 发布任务取得 `id-token: write`，不配置 npm 发布 Token。
2. 在 GitHub 仓库 Settings → Secrets and variables → Actions 中配置 `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID`。Token 应具备目标账户的 Workers Scripts 编辑及部署现有自定义域名所需权限；不要将本地 Wrangler OAuth Token 复制成 Actions Secret。
3. 确认账户内已有 `web-toolkit-docs` Worker，域名为 `wt.yyitian.top`。工作流在 npm 发布前验证凭据存在并可读取该 Worker。
4. 新建 npm 可信发布绑定后及时完成首发验证；当前 npm 要求新绑定在两天内完成首次成功发布，否则需重新创建。

官方参考：[npm 可信发布](https://docs.npmjs.com/trusted-publishers/)、[Cloudflare GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)。凭据只保存在平台 Secret 或用户级配置中，不写入仓库或日志。

## 正常发布

1. 获取远端 main 和标签，核实本地分叉、npm 最新版本及目标版本未占用。网络或鉴权失败必须停止，不能视为版本不存在。
2. 按功能校验和提交代码，提交信息采用中文主行及明细，每项概述 6–15 字。不得将整个工作区无差别暂存。
3. 更新 `package.json` 版本和 `CHANGELOG.md`；版本只使用稳定的 `X.Y.Z`。
4. 运行 `pnpm release:check`，检查变更和产物后提交版本更新。在这个最终提交上创建带说明的 `vX.Y.Z` 标签。
5. 运行 `git push --atomic origin main vX.Y.Z`。标签自动触发 `release.yml`；普通 main／PR CI 不执行发布。
6. 跟踪 Actions。完整流程先校验来源、身份并构建，再发布 npm 压缩包及匿名安装验证，最后部署同次构建的 docs。产物及完整性元数据保留 30 天。
7. 确认 npm 版本、公开访问级别、匿名消费方构建和线上 `release.json` 的版本与提交 SHA。文档导航版本直接读取包版本，无需手动修改。

正式发布串行排队，不取消已进行的发布。包和文档由同一提交构建，npm 压缩包发布不会再次执行仓库的 `prepublishOnly` 构建钩子。本地直接发布目录时该钩子仍保留。

## 部分失败与恢复

- npm 尚未发布：修复身份或基础设施问题后重跑失败任务；若必须修改发布源码，使用新版本，不能移动已有标签。
- npm 已成功、docs 失败：优先在 Actions 重跑失败任务，复用原构建产物；也可手动运行发布工作流，在 **Use workflow from** 选择原版本标签，再选择 `recover` 并填写同一标签。恢复工作流与源码均来自该标签，npm 来源证明也记录真实发布提交。
- 恢复时 npm 版本已存在，只有压缩包 SHA-512 完整性相同且仍为 npm latest 才跳过发布；不同则停止。若重新构建无法复现原包，使用原运行的产物与失败任务恢复。
- 最新版本已推进时拒绝旧版本部署。同版本的文档也只允许从线上提交向后推进，防止恢复旧标签覆盖后续文档修订。
- 不通过修改 latest、撤包或回退文档绕过检查。发布和文档部署不具备跨平台事务，按实际已成功阶段恢复。

## 仅更新文档

在 Actions 从 **main** 手动运行 `release.yml`，模式选择 `docs-only`，标签留空。只构建部署文档，不发布 npm 或创建标签。

当前包版本必须等于 npm latest，main 必须包含对应版本标签，且相对标签仅修改 `website/`、`docs/`、`.github/`、README、AGENTS 或 CHANGELOG。存在库源码、依赖或构建配置等其他修改时拒绝部署，随下一版本发布。

文档独立修订保留 npm 版本号，`release.json` 记录实际部署的 main 提交。部署前再次验证 npm latest 与线上提交，防止旧文档覆盖。
