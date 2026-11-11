import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertCommit,
  assertPackageFiles,
  assertPublishConfig,
  digest,
  git,
  run,
  stableVersion,
} from './core.mjs';
import { checkLinks } from './links.mjs';

for (const script of [
  'lint',
  'verify:release',
  'build',
  'verify:theme',
  'verify:table',
  'verify:utils',
  'docs:build',
]) {
  run('pnpm', [script], { stdio: 'inherit' });
}
await checkLinks();
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
assertPublishConfig(pkg);
stableVersion(pkg.version);
const commit = assertCommit(git('rev-parse', 'HEAD'));
const output = resolve('release-artifacts');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const [packed] = JSON.parse(
  run('npm', [
    'pack',
    '--ignore-scripts',
    '--json',
    '--pack-destination',
    output,
  ]),
);
assertPackageFiles(pkg, packed.files);
const info = { version: pkg.version, commit };
await writeFile(
  'website/.vitepress/dist/release.json',
  JSON.stringify(info, null, 2) + '\n',
);
run('tar', [
  '-czf',
  resolve(output, 'docs.tar.gz'),
  '-C',
  resolve('website/.vitepress/dist'),
  '.',
]);
const manifest = {
  ...info,
  filename: packed.filename,
  integrity: await digest(resolve(output, packed.filename)),
  docsIntegrity: await digest(resolve(output, 'docs.tar.gz')),
};
await writeFile(
  resolve(output, 'manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(`通过：${pkg.name}@${pkg.version} 包内容与文档产物检查`);
