import { describe, expect, it } from "vitest";
import type { ShellInjections } from "../shell-api";
import { makeShellApi, makeTranslator } from "../shell-api";

describe("makeTranslator", () => {
  const translations = {
    en: { hello: "Hello", goodbye: "Goodbye" },
    zh: { hello: "你好" },
  };

  it("returns translation for matching key", () => {
    const t = makeTranslator(translations, "en");
    expect(t("hello")).toBe("Hello");
  });

  it("returns fallback when key not found", () => {
    const t = makeTranslator(translations, "en");
    expect(t("missing", "fallback")).toBe("fallback");
  });

  it("returns key itself when no fallback and key not found", () => {
    const t = makeTranslator(translations, "en");
    expect(t("missing")).toBe("missing");
  });

  it("returns key when translations undefined", () => {
    const t = makeTranslator(undefined, "en");
    expect(t("hello")).toBe("hello");
  });

  it("falls back to key for missing locale", () => {
    const t = makeTranslator(translations, "fr");
    expect(t("hello")).toBe("hello");
  });
});

describe("makeShellApi", () => {
  const injections: ShellInjections = {
    media: {} as never,
    menubar: {} as never,
    toast: {} as never,
    windowNav: {} as never,
    windowDrag: {} as never,
    appearance: {} as never,
    viewer: {} as never,
    openModalWindow: () => "",
  };

  it("returns object with shell API shape", () => {
    const api = makeShellApi("test-app", injections);
    expect(api).toHaveProperty("notify");
    expect(api).toHaveProperty("media");
    expect(api.media).toBe(injections.media);
    expect(api.menubar).toBe(injections.menubar);
    expect(api.toast).toBe(injections.toast);
    expect(api.windowNav).toBe(injections.windowNav);
    expect(api.windowDrag).toBe(injections.windowDrag);
    expect(api.appearance).toBe(injections.appearance);
    expect(api.viewer).toBe(injections.viewer);
  });

  it("notify is a function", () => {
    const api = makeShellApi("test-app", injections);
    expect(typeof api.notify).toBe("function");
  });
});
