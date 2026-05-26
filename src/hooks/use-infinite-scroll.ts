import { useCallback, useEffect, useRef, useState } from "react";

interface PageData<T> {
  items: T[];
  total: number;
  page: number;
}

interface UseInfiniteScrollOptions<T> {
  /** The paginated query result (.data) */
  queryData: PageData<T> | undefined;
  /** Whether the query is currently fetching */
  isFetching: boolean;
  /** Called when sentinel becomes visible and more items can be loaded */
  onLoadMore: () => void;
  /** Set false to pause (e.g. on a non-scrollable tab). Default true. */
  enabled?: boolean;
  /** Deduplicate items by id. Default true. */
  dedupe?: boolean;
}

interface UseInfiniteScrollResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  /** Callback ref — attach to a sentinel element at the bottom of the list */
  sentinelRef: (node: HTMLDivElement | null) => void;
  /** Reset accumulated items back to empty. Call when sort/filter/id changes. */
  reset: () => void;
}

/**
 * Accumulates paginated query results into a single flat list and auto-loads
 * the next page when a sentinel element scrolls into view.
 *
 * Design notes:
 * - Sentinel uses a **callback ref** so the IntersectionObserver is correctly
 *   (re-)attached even when the sentinel is conditionally rendered.
 * - A monotonic `generation` counter ensures the accumulation effect re-fires
 *   after `reset()` even when React Query returns the same cached data ref.
 * - Consumers should add `key={libraryId}` on the content component so that
 *   a library switch causes a full remount with fresh state.
 */
export function useInfiniteScroll<T extends { id: string }>({
  queryData,
  isFetching,
  onLoadMore,
  enabled = true,
  dedupe = true,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [allItems, setAllItems] = useState<T[]>([]);
  const appendedUpToRef = useRef(0);
  // Monotonic counter — incremented by reset() to force the accumulation
  // effect to re-evaluate even when queryData / isFetching are unchanged.
  const [generation, setGeneration] = useState(0);

  const total = queryData?.total ?? 0;

  // Bridge the sync gap: when queryData has page-1 results but the
  // accumulation effect hasn't fired yet (allItems still []), use
  // queryData.items directly so the first render never flashes "empty".
  const items =
    allItems.length === 0 && queryData?.page === 1 && !isFetching
      ? queryData.items
      : allItems;

  const hasMore = items.length < total;

  const reset = useCallback(() => {
    appendedUpToRef.current = 0;
    setAllItems([]);
    setGeneration((g) => g + 1);
  }, []);

  // ── Accumulate pages ────────────────────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: generation forces re-run after reset()
  useEffect(() => {
    if (!queryData || isFetching) return;
    const { page: dataPage, items } = queryData;

    // Page 1 always replaces — handles initial load, cache hit after reset,
    // query invalidation, and sort/filter change.
    if (dataPage === 1) {
      appendedUpToRef.current = 1;
      setAllItems(items);
      return;
    }

    // Only accept the next sequential page; skip already-appended or stale pages.
    if (dataPage <= appendedUpToRef.current) return;

    appendedUpToRef.current = dataPage;
    if (dedupe) {
      setAllItems((prev) => {
        const ids = new Set(prev.map((i) => i.id));
        return [...prev, ...items.filter((i) => !ids.has(i.id))];
      });
    } else {
      setAllItems((prev) => [...prev, ...items]);
    }
  }, [queryData, isFetching, dedupe, generation]);

  // ── IntersectionObserver via callback ref ───────────────────────────
  // Stable ref keeps the observer callback from re-creating on every render.
  const stateRef = useRef({ enabled, hasMore, isFetching, onLoadMore });
  stateRef.current = { enabled, hasMore, isFetching, onLoadMore };

  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    // Disconnect previous observer (if any)
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;

    const io = new IntersectionObserver(
      (entries) => {
        const s = stateRef.current;
        if (
          entries[0].isIntersecting &&
          s.enabled &&
          s.hasMore &&
          !s.isFetching
        ) {
          s.onLoadMore();
        }
      },
      { rootMargin: "0px 0px 600px 0px" },
    );
    io.observe(node);
    observerRef.current = io;
  }, []);

  return { items, total, hasMore, sentinelRef, reset };
}
