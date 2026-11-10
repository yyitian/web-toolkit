<script setup lang="ts">
import { cloneDeep } from 'es-toolkit';
import SuperForm from '../SuperForm/index.vue';
import SuperButton from '../SuperButton/index.vue';
import type { SuperFormColumn, SuperFormInstance } from '../SuperForm/types.ts';

const props = defineProps<{ columns: SuperFormColumn[] }>();
const slots = useSlots();
const emit = defineEmits<{
  initialize: [data: Record<string, unknown>];
  search: [data: Record<string, unknown>];
}>();
const form = ref<SuperFormInstance>();
let defaults: Record<string, unknown> = {};

onMounted(() => {
  defaults = cloneDeep(form.value?.getFormData() ?? {});
  emit('initialize', defaults);
});

function reset() {
  // 包含当前隐藏字段，避免上一次检索的条件在重新显示后复现。
  form.value?.setFormData(
    Object.fromEntries(
      props.columns.map(({ prop }) => [prop, defaults[prop] ?? null]),
    ),
  );
  emit('search', form.value?.getFormData() ?? {});
}
</script>

<template>
  <section class="super-table__search">
    <SuperForm
      ref="form"
      class="super-table__search-form"
      label-position="left"
      :columns="columns"
      @submit="emit('search', $event)"
    >
      <template
        v-for="name in Object.keys(slots).filter((key) => key !== 'extra')"
        #[name]="scope"
      >
        <slot :name="name" v-bind="scope ?? {}" />
      </template>
    </SuperForm>
    <div class="super-table__search-actions">
      <SuperButton type="primary" @click="form?.submit()">搜索</SuperButton>
      <SuperButton @click="reset">重置</SuperButton>
    </div>
    <div v-if="slots.extra" class="super-table__search-extra">
      <slot name="extra" />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.super-table__search {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--wt-table-gap, 12px);
}
.super-table__search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--wt-table-gap, 12px);
  min-width: 0;
  :deep(.el-form-item) {
    width: 200px;
    max-width: 100%;
    margin: 0;
    &:has(.el-date-editor--datetimerange, .el-date-editor--daterange) {
      width: 360px;
    }
  }
}
.super-table__search-actions {
  display: flex;
  gap: 8px;
  .super-button + .super-button {
    margin-left: 0;
  }
}
.super-table__search-extra {
  margin-left: auto;
}
</style>
