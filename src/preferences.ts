/**
 * Shell Preferences API — DB-backed per-app preference storage.
 *
 * Third-party apps use this to read/write their own preferences
 * (scope = "app", scopeId = appId, automatically injected by the shell).
 *
 * The shape includes both a reactive snapshot (for useSyncExternalStore)
 * and mutation methods (patch/put/reset).
 */

/**
 * Preferences API exposed to third-party apps via `ctx.shell.preferences`.
 *
 * Reads are reactive (subscribe + getSnapshot), writes are async with
 * optimistic updates handled by the shell's PreferencesContext.
 */
export interface ShellPreferencesApi {
  /** Current preference value for this app. Empty object `{}` if none. */
  getSnapshot: () => Record<string, unknown>;
  /**
   * Subscribe to preference changes. Called when the value changes after
   * a patch/put/reset operation. Returns an unsubscribe function.
   */
  subscribe: (listener: () => void) => () => void;
  /** Deep-merge partial update. */
  patch: (partial: Record<string, unknown>) => Promise<void>;
  /** Full overwrite. */
  put: (value: Record<string, unknown>) => Promise<void>;
  /** Delete (restore to default empty object). */
  reset: () => Promise<void>;
}
