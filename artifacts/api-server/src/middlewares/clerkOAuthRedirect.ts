/**
 * Clerk OAuth callback redirect middleware.
 *
 * Google (and other social OAuth providers configured through Clerk) redirect
 * the browser to `https://<your-domain>/v1/oauth_callback?code=…&state=…`
 * after the user signs in. In our deployment that path is NOT served by the
 * api-server by default — it falls through to the React SPA, which renders
 * its 404 page ("Did you forget to add the page to the router?").
 *
 * The Clerk Frontend API proxy lives at `/api/__clerk` (see
 * clerkProxyMiddleware.ts). The fix is to add `/v1` to the api-server's
 * served paths (artifact.toml) and 302-redirect any `/v1/*` request to
 * `/api/__clerk/v1/*`, preserving the full query string. The browser then
 * follows the redirect, hits the proxy, and Clerk completes the OAuth flow.
 *
 * Works the same way for desktop browsers and Android WebView — both follow
 * standard 302 redirects.
 */

import type { RequestHandler } from "express";
import { logger } from "../lib/logger";
import { CLERK_PROXY_PATH } from "./clerkProxyMiddleware";

// Strip credential-like OAuth params from URLs before logging. `code` and
// `state` are short-lived but still authentication artifacts — we don't want
// them in our log retention.
function redactOAuthQuery(url: string): string {
  if (!url.includes("?")) return url;
  const [path, qs] = url.split("?", 2);
  const params = new URLSearchParams(qs);
  for (const key of ["code", "state", "id_token", "access_token"]) {
    if (params.has(key)) params.set(key, "[REDACTED]");
  }
  return `${path}?${params.toString()}`;
}

export function clerkOAuthRedirectMiddleware(): RequestHandler {
  return (req, res) => {
    // Path here is everything AFTER the mount point (`/v1`), so a request to
    // `/v1/oauth_callback?code=…` arrives as `req.path === "/oauth_callback"`.
    const targetPath = `${CLERK_PROXY_PATH}/v1${req.path}`;
    const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const target = `${targetPath}${qs}`;

    logger.info(
      {
        kind: "clerk_oauth_redirect",
        method: req.method,
        from: redactOAuthQuery(req.originalUrl),
        to: redactOAuthQuery(target),
        userAgent: req.headers["user-agent"],
        referer: req.headers["referer"],
        host: req.headers["host"],
      },
      "Redirecting Clerk OAuth callback to proxy",
    );

    // 302 — temporary redirect, browser issues a fresh GET to the new URL.
    // Suitable for OAuth callbacks (always GET) and works in Android WebView.
    res.redirect(302, target);
  };
}
