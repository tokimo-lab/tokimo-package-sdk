import type { OpenFileViewerOptions, OpenViewerOptions } from "./types";

export interface ShellViewerApi {
  /**
   * Open a shell-owned viewer window with an explicit viewer type.
   *
   * The SDK only describes the requested viewer entry. The actual React viewer
   * components remain private to the Tokimo web shell.
   *
   * @returns The opened or reused shell window id.
   */
  openViewer: (options: OpenViewerOptions) => string;

  /**
   * Open a file viewer and let the shell infer the viewer type from
   * `fileName ?? filePath` when `viewerType` is omitted.
   *
   * Unknown file extensions fall back to the hex viewer.
   *
   * @returns The opened or reused shell window id.
   */
  openFileViewer: (options: OpenFileViewerOptions) => string;
}
