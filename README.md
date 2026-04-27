# @tokimo/sdk

Runtime contract between the **Tokimo shell** and **third-party Tokimo apps**.

A Tokimo app's UI imports this package for the shell runtime contract,
`@tokimo/ui` for generic UI, and `@tokimo/sdk/viewers` when it needs
embeddable Tokimo viewer components. The shell injects window-manager, bus
client, i18n, and notification handles via a global runtime object so the app
code stays decoupled from shell internals.

## Exports

| Export             | Purpose                                                  |
|--------------------|----------------------------------------------------------|
| `defineApp(def)`   | Default-exported entry of every app's UI bundle          |
| `makeShellApi()`   | Constructs the `ShellApi` handle (notify / locale / …)   |
| `makeTranslator()` | i18n helper auto-bound to the app's namespace            |
| `AppRuntimeCtx`    | Type the shell passes into your `mount(ctx)` function    |
| `ShellApi`         | Type of the shell-provided handle (notify, media, viewers) |
| `NotifyInput`      | Payload shape for `ctx.shell.notify(...)`                |
| `@tokimo/sdk/viewers` | Re-exports embeddable components from `@tokimo/viewers` |

App ↔ backend communication is **plain typed `fetch()`**: every app exposes
its own axum router on a Unix domain socket and the shell server transparently
reverse-proxies `/api/apps/<app>/<route>` to it. There is no generic `appCall`
wrapper — call your own routes directly so React Query / typed clients stay
ergonomic.

## Status

Pilot — shipped alongside `tokimo-app-helloworld` reference app.
