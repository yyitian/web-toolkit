<script setup lang="ts">
import SuperTag from '@/components/SuperTag/index.vue';
</script>

<template>
  <div class="tag-appearance" data-demo="tag-appearance">
    <div>
      <SuperTag effect="light">固定 light</SuperTag>
      <SuperTag effect="dark">固定 dark</SuperTag>
      <SuperTag effect="plain">固定 plain</SuperTag>
    </div>
    <div>
      <SuperTag size="small">小尺寸</SuperTag>
      <SuperTag>默认尺寸</SuperTag>
      <SuperTag size="large">大尺寸</SuperTag>
      <SuperTag round>圆角</SuperTag>
    </div>
    <div>
      <SuperTag
        color="#475569"
        :style="{ color: '#fff', borderColor: '#475569' }"
        >自定义底色</SuperTag
      >
    </div>
  </div>
</template>

<style scoped>
.tag-appearance {
  display: grid;
  gap: 12px;
}
.tag-appearance > div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
