<script setup lang="ts" generic="Row extends object">
import { get } from 'es-toolkit/compat';
import { ElCheckbox, ElSwitch } from 'element-plus';
import SuperIcon from '../SuperIcon/index.vue';
import SuperTags from '../SuperTags/index.vue';
import SuperStatus from '../SuperStatus/index.vue';
import { formatLabel } from '../SuperForm/config.ts';
import { formatDate } from '../../utils/date.ts';
import { DATE_FORMATS } from '../../constants/date.ts';
import {
  cardText,
  getCardValue,
  getCardOption,
  getSwitchValues,
  hasCardContent,
} from './card-config.ts';
import CardImage from './CardImage.vue';
import CardActions from './CardActions.vue';
import CardFooter from './CardFooter.vue';
import SlotRegion from './SlotRegion.vue';
import type {
  SuperTableCardConfig,
  SuperTableCardContext,
  SuperTableCardSwitchChange,
} from './card-types.ts';

const props = defineProps<{
  context: SuperTableCardContext<Row>;
  card: SuperTableCardConfig<Row>;
  selection: boolean;
  blocked?: boolean;
}>();
const emit = defineEmits<{
  select: [selected: boolean];
  'switch-change': [change: SuperTableCardSwitchChange<Row>];
}>();
const slots = useSlots();
const fields = computed(() => props.card.fields ?? {});
const statusConfig = computed(() => props.card.status || undefined);
const actionConfig = computed(() => props.card.actions || undefined);
const values = computed(() => {
  const { row, index } = props.context;
  const fields = props.card.fields ?? {};
  return {
    title: getCardValue(row, index, fields.title ?? 'title'),
    image: getCardValue(row, index, fields.image ?? 'image'),
    description: getCardValue(row, index, fields.description ?? 'description'),
    createdAt: getCardValue(row, index, fields.createdAt ?? 'createdAt'),
    icon: getCardValue(row, index, fields.icon ?? 'icon'),
    tags: getCardValue(row, index, fields.tags ?? 'tags'),
    status: getCardValue(row, index, statusConfig.value?.value),
  };
});
const title = computed(() => cardText(values.value.title));
const createdAt = computed(
  () =>
    formatDate(
      values.value.createdAt,
      props.card.dateFormat ?? DATE_FORMATS.dateTime,
    ) || '—',
);
const switchState = computed(() => {
  const config = props.card.switch;
  if (!config) return undefined;
  const { row, index } = props.context;
  const { active, inactive } = getSwitchValues(config);
  return {
    active,
    inactive,
    value: get(row, config.prop) === active,
    disabled:
      active === inactive ||
      getCardOption(row, index, config.disabled) === true,
    loading: getCardOption(row, index, config.loading) === true,
    label:
      config.label === undefined
        ? `激活：${title.value}`
        : formatLabel(config.label),
  };
});
function changeSwitch(value: string | number | boolean) {
  const config = props.card.switch;
  const state = switchState.value;
  if (!config || !state || props.blocked || state.disabled || state.loading)
    return;
  emit('switch-change', {
    row: props.context.row,
    index: props.context.index,
    prop: config.prop,
    value: value === true ? state.active : state.inactive,
    previousValue: get(props.context.row, config.prop),
  });
}
const imageActions = computed(
  () => actionConfig.value?.placement === 'image-bottom-right',
);
const always = computed(() => actionConfig.value?.display === 'always');
</script>

<template>
  <article
    class="super-table-card"
    :class="{ 'is-selected': context.selected, 'is-blocked': blocked }"
  >
    <ElCheckbox
      v-if="selection"
      class="super-table-card__selection"
      :model-value="context.selected"
      :disabled="!context.selectable"
      :aria-label="`选择：${title}`"
      @change="emit('select', $event === true)"
      @click.stop
    />
    <CardImage :src="values.image" :fit="card.imageFit" :alt="title">
      <template v-if="slots['card-image']" #default
        ><slot name="card-image" v-bind="context" :value="values.image"
      /></template>
      <template v-if="slots['card-image-fallback']" #fallback="scope"
        ><slot name="card-image-fallback" v-bind="context" :src="scope.src"
      /></template>
      <template #controls>
        <SlotRegion
          v-if="card.status !== false && (statusConfig || slots['card-status'])"
          class="super-table-card__status"
          :scope="{ ...context, value: values.status }"
        >
          <template #default="scope"
            ><slot name="card-status" v-bind="scope"
              ><SuperStatus
                :value="values.status"
                :options="statusConfig?.options" /></slot
          ></template>
        </SlotRegion>
        <ElSwitch
          v-if="switchState"
          class="super-table-card__switch"
          size="small"
          :model-value="switchState.value"
          :disabled="switchState.disabled"
          :loading="switchState.loading"
          :aria-label="switchState.label"
          @change="changeSwitch"
          @click.stop
        />
      </template>
      <template
        v-if="card.actions !== false && imageActions && slots['card-actions']"
        #actions
        ><CardActions image :always="always"
          ><slot
            name="card-actions"
            v-bind="context"
            :overflow="false"
            :close="() => {}" /></CardActions
      ></template>
    </CardImage>
    <div class="super-table-card__data">
      <div class="super-table-card__heading">
        <SlotRegion
          v-if="fields.icon !== false && (values.icon || slots['card-icon'])"
          class="super-table-card__icon"
          :scope="{ ...context, value: values.icon }"
          ><template #default="scope"
            ><slot name="card-icon" v-bind="scope"
              ><SuperIcon
                v-if="values.icon"
                :icon="values.icon"
                :size="20" /></slot></template
        ></SlotRegion>
        <div class="super-table-card__title" :title="title" tabindex="0">
          <slot name="card-title" v-bind="context" :value="values.title">{{
            title
          }}</slot>
        </div>
        <SlotRegion
          v-if="
            fields.tags !== false && (values.tags?.length || slots['card-tags'])
          "
          class="super-table-card__tags"
          :scope="{ ...context, value: values.tags }"
          ><template #default="scope"
            ><slot name="card-tags" v-bind="scope"
              ><SuperTags
                :key="blocked ? 'blocked' : 'ready'"
                :tags="values.tags ?? []"
                :limit="card.tagsMaxVisible ?? 1"
                :props="{ size: 'small' }" /></slot></template
        ></SlotRegion>
      </div>
      <SlotRegion
        v-if="
          fields.description !== false &&
          (hasCardContent(values.description) || slots['card-description'])
        "
        class="super-table-card__description"
        :title="cardText(values.description)"
        :scope="{ ...context, value: values.description }"
        ><template #default="scope"
          ><slot name="card-description" v-bind="scope">{{
            cardText(values.description)
          }}</slot></template
        ></SlotRegion
      >
      <SlotRegion
        v-if="slots['card-extra']"
        class="super-table-card__extra"
        :scope="{ ...context }"
        ><template #default="scope"
          ><slot name="card-extra" v-bind="scope" /></template
      ></SlotRegion>
      <CardFooter :always="always" :blocked="blocked">
        <template
          v-if="
            fields.createdAt !== false &&
            (hasCardContent(values.createdAt) || slots['card-created-at'])
          "
          #default
          ><slot
            name="card-created-at"
            v-bind="context"
            :value="values.createdAt"
            :formatted="createdAt"
            ><span :title="createdAt" tabindex="0">{{ createdAt }}</span></slot
          ></template
        >
        <template
          v-if="
            card.actions !== false && !imageActions && slots['card-actions']
          "
          #actions="scope"
          ><slot name="card-actions" v-bind="{ ...context, ...scope }"
        /></template>
      </CardFooter>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '../../styles/typography' as typography;
.super-table-card {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid
    var(--wt-table-card-border-color, var(--wt-border-color-light));
  border-radius: var(--wt-table-card-radius, var(--wt-radius-large));
  background: var(--wt-table-card-bg, var(--wt-surface-base));
  box-shadow: var(--wt-table-card-shadow, var(--wt-shadow-base));
  backdrop-filter: var(--wt-backdrop-filter, none);
  transition:
    transform 180ms ease-out,
    box-shadow 120ms ease,
    border-color 120ms ease;
  &:not(.is-blocked):hover,
  &:not(.is-blocked):focus-within {
    transform: translateY(-2px);
    box-shadow: var(--wt-table-card-hover-shadow, var(--wt-shadow-raised));
  }
  &.is-selected {
    border-color: var(--wt-table-card-selected-color, var(--wt-color-primary));
  }
}
.super-table-card__selection.el-checkbox {
  position: absolute;
  z-index: 2;
  right: 0;
  top: 0;
  transform: translate(50%, -50%);
  margin: 0;
  height: 16px;
}
.super-table-card__switch {
  flex: none;
  margin-left: auto;
}
.super-table-card__status {
  min-width: 0;
  max-width: calc(100% - 48px);
  padding: 2px 6px;
  border-radius: var(--wt-radius-base);
  background: var(--wt-table-card-overlay-bg, var(--wt-surface-overlay));
  backdrop-filter: var(--wt-backdrop-filter, none);
}
.super-table-card__status :deep(.super-status) {
  display: flex;
}
.super-table-card__data {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: var(--wt-table-card-content-gap, 8px);
  padding: var(--wt-table-card-padding, 12px);
  border-radius: 0 0 var(--wt-table-card-radius, var(--wt-radius-large))
    var(--wt-table-card-radius, var(--wt-radius-large));
  overflow: hidden;
}
.super-table-card__heading {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.super-table-card__icon {
  display: flex;
  align-items: center;
  flex: none;
}
.super-table-card__title {
  @include typography.text(title);
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.super-table-card__tags {
  max-width: 45%;
  min-width: 0;
}
.super-table-card__tags :deep(.super-tags) {
  display: flex;
  flex-wrap: nowrap;
  min-width: 0;
}
.super-table-card__tags :deep(.super-tags__visible) {
  flex-wrap: nowrap;
  overflow-x: auto;
  min-width: 0;
  scrollbar-width: thin;
}
.super-table-card__tags :deep(.el-tag) {
  flex: none;
}
.super-table-card__description {
  @include typography.text(caption);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}
.super-table-card__extra {
  @include typography.text(caption);
  min-width: 0;
  overflow-wrap: anywhere;
}
.super-table-card :focus-visible {
  outline: 2px solid var(--wt-color-primary);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .super-table-card {
    transition: none;
    transform: none !important;
  }
}
</style>

<style lang="scss">
@use '../SuperForm/control-theme' as controls;
.super-table-card__selection {
  @include controls.checkbox;
}
.super-table-card__switch {
  @include controls.switch;
}
</style>
