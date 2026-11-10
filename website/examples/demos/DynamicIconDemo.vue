<script setup lang="ts">
import { ElSwitch } from 'element-plus';
import DynamicAudioLines from '@/components/SuperIcon/dynamic-icons/DynamicAudioLines.vue';
import DynamicChevronLeft from '@/components/SuperIcon/dynamic-icons/DynamicChevronLeft.vue';
import DynamicPin from '@/components/SuperIcon/dynamic-icons/DynamicPin.vue';
import DynamicRefresh from '@/components/SuperIcon/dynamic-icons/DynamicRefresh.vue';
import DynamicFoldLeft from '@/components/SuperIcon/dynamic-icons/DynamicFoldLeft.vue';
import SuperButton from '@/components/SuperButton/index.vue';

const active = ref(false);
</script>

<template>
  <div class="demo-row">
    <ElSwitch v-model="active" aria-label="切换动态图标激活状态" />
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
    <SuperButton
      :icon="DynamicRefresh"
      :active="active"
      :aria-pressed="active"
      label="切换刷新状态"
      @click="active = !active"
    />
    <SuperButton
      :icon="DynamicFoldLeft"
      :active="active"
      :aria-pressed="active"
      label="切换左侧展开状态"
      @click="active = !active"
    />
  </div>
</template>
