<script setup lang="ts">
import { ElInput } from 'element-plus';
defineOptions({ inheritAttrs: false });
</script>
<template>
  <ElInput
    v-bind="{
      type: 'textarea',
      resize: 'none',
      autosize: { minRows: 2, maxRows: 4 },
      ...$attrs,
    }"
  />
</template>
