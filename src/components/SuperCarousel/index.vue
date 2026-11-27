<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { useWtLocale } from '../useWtLocale.ts';
import CarouselImage from './CarouselImage.vue';
import CarouselCheckbox from './CarouselCheckbox.vue';
import { useCarouselSelection } from './useCarouselSelection.ts';
import CarouselPreview from './CarouselPreview.vue';
import CarouselNavigation from './CarouselNavigation.vue';
import { carouselPreviews } from './config.ts';
import { useCarousel } from './useCarousel.ts';
import { useCarouselPlayback } from './useCarouselPlayback.ts';
import { useCarouselGestures } from './useCarouselGestures.ts';
import type {
  SuperCarouselId,
  SuperCarouselItem,
  SuperCarouselItemContext,
  SuperCarouselNavigationScope,
  SuperCarouselProps,
  SuperCarouselSlots,
  SuperCarouselSelectionChange,
} from './types.ts';

useWtLocale();
const props = withDefaults(defineProps<SuperCarouselProps>(), {
  height: 'auto',
  initialIndex: 0,
  direction: 'horizontal',
  trigger: 'hover',
  autoplay: false,
  interval: 5000,
  pauseOnHover: true,
  loop: true,
  arrow: 'always',
  indicatorPosition: 'outside',
  cardScale: 0.78,
  motionBlur: false,
  disabled: false,
  lazy: true,
  preview: false,
  selectable: false,
  emptyText: '暂无内容',
});
defineSlots<SuperCarouselSlots>();
const emit = defineEmits<{
  'update:activeId': [id: SuperCarouselId | null];
  'update:selectedIds': [ids: SuperCarouselId[]];
  'selection-change': [context: SuperCarouselSelectionChange];
  change: [currentIndex: number, previousIndex: number];
  'item-click': [context: SuperCarouselItemContext, event: MouseEvent];
  'image-load': [context: SuperCarouselItemContext, event: Event];
  'image-error': [context: SuperCarouselItemContext, event: Event];
  'preview-show': [context: SuperCarouselItemContext];
  'preview-switch': [context: SuperCarouselItemContext, previewIndex: number];
  'preview-close': [context: SuperCarouselItemContext];
}>();
const { selectedIds, selected, setSelected, toggleSelected } =
  useCarouselSelection(
    props,
    (ids) => emit('update:selectedIds', ids),
    (context) => emit('selection-change', context),
  );
const root = ref<HTMLElement>();
const stage = ref<HTMLElement>();
const {
  activeIndex,
  visited,
  offset,
  canPrev,
  canNext,
  prev,
  next,
  setActiveItem,
  setActiveId,
} = useCarousel(
  props,
  (id) => emit('update:activeId', id),
  (index, previous) => emit('change', index, previous),
);
const previewSession = shallowRef<{
  owner: SuperCarouselItemContext;
  entries: ReturnType<typeof carouselPreviews>;
  index: number;
}>();
const previewing = computed(() => Boolean(previewSession.value));
const playback = useCarouselPlayback(
  props,
  root,
  previewing,
  next,
  activeIndex,
);
const { hovered, focused, reduced, paused, playing, togglePlay } = playback;
const gestures = useCarouselGestures(props, reduced, prev, next, setActiveItem);
const navigation = computed<SuperCarouselNavigationScope>(() => ({
  activeIndex: activeIndex.value,
  total: props.items.length,
  canPrev: canPrev.value,
  canNext: canNext.value,
  prev,
  next,
  setActiveItem,
  playing: playing.value,
  togglePlay,
}));
let returnFocus: HTMLElement | undefined;
function openPreview(item: SuperCarouselItem, index: number) {
  if (!props.preview || props.disabled || previewing.value) return;
  const entries = carouselPreviews(props.items);
  const initial = entries.findIndex((entry) => entry.item.id === item.id);
  if (initial < 0) return;
  returnFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : undefined;
  previewSession.value = { owner: { item, index }, entries, index: initial };
}
function closePreview() {
  if (!previewSession.value) return;
  const owner = previewSession.value.owner;
  previewSession.value = undefined;
  emit('preview-close', owner);
  void nextTick(() => {
    const target =
      returnFocus?.isConnected &&
      !returnFocus.closest('[inert]') &&
      !returnFocus.matches?.(':disabled')
        ? returnFocus
        : root.value;
    target?.focus({
      preventScroll: true,
    });
    returnFocus = undefined;
  });
}
watch(
  () => [props.preview, props.items.map((item) => item.id)] as const,
  () => {
    if (
      previewSession.value &&
      (!props.preview ||
        !props.items.some(
          (item) => item.id === previewSession.value?.owner.item.id,
        ))
    )
      closePreview();
  },
);
function itemClick(item: SuperCarouselItem, index: number, event: MouseEvent) {
  if (props.disabled) return;
  emit('item-click', { item, index }, event);
  const target = event.target;
  const interactive =
    target instanceof Element &&
    target.closest(
      'button, a, label, input, textarea, select, .el-switch, [role="button"]:not(.super-carousel__content), [role="checkbox"], [contenteditable]:not([contenteditable="false"]), [data-carousel-no-select]',
    );
  if (interactive) return;
  if (props.selectable && !props.preview) toggleSelected(item, index);
  // 自定义内容的预览交给插槽调用，避免拦截业务按钮。
  if (!slots.default) openPreview(item, index);
}
function previewKeydown(
  item: SuperCarouselItem,
  index: number,
  event: KeyboardEvent,
) {
  if (
    !props.preview ||
    props.disabled ||
    slots.default ||
    event.target !== event.currentTarget ||
    (event.key !== 'Enter' && event.key !== ' ')
  )
    return;
  event.preventDefault();
  event.stopPropagation();
  openPreview(item, index);
}
const slots = useSlots();
const stageHeight = ref(320);
const activeCardSize = ref({ width: 440, height: 275 });
let observer: ResizeObserver | undefined;
let movingTimer: ReturnType<typeof setTimeout> | undefined;
const moving = ref(false);
function measure() {
  const card = stage.value?.querySelector<HTMLElement>(
    '.super-carousel__card.is-active',
  );
  if (card) {
    activeCardSize.value = {
      width: card.offsetWidth,
      height: card.offsetHeight,
    };
    stageHeight.value =
      card.offsetHeight * (props.direction === 'vertical' ? 2.1 : 1) + 40;
  }
}
onMounted(() => {
  observer = new ResizeObserver(measure);
  if (stage.value) observer.observe(stage.value);
  stage.value
    ?.querySelectorAll('.super-carousel__card')
    .forEach((card) => observer?.observe(card));
  measure();
});
watch(
  [activeIndex, () => props.direction, () => props.items],
  () => {
    observer?.disconnect();
    if (stage.value) observer?.observe(stage.value);
    stage.value
      ?.querySelectorAll('.super-carousel__card')
      .forEach((card) => observer?.observe(card));
    measure();
    clearTimeout(movingTimer);
    moving.value = !reduced.value;
    const raw = root.value
      ? getComputedStyle(root.value)
          .getPropertyValue('--wt-carousel-duration')
          .trim()
      : '';
    const duration =
      parseFloat(raw || '350') * (raw.endsWith('ms') || !raw ? 1 : 1000);
    movingTimer = setTimeout(
      () => {
        moving.value = false;
      },
      Number.isFinite(duration) ? duration : 350,
    );
  },
  { flush: 'post' },
);
onBeforeUnmount(() => {
  observer?.disconnect();
  clearTimeout(movingTimer);
});
function cardStyle(index: number): CSSProperties {
  const distance = offset(index);
  return {
    '--_carousel-distance': distance,
    '--_carousel-scale':
      distance === 0
        ? 1
        : Number.isFinite(props.cardScale)
          ? Math.max(0.1, Math.min(1, props.cardScale))
          : 0.78,
    zIndex: distance === 0 ? 3 : Math.abs(distance) <= 1 ? 2 : 0,
    visibility: Math.abs(distance) <= 1 ? 'visible' : 'hidden',
    opacity: Math.abs(distance) <= 1 ? 1 : 0,
  };
}
function focusout(event: FocusEvent) {
  focused.value =
    event.relatedTarget instanceof Node &&
    Boolean(root.value?.contains(event.relatedTarget));
}
defineExpose({
  get activeIndex() {
    return activeIndex.value;
  },
  prev,
  next,
  setActiveItem,
  setActiveId,
});
</script>

<template>
  <section
    ref="root"
    class="super-carousel"
    :class="[
      `super-carousel--${direction}`,
      {
        'is-moving': moving,
        'has-motion-blur': motionBlur,
        'is-hover-arrows': arrow === 'hover',
        'has-fixed-height': height !== 'auto',
        'is-disabled': disabled,
        'is-reduced': reduced,
      },
    ]"
    tabindex="0"
    role="region"
    aria-roledescription="轮播"
    aria-label="内容轮播"
    :aria-disabled="disabled || undefined"
    @keydown="gestures.keydown"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = true"
    @focusout="focusout"
  >
    <div
      v-if="!items.length"
      class="super-carousel__empty"
      :style="{ height: height === 'auto' ? '240px' : height }"
    >
      <slot name="empty">{{ emptyText }}</slot>
    </div>
    <template v-else>
      <div
        ref="stage"
        class="super-carousel__stage"
        :style="{
          height: height === 'auto' ? `${stageHeight}px` : height,
          '--_carousel-active-width': `${activeCardSize.width}px`,
          '--_carousel-active-height': `${activeCardSize.height}px`,
        }"
        @pointerdown="gestures.pointerdown"
        @pointerup="gestures.pointerup"
        @pointercancel="gestures.cancel"
        @click.capture="gestures.click"
        @dragstart.prevent
      >
        <article
          v-for="(item, index) in items"
          :key="item.id"
          class="super-carousel__card"
          :class="{
            'is-active': index === activeIndex,
            'is-selected': selectable && selected.has(item.id),
          }"
          :style="cardStyle(index)"
          role="group"
          aria-roledescription="幻灯片"
          :aria-label="`${index + 1} / ${items.length}`"
          :aria-hidden="Math.abs(offset(index)) > 1 || undefined"
        >
          <div
            class="super-carousel__content"
            :inert="index !== activeIndex || disabled"
            :role="preview && !$slots.default ? 'button' : undefined"
            :tabindex="
              preview && !$slots.default && index === activeIndex && !disabled
                ? 0
                : undefined
            "
            :aria-label="
              preview && !$slots.default ? '预览当前图片' : undefined
            "
            :aria-hidden="index !== activeIndex || undefined"
            @keydown="previewKeydown(item, index, $event)"
            @click="itemClick(item, index, $event)"
          >
            <slot
              v-if="!lazy || visited.has(item.id)"
              :item="item"
              :index="index"
              :active="index === activeIndex"
              :selected="selected.has(item.id)"
              :toggle-selected="() => toggleSelected(item, index)"
              :preview="() => openPreview(item, index)"
            >
              <CarouselImage
                :item="item"
                :image-props="imageProps"
                @load="emit('image-load', { item, index }, $event)"
                @error="emit('image-error', { item, index }, $event)"
              >
                <template v-if="$slots.placeholder" #placeholder
                  ><slot name="placeholder" :item="item" :index="index"
                /></template>
                <template v-if="$slots.error" #error
                  ><slot name="error" :item="item" :index="index"
                /></template>
              </CarouselImage>
            </slot>
          </div>
          <button
            v-if="index !== activeIndex && Math.abs(offset(index)) <= 1"
            type="button"
            class="super-carousel__side-target"
            tabindex="-1"
            :disabled="disabled"
            :aria-label="`切换到${item.label ?? `第 ${index + 1} 项`}`"
            @click="setActiveItem(index)"
          />
          <div
            v-if="selectable && index === activeIndex"
            class="super-carousel__selection-corner"
            @pointerdown.stop
            @click.stop
            @keydown.space.stop
          >
            <CarouselCheckbox
              :checked="selected.has(item.id)"
              :disabled="disabled"
              label="勾选当前项"
              @change="setSelected(item, index, $event)"
            />
          </div>
        </article>
        <div
          class="super-carousel__controls"
          data-carousel-no-swipe
          @pointerdown.stop
          @click.stop
        >
          <slot name="navigation" v-bind="navigation">
            <CarouselNavigation
              :scope="navigation"
              :config="props"
              :paused="paused"
            />
          </slot>
        </div>
      </div>
    </template>
    <CarouselPreview
      v-if="previewSession"
      :urls="previewSession.entries.map((entry) => entry.src)"
      :index="previewSession.index"
      :entries="previewSession.entries"
      :items="items"
      :selectable="selectable"
      :selected-ids="selectedIds"
      :disabled="disabled"
      :image-props="imageProps"
      @select="
        (context, checked) => setSelected(context.item, context.index, checked)
      "
      @show="emit('preview-show', previewSession.owner)"
      @close="closePreview"
      @switch="
        (index) => {
          const entry = previewSession?.entries[index];
          if (entry)
            emit(
              'preview-switch',
              { item: entry.item, index: entry.index },
              index,
            );
        }
      "
    >
      <template v-if="$slots.toolbar" #toolbar="scope"
        ><slot name="toolbar" v-bind="scope"
      /></template>
    </CarouselPreview>
  </section>
</template>
<style lang="scss">
@use './carousel';
</style>
