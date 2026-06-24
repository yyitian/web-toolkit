import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Node 侧构建:把面向消费方的 vite 插件(vite.plugin.ts)单独打成 dist/vite-plugin.js。
// 与组件库构建分开,需在组件库构建之后运行(emptyOutDir:false 保留 index.js 等产物)。
export default defineConfig({
  build: {
    emptyOutDir: false,
    copyPublicDir: false,
    lib: {
      entry: './vite.plugin.ts',
      formats: ['es'],
      fileName: () => 'vite-plugin.js',
    },
    rollupOptions: {
      // vite 与 Node 内置模块由运行环境提供,不打进产物
      external: ['vite', 'fs', 'path', 'node:fs', 'node:path'],
    },
  },
  plugins: [
    dts({
      include: ['vite.plugin.ts'],
      // 单文件插件声明自包含,无需 rollupTypes(那需要 api-extractor);
      // 产出 dist/vite.plugin.d.ts,由 package.json exports 指向。
      outDir: 'dist',
    }),
  ],
});
