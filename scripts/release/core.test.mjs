import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertCredentials,
  assertDocsChanges,
  assertDocsVersion,
  assertPackageFiles,
  assertTag,
  publishDecision,
  registryJson,
  run,
} from './core.mjs';
import { checkLinks } from './links.mjs';

test('稳定标签必须与包版本一致', () => {
  assertTag('v0.7.0', '0.7.0');
  for (const tag of ['v0.6.0', 'main', 'v0.7.0-beta.1'])
    assert.throws(() => assertTag(tag, '0.7.0'));
  assert.throws(() => assertTag('v0.7.0-beta.1', '0.7.0-beta.1'));
});

test('真实 Git 临时仓库验证标签恢复、main 限制和文档源码隔离', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'wt-release-git-'));
  const pipeline = fileURLToPath(new URL('./pipeline.mjs', import.meta.url));
  const source = {
    name: '@yyitian/web-toolkit',
    version: '0.7.0',
    publishConfig: {
      access: 'public',
      registry: 'https://registry.npmjs.org/',
    },
  };
  try {
    const git = (...args) => run('git', args, { cwd: temporary });
    git('init', '-b', 'main');
    git('config', 'user.name', '发布验证');
    git('config', 'user.email', 'release@example.invalid');
    await writeFile(join(temporary, 'package.json'), JSON.stringify(source));
    git('add', 'package.json');
    git('commit', '-m', '创建发布验证基线');
    git('tag', 'v0.7.0');
    git('update-ref', 'refs/remotes/origin/main', 'HEAD');
    const mock = join(temporary, 'registry-mock.mjs');
    await writeFile(
      mock,
      `globalThis.fetch = async (url) => ({ status: String(url).endsWith('/dist-tags') ? 200 : 404, ok: String(url).endsWith('/dist-tags'), json: async () => ({ latest: '0.7.0' }) });`,
    );
    const invoke = (extra = {}) =>
      run(process.execPath, ['--import', mock, pipeline, 'select'], {
        cwd: temporary,
        env: {
          ...process.env,
          GITHUB_EVENT_NAME: 'workflow_dispatch',
          GITHUB_REF: 'refs/tags/v0.7.0',
          GITHUB_SHA: '',
          RELEASE_MODE: 'recover',
          RELEASE_TAG: 'v0.7.0',
          GITHUB_OUTPUT: join(temporary, 'output'),
          CLOUDFLARE_API_TOKEN: '仅用于本地演练',
          CLOUDFLARE_ACCOUNT_ID: 'example',
          ...extra,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    assert.match(invoke(), /版本：0.7.0/);
    assert.throws(() => invoke({ GITHUB_REF: 'refs/heads/other' }));
    assert.throws(() => invoke({ RELEASE_TAG: 'main' }));
    assert.throws(() => invoke({ RELEASE_MODE: 'unknown' }));
    assert.throws(() => invoke({ CLOUDFLARE_API_TOKEN: '' }));
    assert.match(
      invoke({
        GITHUB_EVENT_NAME: 'push',
        GITHUB_REF: 'refs/tags/v0.7.0',
        GITHUB_REF_NAME: 'v0.7.0',
      }),
      /版本：0.7.0/,
    );
    git('checkout', 'main');
    await writeFile(join(temporary, 'README.md'), '文档修订');
    git('add', 'README.md');
    git('commit', '-m', '增加文档修订内容');
    git('update-ref', 'refs/remotes/origin/main', 'HEAD');
    assert.match(
      invoke({ RELEASE_MODE: 'docs-only', GITHUB_REF: 'refs/heads/main' }),
      /版本：0.7.0/,
    );
    git('checkout', 'main');
    await mkdir(join(temporary, 'src'));
    await writeFile(
      join(temporary, 'src/new.ts'),
      'export const unpublished = true;',
    );
    git('add', 'src');
    git('commit', '-m', '增加未发布功能实现');
    git('update-ref', 'refs/remotes/origin/main', 'HEAD');
    assert.throws(() =>
      invoke({ RELEASE_MODE: 'docs-only', GITHUB_REF: 'refs/heads/main' }),
    );
    await writeFile(
      join(temporary, 'package.json'),
      JSON.stringify({ ...source, version: '0.8.0' }),
    );
    git('add', 'package.json');
    git('commit', '-m', '创建未合并版本提交');
    git('tag', 'v0.8.0');
    assert.throws(() =>
      invoke({ RELEASE_TAG: 'v0.8.0', GITHUB_REF: 'refs/tags/v0.8.0' }),
    );
    assert.throws(() => invoke({ GITHUB_SHA: '0'.repeat(40) }));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('只把明确的 404 视为不存在，鉴权及网络错误必须失败', async () => {
  const response = (status) => async () => ({
    status,
    ok: status === 200,
    json: async () => ({ version: '0.7.0' }),
  });
  assert.equal(
    await registryJson('example', { missing: true, fetcher: response(404) }),
    undefined,
  );
  for (const status of [401, 403, 429, 500])
    await assert.rejects(
      registryJson('example', { missing: true, fetcher: response(status) }),
    );
  await assert.rejects(registryJson('example', { fetcher: response(404) }));
  await assert.rejects(
    registryJson('example', {
      missing: true,
      fetcher: async () => {
        throw new Error('DNS 失败');
      },
    }),
  );
});

test('部分成功恢复只能跳过相同 npm 包，不能覆盖或降级', () => {
  const existing = { dist: { integrity: 'sha512-example' } };
  assert.equal(
    publishDecision('0.7.0', 'sha512-example', undefined, '0.6.0'),
    'publish',
  );
  assert.equal(
    publishDecision('0.7.0', 'sha512-example', existing, '0.7.0'),
    'skip',
  );
  assert.throws(() => publishDecision('0.7.0', 'different', existing, '0.7.0'));
  assert.throws(() =>
    publishDecision('0.7.0', 'sha512-example', existing, '0.8.0'),
  );
  assert.throws(() =>
    publishDecision('0.7.0', 'sha512-example', existing, '0.6.0'),
  );
});

test('文档独立部署仅接受当前已发布版本的文档修改', () => {
  assertDocsVersion('0.7.0', '0.7.0');
  assert.throws(() => assertDocsVersion('0.6.0', '0.7.0'));
  assertDocsChanges([
    'website/components/super-table.md',
    'website/examples/demos/TableDemo.vue',
    'README.md',
  ]);
  for (const path of [
    'src/components/SuperTable/index.vue',
    'lib/main.ts',
    'package.json',
    'pnpm-lock.yaml',
    'vite.plugin.ts',
  ])
    assert.throws(() => assertDocsChanges([path]));
});

test('Cloudflare 凭据缺失时在 npm 发布前失败', () => {
  assert.throws(() => assertCredentials({}));
  assert.throws(() => assertCredentials({ CLOUDFLARE_API_TOKEN: 'example' }));
  assertCredentials({
    CLOUDFLARE_API_TOKEN: 'example',
    CLOUDFLARE_ACCOUNT_ID: 'example',
  });
});

test('发布包必须包含全部导出，不得混入文档和内部资料', () => {
  const pkg = {
    exports: {
      '.': { import: './dist/index.js', types: './dist/main.d.ts' },
      './styles/mixin': './src/styles/mixin/index.scss',
    },
  };
  const files = [
    'dist/index.js',
    'dist/main.d.ts',
    'src/styles/mixin/index.scss',
  ].map((path) => ({ path }));
  assertPackageFiles(pkg, files);
  assert.throws(() => assertPackageFiles(pkg, files.slice(1)));
  assert.throws(() =>
    assertPackageFiles(pkg, [...files, { path: 'docs/.codex/private.md' }]),
  );
});

test('检查生成页面的相对链接、中文锚点及静态资源', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'wt-links-'));
  try {
    await mkdir(join(temporary, 'guide'));
    await writeFile(
      join(temporary, 'index.html'),
      '<a href="/guide/start#中文标题">指南</a><a href="/favicon.svg">图标</a>',
    );
    await writeFile(
      join(temporary, 'guide/start.html'),
      '<h2 id="中文标题">说明</h2><a href="../">首页</a>',
    );
    await writeFile(join(temporary, 'favicon.svg'), '<svg/>');
    await checkLinks(temporary);
    await writeFile(
      join(temporary, 'guide/start.html'),
      '<h2 id="其他标题">说明</h2>',
    );
    await assert.rejects(checkLinks(temporary), /失效锚点/);
    await writeFile(
      join(temporary, 'index.html'),
      '<a href="/missing">失效页面</a>',
    );
    await assert.rejects(checkLinks(temporary));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
