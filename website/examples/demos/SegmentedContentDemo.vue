<script setup lang="ts">
import { Grid2x2, List, Rows3 } from '@lucide/vue';
import SuperIcon from '@/components/SuperIcon/index.vue';
import SuperSegmented from '@/components/SuperSegmented/index.vue';
const value = ref(0);
const options = [
  { title: '列表', id: 0, icon: List },
  { title: '卡片', id: 1, icon: Grid2x2 },
  { title: '紧凑', id: 2, icon: Rows3, unavailable: true },
];
const fields = { label: 'title', value: 'id', disabled: 'unavailable' };
</script>

<template>
  <SuperSegmented
    v-model="value"
    :options="options"
    :props="fields"
    aria-label="内容视图"
  >
    <template #default="{ item }">
      <span class="segmented-content"
        ><SuperIcon :icon="item.icon" :size="16" />{{ item.title }}</span
      >
    </template>
  </SuperSegmented>
</template>

<style scoped>
.segmented-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
</style>
