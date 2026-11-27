/** 仅调整控件自身的滚动位置，避免 scrollIntoView 连带滚动页面。 */
export function revealSegmentedItem(
  root: HTMLElement,
  item: HTMLElement | null = root.querySelector(
    '.el-segmented__item.is-selected',
  ),
) {
  if (!item || root.clientWidth === 0 || root.scrollWidth <= root.clientWidth)
    return;
  const viewport = root.getBoundingClientRect();
  const bounds = item.getBoundingClientRect();
  // 预留焦点轮廓所需空间；对超宽单项仅对齐起点，避免重复观察时来回跳动。
  const left = viewport.left + root.clientLeft + 3;
  const right = viewport.left + root.clientLeft + root.clientWidth - 3;
  const delta =
    bounds.width > right - left || bounds.left < left
      ? bounds.left - left
      : Math.max(0, bounds.right - right);
  if (Math.abs(delta) > 1) root.scrollLeft += delta;
}
