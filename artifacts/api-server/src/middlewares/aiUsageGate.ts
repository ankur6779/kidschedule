import { featureGate } from "./featureGate.js";

/**
 * Backwards-compatible wrapper. The Global Paywall consolidated the
 * AI-quota check into the generic per-feature lifetime gate; this alias
 * keeps existing call sites (ai.ts, ai-coach.ts) working unchanged.
 */
export const aiUsageGate = featureGate("ai_query");
