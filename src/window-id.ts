/**
 * Returns this app instance's window id (stable for the bundle's lifetime).
 *
 * Reads from `useRuntimeCtx().windowId`. Throws if called outside
 * `<RuntimeProvider>`.
 */

import { useRuntimeCtx } from "./runtime-provider";

export function useWindowId(): string {
  return useRuntimeCtx().windowId;
}
