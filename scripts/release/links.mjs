import { readdir, readFile } from 'node:fs/promises';
import { posix, resolve } from 'node:path';

export async function checkLinks(directory = 'website/.vitepress/dist') {
  const pages = new Map();
  async function walk(relative = '') {
    for (const entry of await readdir(resolve(directory, relative), {
      withFileTypes: true,
    })) {
      const name = posix.join(relative, entry.name);
      if (entry.isDirectory()) await walk(name);
      else if (name.endsWith('.html')) {
        const html = await readFile(resolve(directory, name), 'utf8');
        pages.set(name, {
          ids: new Set(
            [...html.matchAll(/\bid="([^"]*)"/g)].map((match) => match[1]),
          ),
          links: [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map(
            (match) => match[1],
          ),
        });
      }
    }
  }
  await walk();
  let count = 0;
  for (const [name, page] of pages) {
    for (const href of page.links) {
      const url = new URL(
        href.replaceAll('&amp;', '&'),
        `https://docs.local/${name}`,
      );
      if (url.origin !== 'https://docs.local') continue;
      let target = decodeURIComponent(url.pathname).slice(1);
      if (!target || target.endsWith('/')) target += 'index.html';
      else if (!posix.extname(target)) target += '.html';
      const destination = pages.get(target);
      if (!destination) {
        // 静态资源链接也必须存在。
        await readFile(resolve(directory, target));
        continue;
      }
      if (
        url.hash &&
        !destination.ids.has(decodeURIComponent(url.hash.slice(1)))
      ) {
        throw new Error(`失效锚点：${name} → ${href}`);
      }
      count++;
    }
  }
  console.log(`通过：${pages.size} 个 HTML 页面、${count} 个站内链接与锚点`);
}
