<script setup lang="ts">
import { ElButton } from 'element-plus';
import type { Component } from 'vue';
import SuperIcon from '../SuperIcon/index.vue';

const props = withDefaults(
  defineProps<{
    icon?: string | Component;
    active?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    icon: '',
    loading: false,
    disabled: false,
  },
);

const isDisabled = computed(() => props.loading || props.disabled);

function renderIcon() {
  if (!props.icon) {
    return;
  }
  if (props.loading) {
    return h(SuperIcon, { loading: true });
  }
  return h(SuperIcon, { icon: props.icon, active: props.active });
}
</script>

<template>
  <el-button class="super-button" :disabled="isDisabled">
    <template #icon>
      <Component :is="renderIcon" />
    </template>
    <slot />
  </el-button>
</template>

<style scoped></style>
