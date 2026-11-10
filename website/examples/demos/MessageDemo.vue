<script setup lang="ts">
import SuperButton from '@/components/SuperButton/index.vue';
import { openConfirm, openDeleteConfirm } from '@/utils/message.ts';

const appContext = getCurrentInstance()?.appContext;
const result = ref('尚未操作');

async function confirm() {
  try {
    const action = await openConfirm('确认提交吗？', appContext);
    result.value = action === 'confirm' ? '已确认提交' : '已取消提交';
  } catch {
    result.value = '弹窗打开失败';
  }
}

async function remove(custom = false) {
  try {
    const confirmed = await openDeleteConfirm(
      '示例任务',
      custom
        ? {
            title: '删除任务',
            message: '确认永久删除示例任务吗？此操作不可撤销。',
            confirmButtonText: '永久删除',
            confirmButtonType: 'danger',
            closeOnClickModal: false,
          }
        : {},
      appContext,
    );
    result.value = confirmed ? '已确认删除（仅演示）' : '已取消删除';
  } catch {
    result.value = '弹窗打开失败';
  }
}
</script>

<template>
  <div class="message-demo">
    <div class="message-demo__actions">
      <SuperButton type="primary" @click="confirm">通用确认</SuperButton>
      <SuperButton @click="remove()">删除确认</SuperButton>
      <SuperButton type="danger" @click="remove(true)">
        自定义删除文案
      </SuperButton>
    </div>
    <p role="status" aria-live="polite">{{ result }}</p>
  </div>
</template>

<style scoped lang="scss">
.message-demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
