import assert from 'node:assert/strict';
import dayjs from 'dayjs';
import { ElMessageBox } from 'element-plus';
import { DATE_FORMATS } from '../src/constants/date.ts';
import { formatDate } from '../src/utils/date.ts';
import { openConfirm, openDeleteConfirm } from '../src/utils/message.ts';

const value = '2026-11-10 14:05:09';
assert.equal(formatDate(value), '2026-11-10');
assert.equal(formatDate(value, DATE_FORMATS.dateTime), '2026-11-10 14:05');
assert.equal(
  formatDate(value, DATE_FORMATS.dateTimeSeconds),
  '2026-11-10 14:05:09',
);
assert.equal(formatDate(value, 'date'), '2026-11-10');
assert.equal(formatDate(value, 'dateTime'), '2026-11-10 14:05');
assert.equal(formatDate(value, 'dateTimeSeconds'), '2026-11-10 14:05:09');
assert.equal(formatDate(value, 'YYYY年MM月DD日'), '2026年11月10日');
assert.equal(formatDate(new Date(2026, 10, 10)), '2026-11-10');
assert.equal(formatDate(dayjs(value)), '2026-11-10');
assert.notEqual(formatDate(0), '');
assert.notEqual(formatDate(-1), '');
for (const empty of [
  null,
  undefined,
  '',
  '  ',
  '无效日期',
  NaN,
  Infinity,
  new Date(NaN),
]) {
  assert.equal(formatDate(empty), '');
}
console.log('通过：默认格式、预设值/键名、自定义格式、日期对象、时间戳及空值');

// 只替换 Element Plus 交互边界，执行实际工具函数，避免依赖浏览器和测试框架。
const originalConfirm = ElMessageBox.confirm;
const calls = [];
let outcome = 'confirm';
ElMessageBox.confirm = (...args) => {
  calls.push(args);
  return outcome === 'confirm'
    ? Promise.resolve('confirm')
    : Promise.reject(outcome);
};

try {
  assert.equal(await openConfirm(), 'confirm');
  assert.equal(calls.at(-1)[0], '确认执行此操作吗？');
  assert.equal(calls.at(-1)[1], '操作不可撤销');
  assert.equal(calls.at(-1)[2].confirmButtonText, '确认');
  assert.equal(calls.at(-1)[2].cancelButtonText, '取消');
  assert.equal(calls.at(-1)[2].type, 'warning');
  assert.equal(await openConfirm('确认提交吗？'), 'confirm');
  assert.equal(calls.at(-1)[0], '确认提交吗？');

  const appContext = { provides: {} };
  const options = Object.freeze({
    title: '提交确认',
    message: '确认发布吗？',
    confirmButtonText: '发布',
    cancelButtonText: '暂缓',
    type: 'info',
    closeOnClickModal: false,
    callback: () => assert.fail('不应进入 callback 模式'),
  });
  assert.equal(await openConfirm(options, appContext), 'confirm');
  const [message, title, actualOptions, context] = calls.at(-1);
  assert.equal(message, options.message);
  assert.equal(title, options.title);
  assert.equal(actualOptions.confirmButtonText, options.confirmButtonText);
  assert.equal(actualOptions.cancelButtonText, options.cancelButtonText);
  assert.equal(actualOptions.type, options.type);
  assert.equal(actualOptions.closeOnClickModal, false);
  assert.equal(actualOptions.callback, undefined);
  assert.equal(context, appContext);
  assert.equal(await openDeleteConfirm('<示例任务>'), true);
  assert.equal(calls.at(-1)[0], '确认删除“<示例任务>”吗？');
  assert.notEqual(calls.at(-1)[2].dangerouslyUseHTMLString, true);
  await openDeleteConfirm('  ');
  assert.equal(calls.at(-1)[0], '确认删除该项吗？');
  assert.equal(await openDeleteConfirm('任务', options, appContext), true);
  assert.equal(calls.at(-1)[0], options.message);
  assert.equal(calls.at(-1)[1], options.title);
  assert.equal(calls.at(-1)[3], appContext);
  console.log(
    '通过：弹窗默认值、选项覆盖、上下文透传、文本名称及 callback 保护',
  );

  for (outcome of ['cancel', 'close']) {
    assert.equal(await openConfirm('确认吗？'), 'cancel');
    assert.equal(
      await openConfirm({ distinguishCancelAndClose: true }),
      'cancel',
    );
    assert.equal(await openDeleteConfirm('任务'), false);
  }
  outcome = new Error('模拟初始化失败');
  await assert.rejects(openConfirm(), (error) => error === outcome);
  await assert.rejects(openDeleteConfirm('任务'), (error) => error === outcome);
  ElMessageBox.confirm = () => {
    throw outcome;
  };
  await assert.rejects(openConfirm(), (error) => error === outcome);
  console.log('通过：确认、取消、关闭、异步及同步异常');
} finally {
  ElMessageBox.confirm = originalConfirm;
}
