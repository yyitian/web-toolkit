<script setup lang="ts">
import { Settings } from '@lucide/vue';
import SuperIcon from '@/components/SuperIcon/index.vue';
</script>

<template>
  <div class="demo-row">
    <SuperIcon icon="example" :size="28" title="SVG sprite 图标" />
    <SuperIcon :icon="Settings" :size="28" title="Lucide 图标" />
    <SuperIcon loading :size="28" title="加载中" />
    <SuperIcon :icon="Settings" :size="28" :rotate="45" title="旋转 45 度" />
  </div>
</template>
