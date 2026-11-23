import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { styles, scss, rule, role } from './verify-style-helpers.mjs';

const button = await styles('SuperButton/index.vue');
const base = rule(button, /^\s*\.super-button\.el-button\[/);
assert.match(base, /--el-font-size-base: var\(--wt-font-size-body/);
assert.match(
  base,
  /font-size: var\(--el-font-size-base, var\(--wt-font-size-body/,
);
assert.match(base, /--el-button-font-weight: var\(--wt-font-weight-regular/);
assert.match(base, /font-weight: var\(--el-button-font-weight\)/);
assert.match(
  base,
  /color: var\(--wt-button-color, var\(--el-button-text-color\)\)/,
);
assert.doesNotMatch(base, /line-height:/, '按钮保留原生居中行高');
assert.match(
  rule(button, /\.super-button\.el-button\.el-button--small/),
  /font-size: var\(--el-font-size-small, var\(--wt-font-size-caption/,
);
assert.match(button, /--wt-button-icon-size, 20px/, '纯图标仍使用独立图标尺寸');
for (const field of [
  'Input',
  'InputNumber',
  'Textarea',
  'Select',
  'Cascader',
  'DatePicker',
]) {
  const css = await styles(`SuperForm/fields/SuperForm${field}.vue`);
  assert.match(
    css,
    /font-size: var\(--el-font-size-base, var\(--wt-font-size-body/,
  );
  assert.match(
    css,
    /font-size: var\(--el-font-size-small, var\(--wt-font-size-caption/,
  );
  assert.match(css, /font-weight: var\(--wt-font-weight-regular/);
  assert.match(css, /--wt-form-control-disabled-color/);
}
const select = await styles('SuperForm/fields/SuperFormSelect.vue');
assert.match(
  rule(select, /\.super-form-select \.el-tag/),
  /--el-tag-font-size: var\(--wt-font-size-caption/,
);
const smallSelect = rule(
  select,
  /\.super-form-select\.el-select--small \.el-select__wrapper/,
);
assert.match(
  smallSelect,
  /font-size: var\(--el-font-size-small, var\(--wt-font-size-caption/,
);
assert.doesNotMatch(
  smallSelect,
  /height:|line-height:/,
  '选择器尺寸继续由 Element Plus 管理',
);
for (const name of ['Checkbox', 'Radio']) {
  const css = await styles(`SuperForm/fields/SuperForm${name}.vue`);
  const control = name.toLowerCase();
  assert.match(
    css,
    new RegExp(`--el-${control}-font-size: var\\(--wt-font-size-body`),
  );
  assert.match(
    css,
    new RegExp(`--el-${control}-font-size: var\\(--wt-font-size-caption`),
  );
  assert.match(
    css,
    new RegExp(`--el-${control}-font-weight: var\\(--wt-font-weight-regular`),
  );
  assert.ok(
    css.includes(`.el-${control}--small, .el-${control}--large).is-bordered`),
    '边框尺寸变体具有明确覆盖',
  );
}
const toggle = await styles('SuperForm/fields/SuperFormSwitch.vue');
assert.match(
  rule(toggle, /\.el-switch__inner-wrapper/),
  /font-size: var\(--el-font-size-small, var\(--wt-font-size-caption/,
);
assert.match(rule(toggle, /\.el-switch__label \*/), /font-size: inherit/);
assert.match(toggle, /--wt-form-switch-bg/);
const form = await styles('SuperForm/index.vue');
role(form, /\.super-form__label-text/, 'body', 'bold');
assert.match(
  rule(form, /\.el-form-item__error/),
  /font-size: var\(--el-font-size-small, var\(--wt-font-size-caption/,
);
assert.doesNotMatch(
  rule(form, /\.el-form-item__error/),
  /color:/,
  '校验反馈继续沿用原生错误色',
);
const dialog = await styles('SuperDialog/index.vue');
role(dialog, /^\s*\.super-dialog\s*$/, 'body', 'regular');
role(dialog, /\.el-dialog__title/, 'title', 'bold');
const popover = await styles('SuperPopover/index.vue');
role(popover, /^\s*\.super-popover-floating\[/, 'caption', 'regular');
assert.match(
  rule(popover, /^\s*\.super-popover-floating\[/),
  /--el-font-size-base: var\(--wt-font-size-body/,
);
assert.match(popover, /--wt-popover-color/);
const upload = await styles('SuperForm/fields/SuperFormUpload.vue');
assert.match(
  rule(upload, /\.super-form-upload__file-item\[/),
  /min-height: max\(24px, var\(--wt-line-height-body/,
);
const more = role(upload, /\.super-form-upload__image-more\[/, 'title', 'bold');
assert.match(more, /color: var\(--wt-text-inverse/);
role(upload, /\.el-image__error/, 'caption', 'regular');
const switcher = await styles('SuperThemeSwitcher/index.vue');
role(switcher, /^\s*\.super-theme-switcher\[/, 'body', 'regular');
assert.match(
  role(switcher, /\.super-theme-switcher__label/, 'caption', 'regular'),
  /color: var\(--wt-form-label-color, var\(--wt-text-secondary\)\)/,
);
const themeURL = new URL('../src/styles/theme/index.scss', import.meta.url);
const theme = scss(await readFile(themeURL, 'utf8'), fileURLToPath(themeURL));
assert.match(
  rule(
    theme,
    /\.wt-form-select-popper \.el-select-dropdown__item\.is-selected/,
  ),
  /font-weight: var\(--wt-font-weight-bold/,
);
assert.match(
  rule(theme, /\.wt-form-cascader-popper \.el-cascader-node/),
  /font-size: var\(--el-font-size-base, var\(--wt-font-size-body/,
);
const calendar = rule(theme, /\.wt-form-date-picker-popper \.el-date-table/);
assert.match(
  calendar,
  /font-size: var\(--el-font-size-small, var\(--wt-font-size-caption/,
);
assert.doesNotMatch(
  calendar,
  /height:|line-height:|color:/,
  '日期面板保留原生网格行高与状态色',
);
for (const file of [
  'SuperIcon/index.vue',
  'SuperIcon/dynamic-icons/DynamicPin.vue',
  'SuperFormDialog/index.vue',
]) {
  const source = await readFile(
    new URL(`../src/components/${file}`, import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(
    source,
    /@include typography\.text/,
    '图标与组装组件不重复应用文字样式',
  );
}
console.log(
  '通过：按钮、10 类独立字段、弹窗/浮层、上传、主题切换器的排版契约与控件尺寸保护',
);
console.log(
  '通过：浮层变量桥接、选中字重、校验/禁用/业务色保留；图标及组装组件不重复套用正文排版',
);
