<script setup lang="ts">
import SuperStatus from '@/components/SuperStatus/index.vue';
import { SUPER_STATUS_PRESETS } from '@/components/SuperStatus/config.ts';
</script>

<template>
  <div class="demo-row">
    <SuperStatus
      v-for="status in SUPER_STATUS_PRESETS"
      :key="status.value"
      :value="status.value"
    />
  </div>
</template>
