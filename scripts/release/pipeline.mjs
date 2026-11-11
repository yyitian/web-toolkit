import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertCommit,
  assertCredentials,
  assertDocsChanges,
  assertDocsVersion,
  assertPublishConfig,
  assertTag,
  compareVersions,
  digest,
  git,
  packageName,
  publishDecision,
  registry,
  registryJson,
  run,
  stableVersion,
} from './core.mjs';
import { checkLinks } from './links.mjs';
import { smoke } from './smoke.mjs';

const encodedName = encodeURIComponent(packageName);
const pkg = () => readFile('package.json', 'utf8').then(JSON.parse);
const manifest = () =>
  readFile('release-artifacts/manifest.json', 'utf8').then(JSON.parse);
const latestVersion = async () =>
  stableVersion(
    (await registryJson(`-/package/${encodedName}/dist-tags`)).latest,
  );

async function verifySource(info) {
  const current = await pkg();
  assertPublishConfig(current);
  if (
    current.version !== info.version ||
    git('rev-parse', 'HEAD') !== assertCommit(info.commit)
  ) {
    throw new Error('产物版本或提交与当前检出源码不一致');
  }
}

async function verifyArtifacts(info) {
  await verifySource(info);
  if (
    info.filename !== `yyitian-web-toolkit-${stableVersion(info.version)}.tgz`
  ) {
    throw new Error('npm 压缩包名称无效');
  }
  if (
    (await digest(resolve('release-artifacts', info.filename))) !==
      info.integrity ||
    (await digest('release-artifacts/docs.tar.gz')) !== info.docsIntegrity
  ) {
    throw new Error('发布产物完整性校验失败');
  }
}

async function verifyPublished(info) {
  const existing = await registryJson(`${encodedName}/${info.version}`);
  if (existing.dist?.integrity !== info.integrity)
    throw new Error('npm 已发布包完整性不匹配');
  assertDocsVersion(info.version, await latestVersion());
  return existing;
}

async function select() {
  const event = process.env.GITHUB_EVENT_NAME;
  let mode = 'release';
  let ref;
  if (event === 'push') {
    ref = process.env.GITHUB_REF_NAME;
    if (process.env.GITHUB_REF !== `refs/tags/${ref}`)
      throw new Error('发布必须由版本标签触发');
  } else if (event === 'workflow_dispatch') {
    mode = process.env.RELEASE_MODE;
    if (!['recover', 'docs-only'].includes(mode))
      throw new Error('手动发布模式无效');
    ref = mode === 'recover' ? process.env.RELEASE_TAG : 'origin/main';
    if (mode === 'docs-only' && process.env.GITHUB_REF !== 'refs/heads/main')
      throw new Error('独立文档部署只能从 main 运行');
    if (mode === 'recover' && process.env.GITHUB_REF !== `refs/tags/${ref}`)
      throw new Error('恢复发布时，工作流来源必须选择同一个版本标签');
  } else throw new Error('不支持的发布触发来源');
  if (
    mode !== 'docs-only' &&
    !/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(ref ?? '')
  ) {
    throw new Error('必须指定完整的稳定版本标签');
  }
  const commit = assertCommit(
    git(
      'rev-parse',
      `${mode === 'docs-only' ? ref : `refs/tags/${ref}`}^{commit}`,
    ),
  );
  if (process.env.GITHUB_SHA && process.env.GITHUB_SHA !== commit)
    throw new Error('工作流事件与发布源码提交不一致');
  git('merge-base', '--is-ancestor', commit, 'origin/main');
  const target = JSON.parse(git('show', `${commit}:package.json`));
  assertPublishConfig(target);
  if (mode === 'docs-only') {
    assertDocsVersion(target.version, await latestVersion());
    const baseline = `refs/tags/v${stableVersion(target.version)}`;
    git('merge-base', '--is-ancestor', baseline, commit);
    assertDocsChanges(
      git('diff', '--name-only', baseline, commit).split('\n').filter(Boolean),
    );
  } else {
    assertTag(ref, target.version);
    const existing = await registryJson(`${encodedName}/${target.version}`, {
      missing: true,
    });
    const latest = await latestVersion();
    // 有版本时在产物生成后严格比较完整性；此处先拦截旧版本。
    publishDecision(
      target.version,
      existing?.dist?.integrity,
      existing,
      latest,
    );
  }
  assertCredentials(process.env);
  git('checkout', '--detach', commit);
  const output = `mode=${mode}\ncommit=${commit}\nversion=${target.version}\n`;
  if (!process.env.GITHUB_OUTPUT) throw new Error('缺少 Actions 输出文件');
  await appendFile(process.env.GITHUB_OUTPUT, output);
  console.log(`发布来源：${ref}，版本：${target.version}，提交：${commit}`);
}

async function docs() {
  const current = await pkg();
  assertDocsVersion(current.version, await latestVersion());
  run('pnpm', ['docs:build'], { stdio: 'inherit' });
  await checkLinks();
  const info = {
    version: current.version,
    commit: assertCommit(git('rev-parse', 'HEAD')),
  };
  await mkdir('release-artifacts', { recursive: true });
  await writeFile(
    'website/.vitepress/dist/release.json',
    JSON.stringify(info, null, 2) + '\n',
  );
  run('tar', [
    '-czf',
    resolve('release-artifacts/docs.tar.gz'),
    '-C',
    resolve('website/.vitepress/dist'),
    '.',
  ]);
  await writeFile(
    'release-artifacts/manifest.json',
    JSON.stringify(
      { ...info, docsIntegrity: await digest('release-artifacts/docs.tar.gz') },
      null,
      2,
    ) + '\n',
  );
}

async function preflight() {
  assertCredentials(process.env);
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!/^[a-f0-9]{32}$/.test(account))
    throw new Error('Cloudflare Account ID 格式无效');
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/web-toolkit-docs/deployments`,
    {
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok || !(await response.json()).success)
    throw new Error('Cloudflare 部署身份无法读取目标 Worker');
  console.log('通过：Cloudflare 部署身份与目标 Worker 核查');
}

async function publish() {
  if (compareVersions(run('npm', ['--version']).trim(), '11.5.1') < 0)
    throw new Error('OIDC 发布要求 npm CLI 至少为 11.5.1');
  const info = await manifest();
  await verifyArtifacts(info);
  const existing = await registryJson(`${encodedName}/${info.version}`, {
    missing: true,
  });
  const decision = publishDecision(
    info.version,
    info.integrity,
    existing,
    await latestVersion(),
  );
  if (decision === 'publish') {
    await smoke(resolve('release-artifacts', info.filename));
    run(
      'npm',
      [
        'publish',
        resolve('release-artifacts', info.filename),
        '--access',
        'public',
        '--tag',
        'latest',
        `--registry=${registry}/`,
      ],
      { stdio: 'inherit' },
    );
  } else console.log('npm 相同版本与完整性已存在，跳过重复发布');
  // 等待 registry 元数据可见，查询失败不能伪装为发布成功。
  let lastError;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await verifyPublished(info);
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      if (attempt < 5) await new Promise((done) => setTimeout(done, 5000));
    }
  }
  if (lastError) throw lastError;
  const visibility = JSON.parse(
    run('npm', [
      'access',
      'get',
      'status',
      packageName,
      '--json',
      `--registry=${registry}/`,
    ]),
  );
  if (visibility[packageName] !== 'public')
    throw new Error('npm 包访问级别不是 public');
  await smoke(`${packageName}@${info.version}`);
}

async function deploy() {
  assertCredentials(process.env);
  const info = await manifest();
  await verifySource(info);
  assertDocsVersion(info.version, await latestVersion());
  if (info.integrity) await verifyPublished(info);
  if ((await digest('release-artifacts/docs.tar.gz')) !== info.docsIntegrity)
    throw new Error('文档产物完整性校验失败');
  await mkdir('website/.vitepress/dist', { recursive: true });
  run('tar', [
    '-xzf',
    resolve('release-artifacts/docs.tar.gz'),
    '-C',
    resolve('website/.vitepress/dist'),
  ]);
  await checkLinks();
  const built = JSON.parse(
    await readFile('website/.vitepress/dist/release.json', 'utf8'),
  );
  if (built.version !== info.version || built.commit !== info.commit)
    throw new Error('文档版本信息不一致');
  // 先检查线上标记，避免恢复较老的同版本文档修订覆盖新提交。
  const current = await fetch('https://wt.yyitian.top/release.json', {
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  });
  if (current.ok) {
    const online = await current.json();
    if (online.version === info.version && online.commit !== info.commit) {
      git(
        'merge-base',
        '--is-ancestor',
        assertCommit(online.commit),
        info.commit,
      );
    }
  } else if (current.status !== 404)
    throw new Error(`线上版本查询失败：HTTP ${current.status}`);
  assertDocsVersion(info.version, await latestVersion());
  run('pnpm', ['exec', 'wrangler', 'deploy'], { stdio: 'inherit' });
  let error;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const response = await fetch(
        `https://wt.yyitian.top/release.json?commit=${info.commit}`,
        { cache: 'no-store', signal: AbortSignal.timeout(30_000) },
      );
      if (!response.ok)
        throw new Error(`线上版本查询失败：HTTP ${response.status}`);
      const online = await response.json();
      if (online.version !== info.version || online.commit !== info.commit)
        throw new Error('线上文档未更新到目标提交');
      for (const path of ['/', '/components/super-table', '/favicon.svg']) {
        const page = await fetch(`https://wt.yyitian.top${path}`, {
          signal: AbortSignal.timeout(30_000),
        });
        if (!page.ok) throw new Error(`线上资源验证失败：${path}`);
      }
      error = undefined;
      break;
    } catch (failure) {
      error = failure;
      if (attempt < 5) await new Promise((done) => setTimeout(done, 5000));
    }
  }
  if (error) throw error;
  if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `## 发布验证通过\n\n- 版本：${info.version}\n- 提交：${info.commit}\n- [npm](https://www.npmjs.com/package/${packageName}/v/${info.version})\n- [在线文档](https://wt.yyitian.top/)\n`,
    );
}

const commands = { select, preflight, docs, publish, deploy };
const command = commands[process.argv[2]];
if (!command)
  throw new Error('发布命令必须为 select、preflight、docs、publish 或 deploy');
await command();
