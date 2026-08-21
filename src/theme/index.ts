import {
  computed,
  effectScope,
  inject,
  readonly,
  shallowRef,
  watch,
  type App,
  type ComputedRef,
  type InjectionKey,
  type Plugin,
  type Ref,
} from 'vue';

export type WtColorScheme = 'light' | 'dark';
export type WtMaterial = 'solid' | 'glass';
export type WtBuiltinTheme = 'light' | 'dark' | 'glass-light' | 'glass-dark';

export interface WtThemeOptions {
  scheme?: WtColorScheme;
  material?: WtMaterial;
  storage?: boolean;
}

export interface WtThemeContext {
  theme: ComputedRef<WtBuiltinTheme>;
  scheme: Readonly<Ref<WtColorScheme>>;
  material: Readonly<Ref<WtMaterial>>;
  setTheme(scheme: WtColorScheme, material: WtMaterial): void;
  setScheme(scheme: WtColorScheme): void;
  setMaterial(material: WtMaterial): void;
}

interface WtThemeState {
  scheme: WtColorScheme;
  material: WtMaterial;
}

interface StoredWtTheme extends WtThemeState {
  version: 1;
}

const STORAGE_KEY = 'wt-theme';
const THEME_ATTRIBUTES = [
  'data-wt-theme',
  'data-wt-scheme',
  'data-wt-material',
] as const;
const wtThemeKey: InjectionKey<WtThemeContext> = Symbol('wt-theme');

function resolveTheme({ scheme, material }: WtThemeState): WtBuiltinTheme {
  if (material === 'glass') {
    return scheme === 'dark' ? 'glass-dark' : 'glass-light';
  }
  return scheme;
}

function isStoredTheme(value: unknown): value is StoredWtTheme {
  if (typeof value !== 'object' || value === null) return false;
  const stored = value as Partial<StoredWtTheme>;
  return (
    stored.version === 1 &&
    (stored.scheme === 'light' || stored.scheme === 'dark') &&
    (stored.material === 'solid' || stored.material === 'glass')
  );
}

function readStoredTheme(): WtThemeState | undefined {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const stored: unknown = JSON.parse(raw);
    if (!isStoredTheme(stored)) return undefined;
    return { scheme: stored.scheme, material: stored.material };
  } catch {
    return undefined;
  }
}

function writeStoredTheme(value: WtThemeState) {
  try {
    const stored: StoredWtTheme = { version: 1, ...value };
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // 持久化不可用时只保留内存状态。
  }
}

function applyRootTheme(root: HTMLElement, value: WtThemeState) {
  root.setAttribute('data-wt-theme', resolveTheme(value));
  root.setAttribute('data-wt-scheme', value.scheme);
  root.setAttribute('data-wt-material', value.material);
}

export function createWtTheme(options: WtThemeOptions = {}): Plugin {
  const state = shallowRef<WtThemeState>({
    scheme: options.scheme ?? 'light',
    material: options.material ?? 'solid',
  });
  const theme = computed(() => resolveTheme(state.value));
  const scheme = computed(() => state.value.scheme);
  const material = computed(() => state.value.material);

  const context: WtThemeContext = {
    theme,
    scheme: readonly(scheme),
    material: readonly(material),
    setTheme(nextScheme, nextMaterial) {
      state.value = { scheme: nextScheme, material: nextMaterial };
    },
    setScheme(nextScheme) {
      state.value = { ...state.value, scheme: nextScheme };
    },
    setMaterial(nextMaterial) {
      state.value = { ...state.value, material: nextMaterial };
    },
  };

  return {
    install(app: App) {
      app.provide(wtThemeKey, context);

      if (typeof document === 'undefined') return;
      const root = document.documentElement;
      const originalAttributes = new Map(
        THEME_ATTRIBUTES.map((attribute) => [
          attribute,
          root.getAttribute(attribute),
        ]),
      );

      if (options.storage) {
        const stored = readStoredTheme();
        if (stored) state.value = stored;
      }
      applyRootTheme(root, state.value);

      const scope = effectScope();
      scope.run(() => {
        watch(
          state,
          (value) => {
            applyRootTheme(root, value);
            if (options.storage) writeStoredTheme(value);
          },
          { flush: 'sync' },
        );
      });

      app.onUnmount(() => {
        scope.stop();
        for (const [attribute, value] of originalAttributes) {
          if (value === null) root.removeAttribute(attribute);
          else root.setAttribute(attribute, value);
        }
      });
    },
  };
}

export function useWtTheme(): WtThemeContext {
  const context = inject(wtThemeKey);
  if (!context) {
    throw new Error(
      '[web-toolkit] useWtTheme() 需要先执行 app.use(createWtTheme())。',
    );
  }
  return context;
}
