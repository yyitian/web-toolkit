<script setup lang="ts">
import SuperSegmented from '@/components/SuperSegmented/index.vue';
const view = ref('全部');
const enabled = ref(false);
const options = [
  { label: '停用', value: false },
  { label: '启用', value: true },
];
</script>

<template>
  <div class="segmented-basic">
    <SuperSegmented
      v-model="view"
      :options="['全部', '进行中', '已完成']"
      aria-label="任务状态"
    />
    <SuperSegmented
      v-model="enabled"
      :options="options"
      aria-label="启用状态"
    />
  </div>
</template>

<style scoped>
.segmented-basic {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
</style>
