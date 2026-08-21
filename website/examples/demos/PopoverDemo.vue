<script setup lang="ts">
import SuperPopover from '@/components/SuperPopover/index.vue';

const manualVisible = ref(false);
</script>

<template>
  <div class="popover-demo">
    <div class="popover-demo__group">
      <span class="popover-demo__label">触发方式</span>
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
    </div>

    <div class="popover-demo__group">
      <span class="popover-demo__label">Teleport 与样式定制</span>
      <div class="demo-row">
        <div class="popover-demo__clip">
          <SuperPopover
            popper-class="docs-rich-popover"
            :popper-style="{ '--wt-popover-padding': '10px 14px' }"
          >
            <template #reference="{ setReference }">
              <button :ref="setReference" class="demo-trigger" type="button">
                容器外浮层
              </button>
            </template>
            <template #content>默认 Teleport，不受 overflow 裁切</template>
          </SuperPopover>
        </div>

        <SuperPopover :teleport-to="false" title="浮层与触发器相邻渲染">
          <template #reference="{ setReference }">
            <button :ref="setReference" class="demo-trigger" type="button">
              不 Teleport
            </button>
          </template>
        </SuperPopover>
      </div>
    </div>
  </div>
</template>

<style scoped>
.popover-demo,
.popover-demo__group {
  display: flex;
  flex-direction: column;
}

.popover-demo {
  gap: 20px;
}

.popover-demo__group {
  gap: 10px;
}

.popover-demo__label {
  color: var(--wt-text-regular);
  font-size: 14px;
  font-weight: 600;
}

.popover-demo__clip {
  width: 132px;
  height: 42px;
  overflow: hidden;
  border: 1px dashed var(--wt-border-color-strong);
  border-radius: var(--wt-radius-base);
  padding: 6px;
}

:global(.docs-rich-popover) {
  --wt-popover-bg: linear-gradient(135deg, #7c3aed, #2563eb);
  --wt-popover-color: #fff;
  --wt-popover-border-color: #c4b5fd;
}
</style>
