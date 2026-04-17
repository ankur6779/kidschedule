import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, ArrowLeft, ArrowRight, Loader2, Search,
  Check, ChevronLeft, RotateCcw, BarChart3, Share2, Bookmark,
} from "lucide-react";

// ─── Goals ─────────────────────────────────────────────────────────────────
const GOALS = [
  { id: "balance-screen-time",       title: "Balance Screen Time",        emoji: "📱", gradient: "from-sky-100 to-blue-200" },
  { id: "manage-tantrums",           title: "Manage Tantrums",            emoji: "😤", gradient: "from-rose-100 to-pink-200" },
  { id: "change-stubborn-behaviour", title: "Change Stubborn Behaviour",  emoji: "🛑", gradient: "from-amber-100 to-orange-200" },
  { id: "improve-sleep-patterns",    title: "Improve Sleep Patterns",     emoji: "😴", gradient: "from-indigo-100 to-violet-200" },
  { id: "encourage-independent-eating", title: "Encourage Independent Eating", emoji: "🥄", gradient: "from-emerald-100 to-green-200" },
  { id: "boost-concentration",       title: "Boost Concentration",        emoji: "🎯", gradient: "from-purple-100 to-fuchsia-200" },
  { id: "navigate-fussy-eating",     title: "Navigate Fussy Eating",      emoji: "🥦", gradient: "from-teal-100 to-cyan-200" },
] as const;

// ─── Question definitions ──────────────────────────────────────────────────
type QuestionType = "single" | "multi";
interface Question {
  id: "ageGroup" | "severity" | "triggers" | "routine" | "goalRefinement";
  prompt: string;
  type: QuestionType;
  options: string[];
}

const COMMON_TRIGGERS = [
  "Hunger or tiredness", "Transitions or changes", "Being told 'no'", "Boredom",
  "Sibling conflict", "School/social stress", "Inconsistent rules", "Sensory overload",
];

const QUESTIONS: Question[] = [
  { id: "ageGroup",       prompt: "What's your child's age?",         type: "single", options: ["2–4 years", "5–7 years", "8–10 years"] },
  { id: "severity",       prompt: "How challenging is it right now?", type: "single", options: ["Mild – occasional", "Moderate – frequent", "Severe – daily struggle"] },
  { id: "triggers",       prompt: "What triggers it most? (pick any)",type: "multi",  options: COMMON_TRIGGERS },
  { id: "routine",        prompt: "What's your current approach?",    type: "single", options: ["No clear routine yet", "I try but it's inconsistent", "Strict rules, lots of pushback", "Trying gentle parenting", "Just starting to figure it out"] },
  { id: "goalRefinement", prompt: "What matters most to you?",        type: "single", options: ["Reduce frequency", "Stay calm myself", "Build my child's skills", "Long-term healthy pattern"] },
];

// ─── Types ─────────────────────────────────────────────────────────────────
interface Win {
  win: number;
  title: string;
  objective: string;
  actions: string[];
  activity: string;
  science: string;
  duration: string;
  image?: string;
}
interface Plan { title: string; summary: string; wins: Win[]; }

type Phase = "goals" | "questions" | "loading" | "result";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
export default function AICoachPage() {
  const [, setLocation] = useLocation();
  const { authFetch } = useAuthFetch();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("goals");
  const [goalSearch, setGoalSearch] = useState("");
  const [goalId, setGoalId] = useState<string>("");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [plan, setPlan] = useState<Plan | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [feedbackPrompted, setFeedbackPrompted] = useState<Record<number, boolean>>({});
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const scrollerRef = useRef<HTMLDivElement>(null);

  const filteredGoals = useMemo(() => {
    const q = goalSearch.toLowerCase().trim();
    if (!q) return GOALS;
    return GOALS.filter((g) => g.title.toLowerCase().includes(q));
  }, [goalSearch]);

  const selectedGoal = GOALS.find((g) => g.id === goalId);

  // ─── Goals → Questions
  const handlePickGoal = (id: string) => {
    setGoalId(id);
    setQIndex(0);
    setAnswers({});
    setPhase("questions");
  };

  // ─── Question handlers
  const currentQ = QUESTIONS[qIndex];
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;
  const isAnswered = currentQ?.type === "multi"
    ? Array.isArray(currentAnswer) && currentAnswer.length > 0
    : typeof currentAnswer === "string" && currentAnswer.length > 0;

  const handleSelectOption = (opt: string) => {
    if (!currentQ) return;
    if (currentQ.type === "single") {
      setAnswers((a) => ({ ...a, [currentQ.id]: opt }));
    } else {
      const cur = (answers[currentQ.id] as string[]) ?? [];
      const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
      setAnswers((a) => ({ ...a, [currentQ.id]: next }));
    }
  };

  const handleNextQ = () => {
    if (qIndex < QUESTIONS.length - 1) {
      setQIndex((i) => i + 1);
    } else {
      submitPlan();
    }
  };

  const handleBackQ = () => {
    if (qIndex > 0) setQIndex((i) => i - 1);
    else setPhase("goals");
  };

  // ─── Submit to API
  const submitPlan = async () => {
    setPhase("loading");
    setActiveIdx(0);
    setFeedbackPrompted({});
    setImgErrors({});
    const ageMap: Record<string, string> = { "2–4 years": "2-4", "5–7 years": "5-7", "8–10 years": "8-10" };
    const sevMap: Record<string, string> = { "Mild – occasional": "mild", "Moderate – frequent": "moderate", "Severe – daily struggle": "severe" };
    const payload = {
      goal: goalId,
      ageGroup: ageMap[answers.ageGroup as string] ?? answers.ageGroup ?? "5-7",
      severity: sevMap[answers.severity as string] ?? "moderate",
      triggers: (answers.triggers as string[]) ?? [],
      routine: (answers.routine as string) ?? "",
      goalRefinement: (answers.goalRefinement as string) ?? "",
    };
    try {
      const res = await authFetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = (await res.json()) as { plan: Plan; sessionId: string };
      setPlan(data.plan);
      setSessionId(data.sessionId);
      setPhase("result");
    } catch {
      toast({ title: "Something went wrong", description: "Please try again in a moment.", variant: "destructive" });
      setPhase("questions");
    }
  };

  // ─── Result deck navigation
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || phase !== "result") return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      if (idx !== activeIdx) setActiveIdx(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [phase, activeIdx]);

  const goToCard = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // ─── Feedback
  const submitFeedback = async (winNumber: number, feedback: "yes" | "somewhat" | "no") => {
    if (!plan || !sessionId) return;
    setFeedbackPrompted((p) => ({ ...p, [winNumber]: true }));
    try {
      await authFetch("/api/ai-coach/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          goalId,
          planTitle: plan.title,
          winNumber,
          totalWins: plan.wins.length,
          feedback,
        }),
      });
      toast({ title: "Saved!", description: "Your progress is tracked. Keep going 💜" });
    } catch {
      // silent — already marked prompted to avoid spam
    }
  };

  // ─── Share / Save
  const handleShare = async () => {
    if (!plan) return;
    const text = `${plan.title}\n\n${plan.summary}\n\nMy 6 wins from AmyNest AI Coach:\n${plan.wins.map((w) => `${w.win}. ${w.title}`).join("\n")}`;
    if (navigator.share) {
      try { await navigator.share({ title: plan.title, text }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "Plan copied to clipboard." });
      } catch {}
    }
  };

  const handleStartOver = () => {
    setPhase("goals");
    setGoalId("");
    setAnswers({});
    setPlan(null);
    setSessionId("");
    setActiveIdx(0);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER PHASES
  // ═══════════════════════════════════════════════════════════════════════

  // ── PHASE: GOALS ─────────────────────────────────────────────────────
  if (phase === "goals") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <Link href="/ai-coach/progress">
            <button className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-all">
              <BarChart3 className="h-3.5 w-3.5" /> My Progress
            </button>
          </Link>
        </div>

        <div>
          <h1 className="font-quicksand text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-500" />
            AI Coach (Ask AMY)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a goal — I'll build a personalised, science-backed plan in 6 wins.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={goalSearch}
            onChange={(e) => setGoalSearch(e.target.value)}
            placeholder="Search goals…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-border bg-card text-sm focus:outline-none focus:border-violet-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredGoals.map((g) => (
            <button
              key={g.id}
              onClick={() => handlePickGoal(g.id)}
              className={`group bg-gradient-to-br ${g.gradient} rounded-2xl p-4 border-2 border-transparent hover:border-violet-400 hover:shadow-lg transition-all text-left flex items-center gap-3`}
            >
              <span className="text-3xl shrink-0">{g.emoji}</span>
              <div className="flex-1">
                <p className="font-quicksand font-bold text-base text-foreground leading-tight">{g.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Tap to start →</p>
              </div>
            </button>
          ))}
          {filteredGoals.length === 0 && (
            <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
              No goals match "{goalSearch}"
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PHASE: QUESTIONS ────────────────────────────────────────────────
  if (phase === "questions" && currentQ) {
    const progressPct = ((qIndex + 1) / QUESTIONS.length) * 100;
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <button onClick={handleBackQ} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-semibold">Question {qIndex + 1} of {QUESTIONS.length}</span>
            <span>{selectedGoal?.title}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <h2 className="font-quicksand text-xl font-bold text-foreground">{currentQ.prompt}</h2>
        {currentQ.type === "multi" && (
          <p className="text-xs text-muted-foreground -mt-3">Pick any that apply</p>
        )}

        <div className="space-y-2">
          {currentQ.options.map((opt) => {
            const selected = currentQ.type === "multi"
              ? ((answers[currentQ.id] as string[]) ?? []).includes(opt)
              : answers[currentQ.id] === opt;
            return (
              <button
                key={opt}
                onClick={() => handleSelectOption(opt)}
                className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                  selected
                    ? "bg-violet-50 border-violet-500 text-violet-900"
                    : "bg-card border-border hover:border-violet-300"
                }`}
              >
                <span className="font-semibold text-sm">{opt}</span>
                {selected && <Check className="h-5 w-5 text-violet-600 shrink-0" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNextQ}
          disabled={!isAnswered}
          className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-violet-600 to-pink-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all"
        >
          {qIndex < QUESTIONS.length - 1 ? "Next" : "Build My Plan ✨"}
        </button>
      </div>
    );
  }

  // ── PHASE: LOADING ───────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-violet-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center text-white px-8 space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <Sparkles className="absolute inset-0 w-20 h-20 animate-spin" style={{ animationDuration: "3s" }} />
          </div>
          <h2 className="font-quicksand text-2xl font-bold">Building your plan…</h2>
          <p className="text-sm text-white/80 max-w-xs mx-auto">
            Analysing your answers and crafting 6 research-backed wins for {selectedGoal?.title.toLowerCase()}.
          </p>
        </div>
      </div>
    );
  }

  // ── PHASE: RESULT ────────────────────────────────────────────────────
  if (phase === "result" && plan) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 50, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
          padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)",
        }}>
          <button onClick={handleStartOver} style={{ color: "#fff", background: "rgba(255,255,255,0.15)", borderRadius: 999, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleShare} style={{ color: "#fff", background: "rgba(255,255,255,0.15)", borderRadius: 999, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
              <Share2 size={16} />
            </button>
            <button onClick={() => setLocation("/ai-coach/progress")} style={{ color: "#fff", background: "rgba(255,255,255,0.15)", borderRadius: 999, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
              <BarChart3 size={16} />
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{
          position: "absolute", top: 64, left: 16, right: 16, zIndex: 20,
          display: "flex", gap: 4,
        }}>
          {plan.wins.map((_, i) => (
            <button
              key={i}
              onClick={() => goToCard(i)}
              style={{
                flex: 1, height: 3, borderRadius: 2, border: "none", cursor: "pointer", padding: 0,
                background: i <= activeIdx ? "#fff" : "rgba(255,255,255,0.3)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        {/* Scroller */}
        <div
          ref={scrollerRef}
          style={{
            display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
            width: "100%", height: "100%",
            scrollbarWidth: "none",
          }}
          className="ws-no-scrollbar"
        >
          {plan.wins.map((w, i) => (
            <WinCard
              key={i}
              win={w}
              total={plan.wins.length}
              imageError={imgErrors[i]}
              onImageError={() => setImgErrors((p) => ({ ...p, [i]: true }))}
              isFirst={i === 0}
              planTitle={i === 0 ? plan.title : undefined}
              planSummary={i === 0 ? plan.summary : undefined}
              showFeedback={!feedbackPrompted[w.win]}
              onFeedback={(f) => submitFeedback(w.win, f)}
            />
          ))}
        </div>

        {/* Bottom nav */}
        <div style={{
          position: "absolute", bottom: 16, left: 0, right: 0, zIndex: 20,
          display: "flex", justifyContent: "center", gap: 12,
        }}>
          <button
            onClick={() => goToCard(Math.max(0, activeIdx - 1))}
            disabled={activeIdx === 0}
            style={{ color: "#fff", background: "rgba(255,255,255,0.15)", borderRadius: 999, padding: "10px 16px", border: "none", cursor: activeIdx === 0 ? "default" : "pointer", opacity: activeIdx === 0 ? 0.4 : 1, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}
          >
            <ArrowLeft size={14} /> Prev
          </button>
          <button
            onClick={() => goToCard(Math.min(plan.wins.length - 1, activeIdx + 1))}
            disabled={activeIdx === plan.wins.length - 1}
            style={{ color: "#fff", background: "rgba(255,255,255,0.15)", borderRadius: 999, padding: "10px 16px", border: "none", cursor: activeIdx === plan.wins.length - 1 ? "default" : "pointer", opacity: activeIdx === plan.wins.length - 1 ? 0.4 : 1, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}
          >
            Next <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// WIN CARD
// ═══════════════════════════════════════════════════════════════════════════
function WinCard({
  win, total, imageError, onImageError, isFirst, planTitle, planSummary,
  showFeedback, onFeedback,
}: {
  win: Win;
  total: number;
  imageError?: boolean;
  onImageError?: () => void;
  isFirst: boolean;
  planTitle?: string;
  planSummary?: string;
  showFeedback: boolean;
  onFeedback: (f: "yes" | "somewhat" | "no") => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const showImage = win.image && !imageError;

  return (
    <div
      style={{
        flex: "0 0 100%", width: "100%", height: "100vh",
        scrollSnapAlign: "start", position: "relative",
        background: "#000", overflow: "hidden",
      }}
    >
      {/* Image area (50%) */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "50%",
        background: "linear-gradient(135deg, #fbcfe8 0%, #ddd6fe 50%, #c7d2fe 100%)",
        overflow: "hidden",
      }}>
        {showImage && (
          <img
            src={win.image}
            alt=""
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => onImageError?.()}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              opacity: imgLoaded ? 1 : 0, transition: "opacity 0.4s ease-in",
              display: "block",
            }}
          />
        )}
        {!imgLoaded && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.85)",
          }}>
            {imageError
              ? <Sparkles style={{ width: 32, height: 32, opacity: 0.7 }} />
              : <Loader2 style={{ width: 24, height: 24, animation: "spin 1.2s linear infinite", opacity: 0.7 }} />}
          </div>
        )}

        {/* Win counter */}
        <div style={{
          position: "absolute", top: 90, right: 16,
          background: "rgba(0,0,0,0.55)", color: "#fff",
          padding: "6px 12px", borderRadius: 999,
          fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
        }}>
          WIN {win.win} / {total}
        </div>
      </div>

      {/* Bottom dark overlay (50%) — scrollable content */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
        background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 30%, #000 100%)",
        color: "#fff",
        padding: "20px 20px 90px",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}>
        {isFirst && planTitle && (
          <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#c4b5fd", marginBottom: 4 }}>
              YOUR PLAN
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, marginBottom: 6, fontFamily: "Quicksand, sans-serif" }}>
              {planTitle}
            </h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.45 }}>
              {planSummary}
            </p>
          </div>
        )}

        <h3 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15, marginBottom: 6, fontFamily: "Quicksand, sans-serif" }}>
          {win.title}
        </h3>
        <p style={{ fontSize: 13, color: "#fbcfe8", marginBottom: 14, lineHeight: 1.4 }}>
          {win.objective}
        </p>

        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#a78bfa", marginBottom: 6 }}>DO THIS</p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {win.actions.map((a, i) => (
              <li key={i} style={{ fontSize: 13, lineHeight: 1.4, display: "flex", gap: 8, color: "rgba(255,255,255,0.95)" }}>
                <span style={{ color: "#a78bfa", fontWeight: 700 }}>›</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{
          background: "rgba(167,139,250,0.18)", border: "1px solid rgba(167,139,250,0.4)",
          borderRadius: 14, padding: 12, marginBottom: 12,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#c4b5fd", marginBottom: 4 }}>
            💡 TRY TODAY
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.4, color: "#fff" }}>{win.activity}</p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: "rgba(255,255,255,0.12)", color: "#fff", fontWeight: 600 }}>
            ⏱ {win.duration}
          </span>
        </div>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, fontStyle: "italic", marginBottom: 16 }}>
          📚 {win.science}
        </p>

        {/* Feedback prompt */}
        {showFeedback && (
          <div style={{
            background: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(139,92,246,0.2))",
            border: "1px solid rgba(236,72,153,0.4)",
            borderRadius: 14, padding: 14, marginBottom: 8,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
              Did this work for you?
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              {([
                { v: "yes" as const,      label: "Yes 🎉" },
                { v: "somewhat" as const, label: "Somewhat" },
                { v: "no" as const,       label: "Not yet" },
              ]).map((b) => (
                <button
                  key={b.v}
                  onClick={() => onFeedback(b.v)}
                  style={{
                    flex: 1, padding: "8px 6px", borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.3)",
                    background: "rgba(255,255,255,0.1)", color: "#fff",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
