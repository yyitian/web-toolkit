<script setup lang="ts">
import { ElConfigProvider } from 'element-plus';
import en from 'element-plus/es/locale/lang/en.mjs';
import zhCn from 'element-plus/es/locale/lang/zh-cn.mjs';
import SuperButton from '@/components/SuperButton/index.vue';
import LocaleDemoPanel from './LocaleDemoPanel.vue';

const english = ref(true);
const locale = computed(() => (english.value ? en : zhCn));
</script>

<template>
  <div class="locale-demo">
    <section>
      <h3>默认中文</h3>
      <p>无需配置语言，组件自动使用简体中文。</p>
      <LocaleDemoPanel />
    </section>
    <section>
      <h3>外层语言配置</h3>
      <div class="locale-demo__switch">
        <SuperButton @click="english = !english">
          {{ english ? '切换为中文' : '切换为英文' }}
        </SuperButton>
      </div>
      <ElConfigProvider :locale="locale">
        <LocaleDemoPanel />
      </ElConfigProvider>
    </section>
  </div>
</template>

<style scoped>
.locale-demo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 24px;
}
.locale-demo section {
  min-width: 0;
}
.locale-demo__switch {
  margin-bottom: 16px;
}
</style>
