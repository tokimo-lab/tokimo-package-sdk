/**
 * React hook wrappers around the imperative ShellApi. Third-party apps should
 * prefer these over reaching into ctx.shell.* in render bodies, because they:
 *   - turn shell state into reactive React state (via useSyncExternalStore)
 *   - provide effect-based registration (menubar / media session) that
 *     auto-cleans on unmount
 *
 * These helpers depend on React but not React-DOM; bundlers should externalize
 * "react" so the host React instance is reused (mandatory for hook identity).
 */
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type {
  AppAppearanceSnapshot,
  AppGeneralSettingsSnapshot,
  AppRuntimeCtx,
  MediaCenterSnapshot,
  MenuBarConfig,
  ShellMediaCenterApi,
  ShellToastApi,
  ShellViewerApi,
  ShellWindowDragSnapshot,
} from "./index";

// ── Locale ──────────────────────────────────────────────────────────────────

export function useShellLocale(ctx: AppRuntimeCtx): string {
  const [locale, setLocale] = useState(ctx.locale);

  useEffect(() => {
    return ctx.shell.subscribeLocale(setLocale);
  }, [ctx.shell]);

  return locale;
}

// ── Media center ────────────────────────────────────────────────────────────
//
// Subscribe to the host MediaCenter snapshot. snapshot === null means no
// provider is currently active.

export interface UseMediaCenterResult {
  snapshot: MediaCenterSnapshot | null;
  api: ShellMediaCenterApi | null;
}

export function useMediaCenter(ctx: AppRuntimeCtx): UseMediaCenterResult {
  // Defensive: ShellApi.media is typed non-null but may be absent at runtime
  // (e.g. host version mismatch or stripped shell). Cast through unknown so we
  // don't widen the published ShellApi type unnecessarily.
  const media =
    (ctx.shell.media as unknown as ShellMediaCenterApi | undefined) ?? null;
  const snapshot = useSyncExternalStore(
    (cb) => (media ? media.subscribe(() => cb()) : () => {}),
    () => (media ? media.getSnapshot() : null),
    () => (media ? media.getSnapshot() : null),
  );
  return useMemo(() => ({ snapshot, api: media }), [snapshot, media]);
}

// ── Menubar ────────────────────────────────────────────────────────────────

/**
 * Register `config` while mounted, unregister on unmount or when `config`
 * becomes null. Mirrors the host's effect-based useMenuBar() ergonomics.
 */
export function useShellMenuBar(
  ctx: AppRuntimeCtx,
  config: MenuBarConfig | null,
): void {
  useEffect(() => {
    if (!config) return;
    const dispose = ctx.shell.menubar.set(config);
    return dispose;
  }, [ctx.shell.menubar, config]);
}

// ── Window navigation ───────────────────────────────────────────────────────

export interface UseShellWindowNavResult {
  route: string;
  canGoBack: boolean;
  navigate: (route: string, title?: string) => void;
  replace: (route: string, title?: string) => void;
  goBack: () => void;
}

export function useShellWindowNav(ctx: AppRuntimeCtx): UseShellWindowNavResult {
  const nav = ctx.shell.windowNav;
  // Subscribe to route changes — host adapter calls listeners on each change.
  const route = useSyncExternalStore(
    (cb) => nav.subscribe(cb),
    () => nav.getRoute(),
    () => nav.getRoute(),
  );
  const canGoBack = useSyncExternalStore(
    (cb) => nav.subscribe(cb),
    () => nav.canGoBack(),
    () => nav.canGoBack(),
  );
  return useMemo(
    () => ({
      route,
      canGoBack,
      navigate: nav.navigate,
      replace: nav.replace,
      goBack: nav.goBack,
    }),
    [route, canGoBack, nav.navigate, nav.replace, nav.goBack],
  );
}

// ── Window drag state ───────────────────────────────────────────────────────

export function useShellWindowDrag(
  ctx: AppRuntimeCtx,
): ShellWindowDragSnapshot {
  const drag = ctx.shell.windowDrag;
  return useSyncExternalStore(
    (cb) => drag.subscribe(cb),
    () => drag.getSnapshot(),
    () => drag.getSnapshot(),
  );
}

// ── Toast ───────────────────────────────────────────────────────────────────

/** Stable reference to the toast API (it's already a stable singleton). */
export function useShellToast(ctx: AppRuntimeCtx): ShellToastApi {
  return ctx.shell.toast;
}

// ── Viewer ──────────────────────────────────────────────────────────────────

/** Stable reference to the shell viewer API. */
export function useShellViewer(ctx: AppRuntimeCtx): ShellViewerApi {
  return ctx.shell.viewer;
}

// ── Appearance (theme / title-bar style) ────────────────────────────────────

/**
 * Subscribe to the host's appearance snapshot. Reactive across theme toggles
 * and title-bar style changes (so apps with overlay chrome can re-pad their
 * sidebar for macOS traffic-lights without a window remount).
 */
export function useShellAppearance(ctx: AppRuntimeCtx): AppAppearanceSnapshot {
  const ap = ctx.shell.appearance;
  return useSyncExternalStore(
    (cb) => ap.subscribe(cb),
    () => ap.getSnapshot(),
    () => ap.getSnapshot(),
  );
}

// ── Preferences (per-app DB-backed storage) ──────────────────────────────────

const emptyPrefs: Record<string, unknown> = {};
const noopAsync = async () => {};
const noopUnsub = () => {};

/**
 * Read & mutate the current app's DB-backed preferences (scope = "app",
 * scopeId = appId, automatically scoped by the shell).
 *
 * Returns `{ data, patch, put, reset }`. If the shell does not expose the
 * preferences API (e.g. standalone mode), returns safe defaults.
 */
export function useShellPreference<
  T extends object = Record<string, unknown>,
>(ctx: AppRuntimeCtx) {
  const prefs = ctx.shell.preferences;

  const data = useSyncExternalStore(
    (cb) => prefs?.subscribe(cb) ?? noopUnsub,
    () => (prefs ? prefs.getSnapshot() : emptyPrefs),
    () => (prefs ? prefs.getSnapshot() : emptyPrefs),
  );

  return useMemo(
    () => ({
      data: data as T,
      patch: prefs?.patch ?? noopAsync,
      put: prefs?.put ?? noopAsync,
      reset: prefs?.reset ?? noopAsync,
    }),
    [data, prefs?.patch, prefs?.put, prefs?.reset],
  );
}

// ── General Settings (global system settings) ────────────────────────────────

const defaultGeneralSettings: AppGeneralSettingsSnapshot = {
  adultModeEnabled: false,
  adultModeVisible: false,
};

/**
 * Subscribe to the host's global general settings snapshot (e.g. adult mode).
 * Returns safe defaults if the shell doesn't expose the API.
 */
export function useShellGeneralSettings(
  ctx: AppRuntimeCtx,
): AppGeneralSettingsSnapshot {
  const gs = ctx.shell.generalSettings;
  return useSyncExternalStore(
    (cb) => gs?.subscribe(cb) ?? noopUnsub,
    () => gs?.getSnapshot() ?? defaultGeneralSettings,
    () => gs?.getSnapshot() ?? defaultGeneralSettings,
  );
}
