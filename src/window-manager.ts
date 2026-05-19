/**
 * Window manager hooks — thin reactive wrappers over
 * `ctx.shell.windowManager`.
 *
 * `useWindowActions()` returns the imperative action surface
 * (open/close/openModal/updateMetadata) plus `currentWindowId`.
 * `useWindows()` re-renders on each minimal-DTO snapshot change.
 */

import { useSyncExternalStore } from "react";
import type {
  MinimalWindowDTO,
  OpenWindowParams,
  ShellModalWindowParams,
  TaskMetadata,
} from "./runtime";
import { useShellApi } from "./runtime-provider";

export interface UseWindowActionsResult {
  openWindow: (params: OpenWindowParams) => string;
  closeWindow: (id: string) => void;
  openModalWindow: (params: ShellModalWindowParams) => string;
  updateMetadata: (id: string, meta: Partial<TaskMetadata>) => void;
  currentWindowId: string;
}

export function useWindowActions(): UseWindowActionsResult {
  const wm = useShellApi().windowManager;
  return {
    openWindow: wm.openWindow,
    closeWindow: wm.closeWindow,
    openModalWindow: wm.openModalWindow,
    updateMetadata: wm.updateMetadata,
    currentWindowId: wm.currentWindowId,
  };
}

export function useWindows(): MinimalWindowDTO[] {
  const wm = useShellApi().windowManager;
  return useSyncExternalStore(
    (cb) => wm.windowsSnapshot$.subscribe(cb),
    () => wm.windowsSnapshot$.getSnapshot(),
    () => wm.windowsSnapshot$.getSnapshot(),
  );
}
