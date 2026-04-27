/**
 * @tokimo/sdk — runtime contract between third-party apps and the shell.
 *
 * Each app bundles its own React + UI deps and exposes a `mount(container, ctx)`
 * function. The shell's adapter renders an empty div and calls `mount()` from a
 * `useEffect`, so the app gets a fully isolated React root inside the shell's
 * window content.
 *
 * 后端通信契约：每个 app 子进程自己起一个 axum server 监听 UDS，server 端通过
 * `/api/apps/<id>/<rest>` 透明反代过去。app 前端**直接 `fetch("/api/apps/<id>/...")`**
 * 即可（保持现有 typed REST + React Query 链路不变）；SDK 不再提供通用 RPC 包装。
 *
 * 跨 app 调用（如 `notification_center.notify`）通过 `ctx.shell.*` 暴露的
 * 命名能力发起，shell 内部决定路由方式（local svc 仍走 bus invoke、子进程 app
 * 走 UDS 反代）。业务代码不应该硬编码这些 URL。
 *
 * See docs/app/multi-process-architecture.md for the full design.
 *
 * 此文件仅作 barrel re-export；具体类型 / 实现按领域拆分到 ./manifest, ./runtime,
 * ./shell-api, ./media, ./menubar, ./toast, ./window-nav, ./viewer, ./notify。
 * Embeddable viewer components are exposed from the explicit
 * `@tokimo/sdk/viewers` subpath to keep the root runtime contract lean.
 */

export * from "./appearance";
export * from "./manifest";
export * from "./media";
export * from "./menubar";
export * from "./notify";
export * from "./reactive";
export * from "./runtime";
export * from "./shell-api";
export * from "./toast";
export * from "./viewer";
export * from "./window-nav";
