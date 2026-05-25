import type { ComponentType, ReactNode } from "react";
import type { ShellAppearanceApi } from "./appearance";
import type { ShellMediaCenterApi } from "./media";
import type { ShellMenuBarApi } from "./menubar";
import type { NotifyInput } from "./notify";
import type { ReactiveSource } from "./reactive";
import type { ShellToastApi } from "./toast";
import type { ShellViewerApi } from "./viewer";
import type { ShellWindowDragApi } from "./window-drag";
import type { ShellWindowNavApi } from "./window-nav";

/**
 * Minimal window descriptor passed to a modal child window component.
 *
 * Mirrors the shell's `WindowState` shape, but kept tiny so apps don't
 * have to depend on the shell's full window typings.
 */
export interface ShellWindowHandle {
  id: string;
  metadata: Record<string, unknown>;
  /**
   * Request the host to close this modal window. Safe to call multiple
   * times; the host de-duplicates close requests.
   */
  close: () => void;
}

export type VfsFile = unknown;

export type PlayerSourceMetadata = Record<string, unknown>;

export interface PlayerPlayMeta {
  title: string;
  poster?: string | null;
  sourceMetadata?: PlayerSourceMetadata;
}

export interface PlayerNextItem {
  file: VfsFile;
  meta: PlayerPlayMeta;
}

export type RegisterPlayerExtension = {
  (appId: string, ext: PlayerExtension): () => void;
  (ext: PlayerExtension): () => void;
};

export interface PlayerExtension {
  getResumePosition?: (
    file: VfsFile,
    sourceMetadata?: Record<string, unknown>,
  ) => Promise<number | null>;
  getNextItem?: (
    file: VfsFile,
    sourceMetadata?: Record<string, unknown>,
  ) => Promise<PlayerNextItem | null>;
  onProgress?: (
    file: VfsFile,
    position: number,
    sourceMetadata?: Record<string, unknown>,
  ) => void;
  renderTaskbarActions?: (
    file: VfsFile,
    sourceMetadata?: Record<string, unknown>,
  ) => ReactNode;
  renderEpisodePicker?: (
    file: VfsFile,
    sourceMetadata?: Record<string, unknown>,
  ) => ReactNode;
}

/**
 * Parameters for `shell.openModalWindow`.
 */
export interface ShellModalWindowParams {
  /**
   * Lazy-loaded React component default-export. The component receives
   * `{ win }: { win: ShellWindowHandle }` so it can read `win.metadata`
   * for context (e.g. the entity it should edit).
   */
  component: () => Promise<{
    default: ComponentType<{ win: ShellWindowHandle }>;
  }>;
  /** Window title shown in the title bar. */
  title?: string;
  /** Initial window width (default: 480). */
  width?: number;
  /** Initial window height (default: 640). */
  height?: number;
  /** Arbitrary metadata exposed on `win.metadata` inside the modal. */
  metadata?: Record<string, unknown>;
}

export interface ShellPickFilePathParams {
  /** Initial path to open in the browser. Defaults to "/" or system home. */
  initialPath?: string;
  /** VFS source id when browsing a remote storage source. */
  sourceId?: string;
  /** Protocol prefix shown above the address bar (e.g. "smb://host/share"). */
  protocolPrefix?: string;
  /** Window title; host provides a sensible default if omitted. */
  title?: string;
  /** Initial window width (default: host decides). */
  width?: number;
  /** Initial window height (default: host decides). */
  height?: number;
}

export interface StorageSourceDisplayHints {
  /** Safe redacted display prefix for the storage source (e.g. "smb://host/share"). */
  protocolPrefix?: string;
  /** Local-only real host root path for resolving display paths. */
  rootPath?: string;
}

export interface StorageSource {
  id: string;
  name: string;
  type: string;
  displayHints?: StorageSourceDisplayHints;
  sortOrder: number;
}

export interface StorageBinding {
  sourceId: string;
  sourceType: string;
  sourceName: string;
  displayHints?: StorageSourceDisplayHints;
  path: string;
}

export interface ShellPickStorageBindingParams {
  initial?: { sourceId?: string; path?: string };
  title?: string;
}

// ── Window state types (shared shape for third-party app windows) ───────────
//
// These are structural subsets of the host's full `WindowState` /
// `TaskMetadata`. Apps only need to read a small surface (id, metadata,
// title, etc.) — the host's richer state is assignable to these.

/**
 * Flat metadata bag attached to every window. The host's TaskMetadata is
 * a richer named union; third-party apps just see an open record.
 */
export type TaskMetadata = Record<string, unknown>;

/**
 * Structural subset of the host's WindowState that apps can rely on.
 *
 * Apps receive this as `{ win: WindowState }` for modal-style and viewer
 * windows (e.g. `VideoViewer`, `AddOnlineMediaWindow`).
 */
export interface WindowState {
  id: string;
  appName: string;
  title: string;
  type: string;
  metadata: TaskMetadata;
  route: string;
  appId?: string;
  sourceType?: string;
  sourceId?: string;
  serverId?: string;
  desktopId?: string | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  minimized?: boolean;
  maximized?: boolean;
  zIndex?: number;
  dirty?: boolean;
}

/**
 * Parameters for `shell.windowManager.openWindow`. Lifted from host
 * `OpenWindowParams`; third-party apps populate only what they need.
 */
export interface OpenWindowParams {
  type: string;
  title?: string;
  appName?: string;
  appId?: string;
  sourceType?: string;
  sourceId?: string;
  metadata?: TaskMetadata;
  route?: string;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  forceNew?: boolean;
}

/** Minimal DTO exposed to third-party apps via the windows snapshot stream. */
export interface MinimalWindowDTO {
  id: string;
  type: string;
  title: string;
  active: boolean;
  minimized: boolean;
}

// ── WindowManager / WS / Jobs / Bridge / Config injections ──────────────────

/**
 * Window manager actions + reactive snapshot of all open windows.
 *
 * Apps should NOT bypass this to touch host context directly — same bundle
 * may be mounted across multiple windows, so per-window scoping matters.
 */
export interface ShellWindowManagerApi {
  /** Open a new window (top-level, persisted). Returns the new window id. */
  openWindow: (params: OpenWindowParams) => string;
  /** Close a window by id. */
  closeWindow: (id: string) => void;
  /** Open an ephemeral modal child window centered on this app's window. */
  openModalWindow: (params: ShellModalWindowParams) => string;
  /** Patch arbitrary metadata fields on a window. */
  updateMetadata: (id: string, meta: Partial<TaskMetadata>) => void;
  /** This app's own window id (stable for the bundle's lifetime). */
  currentWindowId: string;
  /** Reactive minimal DTO snapshot of all open windows. */
  windowsSnapshot$: ReactiveSource<MinimalWindowDTO[]>;
}

/** Type-erased WS message envelope (matches host `WsIncoming`). */
export interface WsMessage {
  type: string;
  data?: unknown;
  reqId?: string;
  error?: string;
}

/** Single global WS connection wrapped as a topic subscription API. */
export interface ShellWsApi {
  /** Subscribe to a topic; returns unsubscribe. */
  subscribe: (type: string, handler: (msg: WsMessage) => void) => () => void;
}

/**
 * Job event envelope variants. Mirrors host `WsJobEvent`; payload shapes
 * remain `unknown` to keep the SDK lean (apps narrow as needed).
 */
export interface ShellJobEvent {
  type:
    | "job_update"
    | "external_job_update"
    | "person_scraped"
    | "download_progress";
  /** Top-level app id extracted by host when available. */
  appId?: string | null;
  /** Preferred payload carrier for `job_update` in SDK runtime. */
  data?: unknown;
  /** Legacy compatibility payload (`{ type: "job_update", job: ... }`). */
  job?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ShellJobEventsApi {
  subscribe: (params: {
    onEvent: (event: ShellJobEvent) => void;
    enabled?: boolean;
  }) => () => void;
}

/** Window-bridge primitives. Thin wrapper over host registry. */
export interface ShellBridgeApi {
  create: () => string;
  destroy: (id: string) => void;
  emit: <T = unknown>(id: string, event: string, payload?: T) => void;
  subscribe: <T = unknown>(
    id: string,
    event: string,
    handler: (payload: T) => void,
  ) => () => void;
}

/** Runtime configuration knobs (escape hatches; default to relative URLs). */
export interface ShellConfig {
  /**
   * Optional absolute base URL for the Rust server. Default `undefined`
   * means apps should use relative URLs (`/api/...`, `/storage/...`)
   * and rely on Vite proxy / same-origin in prod.
   */
  rustBaseUrl?: string;
}

export interface AppRuntimeCtx {
  windowId: string;
  appId: string;
  locale: string;
  /**
   * Resolved theme at mount time. Snapshot only — does NOT update when the
   * user toggles theme.
   *
   * @deprecated Prefer `useShellAppearance(ctx)` (reactive). Keeping this
   * field for back-compat with apps that pass it to `ConfigProvider
   * defaultMode` at mount time. Will be removed once all bundled apps
   * migrate.
   */
  theme: "light" | "dark";
  shell: ShellApi;
}

export interface ShellApi {
  notify: (input: NotifyInput) => Promise<void>;
  /**
   * Returns the DOM element that apps should portal content into.
   *
   * By default (`includeTitleBar` omitted or `false`) the container covers
   * only the **window content area** (below the title bar).  Pass
   * `{ includeTitleBar: true }` to obtain a container that covers the
   * **entire window** including the title bar — useful for full-window
   * overlays such as loading spinners or drag handles.
   */
  getWindowContainer: (
    windowId: string,
    options?: { includeTitleBar?: boolean },
  ) => HTMLElement | null;
  /** 全局媒体引擎（CentralMusicEngine 的薄包装），跨 app 单例。 */
  media: ShellMediaCenterApi;
  /** 顶部菜单栏注册（窗口聚焦时显示）。 */
  menubar: ShellMenuBarApi;
  /** Toast / 消息提示。 */
  toast: ShellToastApi;
  /** 窗口内导航（route / replace / goBack）。 */
  windowNav: ShellWindowNavApi;
  /** Shell window drag state stream for apps that need to pause heavy work. */
  windowDrag: ShellWindowDragApi;
  /** 主题 / 标题栏风格快照 + 订阅（用于适配 macOS 红绿灯位置等）。 */
  appearance: ShellAppearanceApi;
  /** Shell-owned file/content viewers. */
  viewer: ShellViewerApi;
  /**
   * Open an ephemeral modal child window centered on this app's window.
   * The parent (this app) is blocked until the modal is closed.
   * Not persisted across reloads. Returns the new window's id.
   */
  openModalWindow: (params: ShellModalWindowParams) => string;
  /**
   * Open the host's native directory picker centered on this app's window.
   * Returns the selected absolute path. Resolves to `null` if the user cancels.
   */
  pickFilePath: (params?: ShellPickFilePathParams) => Promise<string | null>;
  /** List all configured VFS storage sources. */
  listStorageSources: () => Promise<StorageSource[]>;
  /**
   * Open the host's storage binding picker (source + path).
   * Resolves to the selected binding, or `null` if the user cancels.
   */
  pickStorageBinding: (
    params?: ShellPickStorageBindingParams,
  ) => Promise<StorageBinding | null>;
  /** Window manager actions + reactive snapshot. */
  windowManager: ShellWindowManagerApi;
  /** Global WS connection (topic subscribe). */
  ws: ShellWsApi;
  /** Cross-app job event stream (jobs / downloads / scrapes). */
  jobEvents: ShellJobEventsApi;
  /** In-process window-bridge primitives for picker / cross-window flows. */
  bridge: ShellBridgeApi;
  /** Runtime knobs (e.g. optional rustBaseUrl escape hatch). */
  config: ShellConfig;
  /**
   * Subscribe to host locale changes. Handler is invoked with the new locale
   * string (e.g. "zh-CN", "en-US") whenever the user switches language in host
   * shell. Returns an unsubscribe function — app MUST call it on dispose to
   * avoid leaks.
   *
   * Initial value is delivered via `ctx.locale` at mount time; this API is
   * for follow-up changes only (host will NOT re-emit the current locale
   * upon subscribe).
   */
  subscribeLocale: (handler: (locale: string) => void) => () => void;
  /** Host video player (PlayerProvider). */
  player: {
    play: (
      file: VfsFile,
      meta: PlayerPlayMeta,
      options?: {
        initialPosition?: number;
        startPaused?: boolean;
      },
    ) => Promise<void>;
    registerExtension: RegisterPlayerExtension;
    closePlayer: () => void;
    /** Snapshot of currently playing item (null if nothing playing). */
    getCurrentItem: () => {
      fileId: string;
      sourceMetadata?: Record<string, unknown>;
    } | null;
    /** Subscribe to item changes; returns unsubscribe. */
    subscribeItem: (listener: () => void) => () => void;
  };
}
