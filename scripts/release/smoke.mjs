import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageName, registry, run } from './core.mjs';

export async function smoke(target) {
  const temporary = await mkdtemp(join(tmpdir(), 'wt-consumer-'));
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !/token|npm_config|node_auth|pnpm_/i.test(key),
    ),
  );
  await writeFile(join(temporary, 'user.npmrc'), '');
  await writeFile(join(temporary, 'global.npmrc'), '');
  Object.assign(env, {
    NPM_CONFIG_USERCONFIG: join(temporary, 'user.npmrc'),
    NPM_CONFIG_GLOBALCONFIG: join(temporary, 'global.npmrc'),
    NPM_CONFIG_REGISTRY: registry,
    NPM_CONFIG_CACHE: join(temporary, 'cache'),
    NPM_CONFIG_UPDATE_NOTIFIER: 'false',
  });
  try {
    await writeFile(
      join(temporary, 'package.json'),
      JSON.stringify({ private: true, type: 'module' }),
    );
    run(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--fetch-retries=1',
        '--fetch-timeout=60000',
        target,
        'vue@^3.5.0',
        'element-plus@^2.14.0',
        '@lucide/vue@^1.18.0',
        'sass-embedded@1.100.0',
      ],
      { cwd: temporary, env, stdio: 'inherit' },
    );
    await writeFile(
      join(temporary, 'index.html'),
      '<html><body><div id="app"></div><script type="module" src="/main.ts"></script></body></html>',
    );
    await writeFile(
      join(temporary, 'main.ts'),
      `import { createApp, h } from 'vue';
import { SuperButton, SuperPopover, SuperDialog, SuperForm, SuperFormDialog, SuperTable, SuperThemeSwitcher, createWtTheme, formatDate, DATE_FORMATS, datePickerDefaultTime, formatLabel, openConfirm, openDeleteConfirm } from '${packageName}';
import { DynamicPin, DynamicAudioLines, DynamicChevronLeft, DynamicRefresh, DynamicFoldLeft } from '${packageName}/dynamic-icons';
import type { SuperTableColumn, SuperFormColumn, SuperTableInstance, SuperFormInstance, WtThemeOptions } from '${packageName}';
import '${packageName}/style.css';
import './consumer.scss';
const columns: SuperTableColumn<{ id: number }>[] = [{ prop: 'id', label: '编号' }];
const formColumns: SuperFormColumn[] = [{ prop: 'name', formType: 'input' }];
const theme: WtThemeOptions = { scheme: 'light', material: 'solid' };
const instances: [SuperTableInstance | undefined, SuperFormInstance | undefined] = [undefined, undefined];
Object.assign(window, { toolkit: { SuperPopover, SuperDialog, SuperForm, SuperFormDialog, SuperTable, SuperThemeSwitcher, formatDate, DATE_FORMATS, datePickerDefaultTime, formatLabel, openConfirm, openDeleteConfirm, DynamicAudioLines, DynamicChevronLeft, DynamicRefresh, DynamicFoldLeft, columns, formColumns, theme, instances } });
createApp({ render: () => h(SuperButton, { icon: DynamicPin, label: '验证按钮' }) }).use(createWtTheme()).mount('#app');`,
    );
    await writeFile(
      join(temporary, 'consumer.scss'),
      '.consumer { @include flex-align-center(8px); }',
    );
    await writeFile(
      join(temporary, 'vite.config.mjs'),
      `import { webToolkitPlugin } from '${packageName}/vite-plugin';\nexport default { plugins: [webToolkitPlugin()] };`,
    );
    // 与 Vite 客户端的样式模块声明一致，独立检查组件库自己的类型声明。
    await writeFile(
      join(temporary, 'env.d.ts'),
      "declare module '*.css';\ndeclare module '*.scss';\n",
    );
    await writeFile(
      join(temporary, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2023',
          module: 'ESNext',
          moduleResolution: 'bundler',
          lib: ['ES2023', 'DOM'],
          skipLibCheck: true,
          noEmit: true,
          strict: true,
          types: [],
        },
        include: ['main.ts', 'env.d.ts'],
      }),
    );
    run(
      process.execPath,
      [
        fileURLToPath(
          new URL('../../node_modules/typescript/bin/tsc', import.meta.url),
        ),
        '--project',
        join(temporary, 'tsconfig.json'),
      ],
      { cwd: temporary, env, stdio: 'inherit' },
    );
    const vite = fileURLToPath(
      new URL('../../node_modules/vite/bin/vite.js', import.meta.url),
    );
    run(
      process.execPath,
      [vite, 'build', '--config', join(temporary, 'vite.config.mjs')],
      { cwd: temporary, env, stdio: 'inherit' },
    );
    const installed = JSON.parse(
      await readFile(
        join(temporary, 'node_modules/@yyitian/web-toolkit/package.json'),
        'utf8',
      ),
    );
    console.log(
      `通过：无发布凭据环境安装和消费方构建 ${packageName}@${installed.version}`,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (!process.argv[2]) throw new Error('请传入压缩包绝对路径或包版本');
  await smoke(process.argv[2]);
}
