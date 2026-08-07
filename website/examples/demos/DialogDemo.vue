<script setup lang="ts">
import SuperButton from '@/components/SuperButton/index.vue';
import SuperDialog from '@/components/SuperDialog/index.vue';

const visible = ref(false);
</script>

<template>
  <SuperButton type="primary" @click="visible = true">打开弹窗</SuperButton>
  <SuperDialog
    v-model="visible"
    title="删除确认"
    :width="480"
    @confirm="visible = false"
  >
    弹窗内容高度自然增长，超过 maxHeight 后正文区域滚动。
  </SuperDialog>
</template>
