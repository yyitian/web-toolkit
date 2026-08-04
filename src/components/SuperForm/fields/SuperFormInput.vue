<script setup lang="ts">
import { ElInput } from 'element-plus';
defineOptions({ inheritAttrs: false });
</script>
<template><ElInput v-bind="{ clearable: true, ...$attrs }" /></template>
