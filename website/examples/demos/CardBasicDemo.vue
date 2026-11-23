<script setup lang="ts">
import SuperTable from '@/components/SuperTable/index.vue';

interface Task {
  id: number;
  title: string;
  image?: string;
  createdAt: string;
}
const rows: Task[] = [
  { id: 1, title: '资产巡检', createdAt: '2026-11-20 09:00:00' },
  { id: 2, title: '告警分析', createdAt: '2026-11-20 10:00:00' },
];
</script>

<template>
  <div style="height: 660px; overflow: auto">
    <SuperTable
      view="card"
      title="任务卡片"
      :data="rows"
      :total="rows.length"
      selection
    />
  </div>
</template>
