import assert from 'node:assert/strict';
import { createRenderer, h, nextTick, shallowRef } from 'vue';
import {
  dayjs,
  ElConfigProvider,
  useGlobalConfig,
  useLocale,
} from 'element-plus';
import en from 'element-plus/es/locale/lang/en.mjs';
import zhCn from 'element-plus/es/locale/lang/zh-cn.mjs';

const initialLanguage = dayjs.locale();
const initialGlobal = useGlobalConfig().value;
const { useWtLocale } = await import('../src/components/useWtLocale.ts');
assert.equal(dayjs.locale(), initialLanguage);
assert.equal(useGlobalConfig().value, initialGlobal);
assert.equal(dayjs('2026-11-12').locale('zh-cn').format('dddd'), '星期四');
assert.equal(dayjs().locale('zh-cn').$locale().weekStart, 1);

// 使用真实的 Element Plus 配置和语言组合式函数，检查 Vue 注入边界。
const renderer = createRenderer({
  createElement: () => ({ children: [] }),
  createText: () => ({}),
  createComment: () => ({}),
  insert(child, parent, anchor) {
    if (child.parent) {
      const oldChildren = child.parent.children;
      oldChildren.splice(oldChildren.indexOf(child), 1);
    }
    const position = anchor ? parent.children.indexOf(anchor) : -1;
    parent.children.splice(
      position < 0 ? parent.children.length : position,
      0,
      child,
    );
    child.parent = parent;
  },
  remove(child) {
    const parent = child.parent;
    if (parent) parent.children.splice(parent.children.indexOf(child), 1);
    child.parent = undefined;
  },
  patchProp() {},
  setText() {},
  setElementText() {},
  parentNode: (child) => child.parent,
  nextSibling(child) {
    const siblings = child.parent?.children ?? [];
    return siblings[siblings.indexOf(child) + 1] ?? null;
  },
});
const apps = [];
const states = new Map();
const Probe = {
  props: { id: { type: String, required: true } },
  setup(props) {
    states.set(props.id, { config: useGlobalConfig(), ...useLocale() });
    return () => h('probe');
  },
};
const Boundary = {
  setup(_, { slots }) {
    useWtLocale();
    return () => slots.default?.();
  },
};

function probe(id) {
  return h(Probe, { id });
}
function boundary(id) {
  return h(Boundary, null, { default: () => probe(id) });
}
function mount(render) {
  const app = renderer.createApp({ setup: () => render });
  apps.push(app);
  app.mount({ children: [] });
}
function language(id) {
  return states.get(id).lang.value;
}

try {
  mount(() => [boundary('default'), probe('sibling')]);
  assert.equal(language('default'), 'zh-cn');
  assert.equal(language('sibling'), initialGlobal?.locale?.name ?? 'en');
  assert.equal(useGlobalConfig().value, initialGlobal);
  console.log('通过：默认中文、原生兄弟组件和全局配置不受初始化影响');

  const outer = shallowRef({
    size: 'small',
    namespace: 'custom',
    zIndex: 3300,
  });
  const inner = shallowRef(undefined);
  mount(() =>
    h(ElConfigProvider, outer.value, {
      default: () => [
        boundary('inherited'),
        h(Boundary, null, {
          default: () => [
            probe('nested'),
            h(
              ElConfigProvider,
              { locale: inner.value },
              {
                default: () => boundary('nearest'),
              },
            ),
          ],
        }),
      ],
    }),
  );
  assert.equal(language('inherited'), 'zh-cn');
  assert.equal(states.get('inherited').config.value.size, 'small');
  assert.equal(states.get('inherited').config.value.namespace, 'custom');
  assert.equal(states.get('inherited').config.value.zIndex, 3300);

  outer.value = { ...outer.value, locale: en, size: 'large' };
  await nextTick();
  assert.equal(language('inherited'), 'en');
  assert.equal(language('nested'), 'en');
  assert.equal(language('nearest'), 'en');
  assert.equal(states.get('inherited').config.value.size, 'large');
  assert.equal(states.get('inherited').t('el.select.noData'), 'No data');

  inner.value = zhCn;
  await nextTick();
  assert.equal(language('nearest'), 'zh-cn');
  assert.equal(language('nested'), 'en');
  assert.equal(states.get('nearest').config.value.size, 'large');
  console.log('通过：其他配置保留、外层语言优先、动态切换和嵌套就近覆盖');

  outer.value = { ...outer.value, locale: undefined };
  await nextTick();
  assert.equal(language('inherited'), 'zh-cn');
  assert.equal(states.get('inherited').t('el.select.noData'), '无数据');
  assert.equal(language('default'), 'zh-cn');

  outer.value = { ...outer.value, locale: en };
  await nextTick();
  const globalBefore = useGlobalConfig().value;
  mount(() => boundary('another-app'));
  assert.equal(language('another-app'), 'zh-cn');
  assert.equal(language('inherited'), 'en');
  assert.equal(useGlobalConfig().value, globalBefore);
  assert.equal(dayjs.locale(), initialLanguage);
  console.log('通过：清除外层语言恢复默认、不同应用隔离和 Day.js 默认语言保持');
} finally {
  for (const app of apps.reverse()) app.unmount();
}
