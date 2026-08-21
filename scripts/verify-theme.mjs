import assert from 'node:assert/strict';
import { createRenderer } from 'vue';
import { createWtTheme, useWtTheme } from '../src/theme/index.ts';

class FakeRoot {
  attributes = new Map();
  writes = [];

  constructor(initial = {}) {
    for (const [name, value] of Object.entries(initial)) {
      this.attributes.set(name, value);
    }
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
    this.writes.push([name, value]);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    this.writes.push([name, null]);
  }
}

class FakeStorage {
  values = new Map();
  throwOnRead = false;
  throwOnWrite = false;

  getItem(key) {
    if (this.throwOnRead) throw new Error('storage read failed');
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    if (this.throwOnWrite) throw new Error('storage write failed');
    this.values.set(key, value);
  }
}

const renderer = createRenderer({
  patchProp() {},
  insert(child, parent) {
    parent.children.push(child);
  },
  remove() {},
  createElement(type) {
    return { type, children: [] };
  },
  createText(text) {
    return { text };
  },
  createComment(text) {
    return { comment: text };
  },
  setText(node, text) {
    node.text = text;
  },
  setElementText(node, text) {
    node.text = text;
  },
  parentNode() {
    return null;
  },
  nextSibling() {
    return null;
  },
  querySelector() {
    return null;
  },
  setScopeId() {},
  cloneNode(node) {
    return { ...node };
  },
  insertStaticContent() {
    const node = { static: true };
    return [node, node];
  },
});

function setBrowserEnvironment(root, storage) {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement: root },
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });
}

function mountTheme(options, { root = new FakeRoot(), storage } = {}) {
  const resolvedStorage = storage ?? new FakeStorage();
  setBrowserEnvironment(root, resolvedStorage);

  let context;
  const app = renderer.createApp({
    setup() {
      context = useWtTheme();
      return () => null;
    },
  });
  app.use(createWtTheme(options));
  app.mount({ children: [] });
  return { app, context, root, storage: resolvedStorage };
}

function assertTheme(context, root, scheme, material, theme) {
  assert.equal(context.scheme.value, scheme);
  assert.equal(context.material.value, material);
  assert.equal(context.theme.value, theme);
  assert.equal(root.getAttribute('data-wt-scheme'), scheme);
  assert.equal(root.getAttribute('data-wt-material'), material);
  assert.equal(root.getAttribute('data-wt-theme'), theme);
}

{
  const storage = new FakeStorage();
  storage.values.set(
    'wt-theme',
    JSON.stringify({ version: 1, scheme: 'dark', material: 'glass' }),
  );
  const mounted = mountTheme(
    { scheme: 'light', material: 'solid', storage: true },
    { storage },
  );
  assertTheme(mounted.context, mounted.root, 'dark', 'glass', 'glass-dark');
  mounted.app.unmount();
}

for (const invalidValue of [
  '{',
  JSON.stringify({ version: 1, scheme: 'dark' }),
  JSON.stringify({ version: 1, scheme: 'sepia', material: 'glass' }),
  JSON.stringify({ version: 2, scheme: 'dark', material: 'glass' }),
]) {
  const storage = new FakeStorage();
  storage.values.set('wt-theme', invalidValue);
  const mounted = mountTheme(
    { scheme: 'light', material: 'solid', storage: true },
    { storage },
  );
  assertTheme(mounted.context, mounted.root, 'light', 'solid', 'light');
  mounted.app.unmount();
}

{
  const storage = new FakeStorage();
  storage.throwOnRead = true;
  const mounted = mountTheme(
    { scheme: 'dark', material: 'solid', storage: true },
    { storage },
  );
  assertTheme(mounted.context, mounted.root, 'dark', 'solid', 'dark');
  storage.throwOnRead = false;
  storage.throwOnWrite = true;
  mounted.context.setTheme('light', 'glass');
  assertTheme(mounted.context, mounted.root, 'light', 'glass', 'glass-light');
  mounted.app.unmount();
}

{
  const original = {
    'data-wt-theme': 'outside-theme',
    'data-wt-scheme': 'outside-scheme',
  };
  const root = new FakeRoot(original);
  const storage = new FakeStorage();
  const mounted = mountTheme(
    { scheme: 'light', material: 'solid', storage: true },
    { root, storage },
  );

  root.writes.length = 0;
  mounted.context.setTheme('dark', 'glass');
  assert.deepEqual(root.writes, [
    ['data-wt-theme', 'glass-dark'],
    ['data-wt-scheme', 'dark'],
    ['data-wt-material', 'glass'],
  ]);
  const persisted = storage.getItem('wt-theme');
  assert.deepEqual(JSON.parse(persisted), {
    version: 1,
    scheme: 'dark',
    material: 'glass',
  });

  mounted.app.unmount();
  assert.equal(root.getAttribute('data-wt-theme'), 'outside-theme');
  assert.equal(root.getAttribute('data-wt-scheme'), 'outside-scheme');
  assert.equal(root.getAttribute('data-wt-material'), null);
  assert.equal(storage.getItem('wt-theme'), persisted);

  root.writes.length = 0;
  mounted.context.setTheme('light', 'solid');
  assert.deepEqual(root.writes, []);
}

{
  const app = renderer.createApp({ render: () => null });
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    assert.throws(
      () => app.runWithContext(() => useWtTheme()),
      /app\.use\(createWtTheme\(\)\)/,
    );
  } finally {
    console.warn = originalWarn;
  }
}

console.log('主题生命周期验证通过');
