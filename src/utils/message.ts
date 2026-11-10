import { ElMessageBox } from 'element-plus';
import type { ElMessageBoxOptions } from 'element-plus';
import type { AppContext } from 'vue';

export type ConfirmResult = 'confirm' | 'cancel';

/** 使用 Promise 接收结果；不支持会使原生 Promise 悬挂的 callback。 */
export type OpenConfirmOptions = Omit<
  ElMessageBoxOptions,
  'title' | 'callback'
> & {
  title?: string;
  callback?: never;
};

/** 通用确认弹窗；取消、关闭均返回 cancel，实际异常继续抛出。 */
export async function openConfirm(
  options: string | OpenConfirmOptions = {},
  appContext?: AppContext | null,
): Promise<ConfirmResult> {
  const {
    title = '操作不可撤销',
    message = '确认执行此操作吗？',
    ...rest
  } = typeof options === 'string' ? { message: options } : options;

  try {
    await ElMessageBox.confirm(
      message,
      title,
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
        ...rest,
        // 即使 JavaScript 调用方传入 callback，也保持 Promise 结果可用。
        callback: undefined,
      },
      appContext,
    );
    return 'confirm';
  } catch (error) {
    if (error === 'cancel' || error === 'close') return 'cancel';
    throw error;
  }
}

/** 删除确认弹窗；仅确认时返回 true，文案及弹窗选项均可覆盖。 */
export async function openDeleteConfirm(
  name: string,
  options: OpenConfirmOptions = {},
  appContext?: AppContext | null,
): Promise<boolean> {
  return (
    (await openConfirm(
      {
        ...options,
        message:
          options.message ??
          (name.trim() ? `确认删除“${name}”吗？` : '确认删除该项吗？'),
      },
      appContext,
    )) === 'confirm'
  );
}
