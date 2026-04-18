import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

interface Child {
  name: string;
  ageGroup: string;
  problems: string[];
}

interface ParentProfile {
  caregiver: string;
  concern: string;
  routineLevel: string;
}

interface OnboardingData {
  children: Child[];
  parent: ParentProfile;
  priorityGoal: string;
  onboardingComplete: boolean;
}

const AGE_GROUPS = ["1–3", "4–6", "7–10", "10+"];
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

type Step = "splash" | "intro" | "child-name" | "child-age" | "child-problems" | "add-more" | "caregiver" | "concern" | "routine" | "generating" | "result";

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-indigo-400"
          style={{ animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  );
}

function AiAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "lg" ? "w-16 h-16 text-2xl" : size === "sm" ? "w-8 h-8 text-base" : "w-10 h-10 text-lg";
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center shrink-0 shadow-lg`}
      style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)" }}
    >
      <span>🤖</span>
    </div>
  );
}

function AiMessage({ text, show = true }: { text: string; show?: boolean }) {
  if (!show) return null;
  return (
    <div className="flex gap-3 items-end">
      <AiAvatar size="sm" />
      <div
        className="max-w-xs px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed shadow-sm"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          color: "#1e1b4b",
          border: "1px solid rgba(99,102,241,0.15)",
          animation: "chat-pop 0.3s ease-out",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-xs px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed text-white shadow-sm"
        style={{
          background: "linear-gradient(135deg,#6366F1,#A855F7)",
          animation: "chat-pop 0.3s ease-out",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function ProgressBar({ step }: { step: Step }) {
  const steps: Step[] = ["child-name", "child-age", "child-problems", "caregiver", "concern", "routine", "generating", "result"];
  const idx = steps.indexOf(step);
  const pct = idx < 0 ? 0 : Math.round(((idx + 1) / steps.length) * 100);
  return (
    <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: "linear-gradient(90deg,#6366F1,#A855F7)" }}
      />
    </div>
  );
}

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const authFetch = useAuthFetch();

  const [step, setStep] = useState<Step>("splash");
  const [typing, setTyping] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [currentChild, setCurrentChild] = useState<Child>({ name: "", ageGroup: "", problems: [] });
  const [parentProfile, setParentProfile] = useState<ParentProfile>({ caregiver: "", concern: "", routineLevel: "" });
  const [textInput, setTextInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [step, typing]);

  function showThenStep(next: Step, delay = 900) {
    setTyping(true);
    setTimeout(() => { setTyping(false); setStep(next); }, delay);
  }

  useEffect(() => {
    if (step === "splash") {
      setTimeout(() => setStep("intro"), 2800);
    }
    if (step === "generating") {
      setTimeout(() => setStep("result"), 3200);
    }
  }, [step]);

  async function saveAndFinish(finalParent: ParentProfile) {
    const allChildren = children;
    const topProblem = allChildren[0]?.problems[0] || "Screen time";
    const goal = PROBLEM_GOAL_MAP[topProblem] || "Build Better Routines";
    const body: OnboardingData = {
      children: allChildren,
      parent: finalParent,
      priorityGoal: goal,
      onboardingComplete: true,
    };
    try {
      await authFetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch {
    }
    showThenStep("result", 100);
  }

  if (step === "splash") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: "linear-gradient(160deg,#EEF2FF 0%,#F5F3FF 50%,#FDF2F8 100%)" }}
      >
        <div className="flex flex-col items-center gap-6" style={{ animation: "splash-in 0.8s ease-out" }}>
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{
              background: "linear-gradient(135deg,#6366F1,#A855F7)",
              animation: "pulse-glow 2s ease-in-out infinite",
            }}
          >
            <span className="text-5xl">🐣</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold" style={{ color: "#1e1b4b" }}>Welcome to AmyNest AI</h1>
            <p className="mt-2 text-indigo-400 text-lg">Let's build a better routine for your child</p>
          </div>
          <div className="flex gap-2 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: "#6366F1", animation: `typing-dot 1.2s ease-in-out ${i * 0.25}s infinite` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const grad = "linear-gradient(160deg,#EEF2FF 0%,#F5F3FF 60%,#FDF2F8 100%)";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: grad }}>
      {step !== "intro" && (
        <div className="sticky top-0 z-10 px-4 pt-4 pb-2" style={{ background: "rgba(238,242,255,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-3 mb-2">
            <AiAvatar size="sm" />
            <div>
              <p className="text-xs font-semibold text-indigo-700">Amy Coach</p>
              <p className="text-xs text-indigo-400">AI Parenting Assistant</p>
            </div>
          </div>
          <ProgressBar step={step} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4 max-w-lg mx-auto w-full">

        {step === "intro" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8" style={{ animation: "splash-in 0.5s ease-out" }}>
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl"
                style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)" }}
              >
                <span className="text-4xl">🤖</span>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-indigo-900">Meet Amy, Your Coach</h2>
                <p className="text-sm text-indigo-400 mt-1">Powered by AI · Always here for you</p>
              </div>
            </div>
            <div
              className="w-full max-w-sm rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-lg text-indigo-900"
              style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              Hi {user?.firstName ? user.firstName : "there"}! I'm <strong>Amy</strong> — your personal parenting coach. 💜<br /><br />
              I'll ask a few quick questions about your child and create a <strong>personalized plan</strong> just for your family.
            </div>
            <button
              onClick={() => showThenStep("child-name")}
              className="px-10 py-3.5 rounded-2xl text-white font-semibold text-base shadow-xl active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)" }}
            >
              Let's start 🚀
            </button>
          </div>
        )}

        {(["child-name", "child-age", "child-problems", "add-more", "caregiver", "concern", "routine"] as Step[]).includes(step) && (
          <>
            {step === "child-name" && (
              <>
                <AiMessage text={children.length === 0 ? "First, what's your child's name? 👶" : "What's your next child's name?"} />
                {typing && <div className="flex gap-3 items-end"><AiAvatar size="sm" /><TypingDots /></div>}
                {!typing && (
                  <div className="mt-2 flex gap-2">
                    <input
                      className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none shadow-sm border border-indigo-100"
                      style={{ background: "rgba(255,255,255,0.9)" }}
                      placeholder="Enter name..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && textInput.trim()) {
                          setCurrentChild({ ...currentChild, name: textInput.trim() });
                          setTextInput("");
                          showThenStep("child-age");
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (!textInput.trim()) return;
                        setCurrentChild({ ...currentChild, name: textInput.trim() });
                        setTextInput("");
                        showThenStep("child-age");
                      }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow"
                      style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)" }}
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}

            {step === "child-age" && (
              <>
                <AiMessage text={`How old is ${currentChild.name || "your child"}? 🎂`} />
                {typing && <div className="flex gap-3 items-end"><AiAvatar size="sm" /><TypingDots /></div>}
                {!typing && (
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {AGE_GROUPS.map((ag) => (
                      <button
                        key={ag}
                        onClick={() => {
                          setCurrentChild({ ...currentChild, ageGroup: ag });
                          showThenStep("child-problems");
                        }}
                        className="rounded-2xl py-3.5 text-sm font-semibold shadow-sm active:scale-95 transition-all border border-indigo-100"
                        style={{ background: "rgba(255,255,255,0.9)", color: "#1e1b4b" }}
                      >
                        {ag} yrs
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {step === "child-problems" && (
              <>
                <AiMessage text={`What challenges are you facing with ${currentChild.name || "your child"}? Pick all that apply 🤔`} />
                {typing && <div className="flex gap-3 items-end"><AiAvatar size="sm" /><TypingDots /></div>}
                {!typing && (
                  <>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {PROBLEMS.map((p) => {
                        const sel = currentChild.problems.includes(p);
                        return (
                          <button
                            key={p}
                            onClick={() => {
                              setCurrentChild((c) => ({
                                ...c,
                                problems: sel ? c.problems.filter((x) => x !== p) : [...c.problems, p],
                              }));
                            }}
                            className="px-4 py-2 rounded-full text-sm font-medium border transition-all active:scale-95"
                            style={sel
                              ? { background: "linear-gradient(135deg,#6366F1,#A855F7)", color: "#fff", border: "transparent" }
                              : { background: "rgba(255,255,255,0.9)", color: "#1e1b4b", border: "1px solid #c7d2fe" }
                            }
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      disabled={currentChild.problems.length === 0}
                      onClick={() => {
                        setChildren((prev) => [...prev, currentChild]);
                        setCurrentChild({ name: "", ageGroup: "", problems: [] });
                        showThenStep("add-more");
                      }}
                      className="mt-2 w-full py-3.5 rounded-2xl text-white font-semibold shadow-lg active:scale-95 transition-all disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)" }}
                    >
                      Done ✓
                    </button>
                  </>
                )}
              </>
            )}

            {step === "add-more" && (
              <>
                <AiMessage text="Got it! Do you have another child to add? 👨‍👩‍👧‍👦" />
                {typing && <div className="flex gap-3 items-end"><AiAvatar size="sm" /><TypingDots /></div>}
                {!typing && (
                  <div className="flex gap-3 mt-1">
                    {["Yes, add another", "No, continue"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          if (opt.startsWith("Yes")) {
                            showThenStep("child-name");
                          } else {
                            showThenStep("caregiver");
                          }
                        }}
                        className="flex-1 py-3.5 rounded-2xl text-sm font-semibold border active:scale-95 transition-all shadow-sm"
                        style={opt.startsWith("No")
                          ? { background: "linear-gradient(135deg,#6366F1,#A855F7)", color: "#fff", border: "transparent" }
                          : { background: "rgba(255,255,255,0.9)", color: "#1e1b4b", border: "1px solid #c7d2fe" }
                        }
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {step === "caregiver" && (
              <>
                <AiMessage text="Who mainly takes care of the child at home? 🏠" />
                {typing && <div className="flex gap-3 items-end"><AiAvatar size="sm" /><TypingDots /></div>}
                {!typing && (
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {CAREGIVERS.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setParentProfile((p) => ({ ...p, caregiver: c }));
                          showThenStep("concern");
                        }}
                        className="py-3.5 rounded-2xl text-sm font-semibold border active:scale-95 transition-all shadow-sm"
                        style={{ background: "rgba(255,255,255,0.9)", color: "#1e1b4b", border: "1px solid #c7d2fe" }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {step === "concern" && (
              <>
                <AiMessage text="What's your biggest parenting concern right now? 💭" />
                {typing && <div className="flex gap-3 items-end"><AiAvatar size="sm" /><TypingDots /></div>}
                {!typing && (
                  <div className="mt-1 flex gap-2">
                    <input
                      className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none shadow-sm border border-indigo-100"
                      style={{ background: "rgba(255,255,255,0.9)" }}
                      placeholder="e.g. too much screen time..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && textInput.trim()) {
                          setParentProfile((p) => ({ ...p, concern: textInput.trim() }));
                          setTextInput("");
                          showThenStep("routine");
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (!textInput.trim()) return;
                        setParentProfile((p) => ({ ...p, concern: textInput.trim() }));
                        setTextInput("");
                        showThenStep("routine");
                      }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow"
                      style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)" }}
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}

            {step === "routine" && (
              <>
                <AiMessage text="How consistent is your child's daily routine currently? 📅" />
                {typing && <div className="flex gap-3 items-end"><AiAvatar size="sm" /><TypingDots /></div>}
                {!typing && (
                  <div className="flex gap-3 mt-1">
                    {ROUTINE_LEVELS.map((rl) => (
                      <button
                        key={rl}
                        onClick={() => {
                          const finalParent = { ...parentProfile, routineLevel: rl };
                          setParentProfile(finalParent);
                          setTyping(true);
                          setTimeout(() => { setTyping(false); setStep("generating"); }, 600);
                          saveAndFinish(finalParent);
                        }}
                        className="flex-1 py-3.5 rounded-2xl text-sm font-semibold border active:scale-95 transition-all shadow-sm"
                        style={{ background: "rgba(255,255,255,0.9)", color: "#1e1b4b", border: "1px solid #c7d2fe" }}
                      >
                        {rl}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div ref={chatEndRef} />
          </>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center min-h-[65vh] gap-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl"
              style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)", animation: "pulse-glow 1.5s ease-in-out infinite" }}
            >
              <span className="text-4xl">🧠</span>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-indigo-900">Amy is creating</p>
              <p className="text-indigo-600 font-bold text-xl">your personalized plan...</p>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{ background: "#6366F1", animation: `typing-dot 1.2s ease-in-out ${i * 0.25}s infinite` }}
                />
              ))}
            </div>
            <div className="text-xs text-indigo-300 text-center max-w-xs">
              Analysing child profile · Matching science-backed strategies · Building your plan
            </div>
          </div>
        )}

        {step === "result" && (() => {
          const child = children[0];
          const topProblem = child?.problems[0] || "Screen time";
          const goal = PROBLEM_GOAL_MAP[topProblem] || "Build Better Routines";
          const steps6 = [
            "Understand the root cause",
            "Set a realistic goal",
            "Build a morning routine",
            "Introduce reward system",
            "Track daily progress",
            "Celebrate small wins 🎉",
          ];
          return (
            <div className="flex flex-col gap-5 pb-8" style={{ animation: "splash-in 0.5s ease-out" }}>
              <div className="text-center pt-4">
                <div className="text-3xl mb-2">🎉</div>
                <h2 className="text-xl font-bold text-indigo-900">Your plan is ready!</h2>
                <p className="text-sm text-indigo-400 mt-1">Personalised for {child?.name || "your child"}</p>
              </div>

              <div
                className="rounded-3xl p-5 shadow-xl"
                style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(99,102,241,0.15)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)" }}>
                    <span className="text-xl">🎯</span>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-400 font-medium">First Goal</p>
                    <p className="font-bold text-indigo-900">{goal}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
                    <span className="text-xl">👦</span>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-400 font-medium">Child</p>
                    <p className="font-bold text-indigo-900">{child?.name || "Your child"} · {child?.ageGroup || "?"} yrs</p>
                  </div>
                </div>
              </div>

              <div
                className="rounded-3xl p-5 shadow-lg"
                style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(99,102,241,0.15)" }}
              >
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Your 6-Step Journey</p>
                <div className="flex flex-col gap-2">
                  {steps6.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: i === 0 ? "linear-gradient(135deg,#6366F1,#A855F7)" : "rgba(99,102,241,0.15)", color: i === 0 ? "#fff" : "#6366F1" }}
                      >
                        {i + 1}
                      </div>
                      <p className={`text-sm ${i === 0 ? "font-semibold text-indigo-900" : "text-slate-500"}`}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setLocation("/amy-coach")}
                className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-2xl active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)", boxShadow: "0 8px 30px rgba(99,102,241,0.4)" }}
              >
                Start with Amy Coach 🚀
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
