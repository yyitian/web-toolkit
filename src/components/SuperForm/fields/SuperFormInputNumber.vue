<script setup lang="ts">
import { ElInputNumber } from 'element-plus';
defineOptions({ inheritAttrs: false });
</script>
<template>
  <ElInputNumber
    v-bind="{ stepStrictly: true, controlsPosition: 'right', ...$attrs }"
  />
</template>
