import { createApp } from 'vue';
import App from './App.vue';
import '@/styles/index.scss';
import { createWtTheme } from '@/theme/index.ts';

createApp(App)
  .use(createWtTheme({ scheme: 'light', material: 'solid', storage: true }))
  .mount('#app');
