<script setup lang="ts">
import SuperForm from '@/components/SuperForm/index.vue';
import type { SuperFormColumn } from '@/components/SuperForm/types.ts';
import type { CardDemoSettings } from './card-demo-settings.ts';

const props = defineProps<{ modelValue: CardDemoSettings }>();
const emit = defineEmits<{ 'update:modelValue': [value: CardDemoSettings] }>();
function update(key: keyof CardDemoSettings, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}
function select(
  prop: keyof CardDemoSettings,
  label: string,
  options: { label: string; value: string | number }[],
): SuperFormColumn {
  return {
    prop,
    label,
    formType: 'select',
    defaultValue: props.modelValue[prop],
    props: { options, clearable: false },
    change: (_, value) => update(prop, value),
  };
}
function toggle(prop: keyof CardDemoSettings, label: string): SuperFormColumn {
  return {
    prop,
    label,
    formType: 'switch',
    defaultValue: props.modelValue[prop],
    change: (_, value) => update(prop, value === true),
  };
}
const primary = [
  select('mode', '数据模式', [
    { label: '模拟请求', value: 'request' },
    { label: '外部数据', value: 'external' },
  ]),
  select('tagsLimit', '标签数量', [
    { label: '显示 1 个', value: 1 },
    { label: '显示 2 个', value: 2 },
    { label: '仅计数', value: 0 },
    { label: '全部显示', value: 'all' },
  ]),
  select('status', '状态显示', [
    { label: '内置状态', value: 'preset' },
    { label: '自定义状态', value: 'custom' },
    { label: '隐藏', value: 'hidden' },
  ]),
  select('placement', '操作位置', [
    { label: '卡片右下', value: 'bottom-right' },
    { label: '图片右下', value: 'image-bottom-right' },
  ]),
];
const extra = [
  select('image', '图片来源', [
    { label: '正常、缺失与失败', value: 'mixed' },
    { label: '无图片', value: 'missing' },
    { label: '加载失败', value: 'failed' },
  ]),
  select('imageFit', '图片填充', [
    { label: '裁切填满', value: 'cover' },
    { label: '完整显示', value: 'contain' },
  ]),
  toggle('always', '操作栏常驻'),
  toggle('actions', '显示操作栏'),
  toggle('description', '显示说明'),
  toggle('tags', '显示标签'),
  toggle('extra', '显示自定义内容'),
  toggle('switchDisabled', '禁用激活开关'),
  toggle('selectionDisabled', '禁用勾选'),
  toggle('icon', '显示图标'),
  toggle('createdAt', '显示时间'),
  toggle('switch', '显示激活开关'),
  toggle('selection', '显示勾选框'),
  toggle('reserve', '跨页保留勾选'),
  toggle('customSlots', '自定义插槽'),
  toggle('narrow', '窄容器'),
];
</script>

<template>
  <div class="card-demo-settings">
    <SuperForm :columns="primary" inline label-position="top" />
    <details>
      <summary>更多展示设置</summary>
      <SuperForm :columns="extra" inline label-position="top" />
    </details>
  </div>
</template>

<style scoped>
.card-demo-settings {
  width: 100%;
  min-width: 0;
}
summary {
  cursor: pointer;
  color: var(--wt-text-secondary);
  font-size: 13px;
}
details[open] summary {
  margin-bottom: 16px;
}
</style>
