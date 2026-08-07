import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import '../../../src/styles/index.scss';
import DemoBlock from '../../examples/DemoBlock.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 });
    app.provide(ZINDEX_INJECTION_KEY, { current: 0 });
    app.component('DemoBlock', DemoBlock);
  },
} satisfies Theme;
