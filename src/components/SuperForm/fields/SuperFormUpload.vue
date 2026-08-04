<script setup lang="ts">
import { File as FileIcon, Plus, Trash2 } from '@lucide/vue';
import { ElImage, ElMessage, ElSkeleton, ElSkeletonItem } from 'element-plus';
import type { PropType } from 'vue';
import SuperButton from '../../SuperButton/index.vue';
import SuperIcon from '../../SuperIcon/index.vue';
import type {
  SuperUploadAction,
  SuperUploadRequest,
  SuperUploadValue,
} from '../types.ts';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  type: { type: String as PropType<'file' | 'image'>, default: 'file' },
  multiple: { type: Boolean, default: false },
  limit: { type: Number, default: undefined },
  upload: {
    type: Function as PropType<SuperUploadRequest>,
    default: undefined,
  },
  disabled: { type: Boolean, default: false },
});
const model = defineModel<
  SuperUploadValue | SuperUploadValue[] | File | File[] | null
>();
const emit = defineEmits<{ action: SuperUploadAction }>();

const input = ref<HTMLInputElement>();
const loading = ref(false);
const pendingCount = ref(0);
const mounted = ref(true);
const previewUrls = new Map<File, string>();
const MAX_IMAGE_ITEMS = 8;
const isRemote = computed(() => typeof props.upload === 'function');
const effectiveLimit = computed(() => (props.multiple ? props.limit : 1));

function currentItems(): Array<SuperUploadValue | File> {
  if (Array.isArray(model.value)) return model.value;
  return model.value ? [model.value] : [];
}

const imageItems = computed(() => currentItems());
const visibleImageItems = computed(() =>
  imageItems.value.slice(0, MAX_IMAGE_ITEMS),
);
const imagePreviewUrls = computed(() => imageItems.value.map(itemUrl));
const hiddenImageCount = computed(() =>
  Math.max(0, imageItems.value.length - MAX_IMAGE_ITEMS),
);
const visibleImageSkeletonCount = computed(() =>
  Math.min(
    pendingCount.value,
    Math.max(0, MAX_IMAGE_ITEMS - visibleImageItems.value.length),
  ),
);

const triggerDisabled = computed(() => {
  const limit = effectiveLimit.value;
  return (
    Boolean(props.disabled) ||
    loading.value ||
    (limit !== undefined && currentItems().length >= limit)
  );
});

function updateValue(items: Array<SuperUploadValue | File>) {
  model.value = props.multiple
    ? (items as SuperUploadValue[] | File[])
    : ((items[0] as SuperUploadValue | File | undefined) ?? null);
}

function warnLimit() {
  ElMessage.warning(`最多只能选择 ${effectiveLimit.value} 个文件`);
}

function exceedsLimit(count: number) {
  const limit = effectiveLimit.value;
  return limit !== undefined && count > limit;
}

function ensurePreview(file: File) {
  if (props.type === 'image' && !previewUrls.has(file)) {
    previewUrls.set(file, URL.createObjectURL(file));
  }
}

function revokePreview(file: File) {
  const url = previewUrls.get(file);
  if (url) URL.revokeObjectURL(url);
  previewUrls.delete(file);
}

function syncPreviews() {
  if (isRemote.value) return;
  const files = currentItems().filter(
    (item): item is File => item instanceof File,
  );
  for (const file of previewUrls.keys()) {
    if (!files.includes(file)) revokePreview(file);
  }
  files.forEach(ensurePreview);
}

watch(model, syncPreviews, { immediate: true, deep: false });

function normalizeUploadResult(
  result: unknown,
): SuperUploadValue[] | undefined {
  if (result === undefined || result === null || result === false) return [];
  const values = Array.isArray(result) ? result : [result];
  if (
    values.some((value) => typeof value !== 'object' || value === null) ||
    (!props.multiple && values.length !== 1)
  ) {
    ElMessage.warning('上传结果格式不正确');
    return undefined;
  }
  return values as SuperUploadValue[];
}

async function selectRemote(files: File[]) {
  const current = currentItems() as SuperUploadValue[];
  loading.value = true;
  pendingCount.value = files.length;
  try {
    const result = await props.upload!(files, current);
    if (!mounted.value) return;
    const selected = normalizeUploadResult(result);
    if (!selected || selected.length === 0) return;
    const latest = currentItems() as SuperUploadValue[];
    if (exceedsLimit(latest.length + selected.length)) {
      warnLimit();
      return;
    }
    const next = [...latest, ...selected];
    updateValue(next);
    emit('action', 'selected', selected, next);
  } catch {
    // 上传适配器负责具体错误提示；组件仅保证字段值保持不变。
  } finally {
    if (mounted.value) {
      loading.value = false;
      pendingCount.value = 0;
    }
  }
}

function selectLocal(files: File[]) {
  files.forEach(ensurePreview);
  const current = currentItems() as File[];
  const next = [...current, ...files];
  updateValue(next);
  emit('action', 'selected', files, next);
}

function handleFiles(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files ?? []);
  target.value = '';
  if (!files.length || triggerDisabled.value) return;
  if (exceedsLimit(currentItems().length + files.length)) {
    warnLimit();
    return;
  }
  if (isRemote.value) void selectRemote(files);
  else selectLocal(files);
}

function deleteFile(file: SuperUploadValue | File) {
  if (triggerDisabled.value && loading.value) return;
  if (file instanceof File) revokePreview(file);
  const next = currentItems().filter((item) => item !== file);
  updateValue(next);
  emit('action', 'delete', file, next as SuperUploadValue[] | File[]);
}

function itemUrl(item: SuperUploadValue | File) {
  return item instanceof File ? (previewUrls.get(item) ?? '') : item.url;
}

function itemName(item: SuperUploadValue | File) {
  return item.name;
}

function itemKey(item: SuperUploadValue | File) {
  return item instanceof File
    ? `${item.name}-${item.lastModified}`
    : String(item.id ?? item.url);
}

onBeforeUnmount(() => {
  mounted.value = false;
  for (const file of previewUrls.keys()) revokePreview(file);
  if (!isRemote.value && currentItems().some((item) => item instanceof File)) {
    updateValue([]);
  }
});
</script>

<template>
  <div class="super-form-upload" :class="`super-form-upload--${type}`">
    <input
      ref="input"
      class="super-form-upload__input"
      type="file"
      v-bind="$attrs"
      :accept="type === 'image' ? 'image/*' : undefined"
      :multiple="multiple"
      :disabled="triggerDisabled"
      @change="handleFiles"
    />
    <SuperButton
      v-if="type === 'file'"
      class="super-form-upload__file-trigger"
      type="primary"
      :disabled="triggerDisabled"
      @click="input?.click()"
    >
      上传文件
    </SuperButton>

    <div v-if="type === 'file'" class="super-form-upload__file-list">
      <div
        v-for="item in currentItems()"
        :key="itemKey(item)"
        class="super-form-upload__file-item"
      >
        <SuperIcon
          :icon="FileIcon"
          :size="16"
          aria-hidden="true"
          class="super-form-upload__file-icon"
        />
        <span class="super-form-upload__name">{{ itemName(item) }}</span>
        <SuperButton
          class="super-form-upload__delete"
          text
          type="danger"
          :disabled="loading || props.disabled"
          :aria-label="`删除 ${itemName(item)}`"
          @click="deleteFile(item)"
        >
          <SuperIcon :icon="Trash2" :size="14" aria-hidden="true" />
        </SuperButton>
      </div>
      <ElSkeleton
        v-for="index in pendingCount"
        :key="`loading-${index}`"
        class="super-form-upload__file-skeleton"
        animated
      >
        <template #template>
          <ElSkeletonItem variant="rect" />
        </template>
      </ElSkeleton>
    </div>

    <div v-else class="super-form-upload__image-grid">
      <SuperButton
        class="super-form-upload__image-trigger"
        :disabled="triggerDisabled"
        aria-label="上传图片"
        @click="input?.click()"
      >
        <SuperIcon :icon="Plus" :size="32" aria-hidden="true" />
      </SuperButton>

      <div
        v-for="(item, index) in visibleImageItems"
        :key="itemKey(item)"
        class="super-form-upload__image-item"
      >
        <ElImage
          class="super-form-upload__image"
          fit="cover"
          :src="itemUrl(item)"
          :preview-src-list="imagePreviewUrls"
          :initial-index="index"
          preview-teleported
        >
          <template #placeholder>
            <ElSkeleton class="super-form-upload__image-placeholder" animated>
              <template #template>
                <ElSkeletonItem variant="rect" />
              </template>
            </ElSkeleton>
          </template>
        </ElImage>
        <span
          v-if="index === MAX_IMAGE_ITEMS - 1 && hiddenImageCount > 0"
          class="super-form-upload__image-more"
        >
          +{{ hiddenImageCount }}
        </span>
        <SuperButton
          class="super-form-upload__image-delete"
          :disabled="loading || props.disabled"
          :aria-label="`删除 ${itemName(item)}`"
          @click.stop="deleteFile(item)"
        >
          <SuperIcon :icon="Trash2" :size="14" aria-hidden="true" />
        </SuperButton>
      </div>

      <ElSkeleton
        v-for="index in visibleImageSkeletonCount"
        :key="`loading-${index}`"
        class="super-form-upload__image-skeleton"
        animated
      >
        <template #template>
          <ElSkeletonItem variant="rect" />
        </template>
      </ElSkeleton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.super-form-upload {
  @include flex-column(8px);
  align-items: flex-start;
}

.super-form-upload--file {
  width: 100%;
}

.super-form-upload__input {
  display: none;
}

.super-form-upload__file-trigger {
  width: 96px;
}

.super-form-upload__file-list {
  @include flex-column(4px);
  width: 100%;
}

.super-form-upload__file-item {
  @include flex-align-center(4px);
  position: relative;
  height: 24px;
  padding: 0 0 0 4px;
  line-height: 24px;
  border-radius: 4px;
  transition:
    color 0.2s,
    background-color 0.2s;

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-fill-color-light);
  }
}

.super-form-upload__file-icon {
  flex: none;
}

.super-form-upload__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.super-form-upload__delete.el-button {
  flex: none;
  min-width: 0;
  width: 24px;
  height: 24px;
  margin-left: auto;
  padding: 0;
}

.super-form-upload__file-skeleton,
.super-form-upload__file-skeleton :deep(.el-skeleton__item) {
  width: 100%;
  height: 24px;
}

.super-form-upload__image-grid {
  display: grid;
  grid-template-columns: repeat(3, 96px);
  gap: 8px;
}

.super-form-upload__image-trigger,
.super-form-upload__image-item,
.super-form-upload__image-skeleton,
.super-form-upload__image-placeholder,
.super-form-upload__image-skeleton :deep(.el-skeleton__item),
.super-form-upload__image-placeholder :deep(.el-skeleton__item) {
  box-sizing: border-box;
  width: 96px;
  height: 96px;
  border-radius: 6px;
}

.super-form-upload__image-trigger.el-button {
  @include flex-center;
  margin: 0;
  padding: 0;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-blank);
  border: 1px dashed var(--el-border-color);
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;

  &:hover:not(:disabled) {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }

  &:disabled {
    color: var(--el-text-color-disabled);
    background: var(--el-fill-color-light);
    cursor: not-allowed;
  }
}

.super-form-upload__image-item {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.super-form-upload__image {
  display: block;
  width: 100%;
  height: 100%;
}

.super-form-upload__image :deep(.el-image__inner) {
  transition: transform 0.2s ease;
}

.super-form-upload__image-item:hover
  .super-form-upload__image
  :deep(.el-image__inner) {
  transform: scale(1.08);
}

.super-form-upload__image-more {
  @include flex-center;
  position: absolute;
  inset: 0;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  background: rgb(0 0 0 / 52%);
  pointer-events: none;
}

.super-form-upload__image-delete {
  @include flex-center;
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--wt-color-danger);
  background: transparent;
  border: 0;
  cursor: pointer;

  &::before {
    position: absolute;
    inset: 0;
    content: '';
    background: rgb(255 255 255 / 72%);
    clip-path: polygon(0 0, 100% 0, 100% 100%);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

.super-form-upload__image-delete.el-button {
  min-width: 0;
  margin: 0;
  color: var(--wt-color-danger);
  background: transparent;
  border: 0;
}

.super-form-upload__image-delete :deep(> span) {
  position: absolute;
  inset: 0;
}

.super-form-upload__image-delete :deep(.super-icon) {
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 1;
  pointer-events: none;
}
</style>
