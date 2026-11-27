/* eslint-disable vue/one-component-per-file -- 同一脚本中的独立验证宿主。 */
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse, compileScript } from 'vue/compiler-sfc';
import ts from 'typescript';
import { createRenderer, defineComponent, h, nextTick, ref } from 'vue';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'wt-carousel-'));
const vueUrl = import.meta.resolve('vue');
const saved = new Map(
  [
    'window',
    'document',
    'Element',
    'HTMLElement',
    'Node',
    'ResizeObserver',
    'IntersectionObserver',
    'getComputedStyle',
  ].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
);
class Element extends EventTarget {
  constructor(kind) {
    super();
    this.kind = kind;
    this.props = {};
    this.children = [];
    this.offsetHeight = 200;
    this.isConnected = true;
  }
  closest() {
    return this.interactive ? this : null;
  }
  contains(node) {
    return node === this || this.children.some((child) => child.contains(node));
  }
  querySelector() {
    return undefined;
  }
  querySelectorAll() {
    return [];
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
const doc = new EventTarget();
doc.hidden = false;
doc.activeElement = new Element('body');
const media = new EventTarget();
media.matches = false;
let disconnected = 0;
let intersection;
const globals = {
  document: doc,
  window: { matchMedia: () => media },
  Element,
  HTMLElement: Element,
  Node: Element,
  ResizeObserver: class {
    observe() {}
    disconnect() {
      disconnected++;
    }
  },
  IntersectionObserver: class {
    constructor(cb) {
      intersection = cb;
    }
    observe() {}
    disconnect() {
      disconnected++;
    }
  },
  getComputedStyle: () => ({ getPropertyValue: () => '350ms' }),
};
for (const [key, value] of Object.entries(globals))
  Object.defineProperty(globalThis, key, { value, configurable: true });
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
    node.isConnected = false;
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
function walk(node, predicate) {
  return [
    ...(predicate(node) ? [node] : []),
    ...node.children.flatMap((child) => walk(child, predicate)),
  ];
}
const apps = new Set();
function mount(component, initial, listeners = {}, slots) {
  const props = ref(initial),
    host = new Element('host');
  let instance;
  const app = renderer.createApp({
    render: () =>
      h(
        component,
        {
          ...props.value,
          ...listeners,
          ref: (value) => {
            instance = value;
          },
        },
        slots,
      ),
  });
  app.mount(host);
  apps.add(app);
  return {
    host,
    props,
    get instance() {
      return instance;
    },
    unmount() {
      app.unmount();
      apps.delete(app);
    },
  };
}
const elementStub = join(temporary, 'element.mjs');
await writeFile(
  elementStub,
  `import { defineComponent, h, onMounted } from '${vueUrl}';
export const ElImage = defineComponent({ props: ['src','previewSrcList','initialIndex','fit','alt','previewTeleported','zoomRate','minScale','maxScale','showProgress'].reduce((result, key) => ({ ...result, [key]: key === 'previewTeleported' ? Boolean : null }), {}), emits: ['load','error','show','close','switch'], setup(props,{attrs,emit,expose,slots}) {
  const toolbarActions = [];
  expose({showPreview: () => emit('show')});
  return () => h('image', {...attrs,...props, toolbarActions, fireClose: () => emit('close'), fireSwitch: index => emit('switch',index), fireLoad: e => emit('load',e), fireError: e => emit('error',e)}, [slots.placeholder?.(), slots.error?.(), slots.toolbar?.({ actions: action => toolbarActions.push(action), reset: () => toolbarActions.push('reset'), activeIndex: props.initialIndex, prev: () => {}, next: () => {}, setActiveItem: () => {} }), slots.viewer?.()]);
}});
export const ElCheckbox = defineComponent({ props: { modelValue: Boolean, disabled: Boolean }, emits: ['change'], setup(props, { attrs, emit, slots }) {
  return () => h('checkbox', { ...attrs, checked: props.modelValue, disabled: props.disabled, fireChange: value => { if (!props.disabled) emit('change', value); } }, slots.default?.());
}});`,
);
const buttonStub = join(temporary, 'button.mjs');
await writeFile(
  buttonStub,
  `import {defineComponent,h} from '${vueUrl}'; export default defineComponent({setup:(_, {attrs,slots})=>()=>h('button',attrs,slots.default?.())});`,
);
const localeStub = join(temporary, 'locale.mjs');
await writeFile(localeStub, 'export function useWtLocale() {}');
const compiled = new Map();
async function compile(relative) {
  const source = resolve(root, relative);
  if (source.endsWith('/SuperButton/index.vue'))
    return pathToFileURL(buttonStub).href;
  if (source.endsWith('/useWtLocale.ts')) return pathToFileURL(localeStub).href;
  if (compiled.has(source)) return compiled.get(source);
  const target = join(temporary, `source-${compiled.size}.mjs`),
    url = pathToFileURL(target).href;
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
    `import { ref, shallowRef, computed, watch, watchEffect, nextTick, onMounted, onBeforeUnmount, useSlots } from '${vueUrl}';\n${code}`,
    {
      compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
      },
    },
  ).outputText;
  for (const match of [...code.matchAll(/from (['"])([^'"]+)\1/g)]) {
    const name = match[2];
    const next =
      name === 'vue'
        ? vueUrl
        : name === 'element-plus'
          ? pathToFileURL(elementStub).href
          : name.startsWith('.')
            ? await compile(resolve(dirname(source), name))
            : name.startsWith('file:')
              ? name
              : import.meta.resolve(name);
    code = code.replace(match[0], `from '${next}'`);
  }
  await writeFile(target, code);
  return url;
}
try {
  const { carouselIndex, carouselOffset, carouselPreviews } = await import(
    await compile('src/components/SuperCarousel/config.ts')
  );
  const { useCarousel } = await import(
    await compile('src/components/SuperCarousel/useCarousel.ts')
  );
  const { useCarouselPlayback } = await import(
    await compile('src/components/SuperCarousel/useCarouselPlayback.ts')
  );
  const { useCarouselGestures } = await import(
    await compile('src/components/SuperCarousel/useCarouselGestures.ts')
  );
  const { default: Carousel } = await import(
    await compile('src/components/SuperCarousel/index.vue')
  );
  const items = [
    { id: 0, src: 'same.jpg', label: '内置标题不再显示' },
    { id: '0', src: 'same.jpg', previewSrc: 'large.jpg' },
    { id: 'c' },
    { id: 'd', src: 'four.jpg' },
  ];
  assert.deepEqual(
    [-1, 0, 4, 9].map((n) => carouselIndex(n, 4, true)),
    [3, 0, 0, 1],
  );
  assert.deepEqual(
    [NaN, Infinity, 1.2].map((n) => carouselIndex(n, 4, true)),
    [-1, -1, -1],
  );
  assert.equal(carouselOffset(3, 0, 4, true), -1);
  assert.equal(carouselOffset(3, 0, 4, false), 3);
  assert.deepEqual(
    carouselPreviews(items).map((entry) => entry.src),
    ['same.jpg', 'large.jpg', 'four.jpg'],
  );
  let state;
  const changes = [],
    updates = [];
  const State = defineComponent({
    props: {
      items: { type: Array, required: true },
      activeId: { type: [String, Number], default: undefined },
      initialIndex: { type: Number, default: 0 },
      loop: { type: Boolean, default: true },
      disabled: Boolean,
    },
    setup(props) {
      state = useCarousel(
        props,
        (id) => updates.push(id),
        (...args) => changes.push(args),
      );
      return () => null;
    },
  });
  const mounted = mount(State, { items, initialIndex: 1, loop: true });
  assert.equal(state.activeIndex.value, 1);
  assert.deepEqual(updates, ['0']);
  assert.deepEqual(changes, []);
  state.next();
  await nextTick();
  assert.equal(state.activeIndex.value, 2);
  assert.deepEqual(changes, [[2, 1]]);
  state.setActiveId(0);
  await nextTick();
  assert.equal(state.activeIndex.value, 0);
  mounted.props.value.items = [...items].reverse();
  await nextTick();
  assert.equal(state.activeIndex.value, 3);
  mounted.props.value.items = items.slice(1);
  await nextTick();
  assert.equal(state.activeIndex.value, 2);
  mounted.props.value.items = [];
  await nextTick();
  assert.equal(state.activeIndex.value, -1);
  assert.equal(updates.at(-1), null);
  mounted.props.value = { items, activeId: '0', loop: false };
  await nextTick();
  assert.equal(state.activeIndex.value, 1);
  state.setActiveItem(-99);
  await nextTick();
  assert.equal(state.activeIndex.value, 0);
  assert.equal(state.canPrev.value, false);
  mounted.props.value.disabled = true;
  await nextTick();
  state.next();
  assert.equal(state.activeIndex.value, 0);
  mounted.props.value.disabled = false;
  mounted.props.value.loop = true;
  await nextTick();
  state.prev();
  await nextTick();
  assert.equal(state.activeIndex.value, 3);
  mounted.unmount();

  const delayed = mount(State, { items: [], initialIndex: 2 });
  delayed.props.value.items = items;
  await nextTick();
  assert.equal(state.activeIndex.value, 2);
  delayed.unmount();

  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  let playback;
  let advances = 0;
  const active = ref(0),
    previewing = ref(false);
  const Playback = defineComponent({
    props: {
      items: { type: Array, required: true },
      autoplay: Boolean,
      interval: { type: Number, default: 5000 },
      disabled: Boolean,
      loop: { type: Boolean, default: true },
      pauseOnHover: { type: Boolean, default: true },
    },
    setup(props) {
      playback = useCarouselPlayback(
        props,
        ref(new Element('root')),
        previewing,
        () => {
          advances++;
          active.value++;
        },
        active,
      );
      return () => null;
    },
  });
  const player = mount(Playback, {
    items,
    autoplay: true,
    interval: 500,
    loop: true,
  });
  await nextTick();
  mock.timers.tick(500);
  await nextTick();
  assert.equal(advances, 1);
  playback.hovered.value = true;
  await nextTick();
  mock.timers.tick(1000);
  assert.equal(advances, 1);
  player.props.value.pauseOnHover = false;
  await nextTick();
  mock.timers.tick(500);
  await nextTick();
  assert.equal(advances, 2);
  playback.focused.value = true;
  await nextTick();
  mock.timers.tick(1000);
  assert.equal(advances, 2);
  playback.focused.value = false;
  previewing.value = true;
  await nextTick();
  mock.timers.tick(1000);
  assert.equal(advances, 2);
  previewing.value = false;
  doc.hidden = true;
  doc.dispatchEvent(new Event('visibilitychange'));
  await nextTick();
  assert.equal(playback.playing.value, false);
  doc.hidden = false;
  doc.dispatchEvent(new Event('visibilitychange'));
  intersection([{ isIntersecting: false }]);
  await nextTick();
  assert.equal(playback.playing.value, false);
  intersection([{ isIntersecting: true }]);
  media.matches = true;
  media.dispatchEvent(new Event('change'));
  await nextTick();
  assert.equal(playback.playing.value, false);
  media.matches = false;
  media.dispatchEvent(new Event('change'));
  await nextTick();
  assert.equal(playback.playing.value, true);
  playback.togglePlay();
  await nextTick();
  assert.equal(playback.playing.value, false);
  player.props.value.disabled = true;
  playback.togglePlay();
  await nextTick();
  assert.equal(playback.playing.value, false);
  player.props.value.disabled = false;
  player.props.value.interval = 0;
  await nextTick();
  assert.equal(playback.playing.value, false);
  player.props.value.interval = 300;
  await nextTick();
  player.unmount();
  const final = advances;
  mock.timers.tick(1000);
  assert.equal(advances, final);
  assert.ok(disconnected > 0);

  let gestureIndex = 1;
  const gestureProps = { items, direction: 'horizontal' };
  const gestures = useCarouselGestures(
    gestureProps,
    ref(false),
    () => gestureIndex--,
    () => gestureIndex++,
    (index) => {
      gestureIndex = index;
    },
  );
  const event = (key, target = new Element('stage')) => ({
    key,
    target,
    preventDefault() {
      this.prevented = true;
    },
  });
  gestures.keydown(event('ArrowRight'));
  assert.equal(gestureIndex, 2);
  const input = new Element('input');
  input.interactive = true;
  gestures.keydown(event('ArrowLeft', input));
  assert.equal(gestureIndex, 2);
  gestures.keydown(event('Home'));
  assert.equal(gestureIndex, 0);
  gestures.pointerdown({
    button: 0,
    isPrimary: true,
    pointerId: 1,
    clientX: 100,
    clientY: 0,
    target: new Element('img'),
  });
  gestures.pointerup({ pointerId: 1, clientX: 0, clientY: 5 });
  assert.equal(gestureIndex, 1);
  const click = {
    preventDefault() {
      this.prevented = true;
    },
    stopPropagation() {},
  };
  gestures.click(click);
  assert.ok(click.prevented);
  gestureProps.direction = 'vertical';
  gestures.keydown(event('ArrowDown'));
  assert.equal(gestureIndex, 2);

  const changeEvents = [],
    imageEvents = [],
    previewEvents = [];
  const carousel = mount(
    Carousel,
    {
      items,
      preview: true,
      imageProps: {
        src: 'forbidden',
        initialIndex: 99,
        previewSrcList: ['forbidden'],
        maxScale: 4,
      },
    },
    {
      onChange: (...args) => changeEvents.push(args),
      onImageLoad: (context) => imageEvents.push(context),
      onPreviewShow: (context) => previewEvents.push(['show', context]),
      onPreviewSwitch: (context) => previewEvents.push(['switch', context]),
      onPreviewClose: (context) => previewEvents.push(['close', context]),
    },
  );
  await nextTick();
  const images = () => walk(carousel.host, (node) => node.kind === 'image');
  assert.equal(
    walk(carousel.host, (node) => node.kind === 'article').length,
    4,
  );
  assert.equal(images().length, 3);
  assert.equal(carousel.host.textContent.includes('内置标题不再显示'), false);
  assert.equal(images()[0].props.src, 'same.jpg');
  assert.deepEqual(images()[0].props.previewSrcList, []);
  images()[0].props.fireLoad(new Event('load'));
  assert.equal(imageEvents[0].item.id, 0);
  assert.equal(
    walk(carousel.host, (node) => node.props['aria-label'] === '预览图片')
      .length,
    0,
  );
  const previewContent = walk(
    carousel.host,
    (node) =>
      node.props.class === 'super-carousel__content' && !node.props.inert,
  )[0];
  assert.equal(previewContent.props.role, 'button');
  let preventedPreviewKey = false;
  previewContent.props.onKeydown({
    key: 'Enter',
    target: previewContent,
    currentTarget: previewContent,
    preventDefault() {
      preventedPreviewKey = true;
    },
    stopPropagation() {},
  });
  assert.equal(preventedPreviewKey, true);
  await nextTick();
  const host = images().find((node) => node.props.previewSrcList.length);
  assert.ok(host);
  assert.equal(carousel.host.textContent.includes('内置标题不再显示'), false);
  assert.equal(walk(host, (node) => node.kind === 'checkbox').length, 0);
  assert.equal(host.props.previewTeleported, true);
  assert.equal(host.props.initialIndex, 0);
  assert.equal(host.props.maxScale, 4);
  assert.equal(previewEvents[0][0], 'show');
  host.props.fireSwitch(1);
  assert.equal(previewEvents.at(-1)[1].item.id, '0');
  assert.equal(carousel.instance.activeIndex, 0);
  carousel.props.value.items = items.slice(1);
  await nextTick();
  assert.equal(previewEvents.at(-1)[0], 'close');
  assert.equal(
    images().some((node) => node.props.previewSrcList.length),
    false,
  );
  carousel.instance.setActiveId('d');
  await nextTick();
  assert.equal(carousel.instance.activeIndex, 2);
  assert.ok(changeEvents.length);
  carousel.props.value.items = [];
  await nextTick();
  assert.ok(carousel.host.textContent.includes('暂无内容'));
  carousel.unmount();

  const initialSelected = Object.freeze([0]);
  const selectionUpdates = [],
    selectionChanges = [];
  let selectionCarousel;
  selectionCarousel = mount(
    Carousel,
    { items, selectable: true, selectedIds: initialSelected },
    {
      'onUpdate:selectedIds': (ids) => {
        selectionUpdates.push([...ids]);
        selectionCarousel.props.value.selectedIds = ids;
      },
      onSelectionChange: (context) => selectionChanges.push(context),
    },
  );
  await nextTick();
  const checks = () =>
    walk(selectionCarousel.host, (node) => node.kind === 'checkbox');
  const checkItem = () => checks()[0];
  const content = () =>
    walk(
      selectionCarousel.host,
      (node) =>
        node.props.class === 'super-carousel__content' && !node.props.inert,
    )[0];
  assert.equal(checkItem().props.checked, true);
  assert.equal(checkItem().textContent, '');
  assert.equal(selectionUpdates.length, 0);
  checkItem().props.fireChange(false);
  await nextTick();
  assert.deepEqual(selectionCarousel.props.value.selectedIds, []);
  assert.deepEqual(initialSelected, [0]);
  assert.equal(checks().length, 1);
  selectionCarousel.instance.setActiveItem(1);
  await nextTick();
  checkItem().props.fireChange(true);
  await nextTick();
  assert.deepEqual(selectionCarousel.props.value.selectedIds, ['0']);
  assert.equal(checks().length, 1);
  selectionCarousel.instance.setActiveItem(0);
  await nextTick();
  assert.equal(selectionCarousel.instance.activeIndex, 0);
  content().props.onClick({ target: new Element('img') });
  await nextTick();
  assert.deepEqual(selectionCarousel.props.value.selectedIds, ['0', 0]);
  const interactiveButton = new Element('button');
  interactiveButton.interactive = true;
  content().props.onClick({ target: interactiveButton });
  await nextTick();
  assert.deepEqual(selectionCarousel.props.value.selectedIds, ['0', 0]);
  selectionCarousel.props.value.disabled = true;
  await nextTick();
  const eventCount = selectionChanges.length;
  checkItem().props.fireChange(false);
  assert.equal(selectionChanges.length, eventCount);
  selectionCarousel.props.value.disabled = false;
  selectionCarousel.props.value.selectedIds = [999, 'd'];
  selectionCarousel.props.value.items = [...items].reverse();
  selectionCarousel.props.value.preview = true;
  await nextTick();
  assert.equal(checkItem().props.checked, false);
  assert.equal(selectionCarousel.instance.activeIndex, 3);
  content().props.onClick({ target: interactiveButton });
  await nextTick();
  assert.equal(
    walk(
      selectionCarousel.host,
      (node) => node.kind === 'image' && node.props.previewSrcList.length,
    ).length,
    0,
  );
  content().props.onClick({ target: new Element('img') });
  await nextTick();
  const selectionImage = () =>
    walk(
      selectionCarousel.host,
      (node) => node.kind === 'image' && node.props.previewSrcList.length,
    )[0];
  const previewCheck = () =>
    walk(selectionImage(), (node) => node.kind === 'checkbox')[0];
  assert.equal(previewCheck().props.checked, false);
  assert.equal(
    selectionCarousel.host.textContent.includes('内置标题不再显示'),
    false,
  );
  selectionCarousel.props.value.disabled = true;
  await nextTick();
  assert.equal(previewCheck().props.disabled, true);
  previewCheck().props.fireChange(true);
  assert.deepEqual(selectionCarousel.props.value.selectedIds, [999, 'd']);
  selectionCarousel.props.value.disabled = false;
  await nextTick();
  selectionImage().props.fireSwitch(0);
  await nextTick();
  assert.equal(previewCheck().props.checked, true);
  previewCheck().props.fireChange(false);
  await nextTick();
  assert.deepEqual(selectionCarousel.props.value.selectedIds, [999]);
  assert.equal(checkItem().props.checked, false);
  assert.equal(selectionCarousel.instance.activeIndex, 3);
  selectionImage().props.fireSwitch(1);
  await nextTick();
  previewCheck().props.fireChange(true);
  await nextTick();
  assert.deepEqual(selectionCarousel.props.value.selectedIds, [999, '0']);
  assert.equal(selectionChanges.at(-1).item.id, '0');
  assert.equal(selectionChanges.at(-1).index, 2);
  assert.equal(checkItem().props.checked, false);
  assert.equal(selectionCarousel.props.value.selectedIds.includes('0'), true);
  selectionCarousel.props.value.items = [...items]
    .reverse()
    .filter((item) => item.id !== '0');
  await nextTick();
  assert.equal(previewCheck().props.disabled, true);
  selectionCarousel.props.value.items = [...items].reverse();
  await nextTick();
  assert.equal(previewCheck().props.checked, true);
  selectionCarousel.props.value.selectedIds = [];
  await nextTick();
  assert.equal(previewCheck().props.checked, false);
  selectionImage().props.fireClose();
  await nextTick();
  const beforePreviewClick = selectionChanges.length;
  content().props.onClick({ target: new Element('img') });
  await nextTick();
  assert.ok(selectionImage());
  assert.equal(selectionChanges.length, beforePreviewClick);
  selectionImage().props.fireClose();
  await nextTick();
  selectionCarousel.unmount();

  const customToolbar = mount(
    Carousel,
    { items, preview: true, selectable: true },
    {},
    {
      toolbar: (scope) =>
        h('custom-toolbar', { index: scope.activeIndex }, '自定义操作'),
    },
  );
  await nextTick();
  walk(
    customToolbar.host,
    (node) =>
      node.props.class === 'super-carousel__content' && !node.props.inert,
  )[0].props.onClick({ target: new Element('img') });
  await nextTick();
  const customTools = walk(
    customToolbar.host,
    (node) => node.kind === 'custom-toolbar',
  );
  assert.equal(customTools.length, 1);
  assert.equal(customTools[0].props.index, 0);
  const customBar = walk(
    customToolbar.host,
    (node) => node.props.class === 'super-carousel__preview-toolbar',
  )[0];
  assert.equal(walk(customBar, (node) => node.kind === 'checkbox').length, 1);
  assert.equal(
    walk(
      customBar,
      (node) => node.kind === 'button' && node.props.label === '放大',
    ).length,
    0,
  );
  customToolbar.unmount();

  const localSelection = mount(Carousel, { items, selectable: true });
  await nextTick();
  const localContent = () =>
    walk(
      localSelection.host,
      (node) =>
        node.props.class === 'super-carousel__content' && !node.props.inert,
    )[0];
  const localCheck = () =>
    walk(
      localSelection.host,
      (node) =>
        node.kind === 'checkbox' && node.props['aria-label'] === '勾选当前项',
    )[0];
  localContent().props.onClick({ target: new Element('img') });
  await nextTick();
  assert.equal(localCheck().props.checked, true);
  localContent().props.onClick({ target: new Element('img') });
  await nextTick();
  assert.equal(localCheck().props.checked, false);
  localSelection.unmount();

  const floating = mount(Carousel, { items, trigger: 'click', loop: false });
  await nextTick();
  const controls = () =>
    walk(
      floating.host,
      (node) => node.props.class === 'super-carousel__controls',
    )[0];
  const counter = () =>
    walk(
      floating.host,
      (node) => node.props.class === 'super-carousel__count',
    )[0];
  const arrows = () =>
    walk(floating.host, (node) => node.props.class === 'super-carousel__arrow');
  assert.equal(controls().parent.props.class, 'super-carousel__stage');
  assert.equal(
    walk(
      floating.host,
      (node) => node.props.class === 'super-carousel__navigation',
    ).length,
    1,
  );
  assert.equal(counter().textContent, '1 / 4');
  assert.equal(
    walk(
      floating.host,
      (node) => node.props.class === 'super-carousel__indicators',
    ).length,
    0,
  );
  assert.equal(arrows()[0].props.disabled, true);
  assert.ok(arrows().every((node) => node.props.square === undefined));
  arrows()[1].props.onClick();
  await nextTick();
  assert.equal(floating.instance.activeIndex, 1);
  assert.equal(counter().textContent, '2 / 4');
  floating.instance.setActiveItem(3);
  await nextTick();
  assert.equal(arrows()[1].props.disabled, true);
  assert.equal(counter().textContent, '4 / 4');
  floating.props.value.indicatorPosition = 'none';
  floating.props.value.arrow = 'never';
  await nextTick();
  assert.equal(counter(), undefined);
  assert.equal(arrows().length, 0);
  floating.props.value.indicatorPosition = '';
  await nextTick();
  assert.equal(counter().textContent, '4 / 4');
  floating.unmount();

  let mountedCards = 0;
  const Card = defineComponent({
    setup() {
      mountedCards++;
      return () => h('input');
    },
  });
  const custom = mount(Carousel, { items }, {}, { default: () => h(Card) });
  await nextTick();
  assert.equal(mountedCards, 3);
  custom.instance.next();
  await nextTick();
  assert.equal(mountedCards, 4);
  custom.instance.prev();
  await nextTick();
  assert.equal(mountedCards, 4);
  custom.props.value.items = items.slice(0, 2);
  await nextTick();
  assert.equal(walk(custom.host, (node) => node.kind === 'article').length, 2);
  custom.unmount();
  mock.timers.reset();
  const exports = await readFile(resolve(root, 'lib/main.ts'), 'utf8');
  assert.match(exports, /default as SuperCarousel/);
  assert.match(exports, /SuperCarouselInstance/);
  console.log(
    '通过：轮播真实状态与SFC接线、循环/增删/排序、懒渲染、播放暂停与清理、键盘/滑动、预览映射、普通/预览选择同步、悬浮导航接线和导出；Element Plus图片、勾选框及按钮使用替身，真实布局与预览另行浏览器验收。',
  );
} finally {
  for (const app of apps) app.unmount();
  mock.timers.reset();
  for (const [key, descriptor] of saved) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
  await rm(temporary, { recursive: true, force: true });
}
