<script setup lang="ts">
import SuperCarousel from '../../../src/components/SuperCarousel/index.vue';
import { carouselItems } from './carousel-data.ts';
const activeId = ref<string | number | null>('alpine');
</script>
<template>
  <SuperCarousel v-model:active-id="activeId" :items="carouselItems" />
</template>
