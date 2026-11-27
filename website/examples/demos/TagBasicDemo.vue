<script setup lang="ts">
import SuperTag from '@/components/SuperTag/index.vue';
import type { SuperTagProps } from '@/components/SuperTag/types.ts';

const types = [
  'primary',
  'success',
  'info',
  'warning',
  'danger',
] as const satisfies readonly SuperTagProps['type'][];
</script>

<template>
  <div class="tag-basic" data-demo="tag-basic">
    <SuperTag v-for="type in types" :key="type" :type="type">{{
      type
    }}</SuperTag>
  </div>
</template>

<style scoped>
.tag-basic {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
