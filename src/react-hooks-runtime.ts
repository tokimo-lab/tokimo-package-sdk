/**
 * No-arg sugar hooks built on top of `<RuntimeProvider>`.
 *
 * Each hook here is a one-liner over the explicit `useShellX(ctx)` variant
 * exported from `./react-hooks`. Keeping both forms lets apps migrate
 * incrementally and lets ctx-arg variants stay available for non-provider
 * call sites (e.g. imperative escape hatches).
 */

import {
  useMediaCenter as useMediaCenterCtx,
  useShellAppearance,
  useShellGeneralSettings as useShellGeneralSettingsCtx,
  useShellLocale,
  useShellMenuBar,
  useShellPreference as useShellPreferenceCtx,
  useShellToast,
  useShellViewer,
  useShellWindowDrag,
  useShellWindowNav,
} from "./react-hooks";
import { useRuntimeCtx, useShellApi } from "./runtime-provider";

export const useAppearance = () => useShellAppearance(useRuntimeCtx());
export const useLocale = () => useShellLocale(useRuntimeCtx());
export const useMediaCenter = () => useMediaCenterCtx(useRuntimeCtx());
export const useWindowNav = () => useShellWindowNav(useRuntimeCtx());
export const useWindowDrag = () => useShellWindowDrag(useRuntimeCtx());
export const useToast = () => useShellToast(useRuntimeCtx());
export const useViewer = () => useShellViewer(useRuntimeCtx());
export const useNotify = () => useShellApi().notify;
export const useMenuBar = (config: Parameters<typeof useShellMenuBar>[1]) =>
  useShellMenuBar(useRuntimeCtx(), config);

/** No-arg sugar: per-app DB-backed preference (scope = "app", scopeId = appId). */
export const usePreference = () => useShellPreferenceCtx(useRuntimeCtx());

/** No-arg sugar: global general settings snapshot (e.g. adult mode). */
export const useGeneralSettings = () =>
  useShellGeneralSettingsCtx(useRuntimeCtx());
