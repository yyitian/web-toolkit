<script setup lang="ts">
import { Save } from '@lucide/vue';
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
    <SuperButton type="primary">普通按钮</SuperButton>
    <SuperButton type="primary" :icon="Save">保存</SuperButton>
    <SuperButton type="primary" disabled>禁用按钮</SuperButton>
    <SuperButton
      type="primary"
      :icon="Save"
      :loading="loading"
      @click="startLoading"
    >
      保存
    </SuperButton>
    <SuperButton type="primary" :loading="loading" @click="startLoading">
      加载数据
    </SuperButton>
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
