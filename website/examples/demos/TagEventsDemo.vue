<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperTag from '@/components/SuperTag/index.vue';

const initial = ['研发', '运维', '安全'];
const tags = ref([...initial]);
const message = ref('点击标签或关闭图标查看结果');
function remove(tag: string) {
  tags.value = tags.value.filter((value) => value !== tag);
  message.value = `已移除：${tag}`;
}
function reset() {
  tags.value = [...initial];
  message.value = '已恢复标签';
}
</script>

<template>
  <DemoLayout>
    <template #controls
      ><SuperButton size="small" @click="reset">恢复标签</SuperButton></template
    >
    <div class="tag-events">
      <SuperTag
        v-for="tag in tags"
        :key="tag"
        closable
        @click="message = `点击：${tag}`"
        @close="remove(tag)"
        >{{ tag }}</SuperTag
      >
    </div>
    <template #output>{{ message }}</template>
  </DemoLayout>
</template>

<style scoped>
.tag-events {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
