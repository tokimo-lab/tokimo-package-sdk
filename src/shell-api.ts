import { postNotify } from "./notify";
import type { ShellApi } from "./runtime";

export type ShellInjections = Omit<ShellApi, "notify">;

/**
 * 给 shell adapter 用：传入由 shell 注入的有状态能力
 * （media / menubar / toast / windowNav / windowDrag / appearance / viewer），
 * SDK 自行包装 notify（无状态 fetch /api/apps/notification_center/notify）。
 */
export function makeShellApi(
  appId: string,
  injections: ShellInjections,
): ShellApi {
  return {
    notify: (input) => postNotify(input, appId),
    media: injections.media,
    menubar: injections.menubar,
    toast: injections.toast,
    windowNav: injections.windowNav,
    windowDrag: injections.windowDrag,
    appearance: injections.appearance,
    viewer: injections.viewer,
    openModalWindow: injections.openModalWindow,
  };
}

/** Tiny i18n helper, used by apps that pass `translations` to defineApp. */
export function makeTranslator(
  translations: Record<string, Record<string, string>> | undefined,
  locale: string,
) {
  const bundle = translations?.[locale] ?? {};
  return (key: string, fallback?: string): string =>
    bundle[key] ?? fallback ?? key;
}
