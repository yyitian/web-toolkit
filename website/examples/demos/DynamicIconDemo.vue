<script setup lang="ts">
import DynamicAudioLines from '@/components/SuperIcon/dynamic-icons/DynamicAudioLines.vue';
import DynamicChevronLeft from '@/components/SuperIcon/dynamic-icons/DynamicChevronLeft.vue';
import DynamicPin from '@/components/SuperIcon/dynamic-icons/DynamicPin.vue';
import SuperButton from '@/components/SuperButton/index.vue';

const active = ref(false);
</script>

<template>
  <div class="demo-row">
    <SuperButton
      :icon="DynamicPin"
      :active="active"
      label="切换置顶状态"
      @click="active = !active"
    />
    <SuperButton
      :icon="DynamicAudioLines"
      :active="active"
      label="切换音频状态"
      @click="active = !active"
    />
    <SuperButton
      :icon="DynamicChevronLeft"
      :active="active"
      label="切换箭头状态"
      @click="active = !active"
    />
    <span>active：{{ active }}</span>
  </div>
</template>
