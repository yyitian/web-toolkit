import type { Component, Slot } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';

export type LabelRecord = Record<string, string | (() => string)>;

export type LabelValue = string | (() => string) | LabelRecord;

export interface SuperDialogProps {
  title?: LabelValue;
  footer?: boolean;
  width?: number | string;
  height?: number;
  maxHeight?: number;
  cancel?: boolean | LabelValue;
  confirm?: LabelValue;
}

export interface SuperFormOption {
  value: unknown;
  label: LabelValue;
  disabled?: boolean;
  children?: SuperFormOption[];
}

interface SuperFormColumnBase {
  prop: string;
  label?: LabelValue;
  tips?: LabelValue;
  rules?: FormItemRule | FormItemRule[];
  class?: unknown;
  show?: (formData: Record<string, unknown>) => boolean;
}

type SuperFormBuiltinType =
  | 'input'
  | 'textarea'
  | 'input-number'
  | 'radio'
  | 'select'
  | 'checkbox'
  | 'switch'
  | 'date-picker';

export interface SuperUploadProps extends Record<string, unknown> {
  type?: 'file' | 'image';
  multiple?: boolean;
  limit?: number;
  upload?: SuperUploadRequest;
}

export type SuperFormColumn =
  | (SuperFormColumnBase & {
      formType: SuperFormBuiltinType;
      component?: never;
      defaultValue?: unknown;
      props?: Record<string, unknown> & { options?: SuperFormOption[] };
      slots?: Record<string, string | Slot>;
      change?: (formData: Record<string, unknown>, value: unknown) => void;
    })
  | (SuperFormColumnBase & {
      formType: 'upload';
      component?: never;
      defaultValue?:
        | SuperUploadValue
        | SuperUploadValue[]
        | File
        | File[]
        | null;
      props: SuperUploadProps;
      slots?: Record<string, string | Slot>;
      change?: (
        formData: Record<string, unknown>,
        value: SuperUploadValue | SuperUploadValue[] | File | File[] | null,
      ) => void;
    })
  | (SuperFormColumnBase & {
      formType: 'slot';
      component?: never;
      defaultValue?: never;
      props?: never;
      slots?: never;
      change?: never;
    })
  | (SuperFormColumnBase & {
      formType: 'custom';
      component: Component;
      defaultValue?: unknown;
      props?: never;
      slots?: never;
      change?: never;
    });

export interface SuperFormProps {
  columns?: SuperFormColumn[];
  disabled?: boolean;
}

export interface SuperFormInstance {
  getFormData(): Record<string, unknown>;
  setFormData(data: Record<string, unknown>): void;
  validate(): Promise<boolean>;
  submit(): Promise<void>;
  elForm: FormInstance | undefined;
}

export interface SuperUploadValue {
  id?: string | number;
  url: string;
  name: string;
  type: string;
  size: number;
}

export type SuperUploadResult =
  | SuperUploadValue
  | SuperUploadValue[]
  | undefined
  | null
  | false;

export type SuperUploadRequest = (
  files: File[],
  currentFiles: SuperUploadValue[],
) => Promise<SuperUploadResult>;

export type SuperUploadAction =
  | [
      action: 'selected',
      selectedFiles: SuperUploadValue[] | File[],
      currentFiles: SuperUploadValue[] | File[],
    ]
  | [
      action: 'delete',
      deletedFile: SuperUploadValue | File,
      currentFiles: SuperUploadValue[] | File[],
    ];

export interface SuperFormDialogProps {
  title?: LabelValue;
  formData?: Record<string, unknown>;
  columns?: SuperFormColumn[];
  disabled?: boolean;
  width?: number | string;
  loading?: boolean;
  confirm?: LabelValue;
}

export type SuperFormDialogInstance = SuperFormInstance;
