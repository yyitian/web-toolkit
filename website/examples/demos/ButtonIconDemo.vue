<script setup lang="ts">
import {
  Bell,
  BellOff,
  Download,
  RefreshCw,
  Search,
  Settings,
  Upload,
} from '@lucide/vue';
import SuperButton from '@/components/SuperButton/index.vue';

const loading = ref(false);

function startLoading() {
  loading.value = true;
  window.setTimeout(() => {
    loading.value = false;
  }, 2000);
}
</script>

<template>
  <div class="button-demo">
    <SuperButton :icon="Search" />
    <SuperButton :icon="Settings" label="设置" />
    <SuperButton :icon="Bell" label="通知" :square="36" />
    <SuperButton :icon="BellOff" label="禁用通知" disabled />
    <SuperButton :icon="RefreshCw" :loading="loading" @click="startLoading" />
    <SuperButton
      :icon="Download"
      label="下载"
      :loading="loading"
      @click="startLoading"
    />
    <SuperButton
      :icon="Upload"
      label="上传"
      :square="36"
      :loading="loading"
      @click="startLoading"
    />
  </div>
</template>

<style scoped>
.button-demo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
