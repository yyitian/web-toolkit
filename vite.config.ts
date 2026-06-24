import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import AutoImport from 'unplugin-auto-import/vite';
import ElementPlus from 'unplugin-element-plus/vite';

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
      // vue、element-plus 由消费方提供;@lucide/vue 全量体积大且无法 tree-shake,
      // 改为外部可选 peer,避免把整套图标打进产物。@floating-ui/vue 体积小,继续打包。
      external: ['vue', 'element-plus', /^element-plus\/.*/, '@lucide/vue'],
    },
  },
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use '@/styles/mixin' as *;`,
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
    dts({
      include: [
        'lib/**/*.ts',
        'src/components/**/*.ts',
        'src/components/**/*.vue',
        // 让 vue-tsc 识别 unplugin-auto-import 注入的全局 API(h、ref、computed…)
        'auto-imports.d.ts',
      ],
      // 入口声明:dist/lib/main.d.ts(由 package.json exports 指向)
    }),
  ],
});
