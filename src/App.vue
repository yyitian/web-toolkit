<script setup lang="ts">
import { Save, Settings } from '@lucide/vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperIcon from '@/components/SuperIcon/index.vue';
import SuperPopover from '@/components/SuperPopover/index.vue';
import DynamicPin from '@/components/SuperIcon/dynamic-icons/DynamicPin.vue';
import SuperFormDemo from '@/demo/SuperFormDemo.vue';

const pinActive = ref(false);
const loading = ref(false);
const squareLoading = ref(false);
const manualVisible = ref(false);
const clickCount = ref(0);

function startLoading(target: 'normal' | 'square') {
  if (target === 'normal') loading.value = true;
  else squareLoading.value = true;

  setTimeout(() => {
    loading.value = false;
    squareLoading.value = false;
    pinActive.value = !pinActive.value;
  }, 1600);
}
</script>

<template>
  <section class="app-container">
    <svg class="demo-sprite" aria-hidden="true">
      <symbol id="icon-demo-spark" viewBox="0 0 24 24">
        <path
          d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2Z"
          fill="currentColor"
        />
      </symbol>
    </svg>

    <h1>SuperButton 纯图标与正方形按钮</h1>

    <section class="demo-section" data-demo="button-content">
      <h2>文字与图标来源</h2>
      <div class="demo-row">
        <SuperButton type="primary">默认插槽文字</SuperButton>
        <SuperButton type="success" label="label 文字" />
        <SuperButton type="primary" :icon="Save">保存</SuperButton>
        <SuperButton icon="demo-spark" label="Sprite 图标" />
        <SuperButton :icon="Settings" label="Lucide 设置" />
        <SuperButton
          :icon="DynamicPin"
          :active="pinActive"
          label="动态图标"
          @click="pinActive = !pinActive"
        />
        <SuperButton :icon="DynamicPin" label="slot 优先">
          <template #icon><SuperIcon :icon="Settings" /></template>
        </SuperButton>
      </div>
    </section>

    <section class="demo-section" data-demo="icon-only">
      <h2>纯图标状态</h2>
      <div class="demo-row">
        <SuperButton :icon="Settings" />
        <SuperButton :icon="Settings" label="有 tooltip 的设置" />
        <SuperButton :icon="Settings" label="禁用设置" disabled />
        <SuperButton
          :icon="DynamicPin"
          label="加载中的置顶"
          :loading="loading"
          @click="startLoading('normal')"
        />
        <span>点击次数：{{ clickCount }}</span>
        <SuperButton
          :icon="Settings"
          label="点击计数"
          @click="clickCount += 1"
        />
      </div>
    </section>

    <section class="demo-section" data-demo="square">
      <h2>精确正方形与外观组合</h2>
      <div class="demo-row">
        <SuperButton :icon="Settings" :square="24" label="24px" />
        <SuperButton :icon="Settings" :square="32" label="32px" />
        <SuperButton :icon="Settings" :square="40" label="40px" />
        <SuperButton :icon="Settings" :square="35.5" label="35.5px" />
        <SuperButton :icon="Settings" :square="32" label="text" text />
        <SuperButton :icon="Settings" :square="32" label="circle" circle />
        <SuperButton :icon="Settings" :square="32" label="plain" plain />
        <SuperButton
          :icon="DynamicPin"
          :square="40"
          label="square loading"
          :loading="squareLoading"
          @click="startLoading('square')"
        />
      </div>
    </section>

    <section class="demo-section" data-demo="layout">
      <h2>无包装布局</h2>
      <div class="auto-layout">
        <span>左侧内容</span>
        <SuperButton
          class="push-right"
          style="margin-left: auto"
          :icon="Settings"
          :square="32"
          label="margin-left auto"
        />
      </div>
      <el-button-group class="button-group">
        <SuperButton :icon="Settings" :square="32" label="组一" />
        <SuperButton :icon="Save" :square="32" label="组二" />
      </el-button-group>
    </section>

    <section class="demo-section" data-demo="popover">
      <h2>Popover reference 协议</h2>
      <div class="demo-row popover-demo">
        <div class="clip-box">
          <SuperPopover popper-class="rich-tip">
            <template #reference="{ setReference }">
              <span :ref="setReference" class="demo-trigger">hover</span>
            </template>
            <template #content>
              <strong>默认 Teleport</strong>
            </template>
          </SuperPopover>
        </div>

        <SuperPopover
          trigger="click"
          effect="light"
          popper-class="click-tip"
          :popper-style="{ '--wt-popover-z-index': 2600 }"
        >
          <template #reference="{ setReference }">
            <button :ref="setReference" class="demo-trigger" type="button">
              click 打开
            </button>
          </template>
          <template #content>点击浮层内部不会关闭</template>
        </SuperPopover>

        <SuperPopover v-model="manualVisible" trigger="manual" title="手动浮层">
          <template #reference="{ setReference }">
            <button
              :ref="setReference"
              class="demo-trigger"
              type="button"
              @click="manualVisible = !manualVisible"
            >
              manual 切换
            </button>
          </template>
        </SuperPopover>

        <SuperPopover :teleport-to="false" title="相邻浮层">
          <template #reference="{ setReference }">
            <span :ref="setReference" class="demo-trigger">不 Teleport</span>
          </template>
        </SuperPopover>

        <SuperIcon :icon="Settings" title="SuperIcon tooltip" />
      </div>
    </section>

    <section class="demo-section" data-demo="label-edges">
      <h2>label 边界</h2>
      <div class="demo-row">
        <SuperButton :icon="Settings" label="" />
        <SuperButton :icon="Settings" label="   " />
        <SuperButton :icon="Settings" label="自定义提示" title="原生提示" />
      </div>
    </section>

    <section class="demo-section">
      <h2>其他组件回归</h2>
      <SuperFormDemo />
    </section>
  </section>
</template>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  padding: 24px;
  color: #24292f;
}

.demo-sprite {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.demo-section {
  margin-top: 24px;
  border: 1px solid #d8dee4;
  border-radius: 8px;
  padding: 16px;
}

.demo-row {
  @include flex(16px);
  align-items: center;
  flex-wrap: wrap;
}

.auto-layout {
  display: flex;
  align-items: center;
  width: 360px;
  border: 1px dashed #8c959f;
  padding: 8px;
}

.button-group {
  margin-top: 12px;
}

.clip-box {
  width: 100px;
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
  border: 1px dashed #8c959f;
  border-radius: 4px;
  padding: 4px 8px;
  background: #fff;
  color: inherit;
  cursor: pointer;
}

:global(.rich-tip) {
  --wt-popover-bg: linear-gradient(45deg, #6d28d9, #2563eb);
  --wt-popover-color: #fff;
  --wt-popover-border-color: #c4b5fd;
  --wt-popover-padding: 8px 12px;
}

:global(.click-tip) {
  --wt-popover-padding: 8px 12px;
}
</style>
