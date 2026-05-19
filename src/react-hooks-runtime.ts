/**
 * No-arg sugar hooks built on top of `<RuntimeProvider>`.
 *
 * Each hook here is a one-liner over the explicit `useShellX(ctx)` variant
 * exported from `./react-hooks`. Keeping both forms lets apps migrate
 * incrementally and lets ctx-arg variants stay available for non-provider
 * call sites (e.g. imperative escape hatches).
 */

import {
  useShellAppearance,
  useShellMedia,
  useShellMediaSession,
  useShellMediaSessionSnapshot,
  useShellMenuBar,
  useShellToast,
  useShellViewer,
  useShellWindowDrag,
  useShellWindowNav,
} from "./react-hooks";
import { useRuntimeCtx, useShellApi } from "./runtime-provider";

export const useAppearance = () => useShellAppearance(useRuntimeCtx());
export const useMedia = () => useShellMedia(useRuntimeCtx());
export const useMediaSessionSnapshot = () =>
  useShellMediaSessionSnapshot(useRuntimeCtx());
export const useWindowNav = () => useShellWindowNav(useRuntimeCtx());
export const useWindowDrag = () => useShellWindowDrag(useRuntimeCtx());
export const useToast = () => useShellToast(useRuntimeCtx());
export const useViewer = () => useShellViewer(useRuntimeCtx());
export const useNotify = () => useShellApi().notify;
export const useMenuBar = (config: Parameters<typeof useShellMenuBar>[1]) =>
  useShellMenuBar(useRuntimeCtx(), config);
export const useMediaSession = (
  source: Parameters<typeof useShellMediaSession>[1],
) => useShellMediaSession(useRuntimeCtx(), source);
