<script lang="ts">
import type { Placement } from '@floating-ui/vue';

export interface SuperThemeSwitcherProps {
  variant?: 'popover' | 'inline';
  disabled?: boolean;
  placement?: Placement;
}
</script>

<script setup lang="ts">
import { Palette } from '@lucide/vue';
import SuperButton from '../SuperButton/index.vue';
import SuperFormRadio from '../SuperForm/fields/SuperFormRadio.vue';
import SuperPopover from '../SuperPopover/index.vue';
import { useWtTheme } from '../../theme/index.ts';
import type { WtColorScheme, WtMaterial } from '../../theme/index.ts';

withDefaults(defineProps<SuperThemeSwitcherProps>(), {
  variant: 'popover',
  disabled: false,
  placement: 'bottom-end',
});
const { scheme, material, setTheme } = useWtTheme();

const schemeOptions = [
  { label: '浅色', value: 'light' },
  { label: '暗色', value: 'dark' },
];
const materialOptions = [
  { label: '实体', value: 'solid' },
  { label: '毛玻璃', value: 'glass' },
];

function setScheme(value: unknown) {
  setTheme(value as WtColorScheme, material.value);
}

function setMaterial(value: unknown) {
  setTheme(scheme.value, value as WtMaterial);
}
</script>

<template>
  <div v-if="variant === 'inline'" class="super-theme-switcher">
    <div class="super-theme-switcher__group">
      <span class="super-theme-switcher__label">色系</span>
      <SuperFormRadio
        :model-value="scheme"
        :options="schemeOptions"
        :disabled="disabled"
        @update:model-value="setScheme"
      />
    </div>
    <div class="super-theme-switcher__group">
      <span class="super-theme-switcher__label">材质</span>
      <SuperFormRadio
        :model-value="material"
        :options="materialOptions"
        :disabled="disabled"
        @update:model-value="setMaterial"
      />
    </div>
  </div>

  <SuperPopover
    v-else
    trigger="hover"
    :placement="placement"
    :disabled="disabled"
  >
    <template #reference="{ setReference }">
      <SuperButton
        :ref="setReference"
        :icon="Palette"
        aria-label="切换主题"
        :disabled="disabled"
      />
    </template>
    <template #content>
      <div class="super-theme-switcher super-theme-switcher--popover">
        <div class="super-theme-switcher__group">
          <span class="super-theme-switcher__label">色系</span>
          <SuperFormRadio
            :model-value="scheme"
            :options="schemeOptions"
            :disabled="disabled"
            @update:model-value="setScheme"
          />
        </div>
        <div class="super-theme-switcher__group">
          <span class="super-theme-switcher__label">材质</span>
          <SuperFormRadio
            :model-value="material"
            :options="materialOptions"
            :disabled="disabled"
            @update:model-value="setMaterial"
          />
        </div>
      </div>
    </template>
  </SuperPopover>
</template>

<style lang="scss" scoped>
.super-theme-switcher {
  @include flex-column(10px);
  color: var(--wt-form-label-color, var(--el-text-color-regular));
}

.super-theme-switcher--popover {
  min-width: 176px;
  padding: 4px;
}

.super-theme-switcher__group {
  @include flex-column(4px);
}

.super-theme-switcher__label {
  @include font(12px, $color: var(--wt-text-secondary, inherit));
}
</style>
