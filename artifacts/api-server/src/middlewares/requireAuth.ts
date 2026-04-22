import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

/**
 * Decode a JWT payload without verifying — for diagnostic logging only.
 * Never trust the result for authorization decisions.
 */
function unsafeDecodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    // Diagnostic logging — when auth fails in production, we need to see WHY.
    // Without this, every 401 is a black box and we can't fix the real cause.
    const authHeader = req.headers["authorization"] || "";
    const hasBearer = typeof authHeader === "string" && authHeader.startsWith("Bearer ");
    const token = hasBearer ? (authHeader as string).slice(7) : "";

    let payloadDiag: Record<string, unknown> = {};
    if (token) {
      const payload = unsafeDecodeJwtPayload(token);
      if (payload) {
        const now = Math.floor(Date.now() / 1000);
        payloadDiag = {
          jwt_sub: payload.sub,
          jwt_iss: payload.iss,
          jwt_azp: payload.azp,
          jwt_aud: payload.aud,
          jwt_exp: payload.exp,
          jwt_iat: payload.iat,
          jwt_expired:
            typeof payload.exp === "number" ? payload.exp < now : null,
          jwt_age_sec:
            typeof payload.iat === "number" ? now - payload.iat : null,
          jwt_ttl_sec:
            typeof payload.exp === "number" ? payload.exp - now : null,
        };
      } else {
        payloadDiag = { jwt_decode_failed: true };
      }
    }

    logger.warn(
      {
        kind: "require_auth_unauthorized",
        url: req.originalUrl?.split("?")[0],
        method: req.method,
        has_auth_header: hasBearer,
        token_len: token.length,
        clerk_session_id: auth?.sessionId ?? null,
        clerk_user_id: auth?.userId ?? null,
        clerk_session_status: (auth as any)?.sessionStatus ?? null,
        // Clerk's @clerk/express attaches a `reason` when verification fails.
        clerk_auth_reason: (auth as any)?.reason ?? null,
        clerk_auth_message: (auth as any)?.message ?? null,
        user_agent: req.headers["user-agent"],
        origin: req.headers["origin"],
        ...payloadDiag,
      },
      "requireAuth rejected request",
    );

    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
