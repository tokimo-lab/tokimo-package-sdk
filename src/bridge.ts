/**
 * Window-bridge SDK module — thin wrapper over `ctx.shell.bridge`.
 *
 * Bridge registry lives in the host (single process-wide registry, shared
 * across all bundles in all windows). SDK exposes:
 *
 *  - `useBridge()` — create a bridge id, auto-destroy on unmount
 *  - `useBridgeSubscribe(id, event, handler)` — declarative subscription
 *  - `emitBridge(api, id, event, payload)` — direct emit (escape hatch)
 *  - `pickWithBridge(api, openModalWindow, params, options)` — Promise-style picker
 *  - `emitPick(api, win, value)` — child window helper
 *  - `SYSTEM_CLOSE_EVENT` / `PickCancelled` constants
 *
 * The non-hook helpers take a `ShellBridgeApi` instance (call
 * `useShellApi().bridge` once in render and forward) so they remain usable
 * inside callbacks and async functions without breaking hook rules.
 */

import { useEffect, useRef } from "react";
import type {
  ShellBridgeApi,
  ShellModalWindowParams,
  WindowState,
} from "./runtime";
import { useShellApi } from "./runtime-provider";

/** Reserved event name emitted by the host when a window closes. */
export const SYSTEM_CLOSE_EVENT = "system:close";

/** Thrown by `pickWithBridge` when the user closes the modal without picking. */
export class PickCancelled extends Error {
  constructor() {
    super("pick cancelled");
    this.name = "PickCancelled";
  }
}

interface UseBridgeOptions {
  /** Default false. When true caller is responsible for `destroyBridge`. */
  manualDestroy?: boolean;
}

/**
 * Create a bridge id, automatically destroyed on unmount.
 *
 * Returned id is stable for the component's lifetime.
 */
export function useBridge(options?: UseBridgeOptions): string {
  const bridge = useShellApi().bridge;
  const idRef = useRef<string | null>(null);
  if (idRef.current === null) {
    idRef.current = bridge.create();
  }
  const manualDestroy = options?.manualDestroy ?? false;

  useEffect(() => {
    const id = idRef.current;
    return () => {
      if (!manualDestroy && id) bridge.destroy(id);
    };
  }, [bridge, manualDestroy]);

  return idRef.current;
}

/**
 * Declarative subscription to a bridge event. handler changes are picked up
 * via ref so the subscription only rebuilds when id/event change.
 */
export function useBridgeSubscribe<T = unknown>(
  id: string | null | undefined,
  event: string,
  handler: (payload: T) => void,
): void {
  const bridge = useShellApi().bridge;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!id) return;
    return bridge.subscribe<T>(id, event, (payload) => {
      handlerRef.current(payload);
    });
  }, [bridge, id, event]);
}

/**
 * Direct emit on a bridge. Bridge is identified by id; the bridge API is
 * read from the SDK runtime via `useShellApi()` and passed in.
 *
 * Hook-free overload: takes the `ShellBridgeApi` directly. Callers can grab
 * it once via `const { bridge } = useShellApi()` and forward into callbacks.
 */
export function emitBridge<T = unknown>(
  api: ShellBridgeApi,
  id: string | null | undefined,
  event: string,
  payload?: T,
): void {
  if (!id) return;
  api.emit<T>(id, event, payload);
}

export interface PickOptions {
  /** Event name; default "pick". */
  event?: string;
}

/**
 * Picker-style modal helper. Opens a modal with a fresh bridge id injected
 * into `metadata.bridgeId`; resolves on the first `pick` event, rejects with
 * `PickCancelled` if the user closes without picking.
 */
export function pickWithBridge<T = unknown>(
  api: ShellBridgeApi,
  openModalWindow: (params: ShellModalWindowParams) => string,
  params: Omit<ShellModalWindowParams, "metadata"> & {
    metadata?: Record<string, unknown>;
  },
  options: PickOptions = {},
): Promise<T> {
  const { event = "pick" } = options;
  const bridgeId = api.create();

  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const unsubPick = api.subscribe<T>(bridgeId, event, (payload) => {
      if (settled) return;
      settled = true;
      unsubPick();
      unsubClose();
      api.destroy(bridgeId);
      resolve(payload as T);
    });

    const unsubClose = api.subscribe(bridgeId, SYSTEM_CLOSE_EVENT, () => {
      if (settled) return;
      settled = true;
      unsubPick();
      unsubClose();
      api.destroy(bridgeId);
      reject(new PickCancelled());
    });

    try {
      openModalWindow({
        ...params,
        metadata: {
          ...((params.metadata as Record<string, unknown>) ?? {}),
          bridgeId,
        },
      });
    } catch (err) {
      if (!settled) {
        settled = true;
        unsubPick();
        unsubClose();
        api.destroy(bridgeId);
        reject(err);
      }
    }
  });
}

/**
 * Child-window helper: reads `bridgeId` from `win.metadata` and emits the
 * picked value. No-op if no bridgeId is present.
 */
export function emitPick<T = unknown>(
  api: ShellBridgeApi,
  win: WindowState,
  value: T,
  eventName = "pick",
): void {
  const bridgeId = (win.metadata as { bridgeId?: string }).bridgeId;
  if (!bridgeId) return;
  api.emit(bridgeId, eventName, value);
}
