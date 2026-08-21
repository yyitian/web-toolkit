<script setup lang="ts">
import { Save } from '@lucide/vue';
import SuperButton from '@/components/SuperButton/index.vue';

const loading = ref(false);
function handleLoading() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 1500);
}
</script>

<template>
  <div class="button-demo">
    <div class="button-demo__group">
      <span class="button-demo__label">默认用法</span>
      <div class="button-demo__row">
        <SuperButton label="普通按钮" />
        <SuperButton
          :icon="Save"
          type="primary"
          :loading="loading"
          @click="handleLoading"
          >{{ loading ? `保存中` : '点击保存' }}</SuperButton
        >
        <SuperButton type="primary" :loading="loading" @click="handleLoading">{{
          loading ? `保存中` : '点击保存'
        }}</SuperButton>
        <SuperButton type="danger" disabled>禁用</SuperButton>
      </div>
    </div>

    <div class="button-demo__group">
      <span class="button-demo__label">原生用法</span>
      <div class="button-demo__row">
        <SuperButton type="primary">默认按钮</SuperButton>
        <SuperButton type="success" plain>朴素按钮</SuperButton>
        <SuperButton type="warning" dashed>虚线按钮</SuperButton>
        <SuperButton type="danger" round>圆角按钮</SuperButton>
        <SuperButton type="primary" text>文字按钮</SuperButton>
        <SuperButton type="primary" link>链接按钮</SuperButton>
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
