import { describe, expect, it, vi } from "vitest";
import { createReactiveSource } from "../reactive";

describe("createReactiveSource", () => {
  it("getSnapshot returns initial value", () => {
    const src = createReactiveSource(42);
    expect(src.getSnapshot()).toBe(42);
  });

  it("set updates value and notifies listeners", () => {
    const src = createReactiveSource(0);
    const listener = vi.fn();
    src.subscribe(listener);
    src.set(1);
    expect(src.getSnapshot()).toBe(1);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("set with same value (Object.is) skips notification", () => {
    const src = createReactiveSource(0);
    const listener = vi.fn();
    src.subscribe(listener);
    src.set(0);
    expect(listener).not.toHaveBeenCalled();
  });

  it("custom equals skips identical updates", () => {
    const src = createReactiveSource(
      { x: 1 },
      {
        equals: (a, b) => a.x === b.x,
      },
    );
    const listener = vi.fn();
    src.subscribe(listener);
    src.set({ x: 1 });
    expect(listener).not.toHaveBeenCalled();
  });

  it("custom equals fires when values differ", () => {
    const src = createReactiveSource(
      { x: 1 },
      {
        equals: (a, b) => a.x === b.x,
      },
    );
    const listener = vi.fn();
    src.subscribe(listener);
    src.set({ x: 2 });
    expect(listener).toHaveBeenCalledOnce();
  });

  it("unsubscribe removes listener", () => {
    const src = createReactiveSource(0);
    const listener = vi.fn();
    const unsub = src.subscribe(listener);
    unsub();
    src.set(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("multiple listeners all fire", () => {
    const src = createReactiveSource(0);
    const a = vi.fn();
    const b = vi.fn();
    src.subscribe(a);
    src.subscribe(b);
    src.set(1);
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it("one buggy listener does not break others", () => {
    const src = createReactiveSource(0);
    const bad = vi.fn(() => {
      throw new Error("boom");
    });
    const good = vi.fn();
    src.subscribe(bad);
    src.subscribe(good);
    src.set(1);
    expect(good).toHaveBeenCalledOnce();
  });
});
