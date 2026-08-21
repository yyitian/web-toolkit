<script setup lang="ts">
import {
  Bell,
  RefreshCw,
  Search,
  Settings,
  Upload,
  Download,
} from '@lucide/vue';
import SuperButton from '@/components/SuperButton/index.vue';
</script>

<template>
  <div class="button-demo">
    <div class="button-demo__group">
      <span class="button-demo__label">图标按钮</span>
      <div class="button-demo__row">
        <SuperButton :icon="Search" label="搜索" />
        <SuperButton :icon="RefreshCw" label="loading" loading />
        <SuperButton :icon="Search" label="禁用" disabled />
      </div>
    </div>
    <div class="button-demo__group">
      <span class="button-demo__label">边框形态</span>
      <div class="button-demo__row">
        <SuperButton
          type="primary"
          :icon="Settings"
          label="设置"
          :square="36"
        />
        <SuperButton
          type="success"
          :icon="Upload"
          label="上传中"
          :square="36"
          loading
        />
        <SuperButton
          type="warning"
          :icon="Bell"
          label="通知"
          :square="36"
          circle
        />
        <SuperButton
          type="danger"
          :icon="Download"
          label="禁用"
          :square="36"
          disabled
          circle
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.button-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.button-demo__group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.button-demo__label {
  color: var(--wt-text-regular);
  font-size: 14px;
  font-weight: 600;
}

.button-demo__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
