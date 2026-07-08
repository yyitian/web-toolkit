<script setup lang="ts">
import { Settings } from '@lucide/vue';
import SuperIcon from '@/components/SuperIcon/index.vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperPopover from '@/components/SuperPopover/index.vue';
import DynamicPin from '@/components/SuperIcon/dynamic-icons/DynamicPin.vue';
import DynamicAudioLines from '@/components/SuperIcon/dynamic-icons/DynamicAudioLines.vue';
import DynamicChevronLeft from '@/components/SuperIcon/dynamic-icons/DynamicChevronLeft.vue';

const pinActive = ref(false);

const loading = ref(false);
const active = ref(false);
const disabledManualVisible = ref(true);
function handleLoading() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    active.value = !active.value;
  }, 2000);
}
</script>
<template>
  <section class="app-container">
    <div class="super-icon-group">
      <SuperButton type="primary" :icon="Settings" />
      <SuperButton type="success" :icon="DynamicPin">置顶</SuperButton>
      <SuperButton
        type="warning"
        :loading="loading"
        :active="active"
        :icon="DynamicPin"
        @click="handleLoading"
      >
        点击加载
      </SuperButton>
    </div>
    <div class="super-icon-group">
      <SuperIcon
        :icon="DynamicPin"
        :active="pinActive"
        @click="pinActive = !pinActive"
      />
      <SuperIcon :icon="DynamicAudioLines" :active="pinActive"></SuperIcon>
      <SuperIcon :icon="DynamicChevronLeft" :active="pinActive"></SuperIcon>
      <SuperIcon loading />
      <SuperIcon :icon="Settings" title="设置" effect="dark" />
      <SuperIcon :icon="Settings" title="设置" effect="light" />
    </div>
    <div class="super-icon-group popover-demo">
      <div class="clip-box">
        <SuperPopover popper-class="rich-tip">
          <span class="demo-trigger">overflow 内 hover</span>
          <template #content>
            <div class="demo-popover-content">
              <strong>默认 Teleport</strong>
              <p>父容器 overflow:hidden 不会裁剪浮层</p>
            </div>
          </template>
        </SuperPopover>
      </div>

      <SuperPopover
        :arrow="false"
        popper-class="glass-tip"
        :popper-style="{ '--wt-popover-z-index': 2600 }"
      >
        <span class="demo-trigger">半透明无箭头</span>
        <template #content>
          <div class="demo-popover-content">
            <strong>无箭头</strong>
            <p>半透明背景不会露出本该遮挡的箭头区域</p>
          </div>
        </template>
      </SuperPopover>

      <SuperPopover trigger="click" effect="light" popper-class="click-tip">
        <span class="demo-trigger">click 打开</span>
        <template #content>
          <button class="inside-button" type="button">内部点击不关闭</button>
        </template>
      </SuperPopover>

      <SuperPopover
        v-model="disabledManualVisible"
        trigger="manual"
        disabled
        title="disabled 时不会显示"
      >
        <span class="demo-trigger">disabled manual</span>
      </SuperPopover>
    </div>
  </section>
</template>
<style lang="scss" scoped>
.app-container {
  height: 100vh;
}
.super-icon-group {
  @include flex(16px);
  padding: 20px;
}

.popover-demo {
  align-items: center;
  flex-wrap: wrap;
}

.clip-box {
  width: 180px;
  height: 44px;
  overflow: hidden;
  border: 1px solid #d8dee4;
  border-radius: 6px;
  padding: 8px;
}

.demo-trigger {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 6px 10px;
  border: 1px dashed #8c959f;
  border-radius: 4px;
  cursor: pointer;
}

:global(.rich-tip) {
  --wt-popover-bg: linear-gradient(45deg, #d4af37, #2e8b57);
  --wt-popover-color: #fff;
  --wt-popover-border-color: #ffe08a;
  --wt-popover-padding: 8px 12px;
  --wt-popover-max-width: 520px;
}

:global(.glass-tip) {
  --wt-popover-bg: rgb(20 20 20 / 70%);
  --wt-popover-color: #fff;
  --wt-popover-border-color: rgb(255 255 255 / 20%);
  --wt-popover-padding: 8px 12px;
}

:global(.click-tip) {
  --wt-popover-padding: 8px;
}

:global(.click-tip .inside-button) {
  border: 1px solid #d0d7de;
  border-radius: 4px;
  padding: 6px 10px;
  background: #fff;
  cursor: pointer;
}

:global(.demo-popover-content) {
  strong {
    display: block;
    margin-bottom: 2px;
  }

  p {
    margin: 0;
    opacity: 0.9;
  }
}
</style>
