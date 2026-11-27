import type { ImageInstance, ImageProps } from 'element-plus';
import type { ImgHTMLAttributes, VNode } from 'vue';

export type SuperCarouselId = string | number;
export interface SuperCarouselItem {
  id: SuperCarouselId;
  src?: string;
  previewSrc?: string;
  alt?: string;
  label?: string | number;
  [key: string]: unknown;
}
export type SuperCarouselImageProps = Partial<
  Omit<ImageProps, 'src' | 'previewSrcList' | 'initialIndex'>
> &
  Omit<ImgHTMLAttributes, 'src' | 'onLoad' | 'onError'>;
export interface SuperCarouselProps {
  items: readonly SuperCarouselItem[];
  activeId?: SuperCarouselId | null;
  height?: string;
  initialIndex?: number;
  direction?: 'horizontal' | 'vertical';
  trigger?: 'hover' | 'click';
  autoplay?: boolean;
  interval?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  arrow?: 'always' | 'hover' | 'never';
  indicatorPosition?: '' | 'outside' | 'none';
  cardScale?: number;
  motionBlur?: boolean;
  disabled?: boolean;
  lazy?: boolean;
  preview?: boolean;
  selectable?: boolean;
  selectedIds?: readonly SuperCarouselId[];
  emptyText?: string;
  imageProps?: SuperCarouselImageProps;
}
export interface SuperCarouselItemContext {
  item: SuperCarouselItem;
  index: number;
}
export interface SuperCarouselSelectionChange extends SuperCarouselItemContext {
  selected: boolean;
  selectedIds: SuperCarouselId[];
}
export interface SuperCarouselSlotScope extends SuperCarouselItemContext {
  active: boolean;
  preview: () => void;
  selected: boolean;
  toggleSelected: () => void;
}
export interface SuperCarouselNavigationScope {
  activeIndex: number;
  total: number;
  canPrev: boolean;
  canNext: boolean;
  prev: () => void;
  next: () => void;
  setActiveItem: (index: number) => void;
  playing: boolean;
  togglePlay: () => void;
}
export interface SuperCarouselInstance {
  readonly activeIndex: number;
  prev: () => void;
  next: () => void;
  setActiveItem: (index: number) => void;
  setActiveId: (id: SuperCarouselId) => void;
}
export type SuperCarouselToolbarScope = Parameters<
  NonNullable<ImageInstance['$slots']['toolbar']>
>[0];

export interface SuperCarouselSlots {
  default?: (scope: SuperCarouselSlotScope) => VNode[];
  empty?: () => VNode[];
  navigation?: (scope: SuperCarouselNavigationScope) => VNode[];
  placeholder?: (scope: SuperCarouselItemContext) => VNode[];
  error?: (scope: SuperCarouselItemContext) => VNode[];
  toolbar?: (scope: SuperCarouselToolbarScope) => VNode[];
}
