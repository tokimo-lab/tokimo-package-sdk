/**
 * @tokimo/app-sdk — runtime contract between third-party apps and the shell.
 *
 * Each app bundles its own React + UI deps and exposes a `mount(container, ctx)`
 * function. The shell's adapter renders an empty div and calls `mount()` from a
 * `useEffect`, so the app gets a fully isolated React root inside the shell's
 * window content. Communication with the shell happens through plain async calls
 * over the bus HTTP gateway — no cross-realm React contexts.
 *
 * See docs/app/multi-process-architecture.md for the full design.
 */

// ── Manifest types ──

export interface AppManifestLite {
  id: string;
  appName: string;
  /** Lucide icon name (resolved by shell). */
  icon?: string;
  color?: string;
  windowType: string;
  defaultSize?: { width: number; height: number };
  category?: "app" | "page" | "system" | "popup";
}

export interface AppDefinition {
  id: string;
  manifest: AppManifestLite;
  translations?: Record<string, Record<string, string>>;
  /**
   * Mount the app into a shell-provided DOM container.
   * Must return a dispose function that tears down the React root.
   */
  mount: (container: HTMLElement, ctx: AppRuntimeCtx) => Dispose;
}

export type Dispose = () => void;

export interface AppRuntimeCtx {
  windowId: string;
  appId: string;
  locale: string;
  theme: "light" | "dark";
  shell: ShellApi;
}

export interface ShellApi {
  notify: (input: NotifyInput) => Promise<void>;
}

export interface NotifyInput {
  /**
   * 触发该通知的 app id（用于通知中心 app 列表聚合）。
   * 缺省时由 shell 注入当前 app 的 manifest.id。
   */
  appId?: string;
  /**
   * 通知分类（用于"系统设置 → 通知中心"中的开关粒度）；缺省 "default"。
   * 同一 app 可定义多个 category（如 "task_success" / "task_failed"）。
   */
  categoryId?: string;
  /** 分类显示名（i18n key 或纯文本）；首次注册 source 时落库。 */
  categoryLabel?: string;
  title: string;
  body?: string;
  level?: "info" | "success" | "warning" | "error";
}

export function defineApp(def: AppDefinition): AppDefinition {
  return def;
}

// ── HTTP bus client (used by apps and the shell adapter alike) ──

export async function busCall<T = unknown>(
  service: string,
  method: string,
  payload: unknown = {},
): Promise<T> {
  const r = await fetch("/api/bus/call", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ service, method, payload }),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => `${r.status}`);
    throw new Error(`bus.call(${service}.${method}) failed: ${text}`);
  }
  return (await r.json()) as T;
}

/** Convenience: scope all calls to a specific service. */
export function makeBusClient(service: string) {
  return {
    call: <T = unknown>(method: string, payload: unknown = {}) =>
      busCall<T>(service, method, payload),
    callService: busCall,
  };
}

export function makeShellApi(appId: string): ShellApi {
  return {
    notify: (input) =>
      busCall("notification_center", "notify", {
        app_id: input.appId ?? appId,
        category_id: input.categoryId ?? "default",
        category_label: input.categoryLabel,
        title: input.title,
        body: input.body,
        level: input.level,
      }),
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
