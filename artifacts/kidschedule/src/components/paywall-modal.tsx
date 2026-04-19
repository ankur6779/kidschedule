import { useEffect, useState } from "react";
import { Sparkles, Check, X, Smartphone, Zap } from "lucide-react";
import { useUser } from "@clerk/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePaywall } from "@/contexts/paywall-context";
import { useSubscription, type Plan } from "@/hooks/use-subscription";

const REASON_COPY: Record<string, { title: string; subtitle: string }> = {
  ai_quota: {
    title: "Unlock unlimited Amy AI",
    subtitle: "You've used today's free queries. Go premium for unlimited support.",
  },
  personalized_coaching: {
    title: "Unlock Personalized Coaching",
    subtitle: "Amy adapts to your child and gives you smart, tailored next steps.",
  },
  premium_insight: {
    title: "Unlock Premium Insights",
    subtitle: "Behavior analysis and trend insights — only on premium.",
  },
  child_limit: {
    title: "Add unlimited children",
    subtitle: "Free includes 1 child profile. Upgrade for unlimited.",
  },
  feature: {
    title: "Unlock Full Parenting Power",
    subtitle: "Get unlimited AI, smart coaching, and premium insights.",
  },
};

export function PaywallModal() {
  const { state, closePaywall } = usePaywall();
  const { plans, entitlements, checkoutRazorpay, startTrial } = useSubscription();
  const { user } = useUser();
  const [selected, setSelected] = useState<Exclude<Plan, "free">>("six_month");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (state.open) setNotice(null);
  }, [state.open]);

  const copy = REASON_COPY[state.reason] ?? REASON_COPY.feature;

  const onPayWithRazorpay = async () => {
    setSubmitting(true);
    setNotice(null);
    const prefill = {
      name: user?.fullName ?? undefined,
      email: user?.primaryEmailAddress?.emailAddress,
      contact: user?.primaryPhoneNumber?.phoneNumber,
    };
    const res = await checkoutRazorpay(selected, prefill);
    setSubmitting(false);
    if (res.ok) {
      closePaywall();
    } else if (!res.userCancelled) {
      setNotice(res.reason ?? "Checkout is not yet available.");
    }
  };

  const openMobileApp = () => {
    // Try to launch the installed app via Expo deep link; fall back to the
    // web landing page so the user can grab the install link.
    const fallback = window.location.origin + "/get-app";
    const deepLink = "amynest://paywall?reason=" + encodeURIComponent(state.reason);
    const start = Date.now();
    window.location.href = deepLink;
    setTimeout(() => {
      // If we're still here after 1.2s, the deep link didn't open the app.
      if (Date.now() - start < 1500) window.location.href = fallback;
    }, 1200);
  };

  const onTrial = async () => {
    setSubmitting(true);
    await startTrial();
    setSubmitting(false);
    closePaywall();
  };

  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && closePaywall()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 bg-gradient-to-br from-[#0B0B1A] via-[#1A0B2E] to-[#0B0B1A] text-white">
        <button
          onClick={closePaywall}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 hover:bg-white/20 transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-8 pt-10 pb-8">
          {/* Hero */}
          <div className="text-center mb-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 mb-3 shadow-[0_8px_32px_rgba(255,78,205,0.5)]">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold mb-2">{copy.title}</h2>
            <p className="text-white/70 text-sm max-w-md mx-auto">{copy.subtitle}</p>
          </div>

          {/* Plan cards */}
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            {plans.map((p) => {
              const isSelected = p.id === selected;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={[
                    "relative text-left rounded-2xl p-4 border-2 transition-all",
                    isSelected
                      ? "border-pink-400 bg-violet-500/20 shadow-[0_8px_24px_rgba(255,78,205,0.35)]"
                      : "border-white/10 bg-white/5 hover:border-white/30",
                  ].join(" ")}
                >
                  {p.badge && (
                    <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-violet-500 to-pink-500">
                      {p.badge}
                    </span>
                  )}
                  <div className="font-bold text-sm mb-1">{p.title}</div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-black">₹{p.price}</span>
                    <span className="text-xs text-white/60">/ {p.period}</span>
                  </div>
                  {typeof p.savingsPercent === "number" && p.savingsPercent > 0 && (
                    <div className="text-xs font-extrabold text-pink-400 mb-2">
                      Save {p.savingsPercent}%
                    </div>
                  )}
                  <ul className="space-y-1">
                    {p.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-white/85">
                        <Check className={["h-3 w-3 mt-0.5 shrink-0", isSelected ? "text-pink-400" : "text-white/50"].join(" ")} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {notice && (
            <div className="flex items-start gap-2 rounded-lg border border-violet-400/40 bg-violet-400/10 px-3 py-2 mb-4 text-violet-100 text-xs font-semibold">
              <Smartphone className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="leading-snug">{notice}</span>
            </div>
          )}

          <Button
            onClick={onPayWithRazorpay}
            disabled={submitting || plans.length === 0}
            className="w-full h-12 text-base font-extrabold bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 border-0 shadow-[0_10px_24px_rgba(255,78,205,0.5)]"
          >
            <Zap className="h-4 w-4 mr-2" />
            {submitting ? "Opening Razorpay…" : "Pay with UPI / Card"}
          </Button>

          <button
            type="button"
            onClick={openMobileApp}
            disabled={submitting}
            className="w-full mt-2 h-10 inline-flex items-center justify-center gap-2 rounded-md text-sm font-bold text-white/85 bg-white/5 hover:bg-white/10 border border-white/10 transition"
          >
            <Smartphone className="h-3.5 w-3.5" />
            Continue in Mobile App instead
          </button>

          {entitlements?.status === "free" && (
            <button
              type="button"
              onClick={onTrial}
              disabled={submitting}
              className="w-full text-center mt-3 text-pink-400 font-extrabold text-sm hover:underline"
            >
              Start 3-day free trial
            </button>
          )}

          <button
            type="button"
            onClick={closePaywall}
            className="w-full text-center mt-2 text-white/55 text-sm py-2 hover:text-white/80"
          >
            Maybe Later
          </button>

          <p className="text-center text-[11px] text-white/35 mt-2">
            Cancel anytime. Renews automatically until canceled.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
