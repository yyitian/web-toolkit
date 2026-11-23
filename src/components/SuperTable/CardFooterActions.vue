<script setup lang="ts">
import { Ellipsis } from '@lucide/vue';
import type { ComponentPublicInstance } from 'vue';
import SuperButton from '../SuperButton/index.vue';
import SuperPopover from '../SuperPopover/index.vue';
import type { CardActionSize } from './useCardFooterLayout.ts';

const props = defineProps<{
  collapsed: boolean;
  always?: boolean;
  blocked?: boolean;
}>();
const emit = defineEmits<{ size: [size: CardActionSize] }>();
const group = ref<HTMLElement>();
const target = ref<HTMLElement>();
const more = ref<HTMLElement>();
const open = ref(false);
const focusHeld = ref(false);
const restoringFocus = ref(false);
const menuActive = computed(() => open.value && Boolean(target.value));
const menuId = `wt-card-actions-${useId()}`;
let observer: ResizeObserver | undefined;
let observed: HTMLElement | undefined;
let lastSize: CardActionSize = { width: 0, height: 32 };
let mounted = true;
let focusVersion = 0;

function measure() {
  if (observed !== group.value) {
    observer?.disconnect();
    observed = group.value;
    if (observed) observer?.observe(observed);
  }
  // 浮层中的文字按钮与展开图标组宽度不同，保留进入菜单前的宽度。
  if (menuActive.value || !group.value) return;
  const rect = group.value.getBoundingClientRect();
  if (rect.width !== lastSize.width || rect.height !== lastSize.height) {
    lastSize = { width: rect.width, height: rect.height };
    emit('size', lastSize);
  }
}
function items() {
  return Array.from(
    group.value?.querySelectorAll<HTMLElement>(
      'button, a[href], [role="menuitem"], [tabindex="0"]',
    ) ?? [],
  ).filter(
    (element) =>
      !element.matches(
        ':disabled, [disabled], [aria-disabled="true"], [hidden]',
      ) &&
      !element.closest('[inert], [hidden], [aria-hidden="true"]') &&
      (typeof element.getClientRects !== 'function' ||
        element.getClientRects().length > 0),
  );
}
function focusAfterPatch(resolve: () => HTMLElement | undefined) {
  const version = ++focusVersion;
  restoringFocus.value = true;
  void nextTick(() => {
    if (version !== focusVersion) return;
    if (mounted && !props.blocked) resolve()?.focus();
    restoringFocus.value = false;
  });
}
function close(restore = true) {
  if (!open.value) return;
  open.value = false;
  focusHeld.value = false;
  if (restore && !props.blocked) focusAfterPatch(() => more.value);
}
async function show(last = false) {
  if (props.blocked || !props.collapsed) return;
  focusVersion++;
  restoringFocus.value = false;
  focusHeld.value = true;
  open.value = true;
  await nextTick();
  await nextTick();
  if (!mounted || !open.value) return;
  const entries = items();
  (last ? entries.at(-1) : entries[0])?.focus();
  if (!entries.length) target.value?.focus();
}
function reference(element: unknown, setReference: (element: unknown) => void) {
  const node = (element as ComponentPublicInstance | null)?.$el;
  more.value = node instanceof HTMLElement ? node : undefined;
  setReference(element);
}
function referenceKey(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    void show(event.key === 'ArrowUp');
  } else if (event.key === 'Escape' && open.value) {
    event.preventDefault();
    event.stopPropagation();
    close();
  }
}
function menuKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    close();
    return;
  }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const entries = items();
  const index = entries.indexOf(document.activeElement as HTMLElement);
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? entries.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + entries.length) %
          entries.length;
  entries[next]?.focus();
}
function menuClick(event: MouseEvent) {
  if (props.blocked || !(event.target instanceof Node)) return;
  const target =
    event.target instanceof HTMLElement
      ? event.target
      : event.target.parentElement;
  const button = target?.closest<HTMLElement>(
    'button, a[href], [role="menuitem"]',
  );
  if (
    button &&
    !button.matches(':disabled, [disabled], [aria-disabled="true"]') &&
    !button.hasAttribute('aria-haspopup')
  )
    close();
}
function outside(event: Event) {
  if (!open.value || !(event.target instanceof Node)) return;
  if (
    !target.value?.contains(event.target) &&
    !more.value?.contains(event.target)
  )
    close(false);
}
watch(
  () => props.blocked,
  (blocked) => {
    if (blocked) {
      focusVersion++;
      restoringFocus.value = false;
      close(false);
    }
  },
  { flush: 'sync' },
);
watch(
  () => props.collapsed,
  (collapsed) => {
    if (collapsed) return;
    const focused =
      typeof document !== 'undefined' &&
      (group.value?.contains(document.activeElement) ||
        more.value?.contains(document.activeElement));
    const index = focused
      ? items().indexOf(document.activeElement as HTMLElement)
      : -1;
    close(false);
    if (focused) focusAfterPatch(() => items()[Math.max(0, index)]);
  },
);
onMounted(() => {
  if (typeof ResizeObserver !== 'undefined')
    observer = new ResizeObserver(measure);
  measure();
  document.addEventListener('pointerdown', outside, true);
  document.addEventListener('focusin', outside);
});
onUpdated(measure);
onBeforeUnmount(() => {
  mounted = false;
  focusVersion++;
  observer?.disconnect();
  emit('size', { width: 0, height: 32 });
  document.removeEventListener('pointerdown', outside, true);
  document.removeEventListener('focusin', outside);
});
</script>

<template>
  <div
    class="super-table-card__footer-actions"
    :class="{
      'is-always': always,
      'is-collapsed': collapsed,
      'is-open': open || restoringFocus,
    }"
  >
    <Teleport :to="target ?? 'body'" :disabled="!menuActive">
      <div
        ref="group"
        class="super-table-card__action-group"
        :class="{ 'is-menu': menuActive, 'is-probe': collapsed && !menuActive }"
        :inert="blocked || (collapsed && !menuActive) || undefined"
        :aria-hidden="collapsed && !menuActive ? true : undefined"
      >
        <slot :overflow="menuActive" :close="close" />
      </div>
    </Teleport>
    <SuperPopover
      v-if="collapsed"
      v-model="open"
      :trigger="open && focusHeld ? 'manual' : undefined"
      placement="top-end"
      :offset="8"
      :disabled="blocked"
      :close-on-click-outside="false"
      :popper-style="{ '--wt-popover-padding': '4px' }"
    >
      <template #reference="{ setReference }">
        <SuperButton
          :ref="(element) => reference(element, setReference)"
          :icon="Ellipsis"
          :square="32"
          :disabled="blocked"
          aria-label="更多操作"
          aria-haspopup="dialog"
          :aria-expanded="open"
          :aria-controls="open ? menuId : undefined"
          @click.stop="show()"
          @keydown="referenceKey"
        />
      </template>
      <template #content>
        <div
          :id="menuId"
          ref="target"
          class="super-table-card__action-menu"
          role="dialog"
          aria-label="更多操作"
          tabindex="-1"
          :inert="blocked || undefined"
          @focusin="focusHeld = true"
          @keydown="menuKey"
          @click="menuClick"
        />
      </template>
    </SuperPopover>
  </div>
</template>

<style lang="scss">
.super-table-card__footer-actions {
  position: relative;
  flex: none;
  min-width: 0;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity var(--wt-motion-duration-fast, 120ms) ease,
    visibility var(--wt-motion-duration-fast, 120ms);
}
.super-table-card__footer-actions:is(.is-always, .is-open),
.super-table-card:hover .super-table-card__footer-actions,
.super-table-card:focus-within .super-table-card__footer-actions {
  opacity: 1;
  visibility: visible;
}
.super-table-card__action-group {
  display: flex;
  align-items: center;
  gap: 4px;
  width: max-content;
}
.super-table-card__action-group > * {
  flex: none;
}
.super-table-card__action-group > .el-button + .el-button {
  margin-left: 0;
}
.super-table-card__action-group.is-probe {
  position: absolute;
  right: 0;
  top: 0;
  visibility: hidden;
  pointer-events: none;
}
.super-table-card__action-menu {
  min-width: min(160px, calc(100vw - 40px));
  max-width: min(320px, calc(100vw - 40px));
  max-height: min(360px, calc(100vh - 40px));
  overflow: auto;
}
.super-table-card__action-group.is-menu {
  flex-direction: column;
  align-items: stretch;
  width: 100%;
}
.super-table-card__action-group.is-menu > .el-button {
  justify-content: flex-start;
  margin: 0;
}
@media (hover: none) {
  .super-table-card__footer-actions {
    opacity: 1;
    visibility: visible;
  }
}
@media (prefers-reduced-motion: reduce) {
  .super-table-card__footer-actions {
    transition: none;
  }
}
</style>
