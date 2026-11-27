<script setup lang="ts">
import { ElConfigProvider } from 'element-plus';
import SuperSegmented from '@/components/SuperSegmented/index.vue';
const value = ref('列表');
const options = ['列表', '卡片', '时间线'];
</script>

<template>
  <div class="segmented-layout">
    <div class="segmented-layout__sizes">
      <ElConfigProvider size="small"
        ><SuperSegmented
          v-model="value"
          :options="options"
          aria-label="小尺寸视图"
      /></ElConfigProvider>
      <SuperSegmented
        v-model="value"
        :options="options"
        aria-label="默认尺寸视图"
      />
      <SuperSegmented
        v-model="value"
        :options="options"
        size="large"
        aria-label="大尺寸视图"
      />
    </div>
    <SuperSegmented
      v-model="value"
      :options="options"
      block
      class="segmented-layout__block"
      aria-label="均分宽度视图"
    />
    <SuperSegmented
      v-model="value"
      :options="options"
      direction="vertical"
      aria-label="纵向视图"
    />
  </div>
</template>

<style scoped>
.segmented-layout {
  display: grid;
  justify-items: start;
  gap: 16px;
}
.segmented-layout__block {
  justify-self: stretch;
}
.segmented-layout__sizes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
</style>
