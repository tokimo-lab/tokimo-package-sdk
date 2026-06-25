/**
 * Generic app entity event hook.
 *
 * `useAppEntityEvents({ appId, kind, scope, onEvent, enabled })` subscribes
 * to entity-level events emitted by a specific app and optionally filtered
 * by event kind and scope.
 */

import { useEffect, useRef } from "react";
import { useShellApi } from "./runtime-provider";

export interface AppEntityEvent {
  appId: string;
  kind: string;
  scope: string | null;
  payload: unknown;
}

export function useAppEntityEvents(opts: {
  appId: string;
  kind?: string;
  scope?: string;
  onEvent: (event: AppEntityEvent) => void;
  enabled?: boolean;
}): void {
  const { enabled = true } = opts;
  const onEventRef = useRef(opts.onEvent);
  onEventRef.current = opts.onEvent;
  const appIdRef = useRef(opts.appId);
  appIdRef.current = opts.appId;
  const kindRef = useRef(opts.kind);
  kindRef.current = opts.kind;
  const scopeRef = useRef(opts.scope);
  scopeRef.current = opts.scope;
  const appEntityEvents = useShellApi().appEntityEvents;

  useEffect(() => {
    if (!enabled) return;
    return appEntityEvents.subscribe({
      enabled: true,
      appId: appIdRef.current,
      kind: kindRef.current,
      scope: scopeRef.current,
      onEvent: (e) => {
        if (e.appId !== appIdRef.current) return;
        if (kindRef.current && e.kind !== kindRef.current) return;
        if (scopeRef.current && e.scope !== scopeRef.current) return;
        onEventRef.current(e);
      },
    });
  }, [appEntityEvents, enabled, opts.appId, opts.kind, opts.scope]);
}
