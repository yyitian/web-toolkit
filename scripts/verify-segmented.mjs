import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse, compileScript } from 'vue/compiler-sfc';
import ts from 'typescript';
import { createRenderer, createSSRApp, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  ElConfigProvider,
  ID_INJECTION_KEY,
  formContextKey,
  formItemContextKey,
} from 'element-plus';
import { styles, rule } from './verify-style-helpers.mjs';

// 使用真实 ElSegmented；自定义渲染器只隔离 DOM/几何，不能替代浏览器验收。
const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'wt-segmented-'));
const vueUrl = import.meta.resolve('vue');
const cache = new Map();
async function compile(relative) {
  const source = resolve(root, relative);
  if (cache.has(source)) return cache.get(source);
  const target = join(temporary, `${cache.size}.mjs`);
  const url = pathToFileURL(target).href;
  cache.set(source, url);
  let code = await readFile(source, 'utf8');
  if (source.endsWith('.vue')) {
    const { descriptor } = parse(code, { filename: source });
    code = compileScript(descriptor, {
      id: 'segmented-verify',
      inlineTemplate: true,
    }).content;
  }
  const autoImports = [
    'defineComponent',
    'shallowRef',
    'onMounted',
    'onUpdated',
    'onBeforeUnmount',
    'h',
  ];
  code = ts.transpileModule(
    `import { ${autoImports.join(',')} } from '${vueUrl}';\n${code}`,
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
        : specifier.startsWith('.')
          ? await compile(resolve(dirname(source), specifier))
          : specifier.startsWith('file:')
            ? specifier
            : import.meta.resolve(specifier);
    code = code.replace(match[0], `from '${next}'`);
  }
  await writeFile(target, code);
  return url;
}

const invoke = (handler, value) => {
  for (const callback of Array.isArray(handler) ? handler : [handler])
    callback?.(value);
};
class Element {
  constructor(kind) {
    this.kind = kind;
    this.nodeType = 1;
    this.props = {};
    this.children = [];
    this.scrollLeft = 0;
    this.clientLeft = 0;
    this.clientWidth = 300;
    this.scrollWidth = 300;
    this.offsetWidth = 80;
    this.offsetHeight = 26;
    this.offsetLeft = 0;
    this.offsetTop = 0;
  }
  matches(selector) {
    if (selector === ':focus-visible') return false;
    const type = selector.match(/^\w+/)?.[0];
    const classes = [...selector.matchAll(/\.([\w-]+)/g)].map(
      (match) => match[1],
    );
    return (
      (!type || type === this.kind) &&
      classes.every((name) =>
        String(this.props.class ?? '')
          .split(/\s+/)
          .includes(name),
      )
    );
  }
  querySelector(selector) {
    const parts = selector.split(' ');
    return (
      walk(this)
        .slice(1)
        .find((node) => {
          if (!node.matches(parts.at(-1))) return false;
          let parent = node.parent;
          for (let index = parts.length - 2; index >= 0; index--) {
            while (parent && !parent.matches(parts[index]))
              parent = parent.parent;
            if (!parent) return false;
            parent = parent.parent;
          }
          return true;
        }) ?? null
    );
  }
  closest(selector) {
    return this.matches(selector)
      ? this
      : (this.parent?.closest(selector) ?? null);
  }
  getBoundingClientRect() {
    return this.bounds ?? { left: 0, right: 300, width: 300 };
  }
  get textContent() {
    return this.text ?? this.children.map((node) => node.textContent).join('');
  }
}
function walk(node) {
  return [node, ...node.children.flatMap(walk)];
}
const renderer = createRenderer({
  createElement: (kind) => new Element(kind),
  createText: (text) =>
    Object.assign(new Element('text'), { nodeType: 3, text }),
  createComment: () => Object.assign(new Element('comment'), { nodeType: 8 }),
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
const observers = [];
const originalObserver = Object.getOwnPropertyDescriptor(
  globalThis,
  'ResizeObserver',
);
Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  value: class {
    constructor(callback) {
      this.callback = callback;
      this.targets = new Set();
      observers.push(this);
    }
    observe(node) {
      this.targets.add(node);
    }
    disconnect() {
      this.targets.clear();
    }
  },
});
const apps = new Set();
function mount(component, initial, listeners = {}, slots, configure) {
  const props = ref(initial);
  const instance = ref();
  const host = new Element('host');
  const app = renderer.createApp({
    render: () =>
      h(component, { ...props.value, ...listeners, ref: instance }, slots),
  });
  app.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 });
  configure?.(app);
  app.mount(host);
  apps.add(app);
  return {
    app,
    props,
    instance,
    host,
    get root() {
      return host.children.find((node) => node.nodeType === 1);
    },
  };
}
const inputs = (host) => walk(host).filter((node) => node.kind === 'input');

function ssrApp(component) {
  const app = createSSRApp(component);
  app.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 });
  app.provide(formContextKey, { disabled: true });
  return app;
}

try {
  const { default: SuperSegmented } = await import(
    await compile('src/components/SuperSegmented/index.vue')
  );
  const { revealSegmentedItem } = await import(
    await compile('src/components/SuperSegmented/scroll.ts')
  );
  const updates = [];
  const changes = [];
  const validations = [];
  let focuses = 0;
  const options = [
    0,
    false,
    '',
    { label: '不可选', value: 'disabled', disabled: true },
  ];
  const view = mount(
    SuperSegmented,
    {
      options,
      modelValue: false,
      class: 'consumer',
      style: { '--el-segmented-color': 'red' },
      'data-test': 'native',
      ariaLabel: '状态',
      name: 'state',
    },
    {
      'onUpdate:modelValue': (value) => updates.push(value),
      onChange: (value) => changes.push(value),
      onFocusin: () => focuses++,
    },
    undefined,
    (app) => {
      app.provide(formContextKey, { size: 'small', disabled: false });
      app.provide(formItemContextKey, {
        inputIds: [],
        addInputId() {},
        removeInputId() {},
        validate: (trigger) => {
          validations.push(trigger);
          return Promise.resolve();
        },
      });
    },
  );
  assert.match(view.root.props.class, /super-segmented/);
  assert.match(view.root.props.class, /consumer/);
  assert.match(view.root.props.class, /el-segmented--small/);
  assert.equal(view.host.children.length, 1, '没有额外包装 DOM');
  assert.equal(view.root.props['data-test'], 'native');
  assert.equal(view.root.props['aria-label'], '状态');
  assert.equal(view.root.props.style['--el-segmented-color'], 'red');
  assert.deepEqual(
    inputs(view.host).map((node) => node.props.checked),
    [false, true, false, false],
  );
  assert.equal(inputs(view.host)[3].props.disabled, true);
  assert.equal(inputs(view.host)[0].props.name, 'state');
  assert.deepEqual(updates, [], '初始化不更新绑定值');
  assert.match(view.host.textContent, /0false/);
  const input = inputs(view.host)[0];
  invoke(input.props.onChange, { target: input.props });
  assert.deepEqual(updates, [0]);
  assert.deepEqual(changes, [0], '原生事件只触发一次');
  view.props.value.modelValue = 0;
  await nextTick();
  assert.deepEqual(validations, ['change']);
  assert.equal(view.instance.value.$el, view.root);
  assert.equal(view.instance.value.$props.modelValue, 0);
  const forceUpdate = view.instance.value.$forceUpdate;
  forceUpdate();
  await nextTick();
  view.props.value.modelValue = '';
  await nextTick();
  assert.equal(inputs(view.host)[2].props.checked, true);
  view.props.value.disabled = true;
  await nextTick();
  assert.ok(inputs(view.host).every((node) => node.props.disabled));
  view.props.value.modelValue = 'missing';
  view.props.value.options = ['新选项'];
  await nextTick();
  assert.equal(inputs(view.host)[0].props.checked, false);
  assert.deepEqual(updates, [0], '失效值、禁用和选项变化不触发更新');
  view.props.value.validateEvent = false;
  view.props.value.modelValue = '新选项';
  await nextTick();
  const validationCount = validations.length;
  view.props.value.modelValue = '其他';
  await nextTick();
  assert.equal(validations.length, validationCount);
  const previousObserver = observers.at(-1);
  view.props.value.options = [];
  await nextTick();
  assert.equal(view.root, undefined);
  assert.equal(previousObserver.targets.size, 0);
  view.props.value.options = ['其他', '末尾'];
  await nextTick();
  assert.equal(
    view.instance.value.$el,
    view.root,
    '空选项恢复后实时访问新根节点',
  );
  const observer = observers.at(-1);
  assert.equal(observer.targets.size, 2, '观察控件与选项组');
  const selected = view.root.querySelector('.el-segmented__item.is-selected');
  view.root.scrollWidth = 800;
  selected.bounds = { left: 450, right: 530, width: 80 };
  observer.callback();
  assert.equal(view.root.scrollLeft, 233, '尺寸变化时仅滚动控件');
  selected.bounds = { left: 20, right: 100, width: 80 };
  view.root.scrollLeft = 0;
  const last = inputs(view.host).at(-1);
  last.parent.bounds = { left: 500, right: 580, width: 80 };
  invoke(view.root.props.onFocusin, { target: last });
  assert.equal(view.root.scrollLeft, 283);
  assert.equal(focuses, 1, '焦点事件透传且可见');
  view.props.value.direction = 'vertical';
  await nextTick();
  view.root.scrollLeft = 0;
  observer.callback();
  assert.equal(view.root.scrollLeft, 0, '垂直布局不主动横向滚动');
  view.app.unmount();
  apps.delete(view.app);
  assert.equal(observer.targets.size, 0);
  assert.equal(view.instance.value, null);
  observer.callback(); // 卸载后排队的观察回调不会再访问已移除元素。

  const custom = mount(
    SuperSegmented,
    {
      options: [
        { title: '零', id: 0 },
        { title: '关闭', id: false, off: true },
      ],
      modelValue: 0,
      props: { label: 'title', value: 'id', disabled: 'off' },
    },
    {},
    {
      default: ({ item }) => h('strong', { 'data-value': item.id }, item.title),
    },
  );
  assert.match(custom.host.textContent, /零关闭/);
  assert.equal(inputs(custom.host)[1].props.disabled, true);
  assert.equal(
    walk(custom.host).find((node) => node.kind === 'strong').props[
      'data-value'
    ],
    0,
  );

  const unset = mount(SuperSegmented, { options: ['首项', '次项'] });
  assert.ok(
    inputs(unset.host).every((node) => !node.props.checked),
    '未提供绑定值时不自动选中首项',
  );

  const viewport = {
    clientWidth: 300,
    scrollWidth: 900,
    clientLeft: 0,
    scrollLeft: 200,
    getBoundingClientRect: () => ({ left: 100 }),
    querySelector: () => null,
  };
  revealSegmentedItem(viewport, {
    getBoundingClientRect: () => ({ left: 50, right: 130, width: 80 }),
  });
  assert.equal(viewport.scrollLeft, 147, '向左显示');
  revealSegmentedItem(viewport, {
    getBoundingClientRect: () => ({ left: 150, right: 250, width: 100 }),
  });
  assert.equal(viewport.scrollLeft, 147, '可见项不改变滚动');
  revealSegmentedItem(viewport, {
    getBoundingClientRect: () => ({ left: 120, right: 620, width: 500 }),
  });
  assert.equal(viewport.scrollLeft, 164, '超宽项对齐起点');
  revealSegmentedItem(viewport, null);
  assert.equal(viewport.scrollLeft, 164);
  viewport.clientWidth = 0;
  revealSegmentedItem(viewport, {
    getBoundingClientRect() {
      throw Error('隐藏控件不读布局');
    },
  });

  for (const size of ['small', 'default', 'large']) {
    const html = await renderToString(
      ssrApp({
        render: () =>
          h(ElConfigProvider, { size }, () =>
            h(SuperSegmented, {
              options: [0, false, ''],
              modelValue: false,
              ariaLabel: '选择',
            }),
          ),
      }),
    );
    assert.match(html, new RegExp(`el-segmented--${size}`));
    assert.match(html, /aria-label="选择"/);
    assert.equal((html.match(/type="radio"/g) ?? []).length, 3);
    assert.equal((html.match(/ checked/g) ?? []).length, 1);
  }
  const empty = await renderToString(
    ssrApp({ render: () => h(SuperSegmented) }),
  );
  assert.doesNotMatch(empty, /type="radio"/);
  const explicit = await renderToString(
    ssrApp({
      render: () =>
        h(ElConfigProvider, { size: 'small' }, () =>
          h(SuperSegmented, {
            options: ['a'],
            size: 'large',
            disabled: false,
            modelValue: 'a',
          }),
        ),
    }),
  );
  assert.match(explicit, /el-segmented--large/);
  assert.doesNotMatch(explicit, / disabled/);

  const css = await styles('SuperSegmented/index.vue');
  const base = rule(css, /\.super-segmented\.el-segmented\[/);
  assert.match(base, /max-width: 100%/);
  assert.match(base, /overflow-x: auto/);
  assert.match(base, /--wt-font-size-body/);
  assert.match(base, /--wt-font-weight-regular/);
  assert.doesNotMatch(base, /(?:^|[;\n])\s*(?:height|line-height):/);
  assert.match(css, /width: max-content/);
  assert.match(css, /flex-wrap: nowrap/);
  assert.match(css, /grid-auto-columns: minmax\(max-content, 1fr\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /focus-visible/);
  assert.match(css, /--wt-segmented-selected-bg/);
  console.log(
    '通过：真实 ElSegmented 属性/插槽/单次事件、0/false/空值、禁用、字段映射与动态值保留',
  );
  console.log(
    '通过：表单校验、尺寸继承与显式覆盖、实例实时代理、空选项恢复及卸载观察清理',
  );
  console.log(
    '通过：控件内部滚动计算、焦点接线、尺寸变化与垂直保护；主题/排版 CSS 与真实 SSR（非浏览器验收）',
  );
} finally {
  for (const app of apps) app.unmount();
  if (originalObserver)
    Object.defineProperty(globalThis, 'ResizeObserver', originalObserver);
  else delete globalThis.ResizeObserver;
  await rm(temporary, { recursive: true, force: true });
}
