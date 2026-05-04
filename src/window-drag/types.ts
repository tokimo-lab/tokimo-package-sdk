export type ShellWindowDragEventType = "start" | "move" | "end" | "cancel";

export interface ShellWindowDragEvent {
  type: ShellWindowDragEventType;
  windowId: string;
  active: boolean;
  clientX?: number;
  clientY?: number;
}

export interface ShellWindowDragSnapshot {
  active: boolean;
  windowId: string | null;
  lastEvent: ShellWindowDragEvent | null;
}
