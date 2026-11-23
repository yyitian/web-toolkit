<script setup lang="ts">
import { ElSlider } from 'element-plus';
import { Eye, Settings } from '@lucide/vue';
import DemoLayout from '../DemoLayout.vue';
import SuperTable from '@/components/SuperTable/index.vue';
import SuperButton from '@/components/SuperButton/index.vue';

const width = ref(400);
const rows = [
  {
    id: 1,
    title: '自动化巡检',
    description: '调节容器宽度，观察底部操作的自适应展示。',
    createdAt: '2026-11-20 12:30',
  },
];
const result = ref('调整容器宽度，比较操作按钮与更多菜单。');
</script>

<template>
  <DemoLayout data-demo="card-adaptive-actions">
    <template #controls>
      <span>容器宽度 {{ width }}px</span>
      <ElSlider
        v-model="width"
        :min="240"
        :max="560"
        :step="1"
        aria-label="卡片容器宽度"
      />
    </template>
    <div class="adaptive-actions-demo" :style="{ width: `${width}px` }">
      <SuperTable
        view="card"
        :data="rows"
        :config="{ search: false, header: false, pagination: false }"
        :card="{ actions: { display: 'always' } }"
      >
        <template #card-created-at="{ formatted }"
          >创建：{{ formatted }}</template
        >
        <template #card-actions="{ row, overflow }">
          <SuperButton
            :icon="Eye"
            :square="overflow ? undefined : 32"
            :text="overflow"
            label="查看"
            @click="result = `查看：${row.title}`"
          >
            <template v-if="overflow" #default>查看</template>
          </SuperButton>
          <SuperButton
            :icon="Settings"
            :square="overflow ? undefined : 32"
            :text="overflow"
            label="配置"
            @click="result = `配置：${row.title}`"
          >
            <template v-if="overflow" #default>配置</template>
          </SuperButton>
        </template>
      </SuperTable>
    </div>
    <template #output>{{ result }}</template>
  </DemoLayout>
</template>

<style scoped>
.adaptive-actions-demo {
  max-width: 100%;
  height: 560px;
}
:deep(.el-slider) {
  max-width: 240px;
  margin-inline: 12px;
}
</style>
