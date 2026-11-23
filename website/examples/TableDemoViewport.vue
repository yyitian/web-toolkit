<script setup lang="ts">
withDefaults(defineProps<{ height?: number }>(), { height: 720 });
</script>

<template>
  <div class="table-demo-viewport" :style="{ height: `${height}px` }">
    <slot />
  </div>
</template>

<style scoped>
.table-demo-viewport {
  width: 100%;
  min-width: 0;
  overflow: auto;
}
</style>
