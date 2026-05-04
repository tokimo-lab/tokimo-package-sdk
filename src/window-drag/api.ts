import type { ShellWindowDragEvent, ShellWindowDragSnapshot } from "./types";

export interface ShellWindowDragApi {
  getSnapshot: () => ShellWindowDragSnapshot;
  subscribe: (listener: (event: ShellWindowDragEvent) => void) => () => void;
}
