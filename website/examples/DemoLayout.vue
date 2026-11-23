<template>
  <div class="demo-layout">
    <div v-if="$slots.controls" class="demo-controls" aria-label="演示设置">
      <slot name="controls" />
    </div>
    <div class="demo-preview">
      <slot />
    </div>
    <div v-if="$slots.output" class="demo-result" role="status">
      <slot name="output" />
    </div>
  </div>
</template>

<style scoped>
.demo-layout {
  display: grid;
  gap: 16px;
  min-width: 0;
  color: var(--wt-text-regular);
  background: var(--wt-surface-base);
  border-radius: var(--wt-radius-base);
}
.demo-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--wt-border-color-light);
}
.demo-controls :deep(.el-form) {
  width: 100%;
}
.demo-controls :deep(.el-form-item) {
  margin-bottom: 12px;
}
.demo-controls :deep(.el-button + .el-button) {
  margin-left: 0;
}
.demo-preview {
  min-width: 0;
}
.demo-result {
  min-width: 0;
  padding: 12px;
  border-radius: var(--wt-radius-base);
  background: var(--wt-surface-raised);
  color: var(--wt-text-secondary);
  overflow-wrap: anywhere;
}
.demo-result :deep(pre) {
  margin: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  white-space: pre-wrap;
}
</style>
