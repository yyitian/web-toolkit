import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

export const registry = 'https://registry.npmjs.org';
export const packageName = '@yyitian/web-toolkit';

export function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
}

export function stableVersion(value) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) {
    throw new Error(`只接受稳定版本：${value}`);
  }
  return value;
}

export function compareVersions(left, right) {
  const a = stableVersion(left).split('.').map(Number);
  const b = stableVersion(right).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return Math.sign(a[i] - b[i]);
  }
  return 0;
}

export function assertTag(tag, version) {
  stableVersion(version);
  if (tag !== `v${version}`) throw new Error('版本标签与 package.json 不一致');
}

export function assertPublishConfig(pkg) {
  if (
    pkg.name !== packageName ||
    pkg.publishConfig?.access !== 'public' ||
    pkg.publishConfig?.registry !== `${registry}/`
  ) {
    throw new Error('包名、公开级别或 npm 官方 registry 配置不正确');
  }
}

export function assertCredentials(env) {
  for (const key of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) {
    if (!env[key]?.trim()) throw new Error(`缺少 Actions Secret：${key}`);
  }
}

export async function registryJson(
  path,
  { missing = false, fetcher = fetch } = {},
) {
  const response = await fetcher(`${registry}/${path}`, {
    signal: AbortSignal.timeout(30_000),
    headers: { accept: 'application/json' },
  });
  if (response.status === 404 && missing) return undefined;
  if (!response.ok) throw new Error(`npm 查询失败：HTTP ${response.status}`);
  return response.json();
}

export function publishDecision(version, integrity, existing, latest) {
  stableVersion(version);
  if (latest && compareVersions(version, latest) < 0) {
    throw new Error('拒绝发布或部署低于 npm latest 的版本');
  }
  if (!existing) return 'publish';
  if (existing.dist?.integrity !== integrity) {
    throw new Error('npm 版本已存在，但压缩包完整性不同，禁止覆盖');
  }
  if (latest !== version)
    throw new Error('已有版本并非 npm latest，禁止自动修改标签');
  return 'skip';
}

export function assertDocsVersion(version, latest) {
  if (stableVersion(version) !== latest)
    throw new Error('文档版本必须等于 npm latest');
}

export function assertDocsChanges(paths) {
  const allowed =
    /^(website\/|docs\/|\.github\/|README\.md$|AGENTS\.md$|CHANGELOG\.md$)/;
  if (paths.some((path) => !allowed.test(path))) {
    throw new Error('存在未发布的库源码、依赖或构建配置变更，禁止独立部署文档');
  }
}

export function assertPackageFiles(pkg, files) {
  const names = new Set(files.map((file) => file.path));
  const targets = [];
  function visit(value) {
    if (typeof value === 'string') targets.push(value.replace(/^\.\//, ''));
    else if (value && typeof value === 'object')
      Object.values(value).forEach(visit);
  }
  visit(pkg.exports);
  for (const target of targets) {
    if (!names.has(target)) throw new Error(`发布包缺少导出文件：${target}`);
  }
  for (const name of names) {
    if (
      !/^(dist\/|src\/styles\/|package\.json$|README\.md$|LICENSE$)/.test(name)
    ) {
      throw new Error(`发布包混入非发布文件：${name}`);
    }
  }
}

export async function digest(file, algorithm = 'sha512') {
  return `${algorithm}-${createHash(algorithm)
    .update(await readFile(file))
    .digest('base64')}`;
}

export function assertCommit(commit) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('发布提交 SHA 无效');
  return commit;
}

export function git(...args) {
  return run('git', args).trim();
}
