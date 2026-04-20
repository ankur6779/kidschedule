import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Check, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription, type Plan } from "@/hooks/use-subscription";

export default function PricingPage() {
  const { t } = useTranslation();
  const { plans, entitlements, isPremium, checkout, startTrial, loading } = useSubscription();
  const [selected, setSelected] = useState<Exclude<Plan, "free">>("six_month");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const onUpgrade = async () => {
    setSubmitting(true);
    setNotice(null);
    const res = await checkout(selected);
    setSubmitting(false);
    if (!res.ok) setNotice(res.reason ?? t("pricing.checkout_unavailable"));
  };
  const onTrial = async () => {
    setSubmitting(true);
    await startTrial();
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 mb-4 shadow-lg">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">{t("pricing.title")}</h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            {t("pricing.subtitle")}
          </p>
          {isPremium && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
              <Check className="h-4 w-4" /> {t("pricing.on_plan", { plan: entitlements?.plan })}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center text-slate-400">{t("pricing.loading_plans")}</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const isSelected = p.id === selected;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={[
                    "relative text-left rounded-3xl p-6 border-2 bg-white dark:bg-slate-800 transition-all hover:-translate-y-1",
                    isSelected
                      ? "border-pink-400 shadow-[0_16px_40px_-8px_rgba(236,72,153,0.4)]"
                      : "border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500",
                  ].join(" ")}
                  data-testid={`plan-card-${p.id}`}
                >
                  {p.badge && (
                    <span className="absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-violet-500 to-pink-500 text-white">
                      {p.badge}
                    </span>
                  )}
                  <div className="font-bold text-slate-900 dark:text-slate-100 mb-2">{p.title}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-slate-100">₹{p.price}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">/ {p.period}</span>
                  </div>
                  {typeof p.savingsPercent === "number" && p.savingsPercent > 0 && (
                    <div className="text-sm font-extrabold text-pink-500 mb-4">{t("pricing.save_percent", { percent: p.savingsPercent })}</div>
                  )}
                  <ul className="space-y-2 mt-4">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <Check className={["h-4 w-4 mt-0.5 shrink-0", isSelected ? "text-pink-500" : "text-emerald-500"].join(" ")} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        )}

        {notice && (
          <div className="mt-6 max-w-md mx-auto rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 text-center">
            {notice}
          </div>
        )}

        <div className="mt-8 max-w-md mx-auto">
          <Button
            onClick={onUpgrade}
            disabled={submitting || plans.length === 0 || isPremium}
            className="w-full h-12 text-base font-extrabold bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 border-0 shadow-[0_10px_24px_rgba(236,72,153,0.4)]"
            data-testid="button-upgrade"
          >
            <Rocket className="h-4 w-4 mr-2" />
            {isPremium ? t("pricing.already_premium") : submitting ? t("common.please_wait") : t("pricing.upgrade_now")}
          </Button>
          {!isPremium && entitlements?.status === "free" && (
            <button
              type="button"
              onClick={onTrial}
              disabled={submitting}
              className="w-full text-center mt-3 text-pink-600 font-extrabold text-sm hover:underline"
              data-testid="button-start-trial"
            >
              {t("pricing.start_trial")}
            </button>
          )}
          <p className="text-center text-xs text-slate-400 mt-3">{t("pricing.cancel_anytime")}</p>
        </div>
      </div>
    </div>
  );
}
