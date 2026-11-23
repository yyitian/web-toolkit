<script setup lang="ts">
import StatusBasicDemo from './StatusBasicDemo.vue';
import StatusPresetsDemo from './StatusPresetsDemo.vue';
import StatusOptionsDemo from './StatusOptionsDemo.vue';
import StatusOverrideDemo from './StatusOverrideDemo.vue';
import StatusThemeDemo from './StatusThemeDemo.vue';
</script>

<template>
  <div class="status-demo">
    <section>
      <h3 class="wt-text-label">基础用法</h3>
      <StatusBasicDemo />
    </section>
    <section>
      <h3 class="wt-text-label">内置状态</h3>
      <StatusPresetsDemo />
    </section>
    <section>
      <h3 class="wt-text-label">自定义状态</h3>
      <StatusOptionsDemo />
    </section>
    <section>
      <h3 class="wt-text-label">覆盖文案与颜色</h3>
      <StatusOverrideDemo />
    </section>
    <section>
      <h3 class="wt-text-label">主题变量</h3>
      <StatusThemeDemo />
    </section>
  </div>
</template>

<style scoped>
.status-demo {
  display: grid;
  gap: 24px;
  min-width: 0;
}
.status-demo section {
  display: grid;
  gap: 12px;
  min-width: 0;
}
.status-demo h3 {
  margin: 0;
}
</style>
