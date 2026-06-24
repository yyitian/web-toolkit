<script setup lang="ts">
import { Settings } from '@lucide/vue';
import SuperIcon from '@/components/SuperIcon/index.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperPopover from '@/components/SuperPopover/index.vue';
import DynamicPin from '@/components/SuperIcon/dynamic-icons/DynamicPin.vue';

const pinActive = ref(false);

const loading = ref(false);
const active = ref(false);
function handleLoading() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    active.value = !active.value;
  }, 2000);
}
</script>
<template>
  <section class="app-container">
    <div class="super-icon-group">
      <SuperButton type="primary" :icon="Settings" />
      <SuperButton type="success" :icon="DynamicPin">置顶</SuperButton>
      <SuperButton
        type="warning"
        :loading="loading"
        :active="active"
        :icon="DynamicPin"
        @click="handleLoading"
      >
        点击加载
      </SuperButton>
    </div>
    <div class="super-icon-group">
      <SuperIcon
        :icon="DynamicPin"
        :active="pinActive"
        @click="pinActive = !pinActive"
      />
      <SuperIcon loading />
      <SuperIcon :icon="Settings" title="设置" effect="dark" />
      <SuperIcon :icon="Settings" title="设置" effect="light" />
    </div>
    <div class="super-icon-group">
      <!-- 二开:仅靠一个 class 覆盖 --wt-popover-* 变量,金绿 45° 渐变 + 合适的描边 -->
      <SuperPopover class="rich-tip">
        <span class="demo-trigger">金绿渐变 popover(二开)</span>
        <template #content>
          <div class="rich-tip-content">
            <strong>金绿渐变浮层</strong>
            <p>消费方仅覆盖 --wt-popover-* 变量即可定制</p>
          </div>
        </template>
      </SuperPopover>
    </div>
  </section>
</template>
<style lang="scss" scoped>
.app-container {
  height: 100vh;
}
.super-icon-group {
  @include flex(16px);
  padding: 20px;
}
.demo-trigger {
  padding: 8px 12px;
  border: 1px dashed #aaa;
  border-radius: 4px;
  cursor: pointer;
}
// 二开:一个 class 一次性覆盖浮层全部主题变量
.rich-tip {
  --wt-popover-bg: linear-gradient(45deg, #d4af37, #2e8b57);
  --wt-popover-color: #fff;
  --wt-popover-border-color: #ffe08a;
  --wt-popover-padding: 8px 12px;
}
.rich-tip-content {
  strong {
    display: block;
    margin-bottom: 2px;
  }
  p {
    margin: 0;
    opacity: 0.9;
  }
}
</style>
