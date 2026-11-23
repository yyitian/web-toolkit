<script setup lang="ts">
import SuperStatus from '@/components/SuperStatus/index.vue';
</script>

<template>
  <div
    class="demo-row"
    :style="{
      '--wt-status-dot-size': '8px',
      '--wt-status-gap': '10px',
      '--wt-status-color': 'var(--wt-color-warning)',
      '--wt-status-text-color': 'var(--wt-text-primary)',
    }"
  >
    <SuperStatus value="pending" />
    <SuperStatus value="running" />
  </div>
</template>
