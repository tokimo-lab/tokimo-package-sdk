/**
 * Job event hooks — wrappers over `ctx.shell.jobEvents`.
 *
 * `useJobEvents({ onEvent, enabled })` mirrors the host's hook signature.
 * `useJobSubscription(jobId, cb)` filters job_update events by job id.
 */

import { useEffect, useRef } from "react";
import type { ShellJobEvent } from "./runtime";
import { useShellApi } from "./runtime-provider";

export interface UseJobEventsOptions {
  onEvent: (event: ShellJobEvent) => void;
  enabled?: boolean;
}

export function useJobEvents(options: UseJobEventsOptions): void {
  const { enabled = true } = options;
  const onEventRef = useRef(options.onEvent);
  onEventRef.current = options.onEvent;
  const jobEvents = useShellApi().jobEvents;

  useEffect(() => {
    if (!enabled) return;
    return jobEvents.subscribe({
      enabled: true,
      onEvent: (e) => onEventRef.current(e),
    });
  }, [jobEvents, enabled]);
}

/**
 * Subscribe to `job_update` events for a single job id. The callback fires
 * only when the inbound event's `job.id` matches; other variants are ignored.
 */
export function useJobSubscription(
  jobId: string | null | undefined,
  handler: (event: ShellJobEvent) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const jobEvents = useShellApi().jobEvents;

  useEffect(() => {
    if (!jobId) return;
    return jobEvents.subscribe({
      enabled: true,
      onEvent: (e) => {
        if (e.type !== "job_update") return;
        const job = (e as { job?: { id?: string } }).job;
        if (job?.id === jobId) handlerRef.current(e);
      },
    });
  }, [jobEvents, jobId]);
}
