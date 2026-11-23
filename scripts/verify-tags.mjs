import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse, compileScript } from 'vue/compiler-sfc';
import ts from 'typescript';
import { createRenderer, h, nextTick, ref } from 'vue';

// 编译真实 SFC，用 Vue 渲染器验证组件接线；浮层定位与浏览器视觉另行验收。
const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'wt-tags-'));
const vueUrl = import.meta.resolve('vue');
const originals = new Map(
  ['Node', 'HTMLElement', 'document'].map((key) => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ]),
);
const invoke = (handler, event) => {
  for (const callback of Array.isArray(handler) ? handler : [handler])
    callback?.(event);
};

class Element extends EventTarget {
  constructor(kind) {
    super();
    this.kind = kind;
    this.props = {};
    this.children = [];
  }
  contains(node) {
    return node === this || this.children.some((child) => child.contains(node));
  }
  focus() {
    const previous = document.activeElement;
    if (previous === this) return;
    document.activeElement = this;
    invoke(previous?.props.onFocusout, { relatedTarget: this });
    invoke(this.props.onFocusin, { relatedTarget: previous });
  }
  get textContent() {
    return (
      this.text ?? this.children.map((child) => child.textContent).join('')
    );
  }
}
const testDocument = new EventTarget();
testDocument.activeElement = undefined;
Object.defineProperties(globalThis, {
  Node: { value: Element, configurable: true },
  HTMLElement: { value: Element, configurable: true },
  document: { value: testDocument, configurable: true },
});
const renderer = createRenderer({
  createElement: (kind) => new Element(kind),
  createText: (text) => Object.assign(new Element('text'), { text }),
  createComment: () => new Element('comment'),
  insert(node, parent, anchor) {
    if (node.parent)
      node.parent.children.splice(node.parent.children.indexOf(node), 1);
    const index = anchor ? parent.children.indexOf(anchor) : -1;
    parent.children.splice(index < 0 ? parent.children.length : index, 0, node);
    node.parent = parent;
  },
  remove(node) {
    if (node.parent)
      node.parent.children.splice(node.parent.children.indexOf(node), 1);
    node.parent = undefined;
  },
  patchProp: (node, key, _oldValue, value) => {
    node.props[key] = value;
  },
  setText: (node, text) => {
    node.text = text;
  },
  setElementText: (node, text) => {
    node.text = text;
    node.children = [];
  },
  parentNode: (node) => node.parent,
  nextSibling: (node) =>
    node.parent?.children[node.parent.children.indexOf(node) + 1],
});
function walk(node, predicate) {
  return [
    ...(predicate(node) ? [node] : []),
    ...node.children.flatMap((child) => walk(child, predicate)),
  ];
}
const byKind = (host, kind) => walk(host, (node) => node.kind === kind);
const apps = new Set();
function mount(component, initial, listeners = {}, slots) {
  const props = ref(initial);
  const host = new Element('host');
  const app = renderer.createApp({
    render: () => h(component, { ...props.value, ...listeners }, slots),
  });
  app.mount(host);
  apps.add(app);
  return { app, props, host };
}

// ElTag 替身保留 Vue emits/attrs 合并语义，定位替身仅隔离浏览器几何 API。
const elementStub = join(temporary, 'element.mjs');
const popoverStub = join(temporary, 'popover.mjs');
await writeFile(
  elementStub,
  `
import { defineComponent, h } from '${vueUrl}';
export { default as dayjs } from '${import.meta.resolve('dayjs')}';
export const ElTag = defineComponent({
  inheritAttrs: false,
  props: ['type','size','effect','color','round','hit','disableTransitions','closable'],
  emits: ['click','close'],
  setup(props, { attrs, slots, emit }) {
    return () => h('tag', { ...attrs, ...props, fireClick: event => emit('click', event), fireClose: event => emit('close', event) }, slots.default?.());
  }
});
export const ElProgress = defineComponent({ setup: () => () => h('progress') });
`,
);
await writeFile(
  popoverStub,
  `
import { defineComponent, h } from '${vueUrl}';
export default defineComponent({
  props: ['modelValue','placement','teleportTo','trigger','popperClass','popperStyle'],
  emits: ['update:modelValue'],
  setup(props, { slots, emit }) {
    return () => h('popover', { ...props, outside: () => emit('update:modelValue', false) }, [
      slots.reference?.({ setReference() {} }), props.modelValue ? slots.content?.() : null
    ]);
  }
});
`,
);
const compiled = new Map();
async function compile(relative) {
  const source = resolve(root, relative);
  if (source.endsWith('/SuperPopover/index.vue'))
    return pathToFileURL(popoverStub).href;
  if (compiled.has(source)) return compiled.get(source);
  const target = join(temporary, `source-${compiled.size}.mjs`);
  const url = pathToFileURL(target).href;
  compiled.set(source, url);
  let code = await readFile(source, 'utf8');
  if (source.endsWith('.vue')) {
    const { descriptor } = parse(code, { filename: source });
    code = compileScript(descriptor, {
      id: source,
      inlineTemplate: true,
    }).content;
  }
  code = ts.transpileModule(
    `import { computed, ref, shallowRef, watch, nextTick, onBeforeUnmount, useId } from '${vueUrl}';\n` +
      code,
    {
      compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
      },
    },
  ).outputText;
  for (const match of [...code.matchAll(/from (['"])([^'"]+)\1/g)]) {
    const specifier = match[2];
    const next =
      specifier === 'vue'
        ? vueUrl
        : specifier === 'element-plus'
          ? pathToFileURL(elementStub).href
          : specifier.startsWith('.')
            ? await compile(resolve(dirname(source), specifier))
            : specifier;
    code = code.replace(match[0], `from '${next}'`);
  }
  await writeFile(target, code);
  return url;
}

try {
  const { getTagEntries, normalizeLimit, getCountProps, toTagValues } =
    await import(await compile('src/components/SuperTags/config.ts'));
  const { useTagsPopover } = await import(
    await compile('src/components/SuperTags/useTagsPopover.ts')
  );
  const { default: SuperTags } = await import(
    await compile('src/components/SuperTags/index.vue')
  );
  const { default: TableCell } = await import(
    await compile('src/components/SuperTable/TableCell.vue')
  );
  assert.deepEqual(
    [undefined, -1, 1.5, NaN, Infinity, '2', null].map(normalizeLimit),
    Array(7).fill(2),
  );
  assert.equal(normalizeLimit(0), 0);
  assert.equal(normalizeLimit('all'), Infinity);
  const values = Object.freeze([
    '重复',
    '重复',
    0,
    false,
    { key: 0, label: () => '函数', props: { type: 'danger' } },
    { label: { label: () => '对象' } },
  ]);
  const entries = getTagEntries(values, { type: 'info', size: 'small' });
  assert.deepEqual(
    entries.map((item) => item.label),
    ['重复', '重复', '0', 'false', '函数', '对象'],
  );
  assert.equal(entries[4].props.type, 'danger');
  assert.equal(entries[4].props.size, 'small');
  assert.equal(entries[4].key, 'item:number:0');
  assert.notEqual(entries[0].key, entries[4].key);
  assert.deepEqual(
    getCountProps({
      closable: true,
      type: 'success',
      onClose() {},
      onClick() {},
    }),
    { type: 'success' },
  );
  assert.deepEqual(toTagValues(false), [false]);
  assert.deepEqual(toTagValues([0, 'a', { label: 'b' }]), [
    0,
    'a',
    { label: 'b' },
  ]);
  console.log(
    '通过：数量边界、顺序重复项、0/false、LabelValue、属性优先级与计数隔离',
  );

  mock.timers.enable({ apis: ['setTimeout'] });
  const events = [];
  let legacyClicks = 0;
  let legacyCloses = 0;
  const group = mount(
    SuperTags,
    {
      tags: values,
      props: {
        closable: true,
        onClick: () => legacyClicks++,
        onClose: () => legacyCloses++,
      },
    },
    {
      onTagClick: (value) => events.push(['click', value]),
      onTagClose: (value) => events.push(['close', value]),
    },
    {
      tag: (scope) =>
        h(
          'label',
          { index: scope.index, overflow: scope.overflow },
          scope.label,
        ),
    },
  );
  const button = () => byKind(group.host, 'button')[0];
  assert.equal(button().textContent, '+4');
  assert.deepEqual(
    byKind(group.host, 'label').map((node) => node.props.index),
    [0, 1],
  );
  assert.equal(byKind(group.host, 'tag').at(-1).props.closable, undefined);
  invoke(button().props.onPointerenter, { pointerType: 'mouse' });
  await nextTick();
  assert.deepEqual(
    byKind(group.host, 'label')
      .filter((node) => node.props.overflow)
      .map((node) => node.props.index),
    [2, 3, 4, 5],
  );
  const hiddenTag = byKind(group.host, 'tag').find((node) =>
    node.children.some((child) => child.props.overflow),
  );
  hiddenTag.props.fireClick({ type: 'click' });
  hiddenTag.props.fireClose({ type: 'close' });
  assert.equal(legacyClicks, 1);
  assert.equal(legacyCloses, 1);
  assert.equal(events[0][1].index, 2);
  assert.equal(events[0][1].tag, 0);
  assert.equal(values.length, 6);
  console.log(
    '通过：真实组件切片、剩余浮层、插槽源索引、回调兼容与受控关闭事件',
  );

  const panel = () =>
    walk(group.host, (node) => node.props.role === 'group')[0];
  invoke(button().props.onPointerleave, {});
  mock.timers.tick(119);
  assert.ok(panel());
  invoke(panel().props.onPointerenter, { pointerType: 'mouse' });
  mock.timers.tick(1);
  await nextTick();
  assert.ok(panel());
  invoke(panel().props.onPointerleave, {});
  mock.timers.tick(120);
  await nextTick();
  assert.equal(panel(), undefined);
  button().focus();
  await nextTick();
  invoke(button().props.onPointerleave, {});
  mock.timers.tick(120);
  await nextTick();
  assert.ok(panel());
  invoke(button().props.onKeydown, {
    key: 'ArrowDown',
    preventDefault() {},
    stopPropagation() {},
  });
  await nextTick();
  await nextTick();
  assert.equal(document.activeElement, panel());
  const escape = new Event('keydown', { cancelable: true });
  Object.defineProperty(escape, 'key', { value: 'Escape' });
  document.dispatchEvent(escape);
  await nextTick();
  assert.equal(panel(), undefined);
  assert.equal(document.activeElement, button());
  invoke(button().props.onPointerenter, { pointerType: 'touch' });
  await nextTick();
  assert.equal(panel(), undefined, '触摸移入不提前打开或制造持续悬停状态');
  invoke(button().props.onClick, { stopPropagation() {} });
  await nextTick();
  assert.ok(panel());
  invoke(button().props.onPointerleave, { pointerType: 'touch' });
  document.activeElement = undefined;
  mock.timers.tick(120);
  await nextTick();
  assert.ok(panel(), '触摸点击后离开事件不启动悬停关闭');
  group.props.value = { ...group.props.value, tags: values.slice(1) };
  await nextTick();
  assert.equal(button().textContent, '+3');
  const updatedHidden = byKind(group.host, 'tag').find((node) =>
    node.children.some((child) => child.props.overflow),
  );
  updatedHidden.props.fireClick({ type: 'click' });
  assert.equal(events.at(-1)[1].index, 2);
  assert.equal(events.at(-1)[1].tag, false);
  group.props.value = { ...group.props.value, tags: values };
  await nextTick();
  assert.equal(button().textContent, '+4');
  byKind(group.host, 'popover')[0].props.outside();
  await nextTick();
  assert.equal(panel(), undefined);
  console.log(
    '通过：悬停移入、120ms 关闭、焦点保持、键盘进入/Esc 恢复及外部关闭接线',
  );

  group.props.value = { ...group.props.value, limit: 'all' };
  await nextTick();
  assert.equal(button(), undefined);
  assert.deepEqual(
    byKind(group.host, 'label').map((node) => node.props.index),
    [0, 1, 2, 3, 4, 5],
  );
  group.props.value = { ...group.props.value, limit: 0 };
  await nextTick();
  assert.equal(button().textContent, '+6');
  invoke(button().props.onClick, { stopPropagation() {} });
  await nextTick();
  group.props.value = { ...group.props.value, tags: [] };
  await nextTick();
  assert.equal(button(), undefined);
  assert.equal(panel(), undefined);
  console.log('通过：全部展示、仅计数、动态归零与空数组');

  let cellCloses = 0;
  const cell = mount(TableCell, {
    context: {
      row: {},
      index: 0,
      value: ['甲', '乙', '丙'],
      column: {
        prop: 'tags',
        tableType: 'tag',
        cellProps: {
          limit: 1,
          type: 'success',
          onClose: () => cellCloses++,
        },
      },
    },
  });
  assert.equal(byKind(cell.host, 'button')[0].textContent, '+2');
  assert.equal(byKind(cell.host, 'tag')[0].props.type, 'success');
  assert.equal(byKind(cell.host, 'tag')[0].props.limit, undefined);
  byKind(cell.host, 'tag')[0].props.fireClose({});
  assert.equal(cellCloses, 1);
  cell.props.value.context.column.cellProps.limit = 'all';
  await nextTick();
  assert.equal(byKind(cell.host, 'button').length, 0);
  assert.equal(byKind(cell.host, 'tag').length, 3);
  cell.props.value.context.value = false;
  await nextTick();
  assert.equal(byKind(cell.host, 'tag')[0].textContent, 'false');
  console.log('通过：普通表格单值/数组、limit 与原 ElTag 属性及回调');

  let interaction;
  const has = ref(true);
  const lifecycle = mount(
    {
      setup() {
        interaction = useTagsPopover(has);
        return () => null;
      },
    },
    {},
  );
  document.activeElement = undefined;
  interaction.enter('reference');
  has.value = false;
  assert.equal(interaction.visible.value, false);
  has.value = true;
  interaction.open();
  interaction.leave('reference');
  mock.timers.tick(120);
  assert.equal(
    interaction.visible.value,
    false,
    '归零移除入口后不保留旧悬停状态',
  );
  interaction.enter('content');
  interaction.visible.value = false;
  interaction.open();
  interaction.leave('reference');
  mock.timers.tick(120);
  assert.equal(
    interaction.visible.value,
    false,
    '外部关闭后不保留已卸载浮层的悬停状态',
  );
  interaction.open();
  interaction.leave('reference');
  lifecycle.app.unmount();
  apps.delete(lifecycle.app);
  mock.timers.tick(120);
  assert.equal(interaction.visible.value, true, '卸载后不再执行待关闭回调');
  console.log('通过：卸载清理关闭计时器');
} finally {
  for (const app of apps) app.unmount();
  mock.timers.reset();
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
  await rm(temporary, { recursive: true, force: true });
}
