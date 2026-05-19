/**
 * Declarative WS topic subscription. Re-subscribes when `type` or `handler`
 * reference changes (use `useCallback` to stabilize handlers).
 */

import { useEffect, useRef } from "react";
import type { WsMessage } from "./runtime";
import { useShellApi } from "./runtime-provider";

export function useWsSubscribe(
  type: string,
  handler: (msg: WsMessage) => void,
): void {
  const ws = useShellApi().ws;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return ws.subscribe(type, (msg) => handlerRef.current(msg));
  }, [ws, type]);
}
