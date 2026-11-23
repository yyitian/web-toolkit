<script setup lang="ts">
import SuperThemeSwitcher from '@/components/SuperThemeSwitcher/index.vue';
</script>

<template>
  <div class="theme-demo">
    <section>
      <h3>浮层形式</h3>
      <SuperThemeSwitcher />
    </section>
    <section>
      <h3>行内形式</h3>
      <SuperThemeSwitcher variant="inline" />
    </section>
  </div>
</template>

<style lang="scss" scoped>
.theme-demo {
  @include flex-column(16px);
}
</style>
