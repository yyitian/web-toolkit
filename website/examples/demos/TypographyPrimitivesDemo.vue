<script setup lang="ts">
import { Info } from '@lucide/vue';
import SuperButton from '@/components/SuperButton/index.vue';
import SuperDialog from '@/components/SuperDialog/index.vue';
import SuperPopover from '@/components/SuperPopover/index.vue';
import SuperIcon from '@/components/SuperIcon/index.vue';
import SuperTags from '@/components/SuperTags/index.vue';
import SuperStatus from '@/components/SuperStatus/index.vue';
import SuperForm from '@/components/SuperForm/index.vue';

defineProps<{
  size: 'small' | 'default' | 'large';
  semanticStyle: Record<string, string>;
}>();
const visible = ref(false);
</script>

<template>
  <section class="typography-primitives">
    <div class="typography-primitives__row">
      <SuperButton :size="size">普通按钮</SuperButton>
      <SuperButton type="primary" :size="size">业务色按钮</SuperButton>
      <SuperButton :size="size" disabled>禁用按钮</SuperButton>
      <SuperButton :icon="Info" :size="size" label="纯图标尺寸保持独立" />
      <SuperIcon :icon="Info" title="图标提示" />
      <SuperButton :size="size" @click="visible = true">独立弹窗</SuperButton>
    </div>
    <div class="typography-primitives__row">
      <SuperForm
        :columns="[
          {
            prop: 'checked',
            label: '有边框勾选',
            formType: 'checkbox',
            props: { border: true },
          },
        ]"
        :size="size"
        inline
      />
      <SuperStatus value="running" /><SuperStatus value="failed" />
      <SuperTags
        :tags="[
          '巡检',
          { label: '业务标签', props: { type: 'success' } },
          0,
          false,
        ]"
        :props="{ size }"
        :popover="{ popperStyle: semanticStyle }"
      />
      <SuperPopover
        :popper-style="{
          ...semanticStyle,
          '--wt-popover-max-width': 'min(360px, calc(100vw - 32px))',
        }"
      >
        <template #reference="{ setReference }"
          ><SuperButton :ref="setReference" :size="size"
            >浮层内表单</SuperButton
          ></template
        >
        <template #content>
          <div class="typography-primitives__popover">
            <p>填写后可关闭浮层继续查看。</p>
            <SuperForm
              :columns="[
                {
                  prop: 'note',
                  label: '备注',
                  formType: 'input',
                  props: { placeholder: '请输入备注' },
                },
              ]"
              :size="size"
            />
          </div>
        </template>
      </SuperPopover>
    </div>
    <SuperDialog
      v-model="visible"
      :style="semanticStyle"
      title="任务详情"
      width="min(600px, calc(100vw - 32px))"
      @confirm="visible = false"
    >
      查看任务说明与当前配置。
      <template #footer
        ><span>普通页脚文字</span
        ><SuperButton :size="size" @click="visible = false"
          >关闭</SuperButton
        ></template
      >
    </SuperDialog>
  </section>
</template>

<style scoped>
.typography-primitives {
  display: grid;
  gap: 12px;
  min-width: 0;
  margin-block: 12px;
}
.typography-primitives__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.typography-primitives__popover {
  display: grid;
  gap: 8px;
}
</style>
