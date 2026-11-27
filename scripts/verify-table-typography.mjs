import assert from 'node:assert/strict';
import { styles, rule, role } from './verify-style-helpers.mjs';

const table = await styles('SuperTable/index.vue');
role(table, /\.super-table__heading\[/, 'title', 'bold');
assert.doesNotMatch(
  rule(table, /\.super-table__title\[/),
  /font-weight:/,
  '布局容器不应使勾选控件继承标题字重',
);
role(table, /\.super-table__count\[/, 'caption', 'regular');
const body = role(table, /^\s*\.super-table\[/, 'body', 'regular');
assert.match(body, /color: var\(--wt-table-color, var\(--wt-text-regular\)\)/);
assert.match(body, /--el-font-size-small: var\(--wt-font-size-caption/);
const content = await styles('SuperTable/TableContent.vue');
assert.match(
  rule(content, /\.super-table__table\[/),
  /--el-font-size-extra-small: var\(--wt-font-size-caption/,
);
assert.match(
  rule(content, /\.super-table__table\.el-table--small/),
  /--_wt-table-line-height: var\(--wt-line-height-caption/,
);
const header = rule(content, /th\.el-table__cell/);
assert.match(
  header,
  /color: var\(--wt-table-header-color, var\(--wt-text-title\)\)/,
);
assert.match(header, /font-weight: var\(--wt-font-weight-bold/);
assert.match(
  rule(content, /\.cell\s*$/),
  /line-height: var\(--_wt-table-line-height\)/,
);
role(content, /\.el-table__empty-text/, 'caption', 'regular');
assert.match(
  rule(content, /\.wt-table-tooltip\.el-popper/),
  /font-size: var\(--wt-font-size-caption/,
);
assert.doesNotMatch(
  rule(content, /\.wt-table-tooltip\.el-popper/),
  /(?:^|;)\s*color:/,
  'tooltip 保留原生或业务文字色',
);
const search = await styles('SuperForm/fields/SuperFormSelect.vue');
assert.match(
  rule(search, /\.super-form-select\.el-select \.el-select__wrapper/),
  /font-size: var\(--el-font-size-base, var\(--wt-font-size-body/,
);
assert.match(
  rule(search, /\.super-form-select\.el-select--small \.el-select__wrapper/),
  /font-size: var\(--el-font-size-small, var\(--wt-font-size-caption/,
);
assert.doesNotMatch(
  rule(search, /\.super-form-select\.el-select \.el-select__wrapper/),
  /line-height:/,
);
const pagination = await styles('SuperTable/TablePagination.vue');
role(pagination, /\.super-table__footer\[/, 'caption', 'regular');
assert.match(
  rule(pagination, /^\s*\.el-pagination\[/),
  /--el-pagination-font-size-small: var\(--wt-font-size-caption/,
);
assert.match(
  rule(pagination, /\.el-pager li\.is-active/),
  /font-weight: var\(--wt-font-weight-bold/,
);
assert.doesNotMatch(
  rule(pagination, /\.el-pager li\.is-active/),
  /line-height:/,
  '不覆盖原生分页按钮居中行高',
);
assert.match(
  rule(pagination, /\.el-input\s*$/),
  /font-size: var\(--wt-font-size-caption/,
);
const card = await styles('SuperTable/TableCard.vue');
role(card, /\.super-table-card__title\[/, 'title', 'bold');
role(card, /\.super-table-card__description\[/, 'caption', 'regular');
role(card, /\.super-table-card__extra\[/, 'caption', 'regular');
assert.match(card, /-webkit-line-clamp: 2/);
role(
  await styles('SuperTable/CardFooter.vue'),
  /\.super-table-card__time\[/,
  'caption',
  'regular',
);
role(
  await styles('SuperTable/TableCards.vue'),
  /\.super-table-cards__empty\[/,
  'caption',
  'regular',
);
const status = role(
  await styles('SuperStatus/index.vue'),
  /^\s*\.super-status\[/,
  'caption',
  'regular',
);
assert.match(
  status,
  /color: var\(--wt-status-text-color, var\(--wt-text-regular\)\)/,
);
const tags = await styles('SuperTag/index.vue');
assert.match(
  rule(tags, /\.super-tag\.el-tag\[/),
  /--el-tag-font-size: var\(--wt-font-size-caption/,
);
assert.doesNotMatch(
  rule(tags, /\.super-tag\.el-tag\[/),
  /(?:^|;)\s*color:/,
  '标签继续使用 ElTag 的业务语义色',
);
console.log(
  '通过：标题、正文、表头、数量、卡片说明/时间/空态、状态与标签的真实 SCSS 语义契约',
);
console.log(
  '通过：局部字号桥接、small 字号行高、分页字重与原生居中、组件颜色优先级、tooltip/标签语义色保留',
);
