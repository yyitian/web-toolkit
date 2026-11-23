import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse, compileScript, compileStyle } from 'vue/compiler-sfc';
import ts from 'typescript';
import { styles, rule } from './verify-style-helpers.mjs';
import {
  createRenderer,
  h,
  nextTick,
  ref,
  onMounted,
  onBeforeUnmount,
} from 'vue';

// 编译真实组件；仅替换 Element Plus 和浏览器定位边界，不引入测试框架。
const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'wt-card-'));
const vueUrl = import.meta.resolve('vue');
const originals = new Map(
  ['Node', 'HTMLElement', 'document', 'ResizeObserver'].map((key) => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ]),
);
class Element extends EventTarget {
  constructor(kind) {
    super();
    this.kind = kind;
    this.style = {};
    this.children = [];
    this.props = {};
    this.rect = { width: 0, height: 0 };
  }
  contains(node) {
    return this === node || this.children.some((child) => child.contains(node));
  }
  getBoundingClientRect() {
    return this.rect;
  }
  querySelectorAll() {
    return walk(
      this,
      (node) =>
        node !== this &&
        (node.kind === 'button' ||
          node.props.role === 'menuitem' ||
          node.props.tabindex === 0),
    );
  }
  matches(selector) {
    return selector.split(',').some((part) => {
      const value = part.trim();
      if (value === ':disabled' || value === '[disabled]')
        return Boolean(this.props.disabled);
      if (value === '[aria-disabled="true"]')
        return this.props['aria-disabled'] === 'true';
      if (value === '[hidden]') return Boolean(this.props.hidden);
      if (value === '[inert]') return Boolean(this.props.inert);
      return (
        value === this.kind ||
        (value === '[role="menuitem"]' && this.props.role === 'menuitem')
      );
    });
  }
  closest(selector) {
    return this.matches(selector) ? this : this.parent?.closest(selector);
  }
  hasAttribute(name) {
    return this.props[name] !== undefined && this.props[name] !== false;
  }
  focus() {
    document.activeElement = this;
  }
  get textContent() {
    return (
      this.text ?? this.children.map((child) => child.textContent).join('')
    );
  }
}
const observers = new Set();
class Observer {
  constructor(callback) {
    this.callback = callback;
    this.nodes = new Set();
    observers.add(this);
  }
  observe(node) {
    observers.add(this);
    this.nodes.add(node);
  }
  disconnect() {
    this.nodes.clear();
    observers.delete(this);
  }
}
Object.defineProperties(globalThis, {
  Node: { value: Element, configurable: true },
  HTMLElement: { value: Element, configurable: true },
  document: { value: new EventTarget(), configurable: true },
  ResizeObserver: { value: Observer, configurable: true },
});
document.body = new Element('body');
const renderer = createRenderer({
  querySelector: () => document.body,
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
  patchProp: (node, key, _old, value) => {
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
const apps = new Set();
function mount(component, initial = {}, listeners = {}, slots) {
  const props = ref(initial),
    instance = ref(),
    host = new Element('host');
  const app = renderer.createApp({
    render: () =>
      h(
        component,
        { ...props.value, ...listeners, ref: instance },
        typeof slots === 'function' ? slots() : slots,
      ),
  });
  app.mount(host);
  apps.add(app);
  return { props, instance, host, app };
}
const walk = (node, predicate) => [
  ...(predicate(node) ? [node] : []),
  ...node.children.flatMap((child) => walk(child, predicate)),
];
const kind = (host, name) => walk(host, (node) => node.kind === name);
const cls = (host, name) =>
  walk(host, (node) =>
    String(node.props.class ?? '')
      .split(' ')
      .includes(name),
  );
async function settle() {
  for (let i = 0; i < 10; i++) {
    await nextTick();
    await Promise.resolve();
  }
}
const elementStub = join(temporary, 'element.mjs');
await writeFile(
  elementStub,
  `
import { defineComponent, h, watch, ref } from '${vueUrl}';
export { default as dayjs } from '${import.meta.resolve('dayjs')}';
export const ElProgress = defineComponent({setup: () => () => h('progress')});
export const ElCheckbox = defineComponent({ props: ['modelValue','disabled','indeterminate'], emits: ['change'], setup: (p,c) => () => h('checkbox', {...p, change: v => c.emit('change',v)}, c.slots.default?.()) });
export const ElSwitch = defineComponent({ props: ['modelValue','disabled','loading'], emits: ['change'], setup: (p,c) => () => h('switch', {...p, change: v => c.emit('change',v)}) });
export const ElPagination = defineComponent({ props: ['pageSizes','pageSize','currentPage','total'], emits: ['update:pageSize','update:currentPage'], setup: (p,c) => () => h('pagination', {...p, changeSize: n=>c.emit('update:pageSize', n), changePage: n=>c.emit('update:currentPage',n)}) });
export const ElTableColumn = defineComponent({setup: (_p,c) => () => h('native-column', {...c.attrs})});
export const ElTable = defineComponent({
 props: ['data','rowKey'], emits: ['selection-change','sort-change'],
 setup(p, {emit, expose, slots}) {
   const selected = ref([]);
   const clearSelection = () => { selected.value = []; emit('selection-change', []); };
   expose({ clearSelection,
     toggleRowSelection(row, value) { const next = value ?? !selected.value.includes(row); selected.value = selected.value.filter(item => item !== row); if (next) selected.value.push(row); emit('selection-change', selected.value.slice()); },
     sort(prop, order) { emit('sort-change', {prop,order}); }, clearSort() { emit('sort-change', {prop:null,order:null}); },
     getSelectionRows() { return selected.value.slice(); }
   });
   watch(() => p.data, clearSelection);
   return () => h('native-table', {data:p.data}, [...(slots.default?.() ?? []), ...(p.data?.length ? [] : slots.empty?.() ?? [])]);
 }
});
`,
);
const overrides = new Map();
async function stub(path, code) {
  const target = join(temporary, `stub-${overrides.size}.mjs`);
  await writeFile(
    target,
    `import { defineComponent, h, onMounted } from '${vueUrl}';\n${code}`,
  );
  overrides.set(resolve(root, path), pathToFileURL(target).href);
}
await stub('src/components/useWtLocale.ts', 'export function useWtLocale() {}');
await stub(
  'src/components/SuperIcon/index.vue',
  'export default defineComponent({setup: () => () => h("icon")});',
);
await stub(
  'src/components/SuperButton/index.vue',
  `export default defineComponent({inheritAttrs:false,props:['icon','square','disabled','loading','label','text'],setup:(p,c)=>()=>h('button',{...c.attrs,disabled:p.disabled||p.loading,square:p.square},c.slots.default?.()??p.label)});`,
);
await stub(
  'src/components/SuperPopover/index.vue',
  `export default defineComponent({props:['modelValue','trigger','disabled'],emits:['update:modelValue'],setup:(p,c)=>()=>h('popover',{
 mode:p.trigger??'hover',
 hoverIn:()=>{if(!p.disabled&&(!p.trigger||p.trigger==='hover'))c.emit('update:modelValue',true)},
 hoverOut:()=>{if(!p.trigger||p.trigger==='hover')c.emit('update:modelValue',false)}
},[c.slots.reference?.({setReference:()=>{}}),...(p.modelValue?c.slots.content?.()??[]:[])])});`,
);
await stub(
  'src/components/SuperTags/index.vue',
  'export default defineComponent({props:["tags","limit"],setup:p=>()=>h("tags",{...p})});',
);
await stub(
  'src/components/SuperTable/TableSearch.vue',
  `export default defineComponent({emits:['initialize','search'],setup(_p,{emit}){onMounted(()=>emit('initialize',{}));return ()=>h('search',{submit:value=>emit('search',value)});}});`,
);
const compiled = new Map();
async function compile(relative) {
  const source = resolve(root, relative);
  if (overrides.has(source)) return overrides.get(source);
  if (compiled.has(source)) return compiled.get(source);
  const target = join(temporary, `source-${compiled.size}.mjs`),
    url = pathToFileURL(target).href;
  compiled.set(source, url);
  let code = await readFile(source, 'utf8');
  if (source.endsWith('.vue'))
    code = compileScript(parse(code, { filename: source }).descriptor, {
      id: source,
      inlineTemplate: true,
      templateOptions: { compilerOptions: { hoistStatic: false } },
    }).content;
  code = ts.transpileModule(
    `import { h, toRaw, readonly, computed, ref, shallowRef, watch, nextTick, onMounted, onUpdated, onBeforeUnmount, useAttrs, useSlots, useId, toRef, defineComponent } from '${vueUrl}';\n` +
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
            : import.meta.resolve(specifier);
    code = code.replace(match[0], `from '${next}'`);
  }
  await writeFile(target, code);
  return url;
}
try {
  const actionFile = resolve(root, 'src/components/SuperTable/CardActions.vue');
  const actionStyle = parse(await readFile(actionFile, 'utf8')).descriptor
    .styles[0];
  const actionCSS = compileStyle({
    source: actionStyle.content,
    filename: actionFile,
    id: 'data-v-actions',
    scoped: actionStyle.scoped,
  }).code;
  assert.match(
    actionCSS,
    /\.super-table-card:hover\s+\.super-table-card__actions/,
  );
  assert.match(
    actionCSS,
    /\.super-table-card:focus-within\s+\.super-table-card__actions/,
  );
  assert.match(actionCSS, /@media\s*\(hover: none\)/);
  assert.match(
    rule(actionCSS, /^\s*\.super-table-card__actions\s*$/),
    /--wt-table-card-actions-bg/,
  );
  assert.doesNotMatch(actionCSS, /--(?:wt|el)-button-/);
  assert.match(
    rule(actionCSS, /^\s*\.super-table-card__actions\.is-image\s*$/),
    /--wt-surface-overlay/,
  );
  assert.match(actionCSS, /--wt-table-card-actions-shadow/);
  const imageCSS = await styles('SuperTable/CardImage.vue');
  assert.match(imageCSS, /scale\(1\.04\)/);
  for (const trigger of ['hover', 'focus-within']) {
    assert.match(
      rule(
        imageCSS,
        new RegExp(
          `\\.super-table-card:not\\(\\.is-blocked\\):${trigger} img\\.is-ready\\[data-v-[^\\]]+\\]`,
        ),
      ),
      /transform: scale\(1\.04\)/,
    );
  }
  assert.match(imageCSS, /transform 240ms ease-out/);
  assert.match(imageCSS, /prefers-reduced-motion/);
  assert.doesNotMatch(
    rule(imageCSS, /\.super-table-card__image-controls/),
    /transform:/,
  );
  const gridCSS = await styles('SuperTable/TableCards.vue');
  assert.match(gridCSS, /--wt-result-x/);
  assert.match(gridCSS, /prefers-reduced-motion/);
  assert.match(gridCSS, /padding: 24px/);

  const { getCardColumns, getPageOptions, normalizePageSize } = await import(
    await compile('src/components/SuperTable/pagination.ts')
  );
  assert.deepEqual(
    [0, 495, 496, 751, 752, 1007, 1008, 1519, 1520, 2031, 2032, 3055, 3056].map(
      (n) => getCardColumns(n),
    ),
    [1, 1, 2, 2, 3, 3, 4, 4, 6, 6, 8, 8, 12],
  );
  assert.equal(getCardColumns(900, 180, 0), 4);
  const custom = getPageOptions('card', [0, 36, 12, 12, -1, 1.5, NaN]);
  assert.deepEqual(custom.sizes, [36, 12]);
  assert.equal(normalizePageSize(undefined, custom), 36);
  assert.equal(normalizePageSize(12, custom), 12);
  assert.equal(normalizePageSize(undefined, getPageOptions('card')), 24);
  const { resolveStatus, SUPER_STATUS_PRESETS } = await import(
    await compile('src/components/SuperStatus/config.ts')
  );
  const before = JSON.stringify(SUPER_STATUS_PRESETS);
  assert.deepEqual(
    SUPER_STATUS_PRESETS.map(({ value, type }) => [value, type]),
    [
      ['pending', 'info'],
      ['running', 'primary'],
      ['success', 'success'],
      ['failed', 'danger'],
      ['stopped', 'warning'],
      ['unknown', 'info'],
    ],
  );
  assert.deepEqual(resolveStatus({ value: 'starting' }), {
    label: '未知',
    type: 'info',
    color: undefined,
  });
  assert.deepEqual(
    resolveStatus({
      value: 'starting',
      options: [{ value: 'starting', label: '启动中', type: 'warning' }],
    }),
    { label: '启动中', type: 'warning', color: undefined },
  );
  const { default: SuperStatus } = await import(
    await compile('src/components/SuperStatus/index.vue')
  );
  const statusView = mount(SuperStatus, { value: 'pending' });
  assert.equal(cls(statusView.host, 'super-status__dot').length, 0);
  const pendingIcon = cls(statusView.host, 'super-status__icon')[0];
  assert.equal(pendingIcon.kind, 'svg');
  assert.match(pendingIcon.props.class, /active/);
  assert.equal(pendingIcon.props.width, '1em');
  assert.equal(pendingIcon.props.height, '1em');
  assert.equal(pendingIcon.props['aria-hidden'], 'true');
  statusView.props.value = { value: 'stopped' };
  await settle();
  assert.equal(cls(statusView.host, 'super-status__icon').length, 0);
  assert.equal(cls(statusView.host, 'super-status__dot').length, 1);
  assert.equal(
    cls(statusView.host, 'super-status')[0].props.style['--_status-color'],
    'var(--wt-color-warning)',
  );
  statusView.props.value = {
    value: 'pending',
    options: [
      { value: 'pending', label: '排队中', type: 'warning', color: 'red' },
    ],
    label: '等待处理',
    color: 'blue',
  };
  await settle();
  assert.equal(cls(statusView.host, 'super-status__icon').length, 1);
  assert.equal(
    cls(statusView.host, 'super-status__label')[0].textContent,
    '等待处理',
  );
  assert.equal(
    cls(statusView.host, 'super-status')[0].props.style['--_status-color'],
    'blue',
  );
  const statusCSS = await styles('SuperStatus/index.vue');
  assert.match(statusCSS, /prefers-reduced-motion: reduce/);
  assert.match(
    rule(statusCSS, /\.super-status__icon\.active/),
    /animation: none/,
  );
  assert.match(
    rule(statusCSS, /\.super-status__icon\[/),
    /color: var\(--wt-status-color, var\(--_status-color\)\)/,
  );
  assert.deepEqual(
    resolveStatus({
      value: 'running',
      options: [{ value: 'running', label: '执行中' }],
    }),
    { label: '执行中', type: 'primary', color: undefined },
  );
  assert.equal(
    resolveStatus({
      value: 0,
      options: [
        { value: '0', label: '字符串' },
        { value: 0, label: '数字', color: 'red' },
      ],
      color: 'blue',
    }).color,
    'blue',
  );
  assert.equal(resolveStatus({ value: 'missing' }).label, '未知');
  assert.equal(
    resolveStatus({
      value: 'new',
      options: [{ value: 'new', type: 'success' }],
    }).label,
    '未知',
  );
  assert.equal(JSON.stringify(SUPER_STATUS_PRESETS), before);
  const { cardText, getCardValue } = await import(
    await compile('src/components/SuperTable/card-config.ts')
  );
  assert.deepEqual([0, false, '', null, undefined].map(cardText), [
    '0',
    'false',
    '—',
    '—',
    '—',
  ]);
  assert.equal(
    getCardValue({ owner: { name: '路径' } }, 0, 'owner.name'),
    '路径',
  );
  console.log(
    '通过：网格全部断点、分页选项归一化、状态精确匹配与自定义优先级、字段路径和空值',
  );

  const { default: TableCard } = await import(
    await compile('src/components/SuperTable/TableCard.vue')
  );
  const changes = [];
  const row = {
    id: 1,
    name: '任务',
    enabled: 'yes',
    tags: ['甲', '乙'],
    createdAt: 0,
  };
  const card = {
    fields: { title: 'name', tags: 'tags', createdAt: 'createdAt' },
    switch: { prop: 'enabled', activeValue: 'yes', inactiveValue: 'no' },
  };
  const item = mount(
    TableCard,
    {
      context: { row, index: 0, selected: false, selectable: true },
      card,
      selection: true,
    },
    { 'onSwitch-change': (c) => changes.push(c) },
    { 'card-extra': () => h('extra', '自定义') },
  );
  await settle();
  assert.equal(changes.length, 0);
  assert.equal(kind(item.host, 'switch')[0].props.modelValue, true);
  kind(item.host, 'switch')[0].props.change(false);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].value, 'no');
  assert.equal(changes[0].previousValue, 'yes');
  assert.equal(row.enabled, 'yes');
  assert.equal(kind(item.host, 'tags')[0].props.limit, 1);
  assert.equal(kind(item.host, 'extra').length, 1);
  item.props.value = {
    ...item.props.value,
    card: { fields: { title: 'name', createdAt: false } },
  };
  await settle();
  assert.equal(cls(item.host, 'super-table-card__footer').length, 0);
  const emptyActions = mount(
    TableCard,
    {
      context: { row, index: 0, selected: false, selectable: true },
      card: { fields: { title: 'name', createdAt: false } },
      selection: false,
    },
    {},
    { 'card-actions': () => [] },
  );
  await settle();
  assert.equal(cls(emptyActions.host, 'super-table-card__footer').length, 0);
  const { default: CardImage } = await import(
    await compile('src/components/SuperTable/CardImage.vue')
  );
  const image = mount(CardImage, { src: 'one.png', alt: '图' });
  kind(image.host, 'img')[0].props.onError();
  await settle();
  assert.equal(kind(image.host, 'img').length, 0);
  image.props.value = { src: 'two.png', alt: '图' };
  await settle();
  assert.equal(kind(image.host, 'img').length, 1);
  console.log(
    '通过：受控开关初始化不触发、业务值转换不修改行、标签默认折叠、空操作无底带、图片错误后换源恢复',
  );

  const defaults = mount(TableCard, {
    context: {
      row: {
        id: 2,
        title: '同名名称',
        description: false,
        icon: 'icon',
        tags: ['a'],
        createdAt: 0,
      },
      index: 0,
      selected: true,
      selectable: false,
    },
    card: {},
    selection: true,
  });
  await settle();
  assert.ok(defaults.host.textContent.includes('同名名称'));
  assert.ok(defaults.host.textContent.includes('false'));
  assert.equal(cls(defaults.host, 'super-table-card__time').length, 1);
  assert.equal(kind(defaults.host, 'checkbox')[0].props.disabled, true);
  assert.equal(kind(defaults.host, 'checkbox')[0].props.modelValue, true);
  const disabled = mount(
    TableCard,
    {
      context: { row, index: 0, selected: false, selectable: true },
      card: { ...card, switch: { ...card.switch, disabled: true } },
      selection: false,
    },
    { 'onSwitch-change': (value) => changes.push(value) },
  );
  const countBefore = changes.length;
  kind(disabled.host, 'switch')[0].props.change(false);
  assert.equal(changes.length, countBefore);
  const hidden = mount(
    TableCard,
    {
      context: { row, index: 0, selected: false, selectable: true },
      card: {
        fields: {
          title: 'name',
          description: false,
          icon: false,
          tags: false,
          createdAt: false,
        },
        status: false,
        switch: false,
        actions: false,
      },
      selection: false,
    },
    {},
    {
      'card-description': () => h('forbidden-description'),
      'card-icon': () => h('forbidden-icon'),
      'card-tags': () => h('forbidden-tags'),
      'card-created-at': () => h('forbidden-time'),
      'card-status': () => h('forbidden-status'),
      'card-actions': () => h('forbidden-actions'),
    },
  );
  await settle();
  for (const name of [
    'description',
    'icon',
    'tags',
    'time',
    'status',
    'actions',
  ])
    assert.equal(kind(hidden.host, 'forbidden-' + name).length, 0);
  assert.equal(cls(hidden.host, 'super-table-card__image').length, 1);
  assert.equal(cls(hidden.host, 'super-table-card__title').length, 1);
  assert.equal(cls(hidden.host, 'super-table-card__footer').length, 0);
  const { default: TableContent } = await import(
    await compile('src/components/SuperTable/TableContent.vue')
  );
  const native = mount(TableContent, {
    columns: [
      { prop: 'date', tableType: 'date' },
      { prop: 'index', tableType: 'index' },
      { prop: 'expand', tableType: 'expand' },
      { prop: 'progress', tableType: 'progress' },
      {
        prop: 'override',
        tableType: 'date',
        minWidth: 220,
        showOverflowTooltip: true,
      },
      {
        prop: 'props',
        tableType: 'date',
        props: { width: 200, showOverflowTooltip: true },
        width: 240,
        showOverflowTooltip: false,
      },
    ],
    data: [],
    rowKey: 'id',
    selection: false,
    selections: [],
    sort: null,
    loading: true,
    feedback: true,
  });
  await settle();
  const nativeColumns = kind(native.host, 'native-column').map(
    (node) => node.props,
  );
  assert.deepEqual(
    nativeColumns.slice(0, 3).map((p) => p.width),
    [180, 60, 48],
  );
  assert.equal(nativeColumns[3].minWidth, 160);
  assert.equal(nativeColumns[0].showOverflowTooltip, false);
  assert.equal(nativeColumns[4].width, undefined);
  assert.equal(nativeColumns[4].minWidth, 220);
  assert.equal(nativeColumns[4].showOverflowTooltip, true);
  assert.equal(nativeColumns[5].width, 240);
  assert.equal(nativeColumns[5].showOverflowTooltip, false);
  assert.equal(cls(native.host, 'super-table-skeleton__row').length, 10);
  console.log(
    '通过：默认同名映射、布尔文本、false 压制插槽、必需区域与禁用；真实列默认/覆盖和行骨架',
  );

  const { useTableMotion } = await import(
    await compile('src/components/SuperTable/useTableMotion.ts')
  );
  const view = ref('card'),
    motion = useTableMotion(view);
  const q = { page: 1, pageSize: 24, search: {}, sort: null };
  motion.begin(q);
  motion.commit(true);
  assert.equal(motion.state.value.x, 0);
  motion.begin({ ...q, page: 2 });
  motion.commit(true);
  assert.equal(motion.state.value.x, 12);
  motion.begin(q);
  motion.commit(true);
  assert.equal(motion.state.value.x, -12);
  motion.begin({ ...q, search: { name: 'a' } });
  motion.commit(true);
  assert.equal(motion.state.value.x, 0);
  motion.begin({ ...q, page: 2, search: { name: 'b' } });
  assert.equal(motion.state.value.version, 0);
  motion.commit(false);
  assert.equal(motion.state.value.version, 0);
  view.value = 'table';
  motion.begin({ ...q, page: 3 });
  motion.commit(true);
  assert.equal(motion.state.value.x, 0);
  const { useCardImage } = await import(
    await compile('src/components/SuperTable/useCardImage.ts')
  );
  mock.timers.enable({ apis: ['setTimeout'] });
  const src = ref('slow.png'),
    element = ref({ complete: false, naturalWidth: 0 });
  let imageState;
  const stateApp = mount(
    {
      setup() {
        imageState = useCardImage(src, element);
        return () => h('image-state');
      },
    },
    {},
  );
  mock.timers.tick(149);
  assert.equal(imageState.skeleton.value, false);
  mock.timers.tick(1);
  assert.equal(imageState.skeleton.value, true);
  const oldElement = element.value;
  element.value = { complete: false, naturalWidth: 0 };
  src.value = 'new.png';
  assert.equal(imageState.skeleton.value, false);
  imageState.failed({ currentTarget: oldElement });
  assert.equal(imageState.phase.value, 'loading');
  imageState.loaded({ currentTarget: element.value });
  assert.equal(imageState.phase.value, 'ready');
  const sameNode = {
    complete: false,
    naturalWidth: 0,
    getAttribute: () => 'old-dom.png',
  };
  element.value = sameNode;
  src.value = 'next-dom.png';
  imageState.loaded({ currentTarget: element.value });
  assert.equal(
    imageState.phase.value,
    'loading',
    'DOM 尚未换源时迟到的旧事件也不能完成新图片',
  );
  element.value = { complete: false, naturalWidth: 0 };
  imageState.loaded({ currentTarget: element.value });
  src.value = 'cached.png';
  element.value = { complete: true, naturalWidth: 24 };
  await settle();
  assert.equal(imageState.phase.value, 'ready');
  assert.equal(imageState.skeleton.value, false);
  element.value = { complete: false, naturalWidth: 0 };
  src.value = 'failed.png';
  imageState.failed();
  assert.equal(imageState.phase.value, 'error');
  src.value = 'unmount.png';
  stateApp.app.unmount();
  mock.timers.tick(1000);
  assert.equal(imageState.skeleton.value, false);
  mock.timers.reset();
  console.log(
    '通过：图片延迟骨架、缓存、换源迟到事件隔离、失败及卸载；成功结果翻页方向、条件变化淡入和空结果',
  );

  hidden.props.value = {
    ...hidden.props.value,
    card: {
      fields: { title: 'name' },
      status: { value: 'status' },
      actions: {},
    },
  };
  await settle();
  for (const name of [
    'description',
    'icon',
    'tags',
    'time',
    'status',
    'actions',
  ])
    assert.equal(kind(hidden.host, 'forbidden-' + name).length, 1);
  const { default: TableCards } = await import(
    await compile('src/components/SuperTable/TableCards.vue')
  );
  const skeletonCards = mount(TableCards, {
    data: [],
    selection: false,
    rowKey: (r) => String(r.id),
    isSelected: () => false,
    selectable: () => true,
    loading: true,
    feedback: true,
    pageSize: 1,
    emptyText: '空',
  });
  await settle();
  assert.equal(cls(skeletonCards.host, 'super-table-skeleton__card').length, 1);
  assert.equal(cls(skeletonCards.host, 'super-table-card').length, 0);
  assert.equal(cls(skeletonCards.host, 'super-table-cards__empty').length, 0);
  assert.equal(
    kind(native.host, 'native-table')[0].props.data.length,
    0,
    '骨架不向底层注入虚假业务行',
  );
  console.log(
    '通过：隐藏恢复插槽与底带、无映射配置、卡片骨架条数限制及空态抑制，骨架不伪造数据',
  );

  const { getCardFooterLayout } = await import(
    await compile('src/components/SuperTable/useCardFooterLayout.ts')
  );
  assert.deepEqual(getCardFooterLayout(196, 120, 68), {
    collapsed: false,
    stacked: false,
  });
  assert.deepEqual(getCardFooterLayout(195, 120, 68), {
    collapsed: true,
    stacked: false,
  });
  assert.deepEqual(getCardFooterLayout(159, 120, 68), {
    collapsed: true,
    stacked: true,
  });
  assert.deepEqual(getCardFooterLayout(68, 0, 68), {
    collapsed: false,
    stacked: false,
  });
  assert.equal(getCardFooterLayout(67, 0, 68).collapsed, true);
  assert.equal(getCardFooterLayout(20, 120, 0).collapsed, false);
  assert.equal(getCardFooterLayout(0, 120, 68).collapsed, false);

  const { default: CardFooter } = await import(
    await compile('src/components/SuperTable/CardFooter.vue')
  );
  const showActions = ref(true);
  const showTime = ref(true);
  const footer = mount(
    CardFooter,
    {},
    {},
    {
      default: () => (showTime.value ? h('span', '创建时间') : []),
      actions: () => (showActions.value ? h('button', '操作') : []),
    },
  );
  await settle();
  const footerBox = cls(footer.host, 'super-table-card__footer')[0];
  const timeBox = cls(footer.host, 'super-table-card__time-content')[0];
  const groupBox = cls(footer.host, 'super-table-card__action-group')[0];
  footerBox.rect = { width: 300, height: 32 };
  timeBox.rect = { width: 120, height: 24 };
  groupBox.rect = { width: 56, height: 32 };
  for (const observer of [...observers]) observer.callback();
  await settle();
  assert.equal(cls(footer.host, 'is-collapsed').length, 0);
  assert.equal(footerBox.props.style.minHeight, '32px');
  footerBox.rect.width = 170;
  for (const observer of [...observers]) observer.callback();
  await settle();
  assert.equal(cls(footer.host, 'is-collapsed').length, 1);
  assert.equal(cls(footer.host, 'is-stacked').length, 0);
  assert.equal(groupBox.props.inert, true);
  const more = kind(footer.host, 'button').find(
    (node) => node.props['aria-label'] === '更多操作',
  );
  assert.ok(more);
  more.props.onClick({ stopPropagation() {} });
  await settle();
  assert.equal(cls(footer.host, 'super-table-card__action-menu').length, 1);
  assert.equal(cls(footer.host, 'super-table-card__action-group')[0], groupBox);
  assert.equal(groupBox.props.inert, undefined);
  const menu = cls(footer.host, 'super-table-card__action-menu')[0];
  menu.props.onKeydown({
    key: 'Escape',
    preventDefault() {},
    stopPropagation() {},
  });
  await settle();
  assert.equal(cls(footer.host, 'super-table-card__action-menu').length, 0);
  assert.equal(document.activeElement, more);
  assert.equal(groupBox.props.inert, true);
  footerBox.rect.width = 300;
  for (const observer of [...observers]) observer.callback();
  await settle();
  assert.equal(cls(footer.host, 'is-collapsed').length, 0);
  showActions.value = false;
  await settle();
  assert.equal(cls(footer.host, 'super-table-card__footer-actions').length, 0);
  showTime.value = false;
  await settle();
  assert.equal(cls(footer.host, 'super-table-card__footer').length, 0);
  console.log(
    '通过：底部操作按实际宽度收起/展开、菜单 Esc 与焦点恢复、原操作节点移动及动态清空',
  );

  const { default: FooterActions } = await import(
    await compile('src/components/SuperTable/CardFooterActions.vue')
  );
  const disabledAction = ref(false);
  let mountedActions = 0,
    unmountedActions = 0,
    actionClicks = 0;
  const ActionProbe = {
    props: ['overflow', 'disabled'],
    setup(p) {
      onMounted(() => mountedActions++);
      onBeforeUnmount(() => unmountedActions++);
      return () =>
        h(
          'button',
          {
            disabled: p.disabled,
            'data-overflow': p.overflow,
            onClick: () => {
              if (!p.disabled) actionClicks++;
            },
          },
          p.overflow ? '查看' : '图标',
        );
    },
  };
  const reportedActionSizes = [];
  const controls = mount(
    FooterActions,
    { collapsed: true },
    { onSize: (size) => reportedActionSizes.push(size) },
    {
      default: (scope) => [
        h(ActionProbe, { ...scope, disabled: disabledAction.value }),
        h('button', '配置'),
      ],
    },
  );
  await settle();
  const actionGroup = cls(controls.host, 'super-table-card__action-group')[0];
  actionGroup.rect = { width: 68, height: 32 };
  for (const observer of [...observers]) observer.callback();
  await settle();
  const hoverBoundary = () => kind(controls.host, 'popover')[0];
  const focusBeforeHover = document.activeElement;
  assert.equal(hoverBoundary().props.mode, 'hover');
  hoverBoundary().props.hoverIn();
  await settle();
  assert.equal(cls(controls.host, 'is-open').length, 1);
  assert.equal(hoverBoundary().props.mode, 'hover');
  assert.equal(document.activeElement, focusBeforeHover, '悬停打开不抢焦点');
  hoverBoundary().props.hoverOut();
  await settle();
  assert.equal(cls(controls.host, 'is-open').length, 0);
  const openMenu = async () => {
    const button = kind(controls.host, 'button').find(
      (node) => node.props['aria-label'] === '更多操作',
    );
    button.props.onClick({ stopPropagation() {} });
    await settle();
    return button;
  };
  const moreButton = await openMenu();
  assert.equal(
    hoverBoundary().props.mode,
    'manual',
    '聚焦菜单后才临时接管关闭',
  );
  hoverBoundary().props.hoverOut();
  await settle();
  assert.equal(
    cls(controls.host, 'is-open').length,
    1,
    '键盘焦点在菜单内时移出不误关',
  );
  actionGroup.rect = { width: 220, height: 96 };
  for (const observer of [...observers]) observer.callback();
  await settle();
  assert.deepEqual(
    reportedActionSizes.at(-1),
    { width: 68, height: 32 },
    '菜单尺寸不覆盖展开尺寸快照',
  );
  actionGroup.rect = { width: 68, height: 32 };
  assert.equal(mountedActions, 1);
  assert.equal(unmountedActions, 0);
  assert.equal(
    cls(controls.host, 'super-table-card__action-group')[0],
    actionGroup,
  );
  assert.equal(kind(actionGroup, 'button')[0].props['data-overflow'], true);
  assert.equal(document.activeElement, kind(actionGroup, 'button')[0]);
  disabledAction.value = true;
  await settle();
  let popup = cls(controls.host, 'super-table-card__action-menu')[0];
  popup.props.onClick({ target: kind(actionGroup, 'button')[0] });
  assert.equal(cls(controls.host, 'is-open').length, 1, '禁用项不关闭菜单');
  popup.props.onKeydown({ key: 'ArrowDown', preventDefault() {} });
  assert.equal(
    document.activeElement,
    kind(actionGroup, 'button')[1],
    '方向键跳过禁用项',
  );
  disabledAction.value = false;
  await settle();
  const firstAction = kind(actionGroup, 'button')[0];
  firstAction.props.onClick();
  popup.props.onClick({ target: firstAction });
  await settle();
  assert.equal(actionClicks, 1);
  assert.equal(cls(controls.host, 'is-open').length, 0);
  assert.equal(document.activeElement, moreButton);
  assert.equal(
    hoverBoundary().props.mode,
    'hover',
    '关闭后恢复组件默认悬停触发',
  );
  assert.equal(kind(actionGroup, 'button')[0].props['data-overflow'], false);
  assert.equal(mountedActions, 1, '开关菜单不重复挂载操作组件');
  await openMenu();
  const outsideEvent = new Event('pointerdown');
  Object.defineProperty(outsideEvent, 'target', {
    value: new Element('outside'),
  });
  document.dispatchEvent(outsideEvent);
  await settle();
  assert.equal(cls(controls.host, 'is-open').length, 0, '外部点击关闭');
  await openMenu();
  controls.props.value = { collapsed: true, blocked: true };
  await settle();
  assert.equal(cls(controls.host, 'is-open').length, 0, '加载时关闭浮层');
  assert.equal(actionGroup.props.inert, true);
  assert.equal(
    kind(controls.host, 'button').find(
      (node) => node.props['aria-label'] === '更多操作',
    ).props.disabled,
    true,
  );
  controls.props.value = { collapsed: true };
  await settle();
  await openMenu();
  controls.props.value = { collapsed: false };
  await settle();
  assert.equal(cls(controls.host, 'super-table-card__action-menu').length, 0);
  assert.equal(cls(controls.host, 'is-probe').length, 0);
  assert.equal(document.activeElement, kind(actionGroup, 'button')[0]);
  assert.equal(
    cls(controls.host, 'super-table-card__action-group')[0],
    actionGroup,
  );
  assert.equal(mountedActions, 1);
  controls.app.unmount();
  apps.delete(controls.app);
  assert.equal(unmountedActions, 1);
  assert.ok(
    [...observers].every((observer) => !observer.nodes.has(actionGroup)),
  );
  console.log(
    '通过：默认悬停不抢焦点、聚焦后移出不误关、关闭恢复悬停；临界宽度、单次挂载、禁用及业务事件、键盘/外部点击/加载关闭与卸载清理',
  );

  const { default: SuperTable } = await import(
    await compile('src/components/SuperTable/index.vue')
  );
  const external = mount(SuperTable, {
    view: 'card',
    data: [{ id: 1, title: '第一页' }],
    columns: [{ prop: 'title', search: true }],
    total: 72,
    selection: { reserveSelection: true, selectable: () => true },
  });
  await settle();
  const gridNode = () => cls(external.host, 'super-table-cards__grid')[0];
  const enter = () => String(gridNode().props.class);
  kind(external.host, 'pagination')[0].props.changePage(2);
  await settle();
  assert.ok(!enter().includes('is-result-'), '页码变化而数据未到不播放');
  external.props.value = { ...external.props.value, loading: true };
  await settle();
  external.props.value = {
    ...external.props.value,
    data: [{ id: 2, title: '第二页' }],
  };
  await settle();
  assert.ok(!enter().includes('is-result-'), '请求中不提前入场');
  external.props.value = { ...external.props.value, loading: false };
  await settle();
  assert.equal(gridNode().props.style['--wt-result-x'], '12px');
  assert.ok(enter().includes('is-result-'));
  const settledClass = enter();
  external.instance.value.toggleRowSelection({ id: 2 }, true);
  await settle();
  assert.equal(enter(), settledClass);
  external.props.value = {
    ...external.props.value,
    data: [{ id: 2, title: '业务回写' }],
  };
  await settle();
  assert.equal(enter(), settledClass, '无查询时的新数组回写不重播');
  external.props.value = {
    ...external.props.value,
    selection: { reserveSelection: true, selectable: () => false },
  };
  await settle();
  assert.equal(external.instance.value.selections.length, 1);
  assert.equal(
    cls(external.host, 'super-table-card__selection')[0].props.disabled,
    true,
  );
  assert.equal(
    cls(external.host, 'super-table-card__selection')[0].props.modelValue,
    true,
  );
  external.instance.value.toggleRowSelection({ id: 2 }, false);
  assert.equal(external.instance.value.selections.length, 1);
  external.instance.value.clearSelection();
  await settle();
  assert.equal(external.instance.value.selections.length, 0);
  kind(external.host, 'pagination')[0].props.changePage(1);
  await settle();
  external.props.value = {
    ...external.props.value,
    data: [{ id: 1, title: '返回第一页' }],
  };
  await settle();
  assert.equal(gridNode().props.style['--wt-result-x'], '-12px');
  kind(external.host, 'pagination')[0].props.changePage(2);
  await settle();
  external.props.value = {
    ...external.props.value,
    data: [{ id: 2, title: '再次第二页' }],
  };
  await settle();
  kind(external.host, 'search')[0].props.submit({});
  await settle();
  external.props.value = {
    ...external.props.value,
    data: [{ id: 1, title: '同条件检索返回' }],
  };
  await settle();
  assert.equal(
    gridNode().props.style['--wt-result-x'],
    '0px',
    '相同条件检索回首页也应淡入',
  );
  kind(external.host, 'pagination')[0].props.changePage(3);
  await settle();
  external.props.value = { ...external.props.value, loading: true };
  await settle();
  external.props.value = { ...external.props.value, loading: false };
  await settle();
  assert.ok(
    !enter().includes('is-result-'),
    'loading 先结束而数据未到时不提前播放',
  );
  external.props.value = {
    ...external.props.value,
    data: [{ id: 3, title: 'loading 后到达的数据' }],
  };
  await settle();
  assert.equal(gridNode().props.style['--wt-result-x'], '12px');
  console.log(
    '通过：外部模式数据/加载更新顺序、前进后退及检索回首页；选中和业务回写不重播，禁用保留已选状态',
  );

  const customSlots = ref(false);
  const slotQueries = [];
  const dynamicSlots = mount(
    SuperTable,
    {
      view: 'card',
      card: { fields: { title: 'name' } },
      data: [{ id: 1, name: '动态插槽任务' }],
      selection: true,
    },
    { 'onQuery-change': (value) => slotQueries.push(value) },
    () =>
      customSlots.value
        ? {
            'card-title': ({ row }) => h('dynamic-title', row.name),
            'card-image-fallback': () => h('dynamic-fallback', '自定义缺图'),
          }
        : {},
  );
  await settle();
  dynamicSlots.instance.value.toggleRowSelection(
    { id: 1, name: '动态插槽任务' },
    true,
  );
  assert.equal(kind(dynamicSlots.host, 'dynamic-title').length, 0);
  customSlots.value = true;
  await settle();
  assert.equal(
    kind(dynamicSlots.host, 'dynamic-title').length,
    1,
    '首次渲染后新增标题插槽应生效',
  );
  assert.equal(
    kind(dynamicSlots.host, 'dynamic-fallback').length,
    1,
    '新增缺图插槽应通过两层转发',
  );
  assert.equal(
    dynamicSlots.instance.value.selections.length,
    1,
    '插槽更新不应清空勾选',
  );
  customSlots.value = false;
  await settle();
  assert.equal(kind(dynamicSlots.host, 'dynamic-title').length, 0);
  assert.equal(kind(dynamicSlots.host, 'dynamic-fallback').length, 0);
  assert.equal(slotQueries.length, 0, '插槽显隐不应触发查询');
  console.log('通过：卡片标题和缺图插槽可动态增加与移除，保留勾选且不触发查询');
  const queries = [],
    selectionEvents = [],
    updates = [];
  const rows = [
    { id: 1, name: '甲', enabled: true },
    { id: 2, name: '乙', enabled: false },
    { id: 3, name: '丙', enabled: true },
  ];
  const config = { rowKey: 'id', pagination: true };
  const selection = { reserveSelection: true, selectable: (r) => r.enabled };
  const table = mount(
    SuperTable,
    {
      view: 'card',
      card: { fields: { title: 'name' } },
      data: rows,
      total: 60,
      selection,
      config,
    },
    {
      'onQuery-change': (q) => queries.push(q),
      'onSelection-change': (r) => selectionEvents.push(r),
      'onUpdate:pageSize': (n) => updates.push(n),
    },
  );
  await settle();
  assert.equal(queries.length, 0);
  assert.equal(table.instance.value.getQuery().pageSize, 24);
  assert.deepEqual(updates, [24]);
  assert.equal(table.instance.value.elTable, undefined);
  table.instance.value.toggleRowSelection(rows[1], true);
  assert.equal(selectionEvents.length, 0);
  kind(table.host, 'checkbox')[0].props.change(true);
  await settle();
  assert.deepEqual(
    table.instance.value.selections.map((r) => r.id),
    [1, 3],
  );
  assert.equal(selectionEvents.length, 1);
  // 列数改变及隐藏恢复均不查询或清空勾选，CSS 测量节点变化也重算。
  const grid = cls(table.host, 'super-table-cards__grid')[0],
    measure = cls(table.host, 'super-table-cards__measure')[0];
  grid.rect.width = 1600;
  measure.rect = { width: 240, height: 16 };
  for (const observer of [...observers]) observer.callback();
  await settle();
  assert.match(grid.props.style.gridTemplateColumns, /repeat\(6,/);
  assert.equal(queries.length, 0);
  grid.rect.width = 0;
  for (const observer of [...observers]) observer.callback();
  await settle();
  assert.match(grid.props.style.gridTemplateColumns, /repeat\(6,/);
  grid.rect.width = 1008;
  measure.rect.width = 300;
  for (const observer of [...observers]) observer.callback();
  await settle();
  assert.match(grid.props.style.gridTemplateColumns, /repeat\(3,/);
  table.props.value = {
    ...table.props.value,
    data: [{ id: 4, name: '丁', enabled: true }],
  };
  await settle();
  kind(table.host, 'checkbox')[0].props.change(true);
  await settle();
  assert.deepEqual(
    table.instance.value.selections.map((r) => r.id),
    [1, 3, 4],
  );
  table.props.value = {
    ...table.props.value,
    data: [{ id: 1, name: '新甲', enabled: true }],
  };
  await settle();
  assert.equal(table.instance.value.selections[0].name, '新甲');
  table.props.value = { ...table.props.value, view: 'table' };
  await settle();
  assert.equal(queries.length, 1);
  assert.equal(queries[0].pageSize, 20);
  assert.equal(selectionEvents.length, 2);
  assert.deepEqual(
    table.instance.value.elTable.getSelectionRows().map((r) => r.id),
    [1, 3, 4],
  );
  table.instance.value.elTable.toggleRowSelection(
    table.props.value.data[0],
    false,
  );
  await settle();
  assert.deepEqual(
    table.instance.value.selections.map((r) => r.id),
    [3, 4],
  );
  assert.equal(selectionEvents.length, 3);
  table.props.value = { ...table.props.value, view: 'card' };
  await settle();
  assert.equal(queries.length, 2);
  assert.equal(queries[1].pageSize, 24);
  table.props.value = {
    ...table.props.value,
    config: { ...config, pageSizes: [24, 48] },
  };
  await settle();
  assert.equal(queries.length, 2);
  table.props.value = { ...table.props.value, view: 'table' };
  await settle();
  assert.equal(queries.length, 3);
  assert.equal(queries[2].pageSize, 24);
  table.props.value = {
    ...table.props.value,
    config: { ...config, pageSizes: [12, 36] },
  };
  await settle();
  assert.equal(queries.length, 4);
  assert.equal(queries[3].pageSize, 12);
  table.instance.value.clearSelection();
  await settle();
  assert.equal(table.instance.value.selections.length, 0);
  table.props.value = { ...table.props.value, view: 'card', loading: true };
  await settle();
  assert.equal(cls(table.host, 'super-table-cards')[0].props.inert, true);
  table.props.value = { ...table.props.value, loading: false };
  await settle();
  assert.equal(cls(table.host, 'super-table-cards')[0].props.inert, undefined);
  table.props.value = { ...table.props.value, selection: true };
  await settle();
  table.instance.value.toggleRowSelection(table.props.value.data[0], true);
  await settle();
  await table.instance.value.refresh();
  await settle();
  assert.equal(table.instance.value.selections.length, 0);
  table.instance.value.toggleRowSelection(table.props.value.data[0], true);
  await settle();
  table.props.value = {
    ...table.props.value,
    config: { ...config, rowKey: (row) => `task-${row.id}` },
  };
  await settle();
  assert.equal(table.instance.value.selections.length, 0);
  table.instance.value.toggleRowSelection(table.props.value.data[0], true);
  await settle();
  table.props.value = { ...table.props.value, selection: false };
  await settle();
  assert.equal(table.instance.value.selections.length, 0);
  console.log(
    '通过：外部模式首次不查询、视图切换单次查询、分页配置动态更新、跨视图原生勾选同步、跨页快照与全选、加载 inert',
  );

  const edgeQueries = [];
  let toolbar;
  const edge = mount(
    SuperTable,
    {
      view: 'card',
      card: { fields: { title: 'name' } },
      data: rows,
      page: 5,
      pageSize: 36,
      config: { pagination: false },
      columns: [{ prop: 'name', label: '名称', search: true, sortable: true }],
      'default-sort': { prop: 'name', order: 'descending' },
      'tooltip-options': {
        popperClass: 'business-tip',
        placement: 'bottom',
        popperStyle: { '--wt-font-size-caption': '13px', color: 'orange' },
      },
      onRowClick: () => {
        throw new Error('ElTable 事件不应进入卡片 DOM');
      },
    },
    { 'onQuery-change': (q) => edgeQueries.push(q) },
    {
      toolbar: (scope) => {
        toolbar = scope;
        return [];
      },
    },
  );
  await settle();
  assert.equal(edgeQueries.length, 0);
  assert.equal(edge.instance.value.getQuery().pageSize, 36);
  assert.equal(edge.instance.value.getQuery().page, 5);
  assert.deepEqual(edge.instance.value.getQuery().sort, {
    prop: 'name',
    order: 'descending',
  });
  assert.equal(kind(edge.host, 'pagination').length, 0);
  assert.equal(walk(edge.host, (node) => !!node.props.onRowClick).length, 0);
  kind(edge.host, 'search')[0].props.submit({ name: '甲', keep: false });
  await settle();
  assert.equal(edgeQueries.length, 1);
  assert.equal(edgeQueries[0].page, 1);
  toolbar.setSort({ prop: 'createdAt', order: 'ascending' });
  await settle();
  assert.equal(edgeQueries.length, 2);
  edge.props.value = { ...edge.props.value, view: 'table' };
  await settle();
  assert.equal(edgeQueries.length, 3);
  assert.equal(edgeQueries[2].pageSize, 20);
  const tooltip = kind(edge.host, 'native-table')[0].props['tooltip-options'];
  assert.equal(tooltip.popperClass, 'wt-table-tooltip business-tip');
  assert.equal(tooltip.placement, 'bottom');
  assert.equal(tooltip.popperStyle['--wt-font-size-caption'], '13px');
  assert.equal(tooltip.popperStyle.color, 'orange');
  assert.deepEqual(edgeQueries[2].search, { name: '甲', keep: false });
  assert.deepEqual(edgeQueries[2].sort, {
    prop: 'createdAt',
    order: 'ascending',
  });
  edge.props.value = {
    ...edge.props.value,
    view: 'card',
    config: { pageSizes: [0, -1, 1.5] },
  };
  await settle();
  assert.equal(edgeQueries.length, 4);
  assert.equal(edgeQueries[3].pageSize, 24);
  kind(edge.host, 'pagination')[0].props.changeSize(48);
  await settle();
  assert.equal(edgeQueries.length, 5);
  assert.equal(edgeQueries[4].pageSize, 48);
  kind(edge.host, 'pagination')[0].props.changePage(2);
  await settle();
  assert.equal(edgeQueries.length, 6);
  assert.equal(edgeQueries[5].page, 2);
  kind(edge.host, 'pagination')[0].props.changeSize(12);
  await settle();
  assert.equal(edgeQueries.length, 7);
  assert.equal(edgeQueries[6].page, 1);
  const invalid = mount(SuperTable, {
    view: 'card',
    card: { fields: { title: 'name' } },
    pageSize: 99,
    config: { pageSizes: [36, 12] },
  });
  await settle();
  assert.equal(invalid.instance.value.getQuery().pageSize, 36);
  console.log(
    '通过：显式初始条数、无效选项回退、隐藏分页切换、搜索排序保留、分页操作单次查询、ElTable 专用事件不进入卡片 DOM',
  );

  const requests = [];
  const pending = [];
  const request = (query, { signal }) => {
    requests.push({ query, signal });
    return new Promise((resolve, reject) => pending.push({ resolve, reject }));
  };
  const remote = mount(SuperTable, {
    view: 'card',
    card: { fields: { title: 'name' } },
    request,
  });
  await settle();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].query.pageSize, 24);
  remote.props.value = { ...remote.props.value, view: 'table' };
  await settle();
  assert.equal(requests.length, 2);
  assert.equal(requests[0].signal.aborted, true);
  pending[1].resolve({ data: [{ id: 8, name: '最新' }], total: 1 });
  await settle();
  pending[0].resolve({ data: [{ id: 9, name: '过期' }], total: 99 });
  await settle();
  assert.match(remote.host.textContent, /共 1 条/);
  const refresh = remote.instance.value.refresh();
  await settle();
  pending[2].reject(new Error('调用方处理'));
  await refresh;
  await settle();
  assert.match(remote.host.textContent, /共 1 条/);
  void remote.instance.value.refresh();
  await settle();
  remote.app.unmount();
  apps.delete(remote.app);
  assert.equal(requests[3].signal.aborted, true);
  pending[3].resolve({ data: [], total: 0 });
  await settle();
  const noImmediate = mount(SuperTable, {
    view: 'card',
    card: { fields: { title: 'name' } },
    config: { immediate: false },
    request,
  });
  await settle();
  const count = requests.length;
  noImmediate.props.value = { ...noImmediate.props.value, view: 'table' };
  await settle();
  assert.equal(requests.length, count + 1);
  pending.at(-1).resolve({ data: [], total: 0 });
  await settle();
  console.log(
    '通过：请求模式首次24条、竞态取消与过期响应隔离、失败保留数据、卸载取消、immediate=false 后切换仍查询',
  );
} finally {
  for (const app of apps) app.unmount();
  assert.equal(observers.size, 0, '卸载必须清理全部 ResizeObserver');
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
  await rm(temporary, { recursive: true, force: true });
}
