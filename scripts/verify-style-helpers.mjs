import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { compileString } from 'sass-embedded';
import { parse, compileStyle } from 'vue/compiler-sfc';

// 编译方式包含 Vite 对组件注入的公共 mixin；仅验证 CSS 契约，不模拟浏览器。
const root = fileURLToPath(new URL('../', import.meta.url));
export async function styles(component) {
  const filename = resolve(root, `src/components/${component}`);
  const source = await readFile(filename, 'utf8');
  const { descriptor } = parse(source, { filename });
  return descriptor.styles
    .map((block) => {
      const css =
        block.lang === 'scss' ? scss(block.content, filename) : block.content;
      const result = compileStyle({
        source: css,
        filename,
        id: 'data-v-typography',
        scoped: block.scoped,
      });
      assert.deepEqual(result.errors, []);
      return result.code;
    })
    .join('\n');
}
export function rule(css, selector) {
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]+)\}/g)].filter((match) =>
    selector.test(match[1]),
  );
  assert.ok(rules.length, `缺少规则 ${selector}`);
  return rules.map((match) => match[2]).join('\n');
}
export function role(css, selector, size, weight) {
  const declarations = rule(css, selector);
  assert.match(
    declarations,
    new RegExp(`font-size: var\\(--wt-font-size-${size},`),
  );
  assert.match(
    declarations,
    new RegExp(`line-height: var\\(--wt-line-height-${size},`),
  );
  assert.match(
    declarations,
    new RegExp(`font-weight: var\\(--wt-font-weight-${weight},`),
  );
  return declarations;
}

export function scss(source, filename) {
  return compileString(
    `@use ${JSON.stringify(resolve(root, 'src/styles/mixin'))} as *;\n${source}`,
    { url: pathToFileURL(filename) },
  ).css;
}
