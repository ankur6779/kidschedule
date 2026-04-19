import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

// ─── Types ─────────────────────────────────────────────────────────────────
interface ChildData {
  name: string;
  dob: string;
  age: number;
  ageMonths: number;
  isSchoolGoing: boolean;
  childClass: string;
  schoolStartTime: string;
  schoolEndTime: string;
  wakeUpTime: string;
  sleepTime: string;
  foodType: string;
}

interface ParentData {
  name: string;
  role: string;
  workType: string;
}

interface ChatMessage {
  role: "amy" | "user";
  text: string;
}

type Step =
  | "intro"
  | "child-name" | "child-dob" | "child-school" | "child-class"
  | "child-school-start" | "child-school-end"
  | "child-wake" | "child-sleep" | "child-food"
  | "add-more"
  | "parent-name" | "parent-role" | "parent-work"
  | "saving" | "done";

// ─── Helpers ────────────────────────────────────────────────────────────────
function dobToAge(dob: string): { years: number; months: number } {
  const born = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - born.getFullYear();
  let months = now.getMonth() - born.getMonth();
  if (months < 0) { years--; months += 12; }
  return { years: Math.max(0, years), months: Math.max(0, months) };
}

function to24h(display: string): string {
  // "7:30 AM" → "07:30", "3:00 PM" → "15:00"
  const [time, period] = display.split(" ");
  const [h, m] = time.split(":").map(Number);
  const hour = period === "PM" && h !== 12 ? h + 12 : period === "AM" && h === 12 ? 0 : h;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const WAKE_OPTS = ["5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM"];
const SLEEP_OPTS = ["8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM"];
const SCHOOL_START_OPTS = ["7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM"];
const SCHOOL_END_OPTS = ["12:00 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "4:00 PM"];
const CLASSES = ["Nursery", "LKG / KG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th+"];
const ROLES = ["Mother", "Father", "Both", "Grandparent"];
const WORK_TYPES = [
  { label: "Work from Home", value: "work_from_home" },
  { label: "Office Job", value: "office" },
  { label: "Not Working", value: "not_working" },
];

const GRAD = "linear-gradient(135deg,#6366F1,#A855F7)";
const BG = "linear-gradient(160deg,#EEF2FF 0%,#F5F3FF 55%,#FDF2F8 100%)";

// ─── Sub-components ──────────────────────────────────────────────────────────
function AmyAvatar({ size = 8 }: { size?: number }) {
  const px = size * 4;
  return (
    <div
      className="rounded-full shrink-0 shadow-md overflow-hidden border-2 border-indigo-200"
      style={{ width: px, height: px, background: GRAD, flexShrink: 0 }}
    >
      <img
        src="/amynest-logo.png"
        alt="Amy"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-2 items-end">
      <AmyAvatar size={8} />
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center"
        style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(99,102,241,0.15)" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: "#6366F1", animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

function AmyBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-2 items-end" style={{ animation: "chat-pop 0.3s ease-out" }}>
      <AmyAvatar size={8} />
      <div
        className="max-w-xs px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed text-indigo-900"
        style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(99,102,241,0.15)" }}
      >
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end" style={{ animation: "chat-pop 0.25s ease-out" }}>
      <div
        className="max-w-xs px-4 py-3 rounded-2xl rounded-br-sm text-sm text-white leading-relaxed"
        style={{ background: GRAD }}
      >
        {text}
      </div>
    </div>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-all active:scale-95"
      style={selected
        ? { background: GRAD, color: "#fff", border: "transparent", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }
        : { background: "rgba(255,255,255,0.9)", color: "#1e1b4b", border: "1px solid #c7d2fe" }
      }
    >
      {label}
    </button>
  );
}

function GridChips({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o} label={o} selected={selected === o} onClick={() => onSelect(o)} />
      ))}
    </div>
  );
}

function ProgressBar({ step }: { step: Step }) {
  const order: Step[] = [
    "child-name", "child-dob", "child-school", "child-class",
    "child-school-start", "child-school-end", "child-wake", "child-sleep", "child-food",
    "add-more", "parent-name", "parent-role", "parent-work",
  ];
  const idx = order.indexOf(step);
  const pct = idx < 0 ? 100 : Math.round(((idx + 1) / order.length) * 100);
  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-semibold text-indigo-500">Amy Setup</span>
        <span className="text-indigo-300">{Math.min(pct, 100)}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(99,102,241,0.12)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: GRAD }} />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const authFetch = useAuthFetch();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("intro");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const [selected, setSelected] = useState("");
  const [dobInput, setDobInput] = useState("");

  const [children, setChildren] = useState<ChildData[]>([]);
  const [curr, setCurr] = useState<Partial<ChildData>>({});
  const [parent, setParent] = useState<Partial<ParentData>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, step]);

  // Amy sends a message after a typing delay
  function amySays(text: string, delay = 700) {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { role: "amy", text }]);
    }, delay);
  }

  // User replies, adds to history, then advances
  function userReplies(text: string, nextStep: Step, nextAmyMsg?: string, delay = 900) {
    setMessages((m) => [...m, { role: "user", text }]);
    setSelected("");
    setTextInput("");
    if (nextAmyMsg) {
      setTimeout(() => amySays(nextAmyMsg, delay), 300);
    }
    setTimeout(() => {
      setStep(nextStep);
    }, nextAmyMsg ? delay + 700 : 400);
  }

  // Boot: Amy intro
  useEffect(() => {
    if (step === "intro") {
      const firstName = user?.firstName || "there";
      setTimeout(() => {
        setMessages([{
          role: "amy",
          text: `Hi ${firstName}! 👋 I'm Amy, your parenting coach. Let me quickly set up your profile — it'll take about 2 minutes!`,
        }]);
        setTimeout(() => amySays("Let's start with your child. What's your child's name?", 800), 900);
        setTimeout(() => setStep("child-name"), 2400);
      }, 600);
    }
  }, []);

  // ─── Save & finish ──────────────────────────────────────────────────────────
  async function saveEverything() {
    setStep("saving");
    setMessages((m) => [...m, { role: "amy", text: "Perfect! Saving your profile now... 💾" }]);

    try {
      for (const child of children) {
        await authFetch("/api/children", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: child.name,
            dob: child.dob || "",
            age: child.age || 0,
            ageMonths: child.ageMonths || 0,
            isSchoolGoing: child.isSchoolGoing ?? false,
            childClass: child.childClass || "",
            schoolStartTime: child.schoolStartTime || "09:00",
            schoolEndTime: child.schoolEndTime || "15:00",
            wakeUpTime: child.wakeUpTime || "07:00",
            sleepTime: child.sleepTime || "21:00",
            travelMode: "car",
            foodType: child.foodType || "veg",
            goals: "balanced-routine",
          }),
        });
      }

      await authFetch("/api/parent-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parent.name || "",
          role: (parent.role || "mother").toLowerCase(),
          workType: parent.workType || "work_from_home",
        }),
      });

      await authFetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          children: children.map((c) => ({ name: c.name, ageGroup: `${c.age}`, problems: [] })),
          parent: { caregiver: parent.role, concern: "", routineLevel: "medium" },
          priorityGoal: "balanced-routine",
          onboardingComplete: true,
        }),
      });

      localStorage.setItem("onboardingComplete", "true");
      queryClient.setQueryData(["onboarding-status"], { onboardingComplete: true });
    } catch {
    }

    setTimeout(() => setStep("done"), 600);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (step === "saving" || step === "done") {
    const childName = children[0]?.name || "your child";
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-5" style={{ background: BG }}>
        {step === "saving" ? (
          <>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl"
              style={{ background: GRAD, animation: "pulse-glow 1.5s ease-in-out infinite" }}
            >
              <span className="text-4xl">🧠</span>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-indigo-900">Amy is setting up</p>
              <p className="text-indigo-600 font-bold text-2xl mt-1">your profile...</p>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-3 h-3 rounded-full" style={{ background: "#6366F1", display: "inline-block", animation: `typing-dot 1.2s ease-in-out ${i * 0.25}s infinite` }} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-5 w-full max-w-sm" style={{ animation: "splash-in 0.5s ease-out" }}>
            <div className="text-6xl">🎉</div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-indigo-900">Profile ready!</h2>
              <p className="text-indigo-400 mt-1">All set for {childName}</p>
            </div>
            <div
              className="w-full rounded-3xl p-5 shadow-xl"
              style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">✏️</span>
                <div>
                  <p className="font-bold text-indigo-900 text-sm">You can edit these details anytime</p>
                  <p className="text-indigo-400 text-xs mt-1 leading-relaxed">
                    Go to <strong>Profile</strong> or <strong>Children</strong> section from the menu to update your child's info, timings, food preferences, and more.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setLocation("/dashboard")}
              className="w-full py-4 rounded-2xl text-white font-bold text-base active:scale-95 transition-all"
              style={{ background: GRAD, boxShadow: "0 6px 24px rgba(99,102,241,0.4)" }}
            >
              Go to Dashboard 🚀
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Current input component based on step ──────────────────────────────────
  function renderInput() {
    switch (step) {
      case "intro":
        return null;

      case "child-name":
        return (
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-2xl px-4 py-3.5 text-sm outline-none border border-indigo-100 focus:border-indigo-400 transition-colors"
              style={{ background: "rgba(255,255,255,0.95)", color: "#1e1b4b" }}
              placeholder="Child's name..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && textInput.trim()) {
                  const name = textInput.trim();
                  setCurr((c) => ({ ...c, name }));
                  userReplies(name, "child-dob", `Nice name! 😊 When is ${name}'s date of birth?`);
                }
              }}
              autoFocus
            />
            <button
              onClick={() => {
                if (!textInput.trim()) return;
                const name = textInput.trim();
                setCurr((c) => ({ ...c, name }));
                userReplies(name, "child-dob", `Nice name! 😊 When is ${name}'s date of birth?`);
              }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
              style={{ background: GRAD }}
            >→</button>
          </div>
        );

      case "child-dob":
        return (
          <div className="flex flex-col gap-3">
            <input
              type="date"
              className="w-full rounded-2xl px-4 py-3.5 text-sm outline-none border border-indigo-100 focus:border-indigo-400 transition-colors"
              style={{ background: "rgba(255,255,255,0.95)", color: "#1e1b4b" }}
              value={dobInput}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDobInput(e.target.value)}
            />
            <button
              disabled={!dobInput}
              onClick={() => {
                const { years, months } = dobToAge(dobInput);
                setCurr((c) => ({ ...c, dob: dobInput, age: years, ageMonths: months }));
                const ageText = years > 0 ? `${years} year${years !== 1 ? "s" : ""} old` : `${months} months old`;
                const name = curr.name || "your child";
                userReplies(dobInput, "child-school", `Is ${name} currently going to school? 🏫`, 900);
                setDobInput("");
              }}
              className="w-full py-3.5 rounded-2xl text-white font-semibold active:scale-95 transition-all disabled:opacity-40"
              style={{ background: GRAD }}
            >
              Confirm Date of Birth
            </button>
          </div>
        );

      case "child-school":
        return (
          <div className="flex gap-3">
            {["Yes, school going", "No, not yet"].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  const isSchool = opt.startsWith("Yes");
                  setCurr((c) => ({ ...c, isSchoolGoing: isSchool }));
                  if (isSchool) {
                    userReplies(opt, "child-class", `Which class is ${curr.name || "your child"} in?`);
                  } else {
                    setCurr((c) => ({ ...c, childClass: "", schoolStartTime: "09:00", schoolEndTime: "15:00" }));
                    userReplies(opt, "child-wake", `What time does ${curr.name || "your child"} usually wake up? ☀️`);
                  }
                }}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold border active:scale-95 transition-all"
                style={{ background: "rgba(255,255,255,0.9)", color: "#1e1b4b", border: "1px solid #c7d2fe" }}
              >
                {opt}
              </button>
            ))}
          </div>
        );

      case "child-class":
        return (
          <GridChips
            options={CLASSES}
            selected={selected}
            onSelect={(v) => {
              setSelected(v);
              setCurr((c) => ({ ...c, childClass: v }));
              userReplies(v, "child-school-start", `What time does school start for ${curr.name || "your child"}?`);
            }}
          />
        );

      case "child-school-start":
        return (
          <GridChips
            options={SCHOOL_START_OPTS}
            selected={selected}
            onSelect={(v) => {
              setSelected(v);
              setCurr((c) => ({ ...c, schoolStartTime: to24h(v) }));
              userReplies(v, "child-school-end", "And what time does school end?");
            }}
          />
        );

      case "child-school-end":
        return (
          <GridChips
            options={SCHOOL_END_OPTS}
            selected={selected}
            onSelect={(v) => {
              setSelected(v);
              setCurr((c) => ({ ...c, schoolEndTime: to24h(v) }));
              userReplies(v, "child-wake", `What time does ${curr.name || "your child"} wake up in the morning? ☀️`);
            }}
          />
        );

      case "child-wake":
        return (
          <GridChips
            options={WAKE_OPTS}
            selected={selected}
            onSelect={(v) => {
              setSelected(v);
              setCurr((c) => ({ ...c, wakeUpTime: to24h(v) }));
              userReplies(v, "child-sleep", `And what time does ${curr.name || "your child"} go to sleep? 🌙`);
            }}
          />
        );

      case "child-sleep":
        return (
          <GridChips
            options={SLEEP_OPTS}
            selected={selected}
            onSelect={(v) => {
              setSelected(v);
              setCurr((c) => ({ ...c, sleepTime: to24h(v) }));
              userReplies(v, "child-food", `Is ${curr.name || "your child"} vegetarian or non-vegetarian? 🥗`);
            }}
          />
        );

      case "child-food":
        return (
          <div className="flex gap-3">
            {[{ label: "🥦 Vegetarian", value: "veg" }, { label: "🍗 Non-Vegetarian", value: "non_veg" }].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => {
                  const finalChild = { ...curr, foodType: value } as ChildData;
                  setChildren((prev) => [...prev, finalChild]);
                  setCurr({});
                  const childCount = children.length + 1;
                  userReplies(label, "add-more",
                    childCount === 1
                      ? "Got it! Do you have another child to add as well? 👨‍👩‍👧‍👦"
                      : "Do you have one more child to add?",
                  );
                }}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold border active:scale-95 transition-all"
                style={{ background: "rgba(255,255,255,0.9)", color: "#1e1b4b", border: "1px solid #c7d2fe" }}
              >
                {label}
              </button>
            ))}
          </div>
        );

      case "add-more":
        return (
          <div className="flex gap-3">
            {["Yes, add another", "No, continue"].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  if (opt.startsWith("Yes")) {
                    userReplies(opt, "child-name", "What's the next child's name?");
                  } else {
                    userReplies(opt, "parent-name", `Great! Now let me know a bit about you. What's your name? 😊`);
                  }
                }}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold border active:scale-95 transition-all"
                style={opt.startsWith("No")
                  ? { background: GRAD, color: "#fff", border: "transparent" }
                  : { background: "rgba(255,255,255,0.9)", color: "#1e1b4b", border: "1px solid #c7d2fe" }
                }
              >
                {opt}
              </button>
            ))}
          </div>
        );

      case "parent-name":
        return (
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-2xl px-4 py-3.5 text-sm outline-none border border-indigo-100 focus:border-indigo-400 transition-colors"
              style={{ background: "rgba(255,255,255,0.95)", color: "#1e1b4b" }}
              placeholder="Your name..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && textInput.trim()) {
                  const name = textInput.trim();
                  setParent((p) => ({ ...p, name }));
                  userReplies(name, "parent-role", `Nice to meet you, ${name}! 🙏 What is your role with the child?`);
                }
              }}
              autoFocus
            />
            <button
              onClick={() => {
                if (!textInput.trim()) return;
                const name = textInput.trim();
                setParent((p) => ({ ...p, name }));
                userReplies(name, "parent-role", `Nice to meet you, ${name}! 🙏 What is your role with the child?`);
              }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
              style={{ background: GRAD }}
            >→</button>
          </div>
        );

      case "parent-role":
        return (
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setParent((p) => ({ ...p, role: r }));
                  userReplies(r, "parent-work", "What kind of work do you do?");
                }}
                className="py-3.5 rounded-2xl text-sm font-semibold border active:scale-95 transition-all"
                style={{ background: "rgba(255,255,255,0.9)", color: "#1e1b4b", border: "1px solid #c7d2fe" }}
              >
                {r}
              </button>
            ))}
          </div>
        );

      case "parent-work":
        return (
          <div className="flex flex-col gap-2">
            {WORK_TYPES.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => {
                  setParent((p) => ({ ...p, workType: value }));
                  userReplies(label, "saving");
                  setTimeout(() => saveEverything(), 800);
                }}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold border active:scale-95 transition-all"
                style={{ background: "rgba(255,255,255,0.9)", color: "#1e1b4b", border: "1px solid #c7d2fe" }}
              >
                {label}
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: BG }}>
      <div
        className="sticky top-0 z-10"
        style={{ background: "rgba(238,242,255,0.85)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2.5">
            <AmyAvatar size={8} />
            <div>
              <p className="text-xs font-bold text-indigo-700">Amy Coach</p>
              <p className="text-xs text-indigo-400">Setting up your profile</p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                await authFetch("/api/onboarding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ onboardingComplete: true }),
                });
                localStorage.setItem("onboardingComplete", "true");
                queryClient.setQueryData(["onboarding-status"], { onboardingComplete: true });
              } catch (_) {}
              setLocation("/dashboard");
            }}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-indigo-50 active:scale-95"
            title="Skip onboarding"
          >
            Skip onboarding — will do it manually
          </button>
        </div>
        <ProgressBar step={step} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3 max-w-lg mx-auto w-full">
        {messages.map((msg, i) =>
          msg.role === "amy"
            ? <AmyBubble key={i} text={msg.text} />
            : <UserBubble key={i} text={msg.text} />
        )}
        {typing && <TypingBubble />}
        <div ref={chatEndRef} />
      </div>

      {!typing && step !== "intro" && (
        <div
          className="sticky bottom-0 px-4 py-4 max-w-lg mx-auto w-full"
          style={{ background: "rgba(238,242,255,0.9)", backdropFilter: "blur(8px)" }}
        >
          {renderInput()}
        </div>
      )}
    </div>
  );
}
