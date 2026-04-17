import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, ArrowLeft, ArrowRight, Loader2, Search,
  Check, ChevronLeft, RotateCcw, BarChart3, Share2, Bookmark,
} from "lucide-react";

// ─── Goals (categorized) ───────────────────────────────────────────────────
interface GoalItem { id: string; title: string; emoji: string; gradient: string }
interface GoalCategory { id: string; title: string; emoji: string; items: GoalItem[] }

const GOAL_CATEGORIES: GoalCategory[] = [
  {
    id: "behavior", title: "Behavior", emoji: "🎯",
    items: [
      { id: "manage-tantrums",       title: "Manage Tantrums",           emoji: "😤", gradient: "from-rose-100 to-pink-200" },
      { id: "handle-aggression",     title: "Handle Aggression",         emoji: "✋", gradient: "from-red-100 to-rose-200" },
      { id: "reduce-defiance",       title: "Reduce Defiance",           emoji: "🛑", gradient: "from-amber-100 to-orange-200" },
      { id: "emotional-regulation",  title: "Emotional Regulation",      emoji: "💗", gradient: "from-pink-100 to-fuchsia-200" },
      { id: "separation-anxiety",    title: "Separation Anxiety",        emoji: "🫂", gradient: "from-violet-100 to-purple-200" },
    ],
  },
  {
    id: "screen-focus", title: "Screen & Focus", emoji: "📱",
    items: [
      { id: "balance-screen-time",         title: "Balance Screen Time",         emoji: "📱", gradient: "from-sky-100 to-blue-200" },
      { id: "reduce-mobile-addiction",     title: "Reduce Mobile Addiction",     emoji: "📵", gradient: "from-blue-100 to-indigo-200" },
      { id: "improve-focus-span",          title: "Improve Focus Span",          emoji: "🎯", gradient: "from-purple-100 to-fuchsia-200" },
      { id: "reduce-shorts-overuse",       title: "Reduce YouTube / Shorts Overuse", emoji: "🎬", gradient: "from-rose-100 to-red-200" },
      { id: "reduce-instant-gratification",title: "Reduce Instant Gratification", emoji: "⏳", gradient: "from-amber-100 to-yellow-200" },
    ],
  },
  {
    id: "eating", title: "Eating", emoji: "🍽️",
    items: [
      { id: "encourage-independent-eating", title: "Encourage Independent Eating", emoji: "🥄", gradient: "from-emerald-100 to-green-200" },
      { id: "navigate-fussy-eating",        title: "Navigate Fussy Eating",        emoji: "🥦", gradient: "from-teal-100 to-cyan-200" },
      { id: "stop-junk-food-craving",       title: "Stop Junk Food Craving",       emoji: "🍟", gradient: "from-orange-100 to-amber-200" },
      { id: "healthy-eating-routine",       title: "Build Healthy Eating Routine", emoji: "🍎", gradient: "from-green-100 to-emerald-200" },
      { id: "improve-mealtime-behavior",    title: "Improve Mealtime Behavior",    emoji: "🍽️", gradient: "from-lime-100 to-green-200" },
    ],
  },
  {
    id: "sleep", title: "Sleep", emoji: "😴",
    items: [
      { id: "improve-sleep-patterns",    title: "Improve Sleep Patterns",    emoji: "😴", gradient: "from-indigo-100 to-violet-200" },
      { id: "fix-bedtime-resistance",    title: "Fix Bedtime Resistance",    emoji: "🛏️", gradient: "from-purple-100 to-indigo-200" },
      { id: "stop-night-waking",         title: "Stop Night Waking",         emoji: "🌙", gradient: "from-blue-100 to-indigo-200" },
      { id: "consistent-sleep-routine",  title: "Build Consistent Routine",  emoji: "🕘", gradient: "from-violet-100 to-purple-200" },
      { id: "reduce-late-sleeping",      title: "Reduce Late Sleeping Habit",emoji: "⏰", gradient: "from-indigo-100 to-blue-200" },
    ],
  },
  {
    id: "learning", title: "Learning", emoji: "📚",
    items: [
      { id: "boost-concentration",        title: "Boost Concentration",       emoji: "🎯", gradient: "from-purple-100 to-fuchsia-200" },
      { id: "build-study-discipline",     title: "Build Study Discipline",    emoji: "📖", gradient: "from-blue-100 to-sky-200" },
      { id: "increase-learning-interest", title: "Increase Learning Interest",emoji: "💡", gradient: "from-yellow-100 to-amber-200" },
      { id: "reduce-homework-resistance", title: "Reduce Homework Resistance",emoji: "✏️", gradient: "from-teal-100 to-emerald-200" },
      { id: "develop-growth-mindset",     title: "Develop Growth Mindset",    emoji: "🌱", gradient: "from-green-100 to-lime-200" },
    ],
  },
  {
    id: "parenting-challenges", title: "Parenting Challenges", emoji: "💝",
    items: [
      { id: "manage-grandparents-interference", title: "Manage Grandparents' Interference", emoji: "👵", gradient: "from-rose-100 to-pink-200" },
      { id: "align-parenting-between-parents",  title: "Align Parenting Between Parents",   emoji: "🤝", gradient: "from-violet-100 to-purple-200" },
      { id: "handle-working-parent-guilt",      title: "Handle Working Parent Guilt",       emoji: "💼", gradient: "from-sky-100 to-blue-200" },
      { id: "set-consistent-family-rules",      title: "Set Consistent Family Rules",       emoji: "📋", gradient: "from-amber-100 to-orange-200" },
    ],
  },
];

const ALL_GOALS: GoalItem[] = GOAL_CATEGORIES.flatMap((c) => c.items);

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
  deep_explanation: string;
  actions: string[];
  example: string;
  mistake_to_avoid: string;
  micro_task: string;
  duration: string;
  science_reference: string;
}
interface Plan { title: string; root_cause: string; summary: string; wins: Win[]; }

type Phase = "goals" | "questions" | "loading" | "result";
type Feedback = "yes" | "somewhat" | "no";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
export default function AICoachPage() {
  const [, setLocation] = useLocation();
  const authFetch = useAuthFetch();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("goals");
  const [goalSearch, setGoalSearch] = useState("");
  const [goalId, setGoalId] = useState<string>("");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [plan, setPlan] = useState<Plan | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [feedbackByWin, setFeedbackByWin] = useState<Record<number, Feedback>>({});
  const [extending, setExtending] = useState(false);

  // Keep last submitted answers/payload around so we can call /extend later
  const lastPayloadRef = useRef<{
    goal: string; ageGroup: string; severity: string; triggers: string[]; routine: string;
  } | null>(null);

  // Freeze the denominator at the original plan size (12).
  // Extension cards are bonus — adding them must never drop the progress %.
  const originalWinCountRef = useRef<number>(0);

  // Progress %: Worked = 100%, Partially = 50%, Not worked = 0%
  // Denominator = original plan win count (never grows with extensions).
  const progressPct = useMemo(() => {
    const denom = originalWinCountRef.current;
    if (!plan || denom === 0) return 0;
    const sum = Object.values(feedbackByWin).reduce(
      (acc, f) => acc + (f === "yes" ? 1 : f === "somewhat" ? 0.5 : 0),
      0,
    );
    return Math.min(100, Math.round((sum / denom) * 100));
  }, [feedbackByWin, plan]);

  const scrollerRef = useRef<HTMLDivElement>(null);

  const searchQuery = goalSearch.toLowerCase().trim();

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return GOAL_CATEGORIES;
    return GOAL_CATEGORIES
      .map((c) => ({ ...c, items: c.items.filter((g) => g.title.toLowerCase().includes(searchQuery)) }))
      .filter((c) => c.items.length > 0);
  }, [searchQuery]);

  const totalMatches = useMemo(
    () => filteredCategories.reduce((n, c) => n + c.items.length, 0),
    [filteredCategories]
  );

  const selectedGoal = ALL_GOALS.find((g) => g.id === goalId);

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
    setFeedbackByWin({});
    const ageMap: Record<string, string> = { "2–4 years": "2-4", "5–7 years": "5-7", "8–10 years": "8-10" };
    const sevMap: Record<string, string> = { "Mild – occasional": "mild", "Moderate – frequent": "moderate", "Severe – daily struggle": "severe" };
    const payload = {
      goal: goalId,
      ageGroup: ageMap[answers.ageGroup as string] ?? (answers.ageGroup as string) ?? "5-7",
      severity: sevMap[answers.severity as string] ?? "moderate",
      triggers: (answers.triggers as string[]) ?? [],
      routine: (answers.routine as string) ?? "",
      goalRefinement: (answers.goalRefinement as string) ?? "",
    };
    lastPayloadRef.current = {
      goal: payload.goal,
      ageGroup: payload.ageGroup,
      severity: payload.severity,
      triggers: payload.triggers,
      routine: payload.routine,
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
      // Freeze denominator at the original win count so extensions never drop progress %
      originalWinCountRef.current = data.plan.wins.length;
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

  // ─── Feedback (yes / somewhat / no)
  const submitFeedback = async (winNumber: number, feedback: Feedback) => {
    if (!plan || !sessionId) return;

    // Build updated feedback map synchronously so we can compute progress now
    const newFeedbackByWin = { ...feedbackByWin, [winNumber]: feedback };
    setFeedbackByWin(newFeedbackByWin);

    // Save to DB (silent on failure — UI already updated)
    try {
      await authFetch("/api/ai-coach/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId, goalId,
          planTitle: plan.title,
          winNumber,
          totalWins: plan.wins.length,
          feedback,
        }),
      });
    } catch { /* silent */ }

    // Compute new progress inline using frozen denominator (never drops when extensions added)
    const newSum = Object.values(newFeedbackByWin).reduce(
      (acc, f) => acc + (f === "yes" ? 1 : f === "somewhat" ? 0.5 : 0),
      0,
    );
    const denom = originalWinCountRef.current || plan.wins.length;
    const newPct = Math.min(100, Math.round((newSum / denom) * 100));
    const isLastCard = activeIdx === plan.wins.length - 1;

    // Rule: extend ONLY when progress < 100%
    //   - "Not worked for me" on any card → extend (adaptive help)
    //   - Any button on the LAST card while still below 100% → extend (keep going)
    // At 100% — no more extensions, ever.
    if (newPct < 100 && (feedback === "no" || isLastCard)) {
      await requestExtension(winNumber);
    } else {
      toast({
        title: feedback === "yes" ? "Win locked in 🎉" : "Progress noted 💜",
        description: feedback === "yes"
          ? "Marked as complete. Moving to next step."
          : "Partial progress counted. Keep going.",
      });
      // Auto-advance to the next card
      setTimeout(() => goToCard(activeIdx + 1), 300);
    }
  };

  // ─── Adaptive: ask backend for 3 more wins when a step doesn't work
  const requestExtension = async (failedWinNumber: number) => {
    if (!plan || !lastPayloadRef.current || extending) return;
    const failedWin = plan.wins.find((w) => w.win === failedWinNumber);
    if (!failedWin) return;
    // Capture the card the user is currently on — we'll go one step forward from here
    const nextIdx = activeIdx + 1;
    setExtending(true);
    try {
      const startWinNumber = plan.wins.length + 1;
      const res = await authFetch("/api/ai-coach/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lastPayloadRef.current,
          failedWinTitle: failedWin.title,
          failedWinNumber,
          startWinNumber,
          existingWinTitles: plan.wins.map((w) => w.title),
        }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = (await res.json()) as { wins: Win[] };
      if (Array.isArray(data.wins) && data.wins.length > 0) {
        setPlan((p) => p ? { ...p, wins: [...p.wins, ...data.wins] } : p);
        toast({
          title: "3 new strategies added 💛",
          description: "Scroll to the end of your deck to see them.",
        });
        // Go to the very next card from where the user tapped — NOT the extension cards
        setTimeout(() => goToCard(nextIdx), 80);
      }
    } catch {
      toast({
        title: "Couldn't load extras",
        description: "Please tap 'Not worked for me' again in a moment.",
        variant: "destructive",
      });
    } finally {
      setExtending(false);
    }
  };

  // ─── Share / Save
  const handleShare = async () => {
    if (!plan) return;
    const text = `${plan.title}\n\n${plan.summary}\n\nMy ${plan.wins.length} wins from AmyNest Amy Coach:\n${plan.wins.map((w) => `${w.win}. ${w.title}`).join("\n")}`;
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
    originalWinCountRef.current = 0;
    setSessionId("");
    setActiveIdx(0);
    setFeedbackByWin({});
    lastPayloadRef.current = null;
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
          <Link href="/amy-coach/progress">
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
            Pick a goal — I'll build a deep, science-backed plan in 12 step-by-step wins.
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

        <div className="space-y-6">
          {filteredCategories.map((cat) => (
            <section key={cat.id}>
              <h2 className="font-quicksand font-bold text-sm uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2 px-1">
                <span className="text-base">{cat.emoji}</span>
                {cat.title}
                <span className="text-[10px] font-normal text-muted-foreground/70">({cat.items.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cat.items.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handlePickGoal(g.id)}
                    className={`group bg-gradient-to-br ${g.gradient} rounded-2xl p-4 border-2 border-transparent hover:border-violet-400 hover:shadow-lg active:scale-[0.98] transition-all text-left flex items-center gap-3`}
                  >
                    <span className="text-3xl shrink-0">{g.emoji}</span>
                    <div className="flex-1">
                      <p className="font-quicksand font-bold text-base text-foreground leading-tight">{g.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Tap to start →</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {totalMatches === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
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
            Analysing your answers and crafting 12 deep, research-backed wins for {selectedGoal?.title.toLowerCase()}. This takes ~10 seconds.
          </p>
        </div>
      </div>
    );
  }

  // ── PHASE: RESULT ────────────────────────────────────────────────────
  if (phase === "result" && plan) {
    return (
      <div style={{
        position: "fixed", inset: 0,
        background: "linear-gradient(135deg, #faf5ff 0%, #fdf4ff 50%, #f0f9ff 100%)",
        zIndex: 50, display: "flex", flexDirection: "column",
      }}>
        {/* Top bar — light theme */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
          padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 100%)",
          backdropFilter: "blur(8px)",
        }}>
          <button
            onClick={handleStartOver}
            style={{ color: "#6d28d9", background: "rgba(167,139,250,0.15)", borderRadius: 999, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Progress % pill (TOP-RIGHT) */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            color: "#fff", padding: "7px 14px", borderRadius: 999,
            fontSize: 12, fontWeight: 800, letterSpacing: 0.3,
            boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
          }}>
            Progress {progressPct}%
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={handleShare}
              style={{ color: "#6d28d9", background: "rgba(167,139,250,0.15)", borderRadius: 999, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}
              aria-label="Share"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={() => setLocation("/amy-coach/progress")}
              style={{ color: "#6d28d9", background: "rgba(167,139,250,0.15)", borderRadius: 999, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}
              aria-label="Progress"
            >
              <BarChart3 size={16} />
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{
          position: "absolute", top: 60, left: 16, right: 16, zIndex: 20,
          display: "flex", gap: 4,
        }}>
          {plan.wins.map((_, i) => (
            <button
              key={i}
              onClick={() => goToCard(i)}
              style={{
                flex: 1, height: 3, borderRadius: 2, border: "none", cursor: "pointer", padding: 0,
                background: i <= activeIdx ? "#8b5cf6" : "rgba(139,92,246,0.2)",
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
              key={`${w.win}-${i}`}
              win={w}
              total={plan.wins.length}
              isFirst={i === 0}
              planTitle={i === 0 ? plan.title : undefined}
              planSummary={i === 0 ? plan.summary : undefined}
              planRootCause={i === 0 ? plan.root_cause : undefined}
              currentFeedback={feedbackByWin[w.win]}
              extending={extending}
              onFeedback={(f) => submitFeedback(w.win, f)}
            />
          ))}
        </div>

        {/* Extending banner */}
        {extending && (
          <div style={{
            position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)",
            background: "rgba(99,102,241,0.95)", color: "#fff",
            padding: "10px 18px", borderRadius: 999, fontSize: 12.5, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
            zIndex: 25,
          }}>
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            Loading 3 new strategies for you…
          </div>
        )}

        {/* Bottom nav */}
        <div style={{
          position: "absolute", bottom: 16, left: 0, right: 0, zIndex: 20,
          display: "flex", justifyContent: "center", gap: 12,
        }}>
          <button
            onClick={() => goToCard(Math.max(0, activeIdx - 1))}
            disabled={activeIdx === 0}
            style={{
              color: "#6d28d9",
              background: "rgba(255,255,255,0.85)",
              boxShadow: "0 2px 8px rgba(139,92,246,0.15)",
              borderRadius: 999, padding: "10px 16px", border: "1px solid rgba(139,92,246,0.2)",
              cursor: activeIdx === 0 ? "default" : "pointer", opacity: activeIdx === 0 ? 0.4 : 1,
              display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600,
            }}
          >
            <ArrowLeft size={14} /> Prev
          </button>
          <button
            onClick={() => goToCard(Math.min(plan.wins.length - 1, activeIdx + 1))}
            disabled={activeIdx === plan.wins.length - 1}
            style={{
              color: "#fff",
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
              borderRadius: 999, padding: "10px 16px", border: "none",
              cursor: activeIdx === plan.wins.length - 1 ? "default" : "pointer",
              opacity: activeIdx === plan.wins.length - 1 ? 0.4 : 1,
              display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700,
            }}
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
// WIN CARD — light gradient, no images, science reference, adaptive buttons
// ═══════════════════════════════════════════════════════════════════════════
function WinCard({
  win, total, isFirst, planTitle, planSummary, planRootCause,
  currentFeedback, extending, onFeedback,
}: {
  win: Win;
  total: number;
  isFirst: boolean;
  planTitle?: string;
  planSummary?: string;
  planRootCause?: string;
  currentFeedback?: Feedback;
  extending: boolean;
  onFeedback: (f: Feedback) => void;
}) {
  const isExtension = win.win > 12;

  return (
    <div
      style={{
        flex: "0 0 100%", width: "100%", height: "100vh",
        scrollSnapAlign: "start", position: "relative",
        background: isExtension
          ? "linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #ede9fe 100%)"
          : "linear-gradient(135deg, #faf5ff 0%, #fdf4ff 50%, #f0f9ff 100%)",
        overflow: "hidden",
      }}
    >
      {/* Scrollable content — full card */}
      <div style={{
        position: "absolute", inset: 0,
        padding: "92px 22px 130px",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        color: "#1f2937",
      }}>
        {/* Win counter chip */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: isExtension
            ? "linear-gradient(135deg, #f59e0b, #ec4899)"
            : "linear-gradient(135deg, #8b5cf6, #ec4899)",
          color: "#fff",
          padding: "5px 12px", borderRadius: 999,
          fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
          marginBottom: 10,
          boxShadow: "0 2px 8px rgba(139,92,246,0.25)",
        }}>
          {isExtension ? "💛 EXTRA STRATEGY" : "WIN"} {win.win} / {total}
        </div>

        {/* Plan header — only on first card */}
        {isFirst && planTitle && (
          <div style={{
            marginBottom: 18, paddingBottom: 16,
            borderBottom: "1px solid rgba(139,92,246,0.18)",
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: "#7c3aed", marginBottom: 4 }}>
              YOUR PLAN
            </p>
            <h2 style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.2, marginBottom: 8, fontFamily: "Quicksand, sans-serif", color: "#1e1b4b" }}>
              {planTitle}
            </h2>
            {planRootCause && (
              <div style={{
                background: "rgba(244,114,182,0.1)", border: "1px solid rgba(244,114,182,0.3)",
                borderRadius: 12, padding: 12, marginTop: 8, marginBottom: 8,
              }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "#be185d", marginBottom: 4 }}>
                  🧠 ROOT CAUSE
                </p>
                <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "#4c1d3a" }}>{planRootCause}</p>
              </div>
            )}
            <p style={{ fontSize: 12.5, color: "#4b5563", lineHeight: 1.5 }}>
              {planSummary}
            </p>
          </div>
        )}

        {/* Title + objective */}
        <h3 style={{
          fontSize: 24, fontWeight: 800, lineHeight: 1.15,
          marginBottom: 6, fontFamily: "Quicksand, sans-serif",
          color: "#1e1b4b",
        }}>
          {win.title}
        </h3>
        <p style={{
          fontSize: 13.5, color: "#7c3aed",
          marginBottom: 16, lineHeight: 1.4, fontWeight: 600,
        }}>
          {win.objective}
        </p>

        {/* WHY THIS WORKS */}
        {win.deep_explanation && (
          <div style={{
            background: "rgba(255,255,255,0.7)", border: "1px solid rgba(99,102,241,0.18)",
            borderRadius: 14, padding: 14, marginBottom: 14,
            boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "#4338ca", marginBottom: 6 }}>
              🔬 WHY THIS WORKS
            </p>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#1f2937" }}>
              {win.deep_explanation}
            </p>
          </div>
        )}

        {/* DO THIS */}
        <div style={{
          background: "rgba(255,255,255,0.7)", border: "1px solid rgba(139,92,246,0.18)",
          borderRadius: 14, padding: 14, marginBottom: 14,
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "#7c3aed", marginBottom: 10 }}>
            ✅ DO THIS
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
            {win.actions.map((a, i) => (
              <li key={i} style={{ fontSize: 13.5, lineHeight: 1.5, display: "flex", gap: 10, color: "#1f2937" }}>
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: 999,
                  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, marginTop: 1,
                }}>{i + 1}</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* REAL EXAMPLE */}
        {win.example && (
          <div style={{
            background: "rgba(220,252,231,0.8)", border: "1px solid rgba(34,197,94,0.35)",
            borderRadius: 14, padding: 12, marginBottom: 12,
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "#15803d", marginBottom: 4 }}>
              💬 REAL EXAMPLE
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: "#14532d", fontStyle: "italic" }}>
              {win.example}
            </p>
          </div>
        )}

        {/* MISTAKE TO AVOID */}
        {win.mistake_to_avoid && (
          <div style={{
            background: "rgba(254,226,226,0.7)", border: "1px solid rgba(248,113,113,0.4)",
            borderRadius: 14, padding: 12, marginBottom: 12,
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "#b91c1c", marginBottom: 4 }}>
              ⚠️ MISTAKE TO AVOID
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: "#7f1d1d" }}>
              {win.mistake_to_avoid}
            </p>
          </div>
        )}

        {/* MICRO-TASK */}
        {win.micro_task && (
          <div style={{
            background: "linear-gradient(135deg, rgba(167,139,250,0.18), rgba(236,72,153,0.15))",
            border: "1px solid rgba(167,139,250,0.5)",
            borderRadius: 14, padding: 14, marginBottom: 12,
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "#6d28d9", marginBottom: 4 }}>
              🎯 DO THIS TODAY (under 5 min)
            </p>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "#1e1b4b", fontWeight: 600 }}>
              {win.micro_task}
            </p>
          </div>
        )}

        {/* DURATION + SCIENCE REFERENCE */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 11, padding: "4px 10px", borderRadius: 999,
            background: "rgba(139,92,246,0.12)", color: "#6d28d9", fontWeight: 700,
          }}>
            ⏱ {win.duration}
          </span>
        </div>

        {win.science_reference && (
          <p style={{
            fontSize: 11, color: "#6b7280", lineHeight: 1.5,
            marginBottom: 14, fontStyle: "italic",
            paddingLeft: 10, borderLeft: "2px solid rgba(139,92,246,0.3)",
          }}>
            📚 Based on: {win.science_reference}
          </p>
        )}

        {/* Mark-as-done feedback */}
        <div style={{
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(139,92,246,0.25)",
          borderRadius: 16, padding: 14, marginBottom: 8,
          boxShadow: "0 4px 12px rgba(139,92,246,0.08)",
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1e1b4b", marginBottom: 10 }}>
            How did this win go?
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            {([
              { v: "yes" as const,      label: "Worked",            color: "#15803d", bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.45)" },
              { v: "somewhat" as const, label: "Partially worked",  color: "#a16207", bg: "rgba(251,191,36,0.15)", border: "rgba(251,191,36,0.45)" },
              { v: "no" as const,       label: "Not worked for me", color: "#b91c1c", bg: "rgba(248,113,113,0.12)",border: "rgba(248,113,113,0.4)" },
            ]).map((b) => {
              const selected = currentFeedback === b.v;
              return (
                <button
                  key={b.v}
                  onClick={() => onFeedback(b.v)}
                  disabled={extending}
                  style={{
                    flex: 1, padding: "10px 4px", borderRadius: 10,
                    border: `1.5px solid ${selected ? b.color : b.border}`,
                    background: selected ? b.color : b.bg,
                    color: selected ? "#fff" : b.color,
                    fontSize: 11.5, fontWeight: 700,
                    cursor: extending ? "wait" : "pointer",
                    opacity: extending ? 0.7 : 1,
                    transition: "all 0.18s",
                    lineHeight: 1.2,
                  }}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* "Not worked for me" → 3 new strategies are appended automatically */}
        {currentFeedback === "no" && (
          <div style={{
            background: "rgba(254,243,199,0.7)", border: "1px solid rgba(245,158,11,0.4)",
            borderRadius: 14, padding: 14, marginTop: 10,
          }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: "#92400e", marginBottom: 6 }}>
              💛 EXTRA SUPPORT ADDED
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: "#78350f" }}>
              I've added 3 fresh strategies at the end of your plan — different angles to try:
              shrink the step, check a hidden blocker, or flip the approach. Tap <strong>Next</strong> to reach them.
            </p>
          </div>
        )}

        {(currentFeedback === "yes" || currentFeedback === "somewhat") && (
          <div style={{
            background: "rgba(220,252,231,0.6)", border: "1px solid rgba(34,197,94,0.4)",
            borderRadius: 12, padding: 10, marginTop: 8,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>{currentFeedback === "yes" ? "🎉" : "💜"}</span>
            <p style={{ fontSize: 12.5, color: "#14532d", fontWeight: 600, margin: 0 }}>
              {currentFeedback === "yes"
                ? "Logged as a full win. Swipe to the next step."
                : "Partial progress counted. Keep going — small wins compound."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
