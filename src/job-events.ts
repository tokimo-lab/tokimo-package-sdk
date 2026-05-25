/**
 * Job event hooks — wrappers over `ctx.shell.jobEvents`.
 *
 * `useJobEvents({ jobTypes, onEvent, enabled })` mirrors the host's job hook signature
 * and optionally filters by job type.
 * `useJobSubscription(jobId, cb)` filters job_update events by job id.
 */

import { useEffect, useRef } from "react";
import type { ShellJobEvent } from "./runtime";
import { useShellApi } from "./runtime-provider";

export type JobType = string;
export type JobUpdateEvent = ShellJobEvent & { type: "job_update" };

export function useJobEvents(opts: {
  jobTypes?: JobType[];
  onEvent: (e: ShellJobEvent) => void;
  enabled?: boolean;
}): void {
  const { enabled = true } = opts;
  const onEventRef = useRef(opts.onEvent);
  onEventRef.current = opts.onEvent;
  const jobTypesRef = useRef(opts.jobTypes);
  jobTypesRef.current = opts.jobTypes;
  const jobEvents = useShellApi().jobEvents;

  useEffect(() => {
    if (!enabled) return;
    return jobEvents.subscribe({
      enabled: true,
      onEvent: (e) => {
        if (!shouldForwardJobEvent(e, jobTypesRef.current)) return;
        onEventRef.current(e);
      },
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
        const job = getJobRecord(e);
        if (job?.id === jobId) handlerRef.current(e);
      },
    });
  }, [jobEvents, jobId]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function shouldForwardJobEvent(
  event: ShellJobEvent,
  jobTypes: JobType[] | undefined,
): boolean {
  if (!jobTypes || jobTypes.length === 0) return true;
  const job = getJobRecord(event);
  return typeof job?.type === "string" && jobTypes.includes(job.type);
}

function getJobRecord(
  event: ShellJobEvent,
): { id?: string; type?: string } | null {
  const legacyJob = (event as { job?: unknown }).job;
  if (isRecord(legacyJob)) {
    return legacyJob as { id?: string; type?: string };
  }

  if (!isRecord(event.data)) return null;

  const nestedJob = (event.data as { job?: unknown }).job;
  if (isRecord(nestedJob)) {
    return nestedJob as { id?: string; type?: string };
  }

  return event.data as { id?: string; type?: string };
}
