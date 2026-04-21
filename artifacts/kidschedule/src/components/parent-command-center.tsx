import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useListRoutines,
  useGetDashboardSummary,
} from "@workspace/api-client-react";
import {
  computeCommandCenter,
  type AdaptiveItem,
  type AdaptiveMood,
  type AdaptiveSleepQuality,
  type CommandActionId,
} from "@workspace/family-routine";
import { Sparkles, ArrowRight, TrendingUp, TrendingDown, Minus, Heart } from "lucide-react";

type Child = { id: number; name: string };

const TONE_STYLES: Record<"good" | "warn" | "info", string> = {
  good: "from-emerald-500/15 to-teal-500/10 border-emerald-300/40 dark:border-emerald-400/30",
  warn: "from-amber-500/15 to-orange-500/10 border-amber-300/40 dark:border-amber-400/30",
  info: "from-violet-500/15 to-fuchsia-500/10 border-violet-300/40 dark:border-violet-400/30",
};

const MOOD_LABEL: Record<AdaptiveMood, string> = {
  low: "😔 Low",
  neutral: "🙂 Neutral",
  active: "🤸 Active",
};
const SLEEP_LABEL: Record<AdaptiveSleepQuality, string> = {
  poor: "😴 Poor",
  ok: "🌙 OK",
  good: "✨ Good",
};

export function ParentCommandCenter({ child }: { child: Child }) {
  const [, navigate] = useLocation();
  const todayStr = new Date().toISOString().slice(0, 10);

  // ── Mood / sleep — read from the same per-child/day localStorage that the
  //    adaptive engine on routines/[id] writes to, so it stays in sync. ──
  const moodKey = `amynest:adaptive:mood:${child.id}:${todayStr}`;
  const sleepKey = `amynest:adaptive:sleep:${child.id}:${todayStr}`;
  const [mood, setMood] = useState<AdaptiveMood>("neutral");
  const [sleep, setSleep] = useState<AdaptiveSleepQuality>("good");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.localStorage.getItem(moodKey) as AdaptiveMood | null;
    const s = window.localStorage.getItem(sleepKey) as AdaptiveSleepQuality | null;
    if (m === "low" || m === "neutral" || m === "active") setMood(m);
    if (s === "poor" || s === "ok" || s === "good") setSleep(s);
  }, [moodKey, sleepKey]);
  const persistMood = (m: AdaptiveMood) => {
    setMood(m);
    if (typeof window !== "undefined") window.localStorage.setItem(moodKey, m);
  };
  const persistSleep = (s: AdaptiveSleepQuality) => {
    setSleep(s);
    if (typeof window !== "undefined") window.localStorage.setItem(sleepKey, s);
  };

  // ── Pull data ────────────────────────────────────────────────────
  const { data: allRoutines = [] } = useListRoutines({ childId: child.id });
  const { data: summary } = useGetDashboardSummary();

  const todayRoutine = useMemo(
    () => (allRoutines as any[]).find((r) => (r.date ?? "").slice(0, 10) === todayStr),
    [allRoutines, todayStr],
  );
  const items: AdaptiveItem[] = (todayRoutine?.items as AdaptiveItem[]) ?? [];

  const result = useMemo(
    () =>
      computeCommandCenter({
        childName: child.name,
        items,
        positiveBehaviorsToday: summary?.positiveBehaviorsToday ?? 0,
        negativeBehaviorsToday: summary?.negativeBehaviorsToday ?? 0,
        mood,
        sleepQuality: sleep,
        weeklyPositive: summary?.positiveBehaviorsToday ?? 0,
        weeklyNegative: summary?.negativeBehaviorsToday ?? 0,
        weeklyRoutinesGenerated: summary?.routinesGeneratedThisWeek ?? 0,
      }),
    [items, summary, mood, sleep, child.name],
  );

  const { overview, insights, actions, week, parentStatus } = result;

  // ── Action wiring ────────────────────────────────────────────────
  const todayRoutineId: number | undefined = todayRoutine?.id;
  const onAction = (id: CommandActionId) => {
    switch (id) {
      case "simplify-today":
        // Only nudge mood to "low" (which triggers the adaptive engine to
        // simplify on the next routine open) if the parent hasn't already
        // explicitly set today's mood — never overwrite real input.
        if (typeof window !== "undefined" && window.localStorage.getItem(moodKey) === null) {
          persistMood("low");
        }
        if (todayRoutineId) navigate(`/routines/${todayRoutineId}?simplify=1`);
        else navigate(`/routines`);
        return;
      case "fix-routine":
      case "add-activity":
        if (todayRoutineId) navigate(`/routines/${todayRoutineId}`);
        else navigate(`/routines`);
        return;
      case "calm-child":
        navigate(
          `/assistant?q=${encodeURIComponent("My child needs calming. Give me 3 quick things I can try right now in under 5 minutes.")}`,
        );
        return;
      case "improve-sleep":
        navigate(
          `/assistant?q=${encodeURIComponent("My child slept poorly last night. Suggest a 30-min wind-down routine and 3 fixes for tonight.")}`,
        );
        return;
    }
  };

  return (
    <section
      data-section-id="command-center"
      className={[
        "relative rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-emerald-500/10",
        "dark:from-violet-500/15 dark:via-fuchsia-500/10 dark:to-emerald-500/15",
        "backdrop-blur-xl border border-white/60 dark:border-white/10",
        "shadow-[0_0_0_1px_rgba(168,85,247,0.18),0_18px_50px_-18px_rgba(168,85,247,0.45)]",
        "p-3 sm:p-4 space-y-3.5",
      ].join(" ")}
    >
      {/* Header — status pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-quicksand font-bold text-[15px] leading-tight text-foreground truncate">
              {child.name}'s Command Center
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              What's happening · why · what to do
            </p>
          </div>
        </div>
        <div
          className="shrink-0 px-2.5 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/15 text-xs font-bold text-foreground flex items-center gap-1"
          title={overview.statusLabel}
        >
          <span>{overview.statusEmoji}</span>
          <span>{overview.routineCompletionPct}% · {overview.statusLabel}</span>
        </div>
      </div>

      {/* (A) TODAY OVERVIEW — horizontal scrolling metric strip */}
      <div className="-mx-3 px-3 sm:-mx-4 sm:px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max pb-1">
          <Metric label="Routine"  value={`${overview.routineCompletionPct}%`} sub={`${overview.routineCompletedTasks}/${overview.routineTotalTasks} done`} accent="violet" />
          <Metric label="Behavior" value={`${overview.behaviorScore}`}        sub={overview.behaviorLabel}                                                  accent="emerald" />
          <Metric label="Mood"     value={MOOD_LABEL[overview.mood].split(" ")[0]} sub={MOOD_LABEL[overview.mood].split(" ").slice(1).join(" ")}            accent="amber" />
          <Metric label="Sleep"    value={SLEEP_LABEL[overview.sleepQuality].split(" ")[0]} sub={SLEEP_LABEL[overview.sleepQuality].split(" ").slice(1).join(" ")} accent="sky" />
          <Metric label="Screen"   value={`${overview.screenMinutes}m`}        sub={overview.screenMinutes >= 90 ? "High today" : "Within range"}             accent="rose" />
          <Metric label="Quality"  value={`${overview.qualityMinutes}m`}       sub={overview.qualityMinutes >= 30 ? "Connected" : "Add 15 min"}             accent="pink" />
        </div>
      </div>

      {/* Mood + Sleep selectors — drive the engine + insights */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/50 backdrop-blur px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Today:</span>
        <div className="flex items-center gap-1">
          {(["low", "neutral", "active"] as AdaptiveMood[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => persistMood(m)}
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                mood === m ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-foreground border-border hover:bg-muted"
              }`}
            >
              {MOOD_LABEL[m]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {(["poor", "ok", "good"] as AdaptiveSleepQuality[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => persistSleep(s)}
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                sleep === s ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-foreground border-border hover:bg-muted"
              }`}
            >
              {SLEEP_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* (B) AMY AI INSIGHTS — what + why + what to do */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {insights.map((ins, i) => (
          <div
            key={i}
            className={[
              "rounded-2xl border bg-gradient-to-br p-3 sm:p-3.5 backdrop-blur",
              TONE_STYLES[ins.tone],
            ].join(" ")}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-foreground/70 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Amy AI Insight
            </p>
            <p className="text-sm font-bold text-foreground mt-1 leading-snug">{ins.what}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">{ins.why}</p>
            <p className="text-xs text-foreground mt-1.5 leading-snug">
              <span className="font-bold">→ </span>{ins.action}
            </p>
          </div>
        ))}
      </div>

      {/* (C) ACTION CENTER — quick action grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onAction(a.id)}
            className={[
              "group flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl",
              "border backdrop-blur transition-all duration-200",
              "active:scale-95",
              a.severity === "primary"
                ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-transparent shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_12px_30px_-8px_rgba(168,85,247,0.7)]"
                : "bg-white/60 dark:bg-white/[0.04] text-foreground border-white/60 dark:border-white/10 hover:border-primary/40 hover:bg-white/80 dark:hover:bg-white/[0.08]",
            ].join(" ")}
          >
            <span className="text-base">{a.emoji}</span>
            <span className="text-[11.5px] font-bold leading-tight text-center">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Weekly snapshot + Parent status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/50 dark:bg-white/[0.04] backdrop-blur p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">📊 Weekly Snapshot</p>
            <TrendIcon trend={week.behaviorTrend} />
          </div>
          <p className="text-sm font-bold text-foreground leading-snug">{week.behaviorTrendLabel}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-emerald-500"
                style={{ width: `${week.routineConsistencyPct}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
              {week.routineConsistencyPct}% consistent
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-pink-300/30 dark:border-pink-400/20 bg-gradient-to-br from-pink-500/10 to-rose-500/5 backdrop-blur p-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <Heart className="h-3 w-3 text-pink-500" /> Parent Status
          </p>
          <p className="text-sm font-bold text-foreground leading-snug">{parentStatus.stressLabel}</p>
          <p className="text-xs text-muted-foreground leading-snug">{parentStatus.effortSummary}</p>
        </div>
      </div>

      {/* Today's routine link footer */}
      {todayRoutineId && (
        <Link
          href={`/routines/${todayRoutineId}`}
          className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 backdrop-blur px-3 py-2 text-sm font-bold text-foreground hover:border-primary/40 hover:bg-card/60 transition-colors"
        >
          <span>Open today's routine</span>
          <ArrowRight className="h-4 w-4 text-primary" />
        </Link>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "violet" | "emerald" | "amber" | "sky" | "rose" | "pink";
}) {
  const accents: Record<string, string> = {
    violet: "from-violet-500/15 to-fuchsia-500/5",
    emerald: "from-emerald-500/15 to-teal-500/5",
    amber: "from-amber-500/15 to-orange-500/5",
    sky: "from-sky-500/15 to-blue-500/5",
    rose: "from-rose-500/15 to-red-500/5",
    pink: "from-pink-500/15 to-fuchsia-500/5",
  };
  return (
    <div
      className={[
        "min-w-[100px] sm:min-w-[112px] rounded-2xl px-3 py-2.5",
        "bg-gradient-to-br backdrop-blur border border-white/60 dark:border-white/10",
        accents[accent],
      ].join(" ")}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-black text-foreground leading-tight mt-0.5">{value}</p>
      <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-tight truncate">{sub}</p>
    </div>
  );
}

function TrendIcon({ trend }: { trend: "up" | "flat" | "down" }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" aria-label="up" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-rose-500" aria-label="down" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" aria-label="flat" />;
}
