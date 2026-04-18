import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

interface Child {
  name: string;
  ageGroup: string;
  problems: string[];
}

interface ParentData {
  caregiver: string;
  concern: string;
  routineLevel: string;
}

const AGE_GROUPS = ["1–3 yrs", "4–6 yrs", "7–10 yrs", "10+ yrs"];
const PROBLEMS = ["Screen time", "Tantrums", "Sleep issues", "Eating habits", "Focus", "Behaviour"];
const CAREGIVERS = ["Mother", "Father", "Both", "Grandparents"];
const ROUTINE_LEVELS = ["Low", "Medium", "High"];
const PROBLEM_GOAL_MAP: Record<string, string> = {
  "Screen time": "Reduce Screen Time",
  "Tantrums": "Manage Emotional Outbursts",
  "Sleep issues": "Build Healthy Sleep Habits",
  "Eating habits": "Improve Nutrition & Eating",
  "Focus": "Boost Focus & Learning",
  "Behaviour": "Shape Positive Behaviour",
};

const BG = "linear-gradient(160deg,#EEF2FF 0%,#F5F3FF 55%,#FDF2F8 100%)";
const GRAD = "linear-gradient(135deg,#6366F1,#A855F7)";

function GlassCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-3xl p-6 shadow-xl ${className}`}
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(99,102,241,0.15)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function TopBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="px-5 pt-5 pb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-indigo-400">Step {step} of {total}</span>
        <span className="text-xs text-indigo-300">{pct}% complete</span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: GRAD }}
        />
      </div>
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-4 rounded-2xl text-white font-bold text-base active:scale-95 transition-all disabled:opacity-40"
      style={{ background: disabled ? "#c4b5fd" : GRAD, boxShadow: disabled ? "none" : "0 6px 24px rgba(99,102,241,0.35)" }}
    >
      {children}
    </button>
  );
}

function OptionBtn({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="py-3 px-4 rounded-2xl text-sm font-semibold border transition-all active:scale-95"
      style={
        selected
          ? { background: GRAD, color: "#fff", border: "transparent", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }
          : { background: "rgba(255,255,255,0.9)", color: "#1e1b4b", border: "1px solid #c7d2fe" }
      }
    >
      {label}
    </button>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full text-sm font-medium border transition-all active:scale-95"
      style={
        selected
          ? { background: GRAD, color: "#fff", border: "transparent" }
          : { background: "rgba(255,255,255,0.9)", color: "#1e1b4b", border: "1px solid #c7d2fe" }
      }
    >
      {label}
    </button>
  );
}

type Step = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const authFetch = useAuthFetch();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(1);

  const [children, setChildren] = useState<Child[]>([]);
  const [currentChild, setCurrentChild] = useState<Child>({ name: "", ageGroup: "", problems: [] });

  const [parent, setParent] = useState<ParentData>({ caregiver: "", concern: "", routineLevel: "" });
  const [showAddMore, setShowAddMore] = useState(false);

  function saveChildAndContinue() {
    const updated = [...children, currentChild];
    setChildren(updated);
    setCurrentChild({ name: "", ageGroup: "", problems: [] });
    setShowAddMore(false);
    setStep(2);
  }

  function addAnotherChild() {
    const updated = [...children, currentChild];
    setChildren(updated);
    setCurrentChild({ name: "", ageGroup: "", problems: [] });
    setShowAddMore(false);
  }

  async function finishOnboarding() {
    setStep(3);
    const allChildren = [...children];
    if (currentChild.name || allChildren.length === 0) allChildren.push({ ...currentChild });
    const topProblem = allChildren[0]?.problems[0] || "Screen time";
    const priorityGoal = PROBLEM_GOAL_MAP[topProblem] || "Build Better Routines";

    try {
      await authFetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ children: allChildren, parent, priorityGoal, onboardingComplete: true }),
      });
    } catch {
    }

    localStorage.setItem("onboardingComplete", "true");
    queryClient.setQueryData(["onboarding-status"], { onboardingComplete: true });

    setTimeout(() => setStep(4), 2800);
    setTimeout(() => setLocation("/dashboard"), 5200);
  }

  const wrapperStyle: React.CSSProperties = {
    minHeight: "100dvh",
    background: BG,
    display: "flex",
    flexDirection: "column",
  };

  if (step === 3) {
    return (
      <div style={{ ...wrapperStyle, alignItems: "center", justifyContent: "center", gap: 32 }}>
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
          style={{ background: GRAD, animation: "pulse-glow 1.5s ease-in-out infinite" }}
        >
          <span className="text-5xl">🧠</span>
        </div>
        <div className="text-center px-8">
          <p className="text-xl font-bold text-indigo-900">Amy is creating</p>
          <p className="text-indigo-600 font-bold text-2xl mt-1">your personalized plan...</p>
          <div className="flex gap-2 justify-center mt-5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-3 h-3 rounded-full inline-block"
                style={{ background: "#6366F1", animation: `typing-dot 1.2s ease-in-out ${i * 0.25}s infinite` }}
              />
            ))}
          </div>
          <p className="text-xs text-indigo-300 mt-5 leading-relaxed">
            Analysing child profile · Matching science-backed strategies · Building routine
          </p>
        </div>
      </div>
    );
  }

  if (step === 4) {
    const firstChild = children[0] || currentChild;
    const topProblem = firstChild?.problems[0] || "Screen time";
    const goal = PROBLEM_GOAL_MAP[topProblem] || "Build Better Routines";
    return (
      <div style={{ ...wrapperStyle, alignItems: "center", justifyContent: "center", gap: 24, padding: "0 20px" }}>
        <div style={{ animation: "splash-in 0.6s cubic-bezier(0.34,1.56,0.64,1) both" }} className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-indigo-900">Your plan is ready!</h2>
          <p className="text-indigo-400 mt-2">Personalised for {firstChild?.name || "your child"}</p>
        </div>
        <GlassCard className="w-full max-w-sm" style={{ animation: "splash-in 0.6s 0.15s cubic-bezier(0.34,1.56,0.64,1) both" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: GRAD }}>
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <p className="text-xs text-indigo-400 font-medium">First Goal</p>
              <p className="font-bold text-indigo-900">{goal}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {firstChild?.problems.map((p) => (
              <span key={p} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}>{p}</span>
            ))}
          </div>
        </GlassCard>
        <p className="text-sm text-indigo-400 animate-pulse">Taking you to dashboard...</p>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <TopBar step={step} total={2} />

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 max-w-lg mx-auto w-full pb-8">

        {step === 1 && (
          <>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: GRAD }}>
                  <span className="text-xl">👶</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-indigo-900">Child Profile</h2>
                  <p className="text-xs text-indigo-400">Tell us about your child</p>
                </div>
              </div>
            </div>

            {children.length > 0 && (
              <GlassCard className="py-4 px-5">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Added Children</p>
                <div className="flex flex-col gap-2">
                  {children.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-lg">👦</span>
                      <span className="text-sm font-semibold text-indigo-900">{c.name}</span>
                      <span className="text-xs text-indigo-400">· {c.ageGroup} · {c.problems.join(", ")}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            <GlassCard>
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2">Child's Name</label>
              <input
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none border border-indigo-100 focus:border-indigo-400 transition-colors"
                style={{ background: "rgba(255,255,255,0.9)", color: "#1e1b4b" }}
                placeholder="e.g. Arjun"
                value={currentChild.name}
                onChange={(e) => setCurrentChild((c) => ({ ...c, name: e.target.value }))}
              />
            </GlassCard>

            <GlassCard>
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">Age Group</label>
              <div className="grid grid-cols-2 gap-2">
                {AGE_GROUPS.map((ag) => (
                  <OptionBtn key={ag} label={ag} selected={currentChild.ageGroup === ag} onClick={() => setCurrentChild((c) => ({ ...c, ageGroup: ag }))} />
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">Challenges (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {PROBLEMS.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    selected={currentChild.problems.includes(p)}
                    onClick={() => setCurrentChild((c) => ({
                      ...c,
                      problems: c.problems.includes(p) ? c.problems.filter((x) => x !== p) : [...c.problems, p],
                    }))}
                  />
                ))}
              </div>
            </GlassCard>

            <button
              onClick={addAnotherChild}
              disabled={!currentChild.name || !currentChild.ageGroup}
              className="w-full py-3 rounded-2xl text-sm font-semibold border transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.9)", color: "#6366F1", border: "1px solid #c7d2fe" }}
            >
              + Add Another Child
            </button>

            <PrimaryBtn
              onClick={saveChildAndContinue}
              disabled={!currentChild.name || !currentChild.ageGroup || currentChild.problems.length === 0}
            >
              Next → Parent Profile
            </PrimaryBtn>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: GRAD }}>
                <span className="text-xl">👩‍👦</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-indigo-900">Parent Profile</h2>
                <p className="text-xs text-indigo-400">Help Amy understand your situation</p>
              </div>
            </div>

            <GlassCard>
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">Who mainly manages the child?</label>
              <div className="grid grid-cols-2 gap-2">
                {CAREGIVERS.map((c) => (
                  <OptionBtn key={c} label={c} selected={parent.caregiver === c} onClick={() => setParent((p) => ({ ...p, caregiver: c }))} />
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2">Your biggest concern right now</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {["Screen time", "Sleep routine", "Behaviour", "Academics", "Food habits"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setParent((p) => ({ ...p, concern: s }))}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95"
                    style={parent.concern === s
                      ? { background: GRAD, color: "#fff", border: "transparent" }
                      : { background: "rgba(255,255,255,0.9)", color: "#1e1b4b", border: "1px solid #c7d2fe" }
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none border border-indigo-100 focus:border-indigo-400 transition-colors"
                style={{ background: "rgba(255,255,255,0.9)", color: "#1e1b4b" }}
                placeholder="Or type your own concern..."
                value={parent.concern}
                onChange={(e) => setParent((p) => ({ ...p, concern: e.target.value }))}
              />
            </GlassCard>

            <GlassCard>
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">Daily routine consistency</label>
              <div className="flex gap-2">
                {ROUTINE_LEVELS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setParent((p) => ({ ...p, routineLevel: r }))}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all active:scale-95"
                    style={parent.routineLevel === r
                      ? { background: GRAD, color: "#fff", border: "transparent", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }
                      : { background: "rgba(255,255,255,0.9)", color: "#1e1b4b", border: "1px solid #c7d2fe" }
                    }
                  >
                    {r}
                  </button>
                ))}
              </div>
            </GlassCard>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-none px-5 py-4 rounded-2xl text-sm font-semibold border active:scale-95 transition-all"
                style={{ background: "rgba(255,255,255,0.9)", color: "#6366F1", border: "1px solid #c7d2fe" }}
              >
                ← Back
              </button>
              <PrimaryBtn
                onClick={finishOnboarding}
                disabled={!parent.caregiver || !parent.concern || !parent.routineLevel}
              >
                Create My Plan 🚀
              </PrimaryBtn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
