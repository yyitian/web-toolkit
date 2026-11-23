<script setup lang="ts">
import { ElTag } from 'element-plus';
import type { TagEntry } from './config.ts';
import type { SuperTagContext, SuperTagEvent } from './types.ts';

const props = defineProps<{ entry: TagEntry; overflow: boolean }>();
defineSlots<{ default?: (context: SuperTagContext) => unknown }>();
const emit = defineEmits<{
  click: [value: SuperTagEvent];
  close: [value: SuperTagEvent];
}>();
function payload(event: MouseEvent): SuperTagEvent {
  return { tag: props.entry.tag, index: props.entry.index, event };
}
</script>

<template>
  <ElTag
    v-bind="entry.props"
    @click="emit('click', payload($event))"
    @close="emit('close', payload($event))"
  >
    <slot
      :tag="entry.tag"
      :index="entry.index"
      :label="entry.label"
      :overflow="overflow"
      >{{ entry.label }}</slot
    >
  </ElTag>
</template>
