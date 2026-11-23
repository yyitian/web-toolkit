<script setup lang="ts">
import { ElTag } from 'element-plus';
import SuperPopover from '../SuperPopover/index.vue';
import TagItem from './TagItem.vue';
import { getCountProps, getTagEntries, normalizeLimit } from './config.ts';
import { useTagsPopover } from './useTagsPopover.ts';
import type {
  SuperTagContext,
  SuperTagEvent,
  SuperTagsProps,
} from './types.ts';

const props = withDefaults(defineProps<SuperTagsProps>(), {
  tags: () => [],
  limit: 2,
  props: () => ({}),
  popover: () => ({}),
});
const slots = defineSlots<{ tag?: (context: SuperTagContext) => unknown }>();
const emit = defineEmits<{
  'tag-click': [value: SuperTagEvent];
  'tag-close': [value: SuperTagEvent];
}>();
const entries = computed(() => getTagEntries(props.tags, props.props));
const limit = computed(() => normalizeLimit(props.limit));
const shown = computed(() => entries.value.slice(0, limit.value));
const hidden = computed(() => entries.value.slice(limit.value));
const countProps = computed(() => getCountProps(props.props));
const interaction = useTagsPopover(computed(() => hidden.value.length > 0));
const { visible } = interaction;
const contentId = `wt-tags-${useId()}`;

function bindReference(
  element: unknown,
  setReference: (value: unknown) => void,
) {
  interaction.reference.value =
    typeof HTMLElement !== 'undefined' && element instanceof HTMLElement
      ? element
      : undefined;
  setReference(element);
}
function bindContent(element: unknown) {
  interaction.content.value =
    typeof HTMLElement !== 'undefined' && element instanceof HTMLElement
      ? element
      : undefined;
}
function pointerEnter(event: PointerEvent, area: 'reference' | 'content') {
  if (event.pointerType !== 'touch') interaction.enter(area);
}
function pointerLeave(event: PointerEvent, area: 'reference' | 'content') {
  if (event.pointerType !== 'touch') interaction.leave(area);
}
</script>

<template>
  <div class="super-tags">
    <span v-if="shown.length" class="super-tags__visible">
      <TagItem
        v-for="entry in shown"
        :key="entry.key"
        :entry="entry"
        :overflow="false"
        @click="emit('tag-click', $event)"
        @close="emit('tag-close', $event)"
      >
        <template v-if="slots.tag" #default="scope"
          ><slot name="tag" v-bind="scope"
        /></template>
      </TagItem>
    </span>
    <SuperPopover
      v-if="hidden.length"
      v-model="visible"
      trigger="manual"
      :placement="popover.placement ?? 'top'"
      :teleport-to="popover.teleportTo ?? 'body'"
      :popper-class="['super-tags-popper', popover.popperClass]"
      :popper-style="popover.popperStyle"
    >
      <template #reference="{ setReference }">
        <button
          :ref="(element) => bindReference(element, setReference)"
          class="super-tags__more"
          type="button"
          :aria-label="`查看其余 ${hidden.length} 个标签`"
          :aria-expanded="visible"
          :aria-controls="contentId"
          @pointerenter="pointerEnter($event, 'reference')"
          @pointerleave="pointerLeave($event, 'reference')"
          @focusin="interaction.open"
          @focusout="interaction.focusOut"
          @click.stop="interaction.open"
          @keydown.down.prevent="interaction.focusContent"
        >
          <ElTag v-bind="countProps" aria-hidden="true"
            >+{{ hidden.length }}</ElTag
          >
        </button>
      </template>
      <template #content>
        <div
          :id="contentId"
          :ref="bindContent"
          class="super-tags__overflow"
          role="group"
          aria-label="其余标签"
          tabindex="-1"
          @pointerenter="pointerEnter($event, 'content')"
          @pointerleave="pointerLeave($event, 'content')"
          @focusin="interaction.open"
          @focusout="interaction.focusOut"
        >
          <TagItem
            v-for="entry in hidden"
            :key="entry.key"
            :entry="entry"
            :overflow="true"
            @click="emit('tag-click', $event)"
            @close="emit('tag-close', $event)"
          >
            <template v-if="slots.tag" #default="scope"
              ><slot name="tag" v-bind="scope"
            /></template>
          </TagItem>
        </div>
      </template>
    </SuperPopover>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/typography' as typography;
.super-tags,
.super-tags__visible,
.super-tags__overflow {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--wt-tags-gap, 4px);
  min-width: 0;
}
.super-tags {
  @include typography.context;
  max-width: 100%;
  vertical-align: middle;
}
.super-tags__visible :deep(.el-tag),
.super-tags__overflow :deep(.el-tag) {
  --el-tag-font-size: var(--wt-font-size-caption, 12px);
  font-weight: var(--wt-font-weight-regular, 400);
}
.super-tags__more {
  display: inline-flex;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: var(--wt-radius-base, 4px);
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  &:focus-visible {
    outline: 2px solid var(--wt-color-primary, #409eff);
    outline-offset: 2px;
  }
}
.super-tags__overflow {
  display: flex;
  max-height: var(
    --wt-tags-popover-max-height,
    min(240px, calc(100dvh - 48px))
  );
  box-sizing: border-box;
  overflow: auto;
  // 将留白放在交互区域内，鼠标停在浮层留白处也保持打开。
  padding: 8px;
  &:focus-visible {
    outline: 1px solid var(--wt-color-primary, #409eff);
    outline-offset: 1px;
  }
  :deep(.el-tag) {
    max-width: 100%;
    height: auto;
    min-height: 24px;
    line-height: var(--wt-line-height-caption, 20px);
    white-space: normal;
    &.el-tag--small {
      min-height: 20px;
    }
    &.el-tag--large {
      min-height: 32px;
    }
  }
  :deep(.el-tag__content) {
    overflow-wrap: anywhere;
  }
}
</style>

<style lang="scss">
.super-tags-popper {
  --wt-popover-max-width: min(400px, calc(100vw - 24px));
  --wt-popover-padding: 0;
  box-sizing: border-box;
}
</style>
