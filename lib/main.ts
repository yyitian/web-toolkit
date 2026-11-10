import '@/styles/index.scss';

export { formatDate } from '@/utils/date.ts';
export { DATE_FORMATS, datePickerDefaultTime } from '@/constants/date.ts';
export { openConfirm, openDeleteConfirm } from '@/utils/message.ts';
export type { ConfirmResult, OpenConfirmOptions } from '@/utils/message.ts';

export { createWtTheme, useWtTheme } from '@/theme/index.ts';
export type {
  WtBuiltinTheme,
  WtColorScheme,
  WtMaterial,
  WtThemeContext,
  WtThemeOptions,
} from '@/theme/index.ts';

export { default as SuperIcon } from '@/components/SuperIcon/index.vue';
export { default as SuperButton } from '@/components/SuperButton/index.vue';
export type { SuperButtonProps } from '@/components/SuperButton/index.vue';
export { default as SuperPopover } from '@/components/SuperPopover/index.vue';
export { default as SuperDialog } from '@/components/SuperDialog/index.vue';
export { default as SuperForm } from '@/components/SuperForm/index.vue';
export { default as SuperTable } from '@/components/SuperTable/index.vue';
export type {
  SuperTableCellContext,
  SuperTableColumn,
  SuperTableConfig,
  SuperTableInstance,
  SuperTableProps,
  SuperTableQuery,
  SuperTableRequest,
  SuperTableResult,
  SuperTableSearch,
  SuperTableSelection,
} from '@/components/SuperTable/types.ts';
export { default as SuperFormDialog } from '@/components/SuperFormDialog/index.vue';
export { default as SuperThemeSwitcher } from '@/components/SuperThemeSwitcher/index.vue';
export type { SuperThemeSwitcherProps } from '@/components/SuperThemeSwitcher/index.vue';

export { formatLabel } from '@/components/SuperForm/config.ts';
export type {
  LabelRecord,
  LabelValue,
  SuperDialogProps,
  SuperFormColumn,
  SuperFormDialogInstance,
  SuperFormDialogProps,
  SuperFormInstance,
  SuperFormOption,
  SuperFormProps,
  SuperUploadAction,
  SuperUploadProps,
  SuperUploadRequest,
  SuperUploadResult,
  SuperUploadValue,
} from '@/components/SuperForm/types.ts';
