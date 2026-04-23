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
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type {
  AppRuntimeCtx,
  MediaSessionSnapshot,
  MediaSessionSource,
  MenuBarConfig,
  MusicPlaybackSnapshot,
  ShellMediaApi,
  ShellToastApi,
} from "./index";

// ── Media playback ──────────────────────────────────────────────────────────
//
// Returns a live snapshot of the central engine plus the media command set.
// Re-renders on every snapshot change.

export interface UseShellMediaResult extends ShellMediaApi {
  snapshot: MusicPlaybackSnapshot;
}

export function useShellMedia(ctx: AppRuntimeCtx): UseShellMediaResult {
  const media = ctx.shell.media;
  const snapshot = useSyncExternalStore(
    (cb) => media.subscribe(cb),
    () => media.getSnapshot(),
    () => media.getSnapshot(),
  );
  return useMemo(() => ({ ...media, snapshot }), [media, snapshot]);
}

// ── Media session (cross-app player registration) ───────────────────────────
//
// Keeps the registered source in sync with the host. When `source` is null the
// hook does nothing (safe for conditional usage). On change the previous
// session is unregistered before the new one registers.

export function useShellMediaSession(
  ctx: AppRuntimeCtx,
  source: MediaSessionSource | null,
): void {
  const sourceRef = useRef(source);
  sourceRef.current = source;
  const id = source?.id;

  // We deliberately key on `id` only — patches to the source object are
  // applied via updateSession() below, not by re-registering.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    if (!sourceRef.current) return;
    const dispose = ctx.shell.media.registerSession(sourceRef.current);
    return dispose;
  }, [ctx.shell.media, id]);

  // Patch metadata when source mutates (without unregistering).
  useEffect(() => {
    if (!source) return;
    ctx.shell.media.updateSession(source.id, source);
  }, [ctx.shell.media, source]);
}

/**
 * Subscribe to the host's media session snapshot (active source + persisted
 * playback data). Returns a reactive value that re-renders on snapshot change.
 *
 * Third-party apps use this to read host state they don't own — e.g. the
 * currently playing source across apps, or the server-restored playback data
 * needed to resume after a reload.
 */
export function useShellMediaSessionSnapshot(
  ctx: AppRuntimeCtx,
): MediaSessionSnapshot {
  const media = ctx.shell.media;
  return useSyncExternalStore(
    (cb) => media.subscribeSession(cb),
    () => media.getSessionSnapshot(),
    () => media.getSessionSnapshot(),
  );
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

// ── Toast ───────────────────────────────────────────────────────────────────

/** Stable reference to the toast API (it's already a stable singleton). */
export function useShellToast(ctx: AppRuntimeCtx): ShellToastApi {
  return ctx.shell.toast;
}
