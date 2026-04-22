import { Resend } from "resend";
import { logger } from "./logger";

let cached: Resend | null | undefined;

function getClient(): Resend | null {
  if (cached !== undefined) return cached;
  const key = process.env["RESEND_API_KEY"];
  if (!key) {
    cached = null;
    return null;
  }
  cached = new Resend(key);
  return cached;
}

const FROM_ADDRESS =
  process.env["EMAIL_FROM"] ?? "AmyNest <hello@amynest.in>";

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: "no_provider" | "send_failed"; error?: string };

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const client = getClient();
  if (!client) {
    logger.warn(
      { to: args.to, subject: args.subject },
      "RESEND_API_KEY not set — skipping email send",
    );
    return { ok: false, reason: "no_provider" };
  }
  try {
    const result = await client.emails.send({
      from: FROM_ADDRESS,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (result.error) {
      logger.error({ err: result.error, to: args.to }, "Resend send failed");
      return { ok: false, reason: "send_failed", error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? null };
  } catch (err) {
    logger.error({ err, to: args.to }, "Resend threw while sending");
    return {
      ok: false,
      reason: "send_failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function isEmailConfigured(): boolean {
  return !!process.env["RESEND_API_KEY"];
}
