import type { ComponentType } from "react";
import type { ShellAppearanceApi } from "./appearance";
import type { ShellMediaApi } from "./media";
import type { ShellMenuBarApi } from "./menubar";
import type { NotifyInput } from "./notify";
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
  /** 全局媒体引擎（CentralMusicEngine 的薄包装），跨 app 单例。 */
  media: ShellMediaApi;
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
}
