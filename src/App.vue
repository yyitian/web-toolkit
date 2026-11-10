<script setup lang="ts">
import { Save, Settings } from '@lucide/vue';
import { ElButtonGroup } from 'element-plus';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperIcon from '@/components/SuperIcon/index.vue';
import SuperPopover from '@/components/SuperPopover/index.vue';
import SuperThemeSwitcher from '@/components/SuperThemeSwitcher/index.vue';
import DynamicPin from '@/components/SuperIcon/dynamic-icons/DynamicPin.vue';
import DynamicIconDemo from '../website/examples/demos/DynamicIconDemo.vue';
import TableDemo from '../website/examples/demos/TableDemo.vue';
import TableExternalDemo from '../website/examples/demos/TableExternalDemo.vue';
import TableDateDemo from '../website/examples/demos/TableDateDemo.vue';
import TableFeaturesDemo from '../website/examples/demos/TableFeaturesDemo.vue';
import { useWtTheme } from '@/theme/index.ts';

const pinActive = ref(false);
const loading = ref(false);
const { theme } = useWtTheme();

function startLoading() {
  loading.value = true;

  setTimeout(() => {
    loading.value = false;
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

    <div class="demo-header">
      <div>
        <h1>Web Toolkit 本地回归</h1>
        <span>当前主题：{{ theme }}</span>
      </div>
      <SuperThemeSwitcher />
    </div>

    <section class="demo-section" data-demo="table-regression">
      <SuperThemeSwitcher variant="inline" />
      <h2>SuperTable 请求模式</h2>
      <TableDemo />
      <h2>SuperTable 外部数据模式</h2>
      <TableExternalDemo />
      <h2>日期检索配置</h2>
      <TableDateDemo />
      <h2>单元格与底层扩展</h2>
      <TableFeaturesDemo />
    </section>

    <section class="demo-section" data-demo="button-regression">
      <h2>SuperButton 边界回归</h2>
      <div class="demo-row">
        <SuperButton icon="demo-spark" label="Sprite 图标" />
        <SuperButton
          :icon="DynamicPin"
          :active="pinActive"
          label="动态图标"
          @click="pinActive = !pinActive"
        />
        <SuperButton :icon="DynamicPin" label="slot 优先">
          <template #icon><SuperIcon :icon="Settings" /></template>
        </SuperButton>
        <SuperButton :icon="Settings" />
        <SuperButton :icon="Settings" label="禁用设置" disabled />
        <SuperButton :icon="Settings" label="   " />
        <SuperButton :icon="Settings" label="自定义提示" title="原生提示" />
        <SuperButton :icon="Settings" :square="35.5" label="35.5px" />
        <SuperButton
          :icon="DynamicPin"
          :square="40"
          label="square loading"
          :loading="loading"
          @click="startLoading"
        />
      </div>
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
      <ElButtonGroup class="button-group">
        <SuperButton :icon="Settings" :square="32" label="组一" />
        <SuperButton :icon="Save" :square="32" label="组二" />
      </ElButtonGroup>
    </section>

    <section class="demo-section" data-demo="dynamic-icons">
      <h2>动态图标</h2>
      <DynamicIconDemo />
    </section>

    <section class="demo-section" data-demo="popover-regression">
      <h2>SuperPopover 布局回归</h2>
      <div class="demo-row">
        <SuperPopover :teleport-to="false" title="相邻浮层">
          <template #reference="{ setReference }">
            <span :ref="setReference" class="demo-trigger">不 Teleport</span>
          </template>
        </SuperPopover>

        <SuperIcon :icon="Settings" title="SuperIcon tooltip" />
      </div>
    </section>
  </section>
</template>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  padding: 24px;
  color: var(--wt-text-primary);
  background:
    radial-gradient(circle at 10% 0%, #60a5fa 0, transparent 34%),
    radial-gradient(circle at 90% 20%, #c084fc 0, transparent 36%),
    var(--wt-surface-page);
  transition:
    color var(--wt-motion-base),
    background-color var(--wt-motion-base);
}

.demo-header {
  @include flex-between-center(16px);
}

.demo-sprite {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.demo-section {
  margin-top: 24px;
  border: 1px solid var(--wt-border-color-light);
  border-radius: var(--wt-radius-large);
  padding: 16px;
  background: var(--wt-surface-base);
  box-shadow: var(--wt-shadow-base);
  backdrop-filter: var(--wt-backdrop-filter);
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
  border: 1px dashed var(--wt-border-color-strong);
  padding: 8px;
}

.button-group {
  margin-top: 12px;
}

.demo-trigger {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  border: 1px dashed var(--wt-border-color-strong);
  border-radius: 4px;
  padding: 4px 8px;
  background: var(--wt-surface-base);
  color: inherit;
  cursor: pointer;
}
</style>
