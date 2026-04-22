import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";

/**
 * Diagnostic auth endpoint — does NOT require auth and never throws.
 * Returns whatever Clerk's middleware decoded from the request, plus the
 * raw JWT payload (decoded without verification) so we can see exactly
 * what the mobile app is sending. Use to debug 401s in production.
 *
 * Hit it from the mobile app:
 *   GET /api/auth/whoami        with Authorization: Bearer <token>
 */
const router: IRouter = Router();

function unsafeDecodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

router.get("/auth/whoami", (req, res): void => {
  const auth = getAuth(req);
  const authHeader = req.headers["authorization"] || "";
  const hasBearer =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ");
  const token = hasBearer ? (authHeader as string).slice(7) : "";

  const payload = token ? unsafeDecodeJwtPayload(token) : null;
  const now = Math.floor(Date.now() / 1000);

  res.json({
    server_time: new Date().toISOString(),
    server_time_unix: now,
    has_authorization_header: hasBearer,
    token_length: token.length,
    clerk: {
      user_id: auth?.userId ?? null,
      session_id: auth?.sessionId ?? null,
      org_id: auth?.orgId ?? null,
      session_status: (auth as any)?.sessionStatus ?? null,
      reason: (auth as any)?.reason ?? null,
      message: (auth as any)?.message ?? null,
      verified: !!auth?.userId,
    },
    jwt_payload_unverified: payload
      ? {
          sub: payload.sub,
          iss: payload.iss,
          azp: payload.azp,
          aud: payload.aud,
          exp: payload.exp,
          iat: payload.iat,
          expired:
            typeof payload.exp === "number" ? payload.exp < now : null,
          ttl_sec:
            typeof payload.exp === "number" ? payload.exp - now : null,
          age_sec:
            typeof payload.iat === "number" ? now - payload.iat : null,
        }
      : null,
    env: {
      node_env: process.env.NODE_ENV ?? "unknown",
      has_clerk_secret_key: !!process.env.CLERK_SECRET_KEY,
      clerk_secret_key_prefix: process.env.CLERK_SECRET_KEY
        ? process.env.CLERK_SECRET_KEY.slice(0, 7)
        : null,
    },
  });
});

export default router;
