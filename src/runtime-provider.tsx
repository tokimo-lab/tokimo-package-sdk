/**
 * RuntimeProvider — React context for `AppRuntimeCtx`.
 *
 * Wraps `<App />` at mount time so descendant components can consume
 * `useRuntimeCtx()` / `useShellApi()` without prop-drilling `ctx`.
 *
 * **Per-window scope**: do NOT store ctx in a module singleton. The host
 * mounts the same bundle in multiple windows concurrently; a global ctx
 * would cause cross-window leakage (wrong windowId / nav / menubar
 * registrations).
 */

import { createContext, type PropsWithChildren, useContext } from "react";
import type { AppRuntimeCtx, ShellApi } from "./runtime";

const RuntimeCtx = createContext<AppRuntimeCtx | null>(null);

export function RuntimeProvider({
  value,
  children,
}: PropsWithChildren<{ value: AppRuntimeCtx }>) {
  return <RuntimeCtx.Provider value={value}>{children}</RuntimeCtx.Provider>;
}

export function useRuntimeCtx(): AppRuntimeCtx {
  const ctx = useContext(RuntimeCtx);
  if (!ctx) {
    throw new Error("useRuntimeCtx must be used within <RuntimeProvider>");
  }
  return ctx;
}

export function useShellApi(): ShellApi {
  return useRuntimeCtx().shell;
}
