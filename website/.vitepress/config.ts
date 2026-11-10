import { fileURLToPath, URL } from 'node:url';
import AutoImport from 'unplugin-auto-import/vite';
import ElementPlus from 'unplugin-element-plus/vite';
import { defineConfig } from 'vitepress';
import packageJson from '../../package.json' with { type: 'json' };
import { webToolkitPlugin } from '../../vite.plugin.ts';

const sourceDirectory = fileURLToPath(new URL('../../src', import.meta.url));
const iconDirectory = fileURLToPath(
  new URL('../examples/icons', import.meta.url),
);
const toolkitPlugin = webToolkitPlugin({
  iconDirs: [iconDirectory],
  injectMixin: false,
});
const injectSprite = toolkitPlugin.transformIndexHtml as unknown as (
  html: string,
) => string;
const wtThemeInitScript = `;(() => {
  let scheme = 'light'
  let material = 'solid'
  try {
    const stored = JSON.parse(localStorage.getItem('wt-theme') || 'null')
    if (
      stored &&
      stored.version === 1 &&
      (stored.scheme === 'light' || stored.scheme === 'dark') &&
      (stored.material === 'solid' || stored.material === 'glass')
    ) {
      scheme = stored.scheme
      material = stored.material
    }
  } catch {}

  const root = document.documentElement
  root.dataset.wtScheme = scheme
  root.dataset.wtMaterial = material
  root.dataset.wtTheme = material === 'glass'
    ? (scheme === 'dark' ? 'glass-dark' : 'glass-light')
    : scheme
  root.classList.toggle('dark', scheme === 'dark')
})()`;

export default defineConfig({
  lang: 'zh-CN',
  title: 'Web Toolkit',
  description: '@yyitian/web-toolkit Vue 3 组件工具库使用文档',
  appearance: false,
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#409eff' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    ['script', {}, wtThemeInitScript],
  ],
  transformHtml(code) {
    return code.includes('id="icon-example"') ? code : injectSprite(code);
  },
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '组件', link: '/components/super-icon' },
      {
        text: `v${packageJson.version}`,
        link: 'https://www.npmjs.com/package/@yyitian/web-toolkit',
      },
    ],
    sidebar: [
      {
        text: '基础指南',
        items: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: 'Vite 插件', link: '/guide/vite-plugin' },
          { text: '主题定制', link: '/guide/theming' },
          { text: '工具方法', link: '/guide/utilities' },
        ],
      },
      {
        text: '基础组件',
        items: [
          { text: 'SuperIcon', link: '/components/super-icon' },
          { text: 'SuperButton', link: '/components/super-button' },
          { text: 'SuperPopover', link: '/components/super-popover' },
          { text: 'SuperDialog', link: '/components/super-dialog' },
          {
            text: 'SuperThemeSwitcher',
            link: '/components/super-theme-switcher',
          },
        ],
      },
      {
        text: '数据展示',
        items: [{ text: 'SuperTable', link: '/components/super-table' }],
      },
      {
        text: '表单组件',
        items: [
          { text: 'SuperForm', link: '/components/super-form' },
          { text: 'SuperFormDialog', link: '/components/super-form-dialog' },
        ],
      },
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除查询',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },
    outline: { label: '页面导航', level: [2, 3] },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新于' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yyitian/web-toolkit' },
    ],
  },
  vite: {
    resolve: { alias: { '@': sourceDirectory } },
    ssr: { noExternal: ['element-plus'] },
    css: {
      preprocessorOptions: {
        scss: { additionalData: `@use '@/styles/mixin' as *;` },
      },
    },
    plugins: [
      ElementPlus(),
      AutoImport({ imports: ['vue'], dts: false }),
      toolkitPlugin,
    ],
  },
});
