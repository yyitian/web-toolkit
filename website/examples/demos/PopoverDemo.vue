<script setup lang="ts">
import SuperPopover from '@/components/SuperPopover/index.vue';

const manualVisible = ref(false);
</script>

<template>
  <div class="demo-row">
    <SuperPopover title="默认 hover 提示">
      <template #reference="{ setReference }">
        <button :ref="setReference" class="demo-trigger" type="button">
          Hover
        </button>
      </template>
    </SuperPopover>

    <SuperPopover trigger="click" effect="light">
      <template #reference="{ setReference }">
        <button :ref="setReference" class="demo-trigger" type="button">
          Click
        </button>
      </template>
      <template #content>点击浮层内部不会关闭</template>
    </SuperPopover>

    <SuperPopover
      v-model="manualVisible"
      trigger="manual"
      title="由外部状态控制"
    >
      <template #reference="{ setReference }">
        <button
          :ref="setReference"
          class="demo-trigger"
          type="button"
          @click="manualVisible = !manualVisible"
        >
          Manual
        </button>
      </template>
    </SuperPopover>
  </div>
</template>
