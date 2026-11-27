<script setup lang="ts">
import SuperCarousel from '../../../src/components/SuperCarousel/index.vue';
import SuperButton from '../../../src/components/SuperButton/index.vue';
const items = [
  { id: 1, label: '巡检', description: '检查服务状态与近期变更' },
  { id: 2, label: '分析', description: '汇总运行数据，发现异常趋势' },
  { id: 3, label: '报告', description: '整理结论并生成报告' },
];
const selected = ref<number>();
</script>
<template>
  <SuperCarousel
    :items="items"
    style="
      --wt-carousel-card-width: 360px;
      --wt-carousel-ratio: auto;
      --wt-carousel-angle: 24deg;
    "
  >
    <template #default="{ item, active }">
      <div class="carousel-business-card">
        <span class="wt-text-caption">工作台</span
        ><strong class="wt-text-title">{{ item.label }}</strong>
        <p>{{ item.description }}</p>
        <SuperButton
          :type="selected === item.id ? 'success' : 'primary'"
          :disabled="!active"
          @click="selected = Number(item.id)"
          >{{ selected === item.id ? '已选择' : '选择任务' }}</SuperButton
        >
      </div>
    </template>
  </SuperCarousel>
</template>
<style scoped>
.carousel-business-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  min-height: 210px;
  padding: 24px;
}
p {
  margin: 0 0 8px;
}
</style>
