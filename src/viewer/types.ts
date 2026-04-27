export type ViewerWindowType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "epub"
  | "mobi"
  | "book"
  | "hex"
  | "html-preview";

export interface OpenViewerOptions {
  /** Viewer window type to open. The shell owns the actual viewer implementation. */
  type: ViewerWindowType;
  /** Window title. Falls back to `fileName` / `filePath` when omitted. */
  title?: string;
  /** Initial viewer route. Falls back to `filePath` when omitted. */
  route?: string;
  /** File path used by file-backed viewers. */
  filePath?: string;
  /** Display name for file-backed viewers. */
  fileName?: string;
  /** VFS connection id for files opened from Tokimo VFS. */
  fileSystemId?: string;
  /** Direct content URL for files not backed by a registered filesystem. */
  directUrl?: string;
  /** SSH terminal id for files opened from an SSH filesystem. */
  sshTerminalId?: string;
  /** AI agent id for files opened from an agent workspace. */
  agentId?: string;
  /** Skip shell singleton reuse and always create a new viewer window. */
  forceNew?: boolean;
  /** Initial window width, overriding the shell viewer default. */
  initialWidth?: number;
  /** Initial window height, overriding the shell viewer default. */
  initialHeight?: number;
}

export interface OpenFileViewerOptions {
  /** File path used for routing and viewer metadata. */
  filePath: string;
  /** Display name used for preview type inference and window title. */
  fileName?: string;
  /** Explicit viewer type override. When omitted, the shell infers by file name/path. */
  viewerType?: ViewerWindowType;
  /** Window title. Falls back to `fileName` / `filePath` when omitted. */
  title?: string;
  /** Initial viewer route. Falls back to `filePath` when omitted. */
  route?: string;
  /** VFS connection id for files opened from Tokimo VFS. */
  fileSystemId?: string;
  /** Direct content URL for files not backed by a registered filesystem. */
  directUrl?: string;
  /** SSH terminal id for files opened from an SSH filesystem. */
  sshTerminalId?: string;
  /** AI agent id for files opened from an agent workspace. */
  agentId?: string;
  /** Skip shell singleton reuse and always create a new viewer window. */
  forceNew?: boolean;
  /** Initial window width, overriding the shell viewer default. */
  initialWidth?: number;
  /** Initial window height, overriding the shell viewer default. */
  initialHeight?: number;
}
