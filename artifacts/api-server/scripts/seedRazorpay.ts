// One-shot seed script for Razorpay Plans matching AmyNest's PLAN_PRICES.
// Usage: pnpm --filter @workspace/api-server exec tsx scripts/seedRazorpay.ts
//
// Requires: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (test or live).
// Prints the resulting plan_xxx IDs — copy them into env vars:
//   RAZORPAY_PLAN_ID_MONTHLY
//   RAZORPAY_PLAN_ID_SIX_MONTH  (canonical name; RAZORPAY_PLAN_ID_QUARTERLY is also accepted)
//   RAZORPAY_PLAN_ID_YEARLY
import { createPlan, listPlans, razorpayConfigured } from "../src/lib/razorpayClient.js";

type Spec = {
  key: "monthly" | "six_month" | "yearly";
  name: string;
  period: "monthly" | "yearly";
  interval: number;
  amountInr: number;
};

const SPECS: Spec[] = [
  { key: "monthly",   name: "AmyNest Monthly",   period: "monthly", interval: 1, amountInr: 199 },
  { key: "six_month", name: "AmyNest 6-Month",   period: "monthly", interval: 6, amountInr: 999 },
  { key: "yearly",    name: "AmyNest Yearly",    period: "yearly",  interval: 1, amountInr: 1599 },
];

async function main() {
  if (!razorpayConfigured()) {
    console.error("✗ RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set in env");
    process.exit(1);
  }
  const existing = await listPlans(100);
  const out: Record<string, string> = {};
  for (const spec of SPECS) {
    const amountPaise = spec.amountInr * 100;
    const dupe = existing.items?.find(
      (p) =>
        p.item.name === spec.name &&
        p.period === spec.period &&
        p.interval === spec.interval &&
        p.item.amount === amountPaise,
    );
    if (dupe) {
      console.log(`✓ Plan exists for ${spec.key}: ${dupe.id}`);
      out[spec.key] = dupe.id;
      continue;
    }
    const created = await createPlan({
      name: spec.name,
      period: spec.period,
      interval: spec.interval,
      amountPaise,
      description: `${spec.name} (₹${spec.amountInr})`,
    });
    console.log(`+ Created plan for ${spec.key}: ${created.id}`);
    out[spec.key] = created.id;
  }
  console.log("\n========================================");
  console.log("Razorpay seed complete!");
  console.log("========================================");
  console.log(`RAZORPAY_PLAN_ID_MONTHLY=${out.monthly}`);
  console.log(`RAZORPAY_PLAN_ID_SIX_MONTH=${out.six_month}   # also accepted: RAZORPAY_PLAN_ID_QUARTERLY`);
  console.log(`RAZORPAY_PLAN_ID_YEARLY=${out.yearly}`);
  console.log("========================================\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
