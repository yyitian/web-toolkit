import { readFileSync, readdirSync } from 'fs';
import { resolve, basename } from 'path';
import type { Plugin } from 'vite';

export interface WebToolkitPluginOptions {
  iconDirs?: string[];
  injectMixin?: boolean;
}

function extractSvgContent(raw: string): { viewBox: string; inner: string } {
  const viewBox = raw.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 24 24';
  const inner = raw
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>/i, '')
    .trim();
  return { viewBox, inner };
}

function buildSprite(iconDirs: string[]): string {
  const symbols: string[] = [];
  for (const dir of iconDirs) {
    let files: string[];
    try {
      files = readdirSync(dir).filter((f) => f.endsWith('.svg'));
    } catch {
      continue;
    }
    for (const file of files) {
      const name = basename(file, '.svg');
      const raw = readFileSync(resolve(dir, file), 'utf-8');
      const { viewBox, inner } = extractSvgContent(raw);
      symbols.push(
        `<symbol id="icon-${name}" viewBox="${viewBox}">${inner}</symbol>`,
      );
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">${symbols.join('')}</svg>`;
}

export function webToolkitPlugin(
  options: WebToolkitPluginOptions = {},
): Plugin {
  const { iconDirs = [], injectMixin = true } = options;

  return {
    name: 'web-toolkit',

    config() {
      if (!injectMixin) return undefined;
      return {
        css: {
          preprocessorOptions: {
            scss: {
              additionalData: `@use '@yyitian/web-toolkit/styles/mixin' as *;\n`,
            },
          },
        },
      };
    },

    transformIndexHtml(html: string) {
      const sprite = buildSprite(iconDirs);
      return html.replace(/(<body[^>]*>)/i, `$1${sprite}`);
    },
  };
}
