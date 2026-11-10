import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createRenderer, h, nextTick, ref } from 'vue';

// 不引入测试框架；使用 Vue 自身的渲染器验证组合式函数的真实挂载/卸载生命周期。
const temporary = await mkdtemp(join(tmpdir(), 'wt-table-'));
const root = new URL('../', import.meta.url);
const vueUrl = import.meta.resolve('vue');
const replacements = {
  vue: vueUrl,
  'es-toolkit': import.meta.resolve('es-toolkit'),
  'es-toolkit/compat': import.meta.resolve('es-toolkit/compat'),
  '../../constants/date.ts': pathToFileURL(join(temporary, 'date.mjs')).href,
  './config.ts': pathToFileURL(join(temporary, 'config.mjs')).href,
};

async function compile(source, target, globals = '') {
  const content = await readFile(new URL(source, root), 'utf8');
  let output = ts.transpileModule(globals + content, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText;
  for (const [specifier, resolved] of Object.entries(replacements)) {
    output = output.replaceAll(`from '${specifier}'`, `from '${resolved}'`);
  }
  await writeFile(join(temporary, target), output);
}

const renderer = createRenderer({
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  insert() {},
  remove() {},
  patchProp() {},
  setText() {},
  setElementText() {},
  parentNode: () => null,
  nextSibling: () => null,
});
const apps = new Set();

try {
  await compile('src/constants/date.ts', 'date.mjs');
  await compile('src/components/SuperTable/config.ts', 'config.mjs');
  await compile(
    'src/components/SuperTable/useTableQuery.ts',
    'query.mjs',
    `import { ref, shallowRef, watch, onMounted, onBeforeUnmount } from '${vueUrl}';\n`,
  );
  const { useTableQuery } = await import(
    pathToFileURL(join(temporary, 'query.mjs')).href
  );
  const { getSearchColumns, compactSearch, getCellValue } = await import(
    pathToFileURL(join(temporary, 'config.mjs')).href
  );
  const { DATE_FORMATS, datePickerDefaultTime } = await import(
    pathToFileURL(join(temporary, 'date.mjs')).href
  );

  const customTime = [
    new Date(2026, 0, 1, 9, 30),
    new Date(2026, 0, 1, 18, 45),
  ];
  const fields = getSearchColumns([
    { prop: 'defaults', tableType: 'date', search: true },
    {
      prop: 'time',
      search: { formType: 'date-picker', props: { defaultTime: customTime } },
    },
    {
      prop: 'format',
      search: {
        formType: 'date-picker',
        props: { valueFormat: DATE_FORMATS.dateTime },
      },
    },
    {
      prop: 'both',
      search: {
        formType: 'date-picker',
        props: {
          defaultTime: customTime,
          valueFormat: DATE_FORMATS.date,
          type: 'daterange',
        },
      },
    },
  ]);
  assert.equal(fields[0].props.valueFormat, DATE_FORMATS.dateTimeSeconds);
  assert.deepEqual(fields[0].props.defaultTime, datePickerDefaultTime);
  assert.equal(fields[1].props.defaultTime, customTime);
  assert.equal(fields[1].props.valueFormat, DATE_FORMATS.dateTimeSeconds);
  assert.deepEqual(fields[2].props.defaultTime, datePickerDefaultTime);
  assert.equal(fields[2].props.valueFormat, DATE_FORMATS.dateTime);
  assert.equal(fields[3].props.defaultTime, customTime);
  assert.equal(fields[3].props.valueFormat, DATE_FORMATS.date);
  assert.equal(fields[3].props.type, 'daterange');
  assert.equal(datePickerDefaultTime[0].getHours(), 0);
  assert.equal(datePickerDefaultTime[1].getHours(), 23);
  assert.equal(datePickerDefaultTime[1].getMinutes(), 59);
  assert.equal(datePickerDefaultTime[1].getSeconds(), 59);
  const scalar = getSearchColumns([
    {
      prop: 'day',
      search: {
        formType: 'date-picker',
        props: {
          type: 'datetime',
          defaultTime: undefined,
          valueFormat: undefined,
        },
      },
    },
  ])[0];
  assert.ok(scalar.props.defaultTime instanceof Date);
  assert.equal(scalar.props.defaultTime.getHours(), 0);
  assert.equal(scalar.props.valueFormat, DATE_FORMATS.dateTimeSeconds);
  assert.deepEqual(
    compactSearch({
      a: '',
      b: null,
      c: undefined,
      d: [],
      zero: 0,
      no: false,
      range: ['开始', '结束'],
    }),
    { zero: 0, no: false, range: ['开始', '结束'] },
  );
  assert.equal(
    getCellValue({ owner: { name: '小林' } }, { prop: 'owner.name' }, 0),
    '小林',
  );
  assert.equal(
    getCellValue(
      { amount: 0 },
      { prop: 'amount', formatter: (_row, value) => `数量 ${value}` },
      0,
    ),
    '数量 0',
  );
  console.log('通过：日期四种覆盖、默认起止时刻、空值与嵌套路径');

  function mount({ immediate = true, external = false } = {}) {
    const requests = [];
    const queries = [];
    const loads = [];
    const interceptedErrors = [];
    const page = ref(3);
    const pageSize = ref(20);
    let state;
    let cleared = 0;
    const app = renderer.createApp({
      setup() {
        state = useTableQuery({
          page,
          pageSize,
          immediate: () => immediate,
          initialSort: { prop: 'id', order: 'ascending' },
          request: () =>
            external
              ? undefined
              : (query, { signal }) =>
                  new Promise((resolve, reject) =>
                    requests.push({ query, signal, resolve, reject }),
                  ).catch((error) => {
                    // 模拟调用方的返回拦截器：先处理错误，再保持 Promise 拒绝。
                    interceptedErrors.push(error);
                    throw error;
                  }),
          beforeQuery: () => cleared++,
          onQuery: (query) => queries.push(query),
          onLoad: (result) => loads.push(result),
        });
        state.initializeSearch({ zero: 0, enabled: false, name: '' });
        return () => h('div');
      },
    });
    app.mount({});
    apps.add(app);
    return {
      app,
      state,
      requests,
      queries,
      loads,
      interceptedErrors,
      page,
      pageSize,
      cleared: () => cleared,
    };
  }
  const flush = async () => {
    await nextTick();
    await Promise.resolve();
  };
  const table = mount();
  await flush();
  assert.equal(table.requests.length, 1);
  assert.deepEqual(Object.keys(table.requests[0].query).sort(), [
    'page',
    'pageSize',
    'search',
    'sort',
  ]);
  assert.deepEqual(table.requests[0].query.sort, {
    prop: 'id',
    order: 'ascending',
  });
  assert.deepEqual(table.requests[0].query.search, { zero: 0, enabled: false });
  table.queries[0].search.enabled = true;
  assert.equal(table.requests[0].query.search.enabled, false);
  table.requests[0].resolve({ data: [{ id: 1 }], total: 57 });
  await flush();
  assert.equal(table.state.loading.value, false);
  table.page.value = 2;
  await flush();
  assert.equal(table.requests.length, 2);
  table.pageSize.value = 50;
  await flush();
  assert.equal(table.requests.length, 3);
  assert.equal(table.requests[2].query.page, 1);
  assert.equal(table.requests[2].query.pageSize, 50);
  assert.equal(table.requests[1].signal.aborted, true);
  table.requests[2].resolve({ data: [{ id: 3 }], total: 57 });
  await flush();
  table.requests[1].resolve({ data: [{ id: 2 }], total: 57 });
  await flush();
  assert.equal(table.state.result.value.data[0].id, 3);
  assert.equal(table.loads.length, 2);
  console.log('通过：初始加载、分页合并、查询隔离、取消与过期响应');

  const searchPromise = table.state.submitSearch({ name: '任务', empty: [] });
  await flush();
  assert.equal(table.requests.length, 4);
  assert.deepEqual(table.requests[3].query.search, { name: '任务' });
  table.requests[3].reject(new Error('模拟失败'));
  await searchPromise;
  assert.equal(table.interceptedErrors[0].message, '模拟失败');
  assert.equal(table.loads.length, 2);
  assert.equal(table.state.loading.value, false);
  assert.equal(table.state.result.value.data[0].id, 3);
  const refresh = table.state.refresh();
  await flush();
  table.requests[4].resolve({ data: [], total: 0 });
  await refresh;
  assert.equal(table.interceptedErrors.length, 1);
  table.state.setSort({ prop: 'name', order: 'descending' });
  await flush();
  assert.equal(table.requests.length, 6);
  assert.deepEqual(table.requests[5].query.sort, {
    prop: 'name',
    order: 'descending',
  });
  const snapshot = table.state.getQuery();
  snapshot.search.name = '修改副本';
  assert.deepEqual(table.state.getQuery().search, { name: '任务' });
  const stale = table.requests[5];
  void table.state.refresh();
  await flush();
  assert.equal(table.requests.length, 7);
  stale.reject(new Error('过期请求失败'));
  await flush();
  assert.equal(table.interceptedErrors[1].message, '过期请求失败');
  assert.equal(table.state.loading.value, true);
  table.requests[6].reject({ message: 'API返回的错误详情' });
  await flush();
  assert.deepEqual(table.interceptedErrors[2], {
    message: 'API返回的错误详情',
  });
  assert.equal(table.state.loading.value, false);
  void table.state.refresh();
  await flush();
  assert.equal(table.requests.length, 8);
  table.app.unmount();
  apps.delete(table.app);
  assert.equal(table.requests[7].signal.aborted, true);
  table.requests[7].reject(new Error('卸载后失败'));
  await flush();
  assert.equal(table.interceptedErrors[3].message, '卸载后失败');
  assert.equal(table.loads.length, 3);
  console.log(
    '通过：搜索、排序、调用方拦截器处理错误、失败保留数据、过期与卸载请求静默',
  );

  const manual = mount({ immediate: false });
  const external = mount({ external: true });
  await flush();
  assert.equal(manual.requests.length, 0);
  assert.equal(external.queries.length, 0);
  const pending = manual.state.reload();
  await flush();
  assert.equal(manual.requests.length, 1);
  assert.equal(manual.requests[0].query.page, 1);
  manual.requests[0].resolve({ data: [], total: 0 });
  await pending;
  external.page.value = 2;
  await flush();
  assert.equal(external.queries.length, 1);
  assert.equal(external.queries[0].page, 2);
  assert.equal(external.requests.length, 0);
  console.log('通过：延迟首次加载、reload、外部数据模式');
} finally {
  for (const app of apps) app.unmount();
  await rm(temporary, { recursive: true, force: true });
}
