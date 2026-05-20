import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRuntimeCtx, useShellApi } from "./runtime-provider";

const MAX_CONTAINER_LOOKUP_FRAMES = 30;

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
    let cancelled = false;
    let frame = 0;
    let frameId: number | null = null;

    const lookup = () => {
      const next = shell.getWindowContainer(windowId, { includeTitleBar });
      if (cancelled) return;
      if (next) {
        setContainer(next);
        return;
      }
      if (frame >= MAX_CONTAINER_LOOKUP_FRAMES) {
        setContainer(null);
        console.warn(
          `[WindowPortal] container not found for window ${windowId} after ${MAX_CONTAINER_LOOKUP_FRAMES} frames`,
        );
        return;
      }
      frame += 1;
      frameId = window.requestAnimationFrame(lookup);
    };

    // Window content refs are registered by the shell after the child tree starts
    // rendering, so portal lookup can race initial mount by a few frames.
    lookup();

    return () => {
      cancelled = true;
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
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
