import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useJobEvents } from "../job-events";

/** Common shape returned by all sync-progress endpoints. */
export interface SyncProgressData {
  status: string;
  total: number;
  completed: number;
  running: number;
  pending: number;
  failed: number;
}

/** Per-library progress state exposed to sidebar badge. */
export interface LibrarySyncState {
  isActive: boolean;
  pct: number;
}

/** A library item from the list API — only the fields we need. */
interface LibraryItem {
  id: string;
  syncStatus?: string;
}

interface UseSyncProgressOptions<TLib extends LibraryItem> {
  libraries: TLib[] | undefined;
  progressQueryKey: (id: string) => readonly unknown[];
  fetchProgress: (id: string) => Promise<SyncProgressData>;
  onContentRefresh: () => void;
  onLibraryRefresh: () => void;
  scanJobTypes?: readonly string[];
  /** Map job params + data → library UUID. */
  resolveLibraryIdFromJob?: (job: {
    params: Record<string, unknown>;
    data: Record<string, unknown>;
  }) => string | undefined;
  /** @deprecated Prefer `resolveLibraryIdFromJob` for params + data semantics. */
  resolveLibraryId?: (params: Record<string, unknown>) => string | undefined;
}

interface JobShape {
  id?: string;
  type?: string;
  status?: string;
  params?: Record<string, unknown>;
  data?: Record<string, unknown> | null;
  payload?: Record<string, unknown> | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readJobFromEvent(event: unknown): JobShape | null {
  if (!isRecord(event)) return null;

  const legacyJob = (event as { job?: unknown }).job;
  if (isRecord(legacyJob)) return legacyJob as JobShape;

  const eventData = (event as { data?: unknown }).data;
  if (!isRecord(eventData)) return null;

  const nestedJob = (eventData as { job?: unknown }).job;
  if (isRecord(nestedJob)) return nestedJob as JobShape;

  return eventData as JobShape;
}

/**
 * Unified hook for tracking scraping progress across all media domains.
 *
 * SDK port of host's `useSyncProgress`. WS-driven via `useJobEvents`. Since
 * the SDK's `useJobEvents` returns void (no connected flag), this hook always
 * runs the 5s fallback polling whenever there is at least one active library.
 */
export function useSyncProgress<TLib extends LibraryItem>({
  libraries,
  progressQueryKey,
  fetchProgress,
  onContentRefresh,
  onLibraryRefresh,
  scanJobTypes,
  resolveLibraryIdFromJob,
  resolveLibraryId,
}: UseSyncProgressOptions<TLib>): Record<string, LibrarySyncState> {
  const queryClient = useQueryClient();

  const scanJobTypeSetRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    scanJobTypeSetRef.current = scanJobTypes ? new Set(scanJobTypes) : null;
  }, [scanJobTypes]);

  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

  const onContentRefreshRef = useRef(onContentRefresh);
  onContentRefreshRef.current = onContentRefresh;
  const onLibraryRefreshRef = useRef(onLibraryRefresh);
  onLibraryRefreshRef.current = onLibraryRefresh;
  const progressQueryKeyRef = useRef(progressQueryKey);
  progressQueryKeyRef.current = progressQueryKey;
  const fetchProgressRef = useRef(fetchProgress);
  fetchProgressRef.current = fetchProgress;

  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttlePendingRef = useRef(false);

  const throttledContentRefresh = useCallback(() => {
    if (throttleTimerRef.current) {
      throttlePendingRef.current = true;
      return;
    }
    onContentRefreshRef.current();
    onLibraryRefreshRef.current();
    throttleTimerRef.current = setTimeout(() => {
      throttleTimerRef.current = null;
      if (throttlePendingRef.current) {
        throttlePendingRef.current = false;
        onContentRefreshRef.current();
        onLibraryRefreshRef.current();
      }
    }, 500);
  }, []);

  useEffect(() => {
    if (!libraries) return;
    const syncing = libraries
      .filter((l) => l.syncStatus === "syncing")
      .map((l) => l.id);
    if (syncing.length > 0) {
      setActiveIds((prev) => {
        const next = new Set(prev);
        for (const id of syncing) next.add(id);
        return next.size !== prev.size ? next : prev;
      });
    }
  }, [libraries]);

  const libraryIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    libraryIdsRef.current = new Set((libraries ?? []).map((l) => l.id));
  }, [libraries]);

  const resolveLibraryIdFromJobRef = useRef(resolveLibraryIdFromJob);
  resolveLibraryIdFromJobRef.current = resolveLibraryIdFromJob;
  const resolveLibraryIdRef = useRef(resolveLibraryId);
  resolveLibraryIdRef.current = resolveLibraryId;

  const fetchAllRef = useRef<(() => Promise<void>) | null>(null);
  const wsFetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useJobEvents({
    onEvent: (event) => {
      if (event.type !== "job_update") return;
      const job = readJobFromEvent(event);
      if (!job) return;
      const params = job.params ?? {};
      const data = job.data ?? job.payload ?? {};
      const appId =
        resolveLibraryIdFromJobRef.current?.({ params, data }) ??
        resolveLibraryIdRef.current?.(params) ??
        ((data.appId ?? params.appId ?? params.videoId) as string | undefined);
      if (!appId || !libraryIdsRef.current.has(appId)) return;

      const typeSet = scanJobTypeSetRef.current;
      if (typeSet && job.type && !typeSet.has(job.type)) return;

      setActiveIds((prev) => {
        if (prev.has(appId)) return prev;
        const next = new Set(prev);
        next.add(appId);
        return next;
      });

      queryClient.invalidateQueries({
        queryKey: progressQueryKeyRef.current(appId),
      });

      if (wsFetchTimerRef.current) clearTimeout(wsFetchTimerRef.current);
      wsFetchTimerRef.current = setTimeout(() => {
        wsFetchTimerRef.current = null;
        void fetchAllRef.current?.();
      }, 1000);

      if (job.status === "completed" || job.status === "failed") {
        throttledContentRefresh();
      }
    },
    enabled: (libraries ?? []).length > 0,
  });

  const [progressMap, setProgressMap] = useState<
    Record<string, LibrarySyncState>
  >({});

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    const ids = Array.from(activeIds);
    if (ids.length === 0) {
      setProgressMap({});
      return;
    }

    const results: Record<string, LibrarySyncState> = {};
    const settled: string[] = [];

    await Promise.all(
      ids.map(async (id) => {
        try {
          const data = await queryClient.fetchQuery({
            queryKey: progressQueryKeyRef.current(id),
            queryFn: () => fetchProgressRef.current(id),
            staleTime: 1000,
          });
          const total =
            data.completed + data.running + data.pending + data.failed;
          const pct =
            total > 0 ? Math.round((data.completed / total) * 100) : 0;
          const isActive =
            data.status === "syncing" || data.running > 0 || data.pending > 0;
          if (isActive) {
            results[id] = { isActive: true, pct };
          } else {
            settled.push(id);
          }
        } catch {
          results[id] = { isActive: true, pct: 0 };
        }
      }),
    );

    setProgressMap(results);

    if (settled.length > 0) {
      setActiveIds((prev) => {
        const next = new Set(prev);
        for (const id of settled) next.delete(id);
        return next;
      });
    }
  }, [activeIds, queryClient]);

  fetchAllRef.current = fetchAll;

  useEffect(() => {
    if (activeIds.size === 0) {
      setProgressMap({});
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    void fetchAll();

    // SDK port: always run 5s polling fallback (no wsConnected flag exposed).
    pollRef.current = setInterval(() => {
      void fetchAll();
    }, 5000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [activeIds, fetchAll]);

  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
      if (wsFetchTimerRef.current) clearTimeout(wsFetchTimerRef.current);
    };
  }, []);

  const result: Record<string, LibrarySyncState> = { ...progressMap };
  for (const id of activeIds) {
    if (!result[id]) {
      result[id] = { isActive: true, pct: 0 };
    }
  }

  return result;
}
