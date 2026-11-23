<script setup lang="ts">
import TagsBasicDemo from './TagsBasicDemo.vue';
import TagsLimitDemo from './TagsLimitDemo.vue';
import TagsAppearanceDemo from './TagsAppearanceDemo.vue';
import TagsEventsDemo from './TagsEventsDemo.vue';
import TagsSlotDemo from './TagsSlotDemo.vue';
import TagsPopoverDemo from './TagsPopoverDemo.vue';
</script>

<template>
  <div class="tags-demo" data-demo="tags">
    <section>
      <h3 class="wt-text-label">基础用法</h3>
      <TagsBasicDemo />
    </section>
    <section>
      <h3 class="wt-text-label">展示数量</h3>
      <TagsLimitDemo />
    </section>
    <section>
      <h3 class="wt-text-label">标签外观</h3>
      <TagsAppearanceDemo />
    </section>
    <section>
      <h3 class="wt-text-label">点击与关闭</h3>
      <TagsEventsDemo />
    </section>
    <section>
      <h3 class="wt-text-label">自定义内容</h3>
      <TagsSlotDemo />
    </section>
    <section>
      <h3 class="wt-text-label">浮层定制</h3>
      <TagsPopoverDemo />
    </section>
  </div>
</template>

<style scoped>
.tags-demo {
  display: grid;
  gap: 24px;
  min-width: 0;
}
.tags-demo section {
  display: grid;
  gap: 12px;
  min-width: 0;
}
.tags-demo h3 {
  margin: 0;
}
</style>
