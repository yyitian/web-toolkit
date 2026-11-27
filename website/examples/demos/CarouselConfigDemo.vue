<script setup lang="ts">
import DemoLayout from '../DemoLayout.vue';
import SuperCarousel from '@/components/SuperCarousel/index.vue';
import SuperForm from '@/components/SuperForm/index.vue';
import type { SuperFormColumn } from '@/components/SuperForm/types.ts';
import type { SuperCarouselProps } from '@/components/SuperCarousel/types.ts';
import { carouselItems } from './carousel-data.ts';

const config = reactive<Partial<SuperCarouselProps>>({
  direction: 'horizontal',
  height: 'auto',
  arrow: 'always',
  indicatorPosition: 'outside',
  autoplay: false,
  loop: true,
  motionBlur: false,
  disabled: false,
});
function select(
  prop: keyof typeof config,
  label: string,
  values: string[],
): SuperFormColumn {
  return {
    prop,
    label,
    formType: 'select',
    defaultValue: config[prop],
    props: {
      clearable: false,
      style: { width: '130px' },
      options: values.map((value) => ({ label: value, value })),
    },
    change: (_, value) => Object.assign(config, { [prop]: value }),
  };
}
function toggle(prop: keyof typeof config, label: string): SuperFormColumn {
  return {
    prop,
    label,
    formType: 'switch',
    defaultValue: config[prop],
    change: (_, value) => Object.assign(config, { [prop]: value }),
  };
}
const columns = [
  select('direction', '方向', ['horizontal', 'vertical']),
  select('height', '高度', ['auto', '240px', '400px']),
  select('arrow', '箭头', ['always', 'hover', 'never']),
  select('indicatorPosition', '序号', ['outside', 'none']),
  toggle('autoplay', '自动播放'),
  toggle('loop', '循环'),
  toggle('motionBlur', '动态模糊'),
  toggle('disabled', '禁用'),
];
</script>

<template>
  <DemoLayout data-demo="carousel-config">
    <template #controls
      ><SuperForm :columns="columns" inline label-position="top"
    /></template>
    <SuperCarousel :items="carouselItems" v-bind="config" :interval="2000" />
  </DemoLayout>
</template>
