import type { SuperStatusOption, SuperStatusProps } from './types.ts';

export const SUPER_STATUS_PRESETS: readonly SuperStatusOption[] = Object.freeze(
  [
    { value: 'pending', label: '待处理', type: 'info' },
    { value: 'running', label: '运行中', type: 'primary' },
    { value: 'success', label: '成功', type: 'success' },
    { value: 'failed', label: '失败', type: 'danger' },
    { value: 'stopped', label: '已停用', type: 'warning' },
    { value: 'unknown', label: '未知', type: 'info' },
  ].map((item) => Object.freeze(item as SuperStatusOption)),
);

export function resolveStatus(props: SuperStatusProps) {
  const preset = SUPER_STATUS_PRESETS.find(
    (item) => item.value === props.value,
  );
  const custom = props.options?.find((item) => item.value === props.value);
  return {
    label: props.label ?? custom?.label ?? preset?.label ?? '未知',
    type: custom?.type ?? preset?.type ?? 'info',
    color: props.color ?? custom?.color ?? preset?.color,
  };
}
