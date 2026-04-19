import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, ThumbsUp, RotateCcw, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  INFANT_CATEGORIES,
  type InfantCategory,
  type Lang,
  getTipsForAge,
  getAmyInsight,
  pickLang,
} from "@workspace/infant-hub";
import { formatAge } from "@/lib/age-groups";
import { useToast } from "@/hooks/use-toast";

interface InfantHubProps {
  childName: string;
  ageMonths: number;
}

function langOf(i18nLang: string | undefined): Lang {
  if (i18nLang?.startsWith("hi") && !i18nLang.includes("ng")) return "hi";
  if (i18nLang === "hinglish" || i18nLang?.startsWith("hin")) return "hin";
  return "en";
}

export function InfantHub({ childName, ageMonths }: InfantHubProps) {
  const { t, i18n } = useTranslation();
  const lang = langOf(i18n.language);
  const { toast } = useToast();

  const [active, setActive] = useState<InfantCategory>("sleep");
  const [tipIndex, setTipIndex] = useState(0);

  const tips = useMemo(() => getTipsForAge(ageMonths, active), [ageMonths, active]);
  const insight = useMemo(() => getAmyInsight(ageMonths, active), [ageMonths, active]);

  const currentTip = tips.length > 0 ? tips[tipIndex % tips.length] : null;

  const ageLabel = formatAge(Math.floor(ageMonths / 12), ageMonths % 12);

  const handleNext = () => {
    if (tips.length === 0) return;
    setTipIndex((i) => (i + 1) % tips.length);
  };

  return (
    <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-pink-50/60 via-violet-50/40 to-sky-50/60 dark:from-pink-950/20 dark:via-violet-950/20 dark:to-sky-950/20 backdrop-blur-xl overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-300 mb-0.5">
              👶 {t("infant_hub.title")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("infant_hub.subtitle", { name: childName, age: ageLabel })}
            </p>
          </div>
        </div>

        {/* Glass Tabs */}
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
          {INFANT_CATEGORIES.map((cat) => {
            const isActive = active === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setActive(cat.key);
                  setTipIndex(0);
                }}
                className={[
                  "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-200",
                  "backdrop-blur-md border",
                  isActive
                    ? "bg-white/80 dark:bg-white/10 border-violet-400/60 dark:border-violet-300/40 text-violet-900 dark:text-violet-100 shadow-[0_0_0_1px_rgba(168,85,247,0.35),0_8px_24px_-8px_rgba(168,85,247,0.45)]"
                    : "bg-white/40 dark:bg-white/5 border-white/60 dark:border-white/10 text-muted-foreground hover:border-violet-300/60",
                ].join(" ")}
                aria-pressed={isActive}
              >
                <span className="text-base leading-none">{cat.emoji}</span>
                <span>{t(`infant_hub.tabs.${cat.key}`)}</span>
              </button>
            );
          })}
        </div>

        {/* Amy AI Insight */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-100/70 to-fuchsia-100/70 dark:from-violet-900/30 dark:to-fuchsia-900/30 border border-violet-200/60 dark:border-violet-400/20 p-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <Brain className="h-4 w-4 text-violet-600 dark:text-violet-300" />
            <p className="text-xs font-bold text-violet-900 dark:text-violet-100">
              {t("infant_hub.amy_suggests")}
            </p>
          </div>
          <p className="text-sm text-violet-900/90 dark:text-violet-50 leading-snug">
            <span className="mr-1">{insight.emoji}</span>
            {pickLang(insight, lang)}
          </p>
        </div>

        {/* Current Tip */}
        {currentTip ? (
          <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 p-4 backdrop-blur-md">
            <div className="flex items-start gap-3 mb-2">
              <div className="text-3xl leading-none shrink-0">{currentTip.emoji}</div>
              <div className="min-w-0 flex-1">
                <p className="font-quicksand font-bold text-foreground text-[15px] leading-tight">
                  {pickLang(currentTip.title, lang)}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5 font-bold">
                  {t("infant_hub.based_on")}
                </p>
              </div>
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              {pickLang(currentTip.body, lang)}
            </p>

            {/* Interaction buttons */}
            <div className="flex flex-wrap gap-2 mt-3.5">
              <button
                onClick={() => toast({ description: t("infant_hub.thanks") })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-200 dark:hover:bg-emerald-500/25 transition-colors"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                {t("infant_hub.helpful")}
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-bold hover:bg-violet-200 dark:hover:bg-violet-500/25 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("infant_hub.next_tip")}
              </button>
              <button
                onClick={() => toast({ description: t("infant_hub.tried_logged") })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-200 dark:hover:bg-amber-500/25 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("infant_hub.tried_this")}
              </button>
            </div>

            {tips.length > 1 && (
              <p className="mt-2.5 text-[11px] text-muted-foreground text-center">
                {tipIndex + 1} / {tips.length}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-muted/40 p-5 text-center text-sm text-muted-foreground">
            {t("infant_hub.no_tips")}
          </div>
        )}

        {/* Safety footer */}
        <div className="flex items-start gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
          <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600/70" />
          <p className="leading-snug">{t("infant_hub.safe_disclaimer")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
