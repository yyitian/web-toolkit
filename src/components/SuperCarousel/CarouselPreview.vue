<script setup lang="ts">
import { ElImage } from 'element-plus';
import type { ImageInstance } from 'element-plus';
import CarouselPreviewToolbar from './CarouselPreviewToolbar.vue';
import type {
  SuperCarouselId,
  SuperCarouselImageProps,
  SuperCarouselItem,
  SuperCarouselItemContext,
} from './types.ts';
const props = defineProps<{
  urls: string[];
  index: number;
  entries: readonly SuperCarouselItemContext[];
  items: readonly SuperCarouselItem[];
  imageProps?: SuperCarouselImageProps;
  selectable?: boolean;
  selectedIds: readonly SuperCarouselId[];
  disabled?: boolean;
}>();
const emit = defineEmits<{
  show: [];
  close: [];
  switch: [index: number];
  select: [context: SuperCarouselItemContext, checked: boolean];
}>();
const image = ref<ImageInstance>();
const activeIndex = ref(props.index);
const entry = computed(() => props.entries[activeIndex.value]);
const current = computed(() => {
  const index = props.items.findIndex(
    (item) => item.id === entry.value?.item.id,
  );
  return index < 0 ? undefined : { item: props.items[index], index };
});
function switchImage(index: number) {
  activeIndex.value = index;
  emit('switch', index);
}
onMounted(() => image.value?.showPreview());
</script>
<template>
  <ElImage
    ref="image"
    class="super-carousel__preview-host"
    preview-teleported
    v-bind="imageProps"
    :src="urls[index]"
    :preview-src-list="urls"
    :initial-index="index"
    @show="emit('show')"
    @close="emit('close')"
    @switch="switchImage"
  >
    <template v-if="selectable || $slots.toolbar" #toolbar="scope">
      <CarouselPreviewToolbar
        :scope="scope"
        :selectable="selectable && Boolean(entry)"
        :checked="entry && selectedIds.includes(entry.item.id)"
        :disabled="disabled || !current"
        @select="
          (checked) => {
            if (current) emit('select', current, checked);
          }
        "
      >
        <template v-if="$slots.toolbar" #default="toolbarScope">
          <slot name="toolbar" v-bind="toolbarScope" />
        </template>
      </CarouselPreviewToolbar>
    </template>
  </ElImage>
</template>
