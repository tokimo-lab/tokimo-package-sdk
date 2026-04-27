import type { ShellAppearanceApi } from "./appearance";
import type { ShellMediaApi } from "./media";
import type { ShellMenuBarApi } from "./menubar";
import type { NotifyInput } from "./notify";
import type { ShellToastApi } from "./toast";
import type { ShellViewerApi } from "./viewer";
import type { ShellWindowNavApi } from "./window-nav";

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
  /** 主题 / 标题栏风格快照 + 订阅（用于适配 macOS 红绿灯位置等）。 */
  appearance: ShellAppearanceApi;
  /** Shell-owned file/content viewers. */
  viewer: ShellViewerApi;
}
