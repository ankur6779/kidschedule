/**
 * Clerk Frontend API Proxy Middleware
 *
 * Proxies Clerk Frontend API requests through your domain, enabling Clerk
 * authentication on custom domains and .replit.app deployments without
 * requiring CNAME DNS configuration.
 *
 * AUTH CONFIGURATION: To manage users, enable/disable login providers
 * (Google, GitHub, etc.), change app branding, or configure OAuth credentials,
 * use the Auth pane in the workspace toolbar. There is no external Clerk
 * dashboard — all auth configuration is done through the Auth pane.
 *
 * IMPORTANT:
 * - Only active in production (Clerk proxying doesn't work for dev instances)
 * - Must be mounted BEFORE express.json() middleware
 *
 * Usage in app.ts:
 *   import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
 *   app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
 */

import { createProxyMiddleware } from "http-proxy-middleware";
import type { RequestHandler } from "express";
import { logger } from "../lib/logger";

const CLERK_FAPI = "https://frontend-api.clerk.dev";
export const CLERK_PROXY_PATH = "/api/__clerk";

export function clerkProxyMiddleware(): RequestHandler {
  // Only run proxy in production — Clerk proxying doesn't work for dev instances
  if (process.env.NODE_ENV !== "production") {
    return (_req, _res, next) => next();
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return (_req, _res, next) => next();
  }

  return createProxyMiddleware({
    target: CLERK_FAPI,
    changeOrigin: true,
    pathRewrite: (path: string) =>
      path.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ""),
    on: {
      proxyReq: (proxyReq, req) => {
        // x-forwarded-proto can be a comma-separated list — take the first value
        const rawProto = req.headers["x-forwarded-proto"];
        const protocol =
          ((Array.isArray(rawProto) ? rawProto[0] : rawProto)
            ?.split(",")[0]
            ?.trim()) || "https";
        const host = req.headers.host || "";
        const proxyUrl = `${protocol}://${host}${CLERK_PROXY_PATH}`;

        proxyReq.setHeader("Clerk-Proxy-Url", proxyUrl);
        proxyReq.setHeader("Clerk-Secret-Key", secretKey);

        const xff = req.headers["x-forwarded-for"];
        const clientIp =
          (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim() ||
          req.socket?.remoteAddress ||
          "";
        if (clientIp) {
          proxyReq.setHeader("X-Forwarded-For", clientIp);
        }
      },
      proxyRes: (proxyRes, req) => {
        // Log 3xx responses from Clerk so we can see the exact redirect target.
        // This is critical for diagnosing OAuth callback errors.
        const status = proxyRes.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          const raw = proxyRes.headers["location"] || "";
          // Redact OAuth params before logging
          const safeLocation = raw.includes("?")
            ? (() => {
                const [p, qs] = raw.split("?", 2);
                const params = new URLSearchParams(qs);
                for (const k of ["code", "state", "id_token", "access_token"]) {
                  if (params.has(k)) params.set(k, "[REDACTED]");
                }
                return `${p}?${params.toString()}`;
              })()
            : raw;
          logger.info(
            {
              kind: "clerk_proxy_response_redirect",
              status,
              location: safeLocation,
              url: req.originalUrl?.split("?")[0],
            },
            "Clerk proxy returned redirect",
          );
        }
      },
    },
  }) as RequestHandler;
}
