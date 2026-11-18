import { computed, inject, provide } from 'vue';
import {
  configProviderContextKey,
  dayjs,
  localeContextKey,
} from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn.mjs';
import zhCnDate from 'dayjs/locale/zh-cn.js';

// 注册到 Element Plus 实际使用的 Day.js 实例，不改变其全局默认语言。
dayjs.locale(zhCnDate, undefined, true);

/** 仅为当前组件的子树补充中文默认值，保留外层响应式配置。 */
export function useWtLocale(): void {
  const inherited = inject(configProviderContextKey, undefined);
  const locale = computed(() => inherited?.value?.locale ?? zhCn);
  const config = computed(() => ({
    ...inherited?.value,
    locale: locale.value,
  }));

  provide(configProviderContextKey, config);
  provide(localeContextKey, locale);
}
