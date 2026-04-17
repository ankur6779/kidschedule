import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowLeft, ArrowRight, Loader2, Share2, Bookmark, RotateCcw, Check } from "lucide-react";

interface Step {
  heading: string;
  subheading: string;
  explanation: string;
  tip: string;
  image_prompt: string;
}

interface Plan {
  title: string;
  reason: string;
  steps: Step[];
}

const TRIGGER_OPTIONS = [
  "Tiredness", "Hunger", "Overstimulation", "Transitions",
  "Screen time ending", "Sibling conflict", "Frustration",
  "Bedtime", "Mealtime", "Going out", "Coming home",
];

const COMMON_PROBLEMS = [
  "Tantrums & meltdowns",
  "Won't sleep / bedtime resistance",
  "Hitting / biting",
  "Won't eat",
  "Whining / nagging",
  "Defiance / saying no to everything",
  "Sibling fighting",
  "Screen time battles",
  "Separation anxiety",
  "Won't listen",
  "Lying",
  "Big emotions",
];

const SAVED_KEY = "ai_coach_saved_plans";

export default function AICoachPage() {
  const [, navigate] = useLocation();
  const authFetch = useAuthFetch();
  const { toast } = useToast();

  // Form state
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState("");
  const [problem, setProblem] = useState("");
  const [triggers, setTriggers] = useState<string[]>([]);
  const [goal, setGoal] = useState("");

  // Flow state
  const [step, setStep] = useState<"form" | "loading" | "result">("form");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [images, setImages] = useState<Record<number, string>>({});
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [saved, setSaved] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const toggleTrigger = (t: string) => {
    setTriggers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  // ─── Fetch images with concurrency cap of 2 + 1 retry ──────────────────
  const fetchImages = useCallback(async (p: Plan) => {
    fetchAbortRef.current?.abort();
    const ac = new AbortController();
    fetchAbortRef.current = ac;

    const CONCURRENCY = 2;
    const queue = p.steps.map((s, idx) => ({ s, idx, attempts: 0 }));

    const runOne = async (): Promise<void> => {
      const job = queue.shift();
      if (!job || ac.signal.aborted) return;
      try {
        const res = await authFetch("/api/ai-coach/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: job.s.image_prompt }),
          signal: ac.signal,
        } as RequestInit);
        if (res.ok) {
          const data = (await res.json()) as { dataUrl?: string };
          if (data.dataUrl) setImages((prev) => ({ ...prev, [job.idx]: data.dataUrl! }));
          else throw new Error("no image");
        } else {
          throw new Error(`status ${res.status}`);
        }
      } catch (err) {
        if (ac.signal.aborted) return;
        if (job.attempts < 1) {
          queue.push({ ...job, attempts: job.attempts + 1 });
        } else {
          setImgErrors((prev) => ({ ...prev, [job.idx]: true }));
        }
      }
      await runOne();
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, runOne));
  }, [authFetch]);

  // Cancel in-flight image fetches when leaving the page
  useEffect(() => () => fetchAbortRef.current?.abort(), []);

  const handleSubmit = async () => {
    if (!problem.trim()) {
      toast({ title: "Tell me what's happening", description: "Please describe the problem first.", variant: "destructive" });
      return;
    }
    setStep("loading");
    setImages({});
    setImgErrors({});
    setSaved(false);

    try {
      const res = await authFetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: childName.trim() || undefined,
          age: age.trim() || undefined,
          problem: problem.trim(),
          triggers,
          goal: goal.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = (await res.json()) as { plan: Plan };
      setPlan(data.plan);
      setActiveIdx(0);
      setStep("result");
      fetchImages(data.plan);
    } catch (err) {
      toast({ title: "Something went wrong", description: "Please try again in a moment.", variant: "destructive" });
      setStep("form");
    }
  };

  // ─── Track active card on scroll ───────────────────────────────────────
  useEffect(() => {
    if (step !== "result") return;
    const el = scrollerRef.current;
    if (!el) return;
    const handler = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActiveIdx(idx);
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [step, plan]);

  const scrollTo = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  };

  // ─── Save / Share ──────────────────────────────────────────────────────
  const handleSave = () => {
    if (!plan) return;
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({
        savedAt: Date.now(),
        childName, age, problem, triggers, goal,
        plan,
      });
      localStorage.setItem(SAVED_KEY, JSON.stringify(list.slice(0, 20)));
      setSaved(true);
      toast({ title: "Plan saved", description: "Your plan is saved on this device." });
    } catch {
      toast({ title: "Couldn't save", description: "Storage is full or unavailable.", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (!plan) return;
    const text = [
      plan.title,
      "",
      plan.reason,
      "",
      ...plan.steps.map((s, i) => `${i + 1}. ${s.heading} — ${s.tip}`),
      "",
      "— from AmyNest AI Parenting Coach",
    ].join("\n");
    if (navigator.share) {
      try {
        await navigator.share({ title: plan.title, text });
      } catch {/* user cancelled */}
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Plan copied to clipboard." });
      } catch {
        toast({ title: "Couldn't copy", description: "Please try again.", variant: "destructive" });
      }
    }
  };

  const handleStartOver = () => {
    fetchAbortRef.current?.abort();
    setStep("form");
    setPlan(null);
    setImages({});
    setImgErrors({});
    setActiveIdx(0);
    setSaved(false);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  if (step === "loading") {
    return (
      <div style={{
        minHeight: "100vh", background: "linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24, color: "#fff",
      }}>
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{
            width: 84, height: 84, margin: "0 auto 24px",
            borderRadius: "50%", background: "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <Loader2 style={{ width: 40, height: 40, animation: "spin 1.4s linear infinite" }} />
            <Sparkles style={{
              position: "absolute", top: -8, right: -8,
              width: 28, height: 28, color: "#fbbf24",
              animation: "pulse 1.6s ease-in-out infinite",
            }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>
            Creating a personalized plan{childName ? ` for ${childName}` : ""}…
          </h2>
          <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.5, margin: 0 }}>
            Combining child psychology and your specific situation. This usually takes 5-10 seconds.
          </p>
          <style>{`
            @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
            @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.2);opacity:0.7} }
          `}</style>
        </div>
      </div>
    );
  }

  if (step === "result" && plan) {
    return (
      <div style={{
        minHeight: "100vh", background: "#000",
        display: "flex", flexDirection: "column", color: "#fff",
        position: "relative", overflow: "hidden",
      }}>
        {/* Top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
          padding: "16px 16px 24px",
          background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleStartOver}
              style={{
                background: "rgba(255,255,255,0.12)", border: "none", color: "#fff",
                width: 36, height: 36, borderRadius: "50%", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              aria-label="Start over"
            >
              <ArrowLeft style={{ width: 18, height: 18 }} />
            </button>
            <div style={{ flex: 1, fontSize: 12, opacity: 0.7, fontWeight: 600 }}>
              AI PARENTING COACH
            </div>
            <button
              onClick={handleShare}
              style={{
                background: "rgba(255,255,255,0.12)", border: "none", color: "#fff",
                width: 36, height: 36, borderRadius: "50%", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              aria-label="Share plan"
            >
              <Share2 style={{ width: 16, height: 16 }} />
            </button>
            <button
              onClick={handleSave}
              disabled={saved}
              style={{
                background: saved ? "#10b981" : "rgba(255,255,255,0.12)",
                border: "none", color: "#fff",
                width: 36, height: 36, borderRadius: "50%", cursor: saved ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              aria-label="Save plan"
            >
              {saved ? <Check style={{ width: 16, height: 16 }} /> : <Bookmark style={{ width: 16, height: 16 }} />}
            </button>
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 4, padding: "0 4px" }}>
            {plan.steps.map((_, i) => (
              <div
                key={i}
                onClick={() => scrollTo(i)}
                style={{
                  flex: 1, height: 3, borderRadius: 2, cursor: "pointer",
                  background: i <= activeIdx ? "#fff" : "rgba(255,255,255,0.25)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Swipeable cards */}
        <div
          ref={scrollerRef}
          style={{
            flex: 1, display: "flex", overflowX: "auto", overflowY: "hidden",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
          }}
          className="ws-no-scrollbar"
        >
          {plan.steps.map((s, i) => (
            <CardView
              key={i}
              step={s}
              index={i}
              total={plan.steps.length}
              imageUrl={images[i]}
              imageError={imgErrors[i]}
              isFirst={i === 0}
              planTitle={i === 0 ? plan.title : undefined}
              planReason={i === 0 ? plan.reason : undefined}
            />
          ))}
        </div>

        {/* Bottom nav arrows */}
        <div style={{
          position: "absolute", bottom: 20, left: 0, right: 0, zIndex: 20,
          display: "flex", justifyContent: "center", gap: 12, padding: "0 16px",
        }}>
          <button
            onClick={() => scrollTo(Math.max(0, activeIdx - 1))}
            disabled={activeIdx === 0}
            style={{
              background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
              padding: "10px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6,
              opacity: activeIdx === 0 ? 0.4 : 1,
              cursor: activeIdx === 0 ? "default" : "pointer",
              backdropFilter: "blur(10px)",
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} /> Prev
          </button>
          {activeIdx === plan.steps.length - 1 ? (
            <button
              onClick={handleStartOver}
              style={{
                background: "#fff", border: "none", color: "#000",
                padding: "10px 18px", borderRadius: 999, fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              }}
            >
              <RotateCcw style={{ width: 14, height: 14 }} /> New plan
            </button>
          ) : (
            <button
              onClick={() => scrollTo(Math.min(plan.steps.length - 1, activeIdx + 1))}
              style={{
                background: "#fff", border: "none", color: "#000",
                padding: "10px 18px", borderRadius: 999, fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              }}
            >
              Next <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        <style>{`.ws-no-scrollbar::-webkit-scrollbar{display:none}`}</style>
      </div>
    );
  }

  // ─── FORM ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #fef3f2 0%, #fef0f9 50%, #f0f4ff 100%)",
      padding: "20px 16px 60px",
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* Header */}
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            background: "none", border: "none", color: "#475569",
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 14, padding: 0, marginBottom: 20, cursor: "pointer",
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back
        </button>

        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "linear-gradient(135deg,#a855f7,#ec4899)",
            color: "#fff", padding: "5px 12px", borderRadius: 999,
            fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 12,
          }}>
            <Sparkles style={{ width: 12, height: 12 }} /> AI PARENTING COACH
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", lineHeight: 1.2 }}>
            What's challenging you today?
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
            Get a personalized, science-based plan in seconds — calm, practical, no judgment.
          </p>
        </div>

        {/* Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <FormGroup label="Child's name" optional>
            <input
              value={childName}
              onChange={e => setChildName(e.target.value)}
              placeholder="e.g., Aanya"
              maxLength={40}
              style={inputStyle}
            />
          </FormGroup>

          <FormGroup label="Age" optional>
            <input
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="e.g., 4 years, 18 months"
              maxLength={30}
              style={inputStyle}
            />
          </FormGroup>

          <FormGroup label="What's the problem?" required>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {COMMON_PROBLEMS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProblem(p)}
                  style={chipStyle(problem === p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <textarea
              value={problem}
              onChange={e => setProblem(e.target.value)}
              placeholder="Or describe in your own words…"
              rows={3}
              maxLength={400}
              style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
            />
          </FormGroup>

          <FormGroup label="What seems to trigger it?" optional>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TRIGGER_OPTIONS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTrigger(t)}
                  style={chipStyle(triggers.includes(t))}
                >
                  {t}
                </button>
              ))}
            </div>
          </FormGroup>

          <FormGroup label="Your goal" optional>
            <input
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="e.g., calmer mornings, less yelling"
              maxLength={120}
              style={inputStyle}
            />
          </FormGroup>

          <button
            onClick={handleSubmit}
            disabled={!problem.trim()}
            style={{
              marginTop: 8,
              background: !problem.trim()
                ? "#cbd5e1"
                : "linear-gradient(135deg,#a855f7 0%,#ec4899 100%)",
              color: "#fff", border: "none", borderRadius: 14,
              padding: "16px 20px", fontSize: 16, fontWeight: 700,
              cursor: !problem.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: !problem.trim() ? "none" : "0 8px 20px rgba(168,85,247,0.35)",
              transition: "transform 0.1s",
            }}
            onMouseDown={e => !(!problem.trim()) && (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Sparkles style={{ width: 18, height: 18 }} /> Solve with AI
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card view (for swipe deck) ────────────────────────────────────────────
function CardView({
  step, index, total, imageUrl, imageError, isFirst, planTitle, planReason,
}: {
  step: Step; index: number; total: number; imageUrl?: string; imageError?: boolean;
  isFirst: boolean; planTitle?: string; planReason?: string;
}) {
  const [showDetails, setShowDetails] = useState(true);
  return (
    <div
      onClick={() => setShowDetails(v => !v)}
      style={{
        flex: "0 0 100%", width: "100%", height: "100vh",
        scrollSnapAlign: "start", position: "relative",
        background: "#000", overflow: "hidden", cursor: "pointer",
      }}
    >
      {/* Image area (60%) */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "62%",
        background: imageUrl
          ? `url(${imageUrl}) center/cover no-repeat`
          : "linear-gradient(135deg, #fbcfe8 0%, #ddd6fe 50%, #c7d2fe 100%)",
        transition: "background-image 0.4s",
      }}>
        {!imageUrl && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600,
            flexDirection: "column", gap: 10,
          }}>
            {imageError ? (
              <>
                <Sparkles style={{ width: 32, height: 32, opacity: 0.6 }} />
                <span style={{ opacity: 0.85 }}>Step {index + 1}</span>
              </>
            ) : (
              <>
                <Loader2 style={{ width: 28, height: 28, animation: "spin 1.2s linear infinite" }} />
                Painting your card…
              </>
            )}
          </div>
        )}
        {/* Step counter */}
        <div style={{
          position: "absolute", top: 80, right: 16,
          background: "rgba(0,0,0,0.5)", color: "#fff",
          padding: "4px 10px", borderRadius: 999,
          fontSize: 11, fontWeight: 700, backdropFilter: "blur(8px)",
        }}>
          {index + 1} / {total}
        </div>
      </div>

      {/* Bottom overlay (40%) */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        minHeight: "44%", maxHeight: "62%",
        background: "linear-gradient(180deg, rgba(15,23,42,0.0) 0%, rgba(15,23,42,0.95) 18%, rgba(15,23,42,1) 100%)",
        padding: "60px 22px 90px", color: "#fff",
        display: "flex", flexDirection: "column", gap: 10,
        overflow: "auto",
      }}
        onClick={e => e.stopPropagation()}
      >
        {isFirst && planTitle && (
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1,
            color: "#fbbf24", textTransform: "uppercase", marginBottom: -2,
          }}>
            {planTitle}
          </div>
        )}
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, color: "#a78bfa", textTransform: "uppercase" }}>
          {step.subheading}
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
          {step.heading}
        </h2>
        {showDetails && (
          <>
            {isFirst && planReason && (
              <p style={{
                fontSize: 13, opacity: 0.75, lineHeight: 1.55, margin: "4px 0 6px",
                fontStyle: "italic", borderLeft: "2px solid rgba(251,191,36,0.5)", paddingLeft: 10,
              }}>
                {planReason}
              </p>
            )}
            <p style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.92, margin: 0 }}>
              {step.explanation}
            </p>
            <div style={{
              marginTop: 4, padding: "12px 14px",
              background: "rgba(251,191,36,0.12)", borderRadius: 12,
              borderLeft: "3px solid #fbbf24",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", letterSpacing: 0.8, marginBottom: 4 }}>
                💡 TRY THIS
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0, color: "#fff" }}>
                {step.tip}
              </p>
            </div>
          </>
        )}
        <div style={{ fontSize: 11, opacity: 0.4, marginTop: 6, textAlign: "center" }}>
          {showDetails ? "Tap card to hide details" : "Tap card to show details"}
        </div>
      </div>
    </div>
  );
}

// ─── Form helpers ──────────────────────────────────────────────────────────
function FormGroup({ label, required, optional, children }: {
  label: string; required?: boolean; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{
        fontSize: 13, fontWeight: 700, color: "#0f172a",
        marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
      }}>
        {label}
        {required && <span style={{ color: "#dc2626", fontSize: 12 }}>*</span>}
        {optional && <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 500 }}>(optional)</span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", fontSize: 14,
  border: "1.5px solid #e2e8f0", borderRadius: 12,
  background: "#fff", color: "#0f172a", outline: "none",
  fontFamily: "inherit",
};

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: "7px 12px", fontSize: 12, fontWeight: 600,
  borderRadius: 999, border: "1.5px solid",
  borderColor: active ? "#a855f7" : "#e2e8f0",
  background: active ? "linear-gradient(135deg,#a855f7,#ec4899)" : "#fff",
  color: active ? "#fff" : "#475569",
  cursor: "pointer", transition: "all 0.15s",
});
