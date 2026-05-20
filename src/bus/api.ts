export interface ShellBusEvent<T = unknown> {
  type: string;
  data: T;
  reqId?: string;
  error?: string;
}

export interface ShellBusApi {
  /**
   * Subscribe to a specific event type emitted by the shell's global
   * WebSocket. Returns an unsubscribe function.
   *
   * Apps use this for cross-cutting realtime updates the shell already
   * receives (e.g. `mail:new_messages`, job updates), instead of opening
   * their own WS connection.
   */
  subscribe<T = unknown>(
    eventType: string,
    handler: (event: ShellBusEvent<T>) => void,
  ): () => void;
}
