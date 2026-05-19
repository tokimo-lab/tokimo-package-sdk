import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRuntimeCtx, useShellApi } from "./runtime-provider";

export interface WindowContainerOptions {
  /**
   * When `true`, the returned container covers the **entire window**
   * (including the title bar), suitable for full-window overlays.
   *
   * When `false` (default), the container covers only the **window content
   * area** below the title bar.
   */
  includeTitleBar?: boolean;
}

/**
 * Returns the DOM element that portal content should be rendered into.
 *
 * @param options.includeTitleBar – opt-in to cover the full window including
 *   the title bar.  Defaults to `false` (content area only).
 */
export function useWindowContainer(
  options?: WindowContainerOptions,
): HTMLElement | null {
  const { windowId } = useRuntimeCtx();
  const shell = useShellApi();
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const includeTitleBar = options?.includeTitleBar ?? false;

  useEffect(() => {
    setContainer(shell.getWindowContainer(windowId, { includeTitleBar }));
  }, [shell, windowId, includeTitleBar]);

  return container;
}

/**
 * Renders `children` into the shell-managed window container via a React
 * portal.
 *
 * @param props.includeTitleBar – when `true`, portals into the full-window
 *   container (title bar + content).  Defaults to `false` (content area only).
 */
export function WindowPortal({
  children,
  includeTitleBar,
}: {
  children: ReactNode;
  includeTitleBar?: boolean;
}) {
  const container = useWindowContainer({ includeTitleBar });
  if (!container) return null;
  return createPortal(children, container);
}
