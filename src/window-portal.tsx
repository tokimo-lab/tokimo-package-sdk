import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRuntimeCtx, useShellApi } from "./runtime-provider";

export function useWindowContainer(): HTMLElement | null {
  const { windowId } = useRuntimeCtx();
  const shell = useShellApi();
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(shell.getWindowContainer(windowId));
  }, [shell, windowId]);

  return container;
}

export function WindowPortal({ children }: { children: ReactNode }) {
  const container = useWindowContainer();
  if (!container) return null;
  return createPortal(children, container);
}
