<script setup lang="ts">
import { CircleCheck } from '@lucide/vue';
import SuperIcon from '@/components/SuperIcon/index.vue';
import SuperTag from '@/components/SuperTag/index.vue';
</script>

<template>
  <SuperTag type="success">
    <span class="tag-content"
      ><SuperIcon :icon="CircleCheck" :size="14" />已完成</span
    >
  </SuperTag>
</template>

<style scoped>
.tag-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
