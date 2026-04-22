// Crash reporter abstraction.
//
// Today this is a thin no-op wrapper around `console.error` so that the rest
// of the app can call `captureException` / `addBreadcrumb` without caring
// whether a real reporter is wired up.
//
// To enable a real backend (Sentry, Bugsnag, etc.) once the app moves off
// Expo Go to a development/production build, swap the implementations below.
// The `EXPO_PUBLIC_SENTRY_DSN` env var is the convention we'll honour:
//   - empty / unset → no-op (current behaviour)
//   - present       → init Sentry inside `initCrashReporter` and forward calls
//
// The error boundary and the global error helpers already call into this
// module, so swapping is a single-file change.

let initialized = false;

type Severity = "debug" | "info" | "warning" | "error" | "fatal";

export function initCrashReporter(): void {
  if (initialized) return;
  initialized = true;
  // Future: if (process.env.EXPO_PUBLIC_SENTRY_DSN) Sentry.init({ dsn: ... });
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (context) console.error("[crash]", err, context);
  else console.error("[crash]", err);
}

export function captureMessage(message: string, severity: Severity = "info"): void {
  console.log(`[crash:${severity}]`, message);
}

export function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
  if (data) console.log(`[breadcrumb:${category}]`, message, data);
  else console.log(`[breadcrumb:${category}]`, message);
}

export function setUser(user: { id?: string; email?: string } | null): void {
  // No-op until a real reporter is wired up.
  void user;
}
