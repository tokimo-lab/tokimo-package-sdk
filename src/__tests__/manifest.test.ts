import { describe, expect, it } from "vitest";
import type { AppDefinition } from "../manifest";
import { defineApp } from "../manifest";

describe("defineApp", () => {
  it("returns the definition unchanged", () => {
    const def: AppDefinition = {
      id: "test-app",
      manifest: { id: "test-app", appName: "Test", windowType: "window" },
      mount: () => () => {},
    };
    expect(defineApp(def)).toBe(def);
  });
});
