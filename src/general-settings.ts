/**
 * Shell General Settings API — global system settings snapshot.
 *
 * Exposes settings like adult mode that are not app-specific but that
 * third-party apps need to read. Uses the same ReactiveSnapshotApi
 * pattern as `appearance`.
 */

import type { ReactiveSnapshotApi } from "./reactive";

/** Snapshot of global general settings relevant to third-party apps. */
export interface AppGeneralSettingsSnapshot {
  /** Whether adult mode is fully enabled (env var + DB toggle). */
  adultModeEnabled: boolean;
  /** Whether the env var allows showing adult-related UI. */
  adultModeVisible: boolean;
}

/** Reactive snapshot API for general settings. */
export type ShellGeneralSettingsApi =
  ReactiveSnapshotApi<AppGeneralSettingsSnapshot>;
