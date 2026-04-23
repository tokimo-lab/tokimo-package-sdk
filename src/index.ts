/**
 * @tokimo/app-sdk — runtime contract between third-party apps and the shell.
 *
 * Each app bundles its own React + UI deps and exposes a `mount(container, ctx)`
 * function. The shell's adapter renders an empty div and calls `mount()` from a
 * `useEffect`, so the app gets a fully isolated React root inside the shell's
 * window content.
 *
 * 后端通信契约：每个 app 子进程自己起一个 axum server 监听 UDS，server 端通过
 * `/api/apps/<id>/<rest>` 透明反代过去。app 前端**直接 `fetch("/api/apps/<id>/...")`**
 * 即可（保持现有 typed REST + React Query 链路不变）；SDK 不再提供通用 RPC 包装。
 *
 * 跨 app 调用（如 `notification_center.notify`）通过 `ctx.shell.*` 暴露的
 * 命名能力发起，shell 内部决定路由方式（local svc 仍走 bus invoke、子进程 app
 * 走 UDS 反代）。业务代码不应该硬编码这些 URL。
 *
 * See docs/app/multi-process-architecture.md for the full design.
 */

// ── Manifest types ──

export interface AppManifestLite {
  id: string;
  appName: string;
  /** Lucide icon name (resolved by shell). */
  icon?: string;
  /**
   * Image-based icon URL. When set, takes precedence over `icon` in surfaces
   * that support raster icons (window title bar, taskbar, launchpad, notifications).
   * Use a relative `assets/...` path (the shell rewrites it to
   * `/api/apps/<id>/assets/...`) or an absolute URL.
   */
  image?: string;
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
  /** 全局媒体引擎（CentralMusicEngine 的薄包装），跨 app 单例。 */
  media: ShellMediaApi;
  /** 顶部菜单栏注册（窗口聚焦时显示）。 */
  menubar: ShellMenuBarApi;
  /** Toast / 消息提示。 */
  toast: ShellToastApi;
  /** 窗口内导航（route / replace / goBack）。 */
  windowNav: ShellWindowNavApi;
}

// ── Media ────────────────────────────────────────────────────────────────────

export type MediaSourceType = "video" | "music" | "audio";

export interface MediaSessionQueueItem {
  id: string;
  title: string;
  artist?: string;
  artwork?: string;
  duration?: number;
}

export interface MusicPlaybackSnapshot {
  /** 当前 active provider id（如 `"apple-music"`）；null 表示无活跃源。 */
  activeProvider: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export interface LoadAndPlayOptions {
  /** App / 业务层的 provider 名（用于互斥与 active 判断）。 */
  provider: string;
  /** 当前播放音轨 id（用于 onEnded 时判断是否仍是当前曲目）。 */
  trackId?: string;
  /** 起始播放位置（秒）。 */
  startTime?: number;
  /** 自定义请求头（用于鉴权 / Range）。 */
  headers?: Record<string, string>;
  /** 是否以 HLS 形式播放（m3u8）。 */
  hls?: boolean;
}

export interface ShellMediaApi {
  // Central engine ── 跨 app 单例
  loadAndPlay: (url: string, opts: LoadAndPlayOptions) => Promise<void>;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  stop: () => void;
  setVolume: (vol: number) => void;
  setInitialVolume: (vol: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getIsPlaying: () => boolean;
  getActiveProvider: () => string | null;
  getAnalyser: () => AnalyserNode | null;
  getSnapshot: () => MusicPlaybackSnapshot;
  /** 订阅引擎状态变化（每次 snapshot 改变都触发）。返回 unsubscribe。 */
  subscribe: (listener: () => void) => () => void;
  /** 当前曲目播放结束回调。返回 unsubscribe。 */
  onEnded: (cb: () => void) => () => void;

  // Media session（跨 app 注册 + 系统级播放器互斥）
  registerSession: (source: MediaSessionSource) => () => void;
  /** 局部更新已注册 source 的元数据（不触发 React 重渲染）。 */
  updateSession: (id: string, patch: Partial<MediaSessionSource>) => void;
  requestPlay: (id: string, provider?: string) => void;
  notifyPause: (id: string, provider?: string) => void;
  notifyClose: (id: string, provider?: string) => void;
  /**
   * 读取 host 当前媒体会话快照（活跃源 + 持久化播放数据）。
   * 跨 app 只读访问：apple-music 需根据 host 活跃源判断是否在播放自己。
   */
  getSessionSnapshot: () => MediaSessionSnapshot;
  /** 订阅会话快照变化（activeSource / rawPlaybackData 任一变动都触发）。 */
  subscribeSession: (listener: () => void) => () => void;
  /**
   * 通知 host 当前源状态需要持久化。只对 active source 生效。
   * `immediate: true` 跳过 debounce（用于 play/pause/next 等关键动作）。
   */
  notifySaveNeeded: (
    id: string,
    provider?: string,
    immediate?: boolean,
  ) => void;
}

/** host 侧共享给 bundle 的媒体会话只读快照。 */
export interface MediaSessionSnapshot {
  activeSource: MediaSessionSource | null;
  /**
   * 从服务端拉回的持久化播放数据，由 host 定义具体类型。
   * 对 SDK 是 opaque —— bundle 自行 cast 到业务类型（如 apple-music 的
   * `PlaybackStateData`）。
   */
  rawPlaybackData: unknown;
  /** host 初次加载完成后置 true。 */
  rawPlaybackDataReady: boolean;
}

export interface MediaSessionSource {
  id: string;
  type: MediaSourceType;
  provider?: string;
  trackId?: string;
  /** UI 显示用的 label（如 "Apple Music"）。 */
  label?: string;
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  isPlaying: boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  volume: number;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  next?: () => void;
  previous?: () => void;
  getAnalyser?: () => AnalyserNode | null;
  queue: MediaSessionQueueItem[];
  currentIndex: number;
  skipToIndex?: (index: number) => void;
  removeFromQueue?: (index: number) => void;
  /**
   * Returns the current playback state for persistence. Host's media center
   * (single write authority) calls this when notifySaveNeeded fires. Shape
   * must match host PlaybackStateData["music"]; we keep it `unknown` here to
   * avoid coupling the SDK to host internals.
   */
  buildPersistState?: () => unknown;
}

// ── Menubar ──────────────────────────────────────────────────────────────────

export interface MenuBarMenuItem {
  key: string;
  label: string;
  icon?: unknown;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

export interface MenuBarMenuDivider {
  type: "divider";
}

export type MenuBarMenuEntry = MenuBarMenuItem | MenuBarMenuDivider;

export interface MenuBarMenu {
  key: string;
  label: string;
  items: MenuBarMenuEntry[];
}

export interface MenuBarSearchConfig {
  appId: string;
  searchType: "movie" | "tv" | "book" | "photo" | "music";
  placeholder?: string;
  onSelect: (item: {
    id: string;
    title: string;
    [key: string]: unknown;
  }) => void;
  recentItems?: Array<{
    id: string;
    title: string;
    posterPath?: string | null;
    type?: string;
  }>;
}

export interface MenuBarConfig {
  menus?: MenuBarMenu[];
  search?: MenuBarSearchConfig;
  about?: { description?: string; version?: string };
}

export interface ShellMenuBarApi {
  /** 注册当前 app 的菜单栏配置。null 清除。返回 dispose。 */
  set: (config: MenuBarConfig | null) => () => void;
}

// ── Toast ────────────────────────────────────────────────────────────────────

export type ToastLevel = "info" | "success" | "warning" | "error";

export interface ShellToastApi {
  show: (
    level: ToastLevel,
    message: string,
    opts?: { duration?: number },
  ) => void;
  info: (message: string, opts?: { duration?: number }) => void;
  success: (message: string, opts?: { duration?: number }) => void;
  warning: (message: string, opts?: { duration?: number }) => void;
  error: (message: string, opts?: { duration?: number }) => void;
}

// ── WindowNav ────────────────────────────────────────────────────────────────

export interface ShellWindowNavApi {
  /** 当前路由路径（窗口内）。 */
  getRoute: () => string;
  /** push 到当前窗口的导航栈。 */
  navigate: (route: string, title?: string) => void;
  /** 替换当前路由，不入栈。 */
  replace: (route: string, title?: string) => void;
  /** 后退一步。 */
  goBack: () => void;
  /** 是否有上一级可返回。 */
  canGoBack: () => boolean;
  /** 订阅路由变化。 */
  subscribe: (listener: () => void) => () => void;
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

// ── Shell-injected capabilities ──

/**
 * 通过 shell 提供的 notification_center 发送通知。
 *
 * 路由：`POST /api/apps/notification_center/notify`。
 * notification_center 当前是 server 内的 local service（走 bus invoke），未来若拆成
 * 独立子进程，URL 不变（透明 UDS 反代）。**业务代码请用 `ctx.shell.notify(...)`**，
 * 不要直接 fetch 这个 URL。
 */
async function postNotify(
  input: NotifyInput,
  fallbackAppId: string,
): Promise<void> {
  const r = await fetch("/api/apps/notification_center/notify", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      app_id: input.appId ?? fallbackAppId,
      category_id: input.categoryId ?? "default",
      category_label: input.categoryLabel,
      title: input.title,
      body: input.body,
      level: input.level,
    }),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => `${r.status}`);
    throw new Error(`notify failed: ${text}`);
  }
}

export type ShellInjections = Omit<ShellApi, "notify">;

/**
 * 给 shell adapter 用：传入由 shell 注入的有状态能力（media / menubar / toast / windowNav），
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
