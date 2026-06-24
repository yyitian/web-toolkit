import pluginVue from 'eslint-plugin-vue';
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import globals from 'globals';
import autoImportGlobals from './.eslintrc-auto-import.json' with { type: 'json' };

export default defineConfigWithVueTs(
  {
    name: 'web-toolkit/ignores',
    ignores: ['**/dist/**', '**/auto-imports.d.ts', '**/coverage/**'],
  },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    name: 'web-toolkit/globals',
    languageOptions: {
      globals: {
        ...globals.browser,
        ...autoImportGlobals.globals,
      },
    },
  },
  {
    // 组件库约定:每个组件存放于「组件名/index.vue」,文件名固定为 index,
    // 关闭多词组件名规则(组件真实名由目录决定,导出名是多词的 SuperXxx)。
    name: 'web-toolkit/component-index',
    files: ['**/index.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  skipFormatting,
);
