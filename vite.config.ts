import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import AutoImport from 'unplugin-auto-import/vite';
import ElementPlus from 'unplugin-element-plus/vite';
import { webToolkitPlugin } from './vite.plugin.ts';

export default defineConfig({
  build: {
    // 库构建不需要拷贝 public/ 静态资源
    copyPublicDir: false,
    lib: {
      entry: {
        index: './lib/main.ts',
        'dynamic-icons': './lib/dynamic-icons.ts',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: 'style', // 抽取的组件样式 → dist/style.css
    },
    rollupOptions: {
      // vue、element-plus 由消费方提供；内部使用的 lucide 图标参与 tree-shaking。
      external: ['vue', 'element-plus', /^element-plus\/.*/],
    },
  },
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  plugins: [
    vue(),
    ElementPlus(),
    AutoImport({
      imports: ['vue'],
      eslintrc: { enabled: false },
    }),
    webToolkitPlugin(),
    dts({
      include: [
        'lib/**/*.ts',
        'src/components/**/*.ts',
        'src/components/**/*.vue',
        'src/theme/**/*.ts',
        // 让 vue-tsc 识别 unplugin-auto-import 注入的全局 API(h、ref、computed…)
        'auto-imports.d.ts',
      ],
      // 入口声明:dist/lib/main.d.ts(由 package.json exports 指向)
    }),
  ],
});
