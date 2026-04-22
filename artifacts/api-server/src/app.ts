import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
import { clerkOAuthRedirectMiddleware } from "./middlewares/clerkOAuthRedirect";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(
  express.json({
    limit: "10mb",
    // Capture the raw request bytes for Razorpay's webhook so we can
    // verify the X-Razorpay-Signature HMAC. Stored only for that path
    // to avoid wasting memory on every request.
    verify: (req: any, _res, buf) => {
      const url: string = req.originalUrl ?? req.url ?? "";
      if (url.includes("/api/subscription/razorpay/webhook")) {
        req.rawBody = buf.toString("utf8");
      }
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(clerkMiddleware());

app.use("/api", router);

// Clerk OAuth callbacks (Google, GitHub, etc.) come back to /v1/oauth_callback
// at the deployment root. Redirect them through the Clerk proxy so the SPA
// doesn't intercept them and show a 404. See clerkOAuthRedirect.ts.
app.use("/v1", clerkOAuthRedirectMiddleware());

// Clean JSON 404 for anything else this service receives. Without this,
// Express's default handler returns an HTML "Cannot GET …" page which is
// confusing in browsers and useless to mobile clients. Logging the full
// request makes OAuth/WebView debugging easier.
app.use((req, res) => {
  // Strip OAuth credentials from logged URL — same redaction logic as
  // clerkOAuthRedirect.ts; kept inline to avoid coupling.
  const safeUrl = (() => {
    if (!req.originalUrl.includes("?")) return req.originalUrl;
    const [p, qs] = req.originalUrl.split("?", 2);
    const params = new URLSearchParams(qs);
    for (const k of ["code", "state", "id_token", "access_token"]) {
      if (params.has(k)) params.set(k, "[REDACTED]");
    }
    return `${p}?${params.toString()}`;
  })();
  logger.warn(
    {
      kind: "api_server_404",
      method: req.method,
      url: safeUrl,
      userAgent: req.headers["user-agent"],
      referer: req.headers["referer"],
    },
    "Unknown route on api-server",
  );
  res.status(404).json({
    error: "not_found",
    message: `No handler for ${req.method} ${req.originalUrl} on api-server.`,
    hint:
      "If this was a Clerk OAuth callback, ensure your provider's redirect " +
      "URL matches the deployment domain. App routes live in the SPA, not here.",
  });
});

export default app;
