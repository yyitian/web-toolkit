<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperTags from '@/components/SuperTags/index.vue';
import type { SuperTagEvent } from '@/components/SuperTags/types.ts';

const initialTags = ['研发', '运维', '审计', '安全'];
const tags = ref([...initialTags]);
const nextNumber = ref(5);
const message = ref('点击标签查看事件，点击关闭图标移除标签。');
function click({ index }: SuperTagEvent) {
  message.value = `点击了源数组第 ${index + 1} 项`;
}
function remove({ index }: SuperTagEvent) {
  tags.value = tags.value.filter((_, sourceIndex) => sourceIndex !== index);
  message.value = `已移除源数组第 ${index + 1} 项，剩余 ${tags.value.length} 项`;
}
function add() {
  tags.value = [...tags.value, `新增标签 ${nextNumber.value++}`];
  message.value = `已添加标签，共 ${tags.value.length} 项`;
}
function reset() {
  tags.value = [...initialTags];
  nextNumber.value = 5;
  message.value = '已恢复示例标签';
}
</script>

<template>
  <DemoLayout>
    <template #controls>
      <SuperButton size="small" @click="add">添加标签</SuperButton>
      <SuperButton size="small" @click="reset">恢复标签</SuperButton>
    </template>
    <SuperTags
      :tags="tags"
      :props="{ closable: true, size: 'small' }"
      @tag-click="click"
      @tag-close="remove"
    />
    <template #output>{{ message }}</template>
  </DemoLayout>
</template>
