import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse, compileScript } from 'vue/compiler-sfc';
import ts from 'typescript';
import { createRenderer, createSSRApp, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';

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
  getAttribute(name) {
    return this.props[name] ?? null;
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  removeAttribute(name) {
    delete this.props[name];
  }
  get textContent() {
    return (
      this.text ?? this.children.map((child) => child.textContent).join('')
    );
  }
}
const testDocument = new EventTarget();
testDocument.activeElement = undefined;
testDocument.documentElement = new Element('html');
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
function mount(component, initial, listeners = {}, slots, plugin) {
  const props = ref(initial);
  const host = new Element('host');
  const app = renderer.createApp({
    render: () => h(component, { ...props.value, ...listeners }, slots),
  });
  if (plugin) app.use(plugin);
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
export { tagProps } from '${import.meta.resolve('element-plus')}';
export { default as dayjs } from '${import.meta.resolve('dayjs')}';
export const ElTag = defineComponent({
  inheritAttrs: false,
  props: ['type','size','effect','color','round','hit','disableTransitions','closable'],
  emits: ['click','close'],
  setup(props, { attrs, slots, emit, expose }) {
    expose({ get token() { return props.type; }, readType() { return this.token; } });
    return () => h('tag', { ...attrs, ...props, fireClick: event => emit('click', event), fireClose: event => emit('close', event) }, [slots.default?.(), slots.extra?.({ effect: props.effect })]);
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
    let reference;
    return () => h('popover', { ...props, getReference: () => reference, outside: () => emit('update:modelValue', false) }, [
      slots.reference?.({ setReference(element) { reference = element; } }), props.modelValue ? slots.content?.() : null
    ]);
  }
});
`,
);
const compiled = new Map();
async function compile(relative, realElement = false) {
  const source = resolve(root, relative);
  if (source.endsWith('/SuperPopover/index.vue'))
    return pathToFileURL(popoverStub).href;
  const key = `${realElement}:${source}`;
  if (compiled.has(key)) return compiled.get(key);
  const target = join(temporary, `source-${compiled.size}.mjs`);
  const url = pathToFileURL(target).href;
  compiled.set(key, url);
  let code = await readFile(source, 'utf8');
  if (source.endsWith('.vue')) {
    const { descriptor } = parse(code, { filename: source });
    code = compileScript(descriptor, {
      id: source,
      inlineTemplate: true,
    }).content;
  }
  const imported = new Set();
  for (const statement of ts.createSourceFile(
    source,
    code,
    ts.ScriptTarget.Latest,
  ).statements) {
    if (
      ts.isImportDeclaration(statement) &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      for (const element of statement.importClause.namedBindings.elements)
        imported.add(element.name.text);
    }
  }
  const autoImports = [
    'computed',
    'ref',
    'shallowRef',
    'watch',
    'nextTick',
    'onBeforeUnmount',
    'useId',
    'defineComponent',
    'h',
  ].filter((name) => !imported.has(name));
  code = ts.transpileModule(
    `import { ${autoImports.join(', ')} } from '${vueUrl}';\n` + code,
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
        : specifier === 'element-plus' && !realElement
          ? pathToFileURL(elementStub).href
          : specifier.startsWith('.')
            ? await compile(resolve(dirname(source), specifier), realElement)
            : specifier === 'element-plus'
              ? import.meta.resolve('element-plus')
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
  const { default: SuperTag } = await import(
    await compile('src/components/SuperTag/index.vue')
  );
  const { createWtTheme, useWtTheme } = await import(
    await compile('src/theme/index.ts')
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

  const tagRef = ref();
  const directEvents = [];
  const direct = mount(
    SuperTag,
    {
      type: 'success',
      closable: true,
      color: '#475569',
      class: 'consumer',
      style: { color: '#fff' },
      'data-tag': 'direct',
    },
    {
      ref: tagRef,
      onClick: (event) => directEvents.push(event),
      onClose: (event) => directEvents.push(event),
    },
    {
      default: () => h('strong', '自定义'),
      extra: (scope) => h('extra', scope.effect),
    },
  );
  const nativeTag = () => byKind(direct.host, 'tag')[0];
  assert.equal(direct.host.children.length, 1, '不增加根 DOM 包装');
  assert.match(nativeTag().props.class, /consumer/);
  assert.match(nativeTag().props.class, /super-tag/);
  assert.equal(nativeTag().props.style.color, '#fff');
  assert.equal(nativeTag().props.color, '#475569');
  assert.equal(nativeTag().props['data-tag'], 'direct');
  assert.equal(nativeTag().props.effect, 'light', '无主题插件时使用 light');
  assert.equal(byKind(direct.host, 'strong')[0].textContent, '自定义');
  assert.equal(
    byKind(direct.host, 'extra')[0].textContent,
    'light',
    '具名插槽及作用域透明转发',
  );
  const click = { type: 'click' },
    close = { type: 'close' };
  nativeTag().props.fireClick(click);
  nativeTag().props.fireClose(close);
  assert.deepEqual(
    directEvents,
    [click, close],
    '事件保持原始参数且仅触发一次',
  );
  assert.equal(tagRef.value.$el, nativeTag());
  assert.equal(tagRef.value.readType(), 'success', '底层方法保持 this');
  const detachedMethod = tagRef.value.readType;
  assert.equal(detachedMethod(), 'success', '取出方法后仍保留底层上下文');
  direct.props.value = {
    ...direct.props.value,
    type: 'danger',
    effect: 'plain',
  };
  await nextTick();
  assert.equal(tagRef.value.token, 'danger', '代理实时读取底层公开属性');
  assert.equal(tagRef.value.readType(), 'danger');
  assert.equal(byKind(direct.host, 'extra')[0].textContent, 'plain');

  let theme;
  const themedProps = ref({});
  const themed = mount(
    {
      setup() {
        theme = useWtTheme();
        return () =>
          h(SuperTags, {
            tags: [
              '默认',
              { label: '覆盖', props: { effect: 'plain' } },
              '剩余',
            ],
            props: themedProps.value,
          });
      },
    },
    {},
    {},
    undefined,
    createWtTheme(),
  );
  function tagEffects() {
    return byKind(themed.host, 'tag').map((tag) => tag.props.effect);
  }
  assert.deepEqual(tagEffects(), ['light', 'plain', 'light']);
  for (const material of ['solid', 'glass']) {
    theme.setTheme('dark', material);
    await nextTick();
    assert.deepEqual(tagEffects(), ['dark', 'plain', 'dark']);
    themedProps.value = { effect: 'light' };
    await nextTick();
    assert.deepEqual(tagEffects(), ['light', 'plain', 'light']);
    themedProps.value = {};
    await nextTick();
    assert.deepEqual(
      tagEffects(),
      ['dark', 'plain', 'dark'],
      '移除显式配置恢复自动模式',
    );
    theme.setScheme('light');
    await nextTick();
    assert.deepEqual(tagEffects(), ['light', 'plain', 'light']);
  }
  byKind(themed.host, 'tag')
    .at(-1)
    .props.fireClick({ stopPropagation() {} });
  await nextTick();
  theme.setScheme('dark');
  await nextTick();
  assert.deepEqual(
    tagEffects(),
    ['dark', 'plain', 'dark', 'dark'],
    '已打开浮层同步更新主题',
  );
  themed.app.unmount();
  apps.delete(themed.app);
  console.log(
    '通过：单标签透传、插槽作用域、原始事件、实例及方法上下文、四主题与显式配置优先',
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
  const button = () =>
    walk(group.host, (node) => node.props.role === 'button')[0];
  assert.equal(
    byKind(group.host, 'button').length,
    0,
    '+N 不生成原生 button 包装',
  );
  assert.equal(button().kind, 'tag');
  assert.equal(button().props.tabindex, '0');
  assert.equal(
    byKind(group.host, 'popover')[0].props.getReference(),
    button(),
    '绑定实际 ElTag 元素',
  );
  assert.equal(button().textContent, '+4');
  assert.deepEqual(
    byKind(group.host, 'label').map((node) => node.props.index),
    [0, 1],
  );
  assert.equal(byKind(group.host, 'tag').at(-1).props.closable, false);
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
  button().props.fireClick({ stopPropagation() {} });
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
  for (const key of ['Enter', ' ']) {
    let prevented = false;
    invoke(button().props.onKeydown, {
      key,
      preventDefault() {
        prevented = true;
      },
    });
    await nextTick();
    assert.ok(panel(), `${key} 打开浮层`);
    assert.equal(prevented, true, '阻止空格滚动或表单默认行为');
    byKind(group.host, 'popover')[0].props.outside();
    await nextTick();
  }
  const oldReference = byKind(group.host, 'popover')[0].props.getReference;
  console.log(
    '通过：悬停移入、120ms 关闭、焦点保持、键盘进入/Esc 恢复及外部关闭接线',
  );

  group.props.value = { ...group.props.value, limit: 'all' };
  await nextTick();
  assert.equal(button(), undefined);
  assert.equal(oldReference(), null, '移除 +N 后清理参考元素');
  assert.deepEqual(
    byKind(group.host, 'label').map((node) => node.props.index),
    [0, 1, 2, 3, 4, 5],
  );
  group.props.value = { ...group.props.value, limit: 0 };
  await nextTick();
  assert.equal(button().textContent, '+6');
  button().props.fireClick({ stopPropagation() {} });
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
  assert.equal(
    walk(cell.host, (node) => node.props.role === 'button')[0].textContent,
    '+2',
  );
  assert.equal(byKind(cell.host, 'tag')[0].props.type, 'success');
  assert.equal(byKind(cell.host, 'tag')[0].props.limit, undefined);
  byKind(cell.host, 'tag')[0].props.fireClose({});
  assert.equal(cellCloses, 1);
  cell.props.value.context.column.cellProps.limit = 'all';
  await nextTick();
  assert.equal(
    walk(cell.host, (node) => node.props.role === 'button').length,
    0,
  );
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

  // 用真实 ElTag 做 SSR，补充边界替身无法证明的默认类名与外层尺寸继承。
  const { default: RealSuperTag } = await import(
    await compile('src/components/SuperTag/index.vue', true)
  );
  const { createWtTheme: realTheme } = await import(
    await compile('src/theme/index.ts', true)
  );
  const { ElConfigProvider } = await import('element-plus');
  delete globalThis.document;
  try {
    for (const scheme of ['light', 'dark']) {
      for (const material of ['solid', 'glass']) {
        const app = createSSRApp({
          render: () =>
            h(
              ElConfigProvider,
              { size: 'small' },
              {
                default: () =>
                  h(
                    RealSuperTag,
                    { type: 'success', closable: true, 'data-real': 'tag' },
                    () => '真实标签',
                  ),
              },
            ),
        });
        app.use(realTheme({ scheme, material }));
        const html = await renderToString(app);
        assert.match(html, new RegExp(`el-tag--${scheme}`));
        assert.match(html, /el-tag--small/);
        assert.match(html, /el-tag--success/);
        assert.match(html, /super-tag/);
        assert.match(html, /data-real="tag"/);
        assert.equal(
          (html.match(/<button/g) ?? []).length,
          1,
          '关闭按钮由原生 ElTag 生成',
        );
        assert.doesNotMatch(html, /<div/);
      }
    }
    const app = createSSRApp({
      render: () =>
        h(
          RealSuperTag,
          {
            effect: 'plain',
            size: 'large',
            round: true,
            color: '#475569',
            style: { color: '#ffffff' },
          },
          () => '覆盖',
        ),
    });
    app.use(realTheme({ scheme: 'dark' }));
    const html = await renderToString(app);
    assert.match(html, /el-tag--plain/);
    assert.match(html, /el-tag--large/);
    assert.match(html, /is-round/);
    assert.match(html, /background-color:#475569/);
    assert.match(html, /color:#ffffff/);
  } finally {
    Object.defineProperty(globalThis, 'document', {
      value: testDocument,
      configurable: true,
    });
  }
  console.log(
    '通过：真实 ElTag SSR 四主题、外层尺寸继承、显式外观及无额外包装；非浏览器验收',
  );
} finally {
  for (const app of apps) app.unmount();
  mock.timers.reset();
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
  await rm(temporary, { recursive: true, force: true });
}
