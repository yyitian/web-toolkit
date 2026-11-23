<script setup lang="ts">
import SuperButton from '@/components/SuperButton/index.vue';
import SuperPopover from '@/components/SuperPopover/index.vue';

const props = defineProps<{ section?: 'triggers' | 'customization' }>();
const manualVisible = ref(false);
</script>

<template>
  <div class="popover-demo">
    <div v-if="props.section !== 'customization'" class="popover-demo__group">
      <span class="popover-demo__label">触发方式</span>
      <div class="demo-row">
        <SuperPopover title="默认 hover 提示">
          <template #reference="{ setReference }">
            <SuperButton :ref="setReference"> 悬停查看 </SuperButton>
          </template>
        </SuperPopover>

        <SuperPopover trigger="click">
          <template #reference="{ setReference }">
            <SuperButton :ref="setReference"> 点击查看 </SuperButton>
          </template>
          <template #content>点击浮层内部不会关闭</template>
        </SuperPopover>

        <SuperPopover
          v-model="manualVisible"
          trigger="manual"
          title="由外部状态控制"
        >
          <template #reference="{ setReference }">
            <SuperButton
              :ref="setReference"
              @click="manualVisible = !manualVisible"
            >
              手动控制
            </SuperButton>
          </template>
        </SuperPopover>
      </div>
    </div>

    <div v-if="props.section !== 'triggers'" class="popover-demo__group">
      <span class="popover-demo__label">Teleport 与样式定制</span>
      <div class="demo-row">
        <div class="popover-demo__clip">
          <SuperPopover
            popper-class="docs-rich-popover"
            :popper-style="{ '--wt-popover-padding': '10px 14px' }"
          >
            <template #reference="{ setReference }">
              <SuperButton :ref="setReference"> 容器外浮层 </SuperButton>
            </template>
            <template #content>浮层不会被容器边界裁切</template>
          </SuperPopover>
        </div>

        <SuperPopover :teleport-to="false" title="浮层与触发器相邻渲染">
          <template #reference="{ setReference }">
            <button :ref="setReference" type="button" class="demo-trigger">
              原生参考元素（不 Teleport）
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
