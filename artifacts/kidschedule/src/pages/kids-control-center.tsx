import { useEffect, useState } from "react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { Layout } from "@/components/layout";
import { Loader2, Check, X, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const FEATURE_KEY = "kids_control_center";

type FeedbackKind = "interested" | "not_interested";

type ServerFeedback = {
  feedback: FeedbackKind | null;
  comment: string | null;
  updatedAt: string | null;
};

const HIGHLIGHTS = [
  { icon: "🛡️", text: "Safe child-friendly UI" },
  { icon: "🔄", text: "Sync with parent routines" },
  { icon: "🎁", text: "Reward-based engagement" },
  { icon: "🚫", text: "No distractions" },
];

const FEATURES = [
  { icon: "⏱", title: "Screen Time Guidance", desc: "Healthy limits, gentle nudges" },
  { icon: "📋", title: "Routine Control", desc: "Daily flow, on autopilot" },
  { icon: "🎯", title: "Focus Mode", desc: "Quiet time for study & sleep" },
  { icon: "📊", title: "Activity Tracking", desc: "See what your child enjoys" },
  { icon: "🔒", title: "Parent Lock", desc: "PIN-protected controls" },
];

export default function KidsControlCenterPage() {
  const authFetch = useAuthFetch();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<FeedbackKind | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<FeedbackKind | null>(null);
  const [comment, setComment] = useState("");
  const [savedComment, setSavedComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [thanks, setThanks] = useState<FeedbackKind | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await authFetch(`/api/feature-feedback?feature=${FEATURE_KEY}`);
        if (!alive) return;
        if (res.ok) {
          const data: ServerFeedback = await res.json();
          if (data.feedback) setSavedFeedback(data.feedback);
          if (data.comment) {
            setComment(data.comment);
            setSavedComment(data.comment);
          }
        }
      } catch {
        /* non-fatal — user can still submit */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [authFetch]);

  const submitFeedback = async (kind: FeedbackKind) => {
    if (submitting) return;
    setSubmitting(kind);
    try {
      const res = await authFetch("/api/feature-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: FEATURE_KEY, feedback: kind, comment: comment.trim() || undefined }),
      });
      if (res.ok) {
        setSavedFeedback(kind);
        setSavedComment(comment.trim());
        setThanks(kind);
        setTimeout(() => setThanks(null), 2400);
      }
    } catch {
      /* ignore — UI stays on previous state */
    } finally {
      setSubmitting(null);
    }
  };

  const saveComment = async () => {
    if (!savedFeedback || savingComment) return;
    if (comment.trim() === savedComment.trim()) return;
    setSavingComment(true);
    try {
      const res = await authFetch("/api/feature-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: FEATURE_KEY, feedback: savedFeedback, comment: comment.trim() || undefined }),
      });
      if (res.ok) {
        setSavedComment(comment.trim());
        setThanks(savedFeedback);
        setTimeout(() => setThanks(null), 2000);
      }
    } finally {
      setSavingComment(false);
    }
  };

  return (
    <Layout>
      <div className="relative min-h-screen overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-20 h-80 w-80 rounded-full bg-violet-400/30 dark:bg-violet-500/25 blur-3xl" />
          <div className="absolute top-40 -right-20 h-80 w-80 rounded-full bg-pink-400/25 dark:bg-pink-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-72 w-[40rem] rounded-full bg-amber-300/20 dark:bg-amber-400/15 blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 sm:py-10">
          <Link href="/parenting-hub">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              data-testid="link-back-to-hub"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Parent Hub
            </button>
          </Link>

          {/* HEADER */}
          <header className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/15 to-pink-500/15 border border-violet-300/40 dark:border-violet-500/30 text-xs font-bold text-violet-700 dark:text-violet-300 mb-3">
              <Sparkles className="h-3 w-3" /> Coming Soon 🚀
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-br from-violet-600 via-pink-500 to-amber-500 bg-clip-text text-transparent">
              👶 Kids Control Center
            </h1>
          </header>

          {/* HERO */}
          <section className="rounded-3xl p-5 sm:p-7 mb-5 backdrop-blur-xl bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-[0_8px_40px_-12px_rgba(124,58,237,0.35)]">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight">
              Smart Control for Parents, Safe Experience for Kids
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Guide your child's routine, learning, and screen time with ease.
            </p>
          </section>

          {/* AMYNEST KIDS */}
          <section className="rounded-3xl p-5 sm:p-7 mb-5 backdrop-blur-xl bg-gradient-to-br from-violet-500/10 via-white/60 to-pink-500/10 dark:from-violet-500/15 dark:via-white/5 dark:to-pink-500/15 border border-violet-200/60 dark:border-violet-500/20 shadow-[0_8px_40px_-12px_rgba(236,72,153,0.30)]">
            <h3 className="text-lg sm:text-xl font-extrabold text-foreground mb-2">
              👶 AmyNest Kids <span className="text-sm font-semibold text-muted-foreground">(Child Experience)</span>
            </h3>
            <p className="text-sm sm:text-[15px] text-foreground/80 leading-relaxed mb-4">
              AmyNest Kids is a safe and guided environment for children that syncs with the parent app.
              Kids see only their routines, activities, and rewards, while parents manage everything in the background.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {HIGHLIGHTS.map((h) => (
                <div
                  key={h.text}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-white/70 dark:bg-white/8 border border-white/60 dark:border-white/10"
                >
                  <span className="text-lg">{h.icon}</span>
                  <span className="text-xs sm:text-sm font-semibold text-foreground/90">{h.text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* FEATURE PREVIEW */}
          <section className="mb-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">
              Feature Preview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="group rounded-2xl p-4 backdrop-blur-xl bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 hover:border-violet-300/60 dark:hover:border-violet-500/40 hover:shadow-[0_8px_30px_-10px_rgba(124,58,237,0.4)] transition-all"
                  style={{ animationDelay: `${i * 60}ms` }}
                  data-testid={`feature-${f.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0 group-hover:scale-110 transition-transform">{f.icon}</div>
                    <div className="min-w-0">
                      <div className="font-bold text-foreground text-[15px] leading-tight">{f.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{f.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* DESCRIPTION */}
          <section className="rounded-3xl p-5 sm:p-6 mb-5 backdrop-blur-xl bg-gradient-to-br from-amber-100/50 to-rose-100/50 dark:from-amber-500/10 dark:to-rose-500/10 border border-amber-200/60 dark:border-amber-500/20">
            <p className="text-sm sm:text-[15px] text-foreground/85 leading-relaxed text-center">
              Kids Control Center helps parents guide children in a balanced way by focusing on
              <span className="font-bold text-violet-700 dark:text-violet-300"> habits, routines, and learning </span>
              instead of strict restrictions.
            </p>
          </section>

          {/* FEEDBACK */}
          <section className="rounded-3xl p-5 sm:p-7 backdrop-blur-xl bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-[0_8px_40px_-12px_rgba(124,58,237,0.30)]">
            <h3 className="text-lg sm:text-xl font-extrabold text-foreground text-center mb-1">
              Would you like this feature?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mb-5">
              Your feedback helps us decide what to build next.
            </p>

            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <FeedbackButton
                    kind="interested"
                    label="👍 Interested"
                    selected={savedFeedback === "interested"}
                    submitting={submitting === "interested"}
                    onClick={() => submitFeedback("interested")}
                  />
                  <FeedbackButton
                    kind="not_interested"
                    label="👎 Not Interested"
                    selected={savedFeedback === "not_interested"}
                    submitting={submitting === "not_interested"}
                    onClick={() => submitFeedback("not_interested")}
                  />
                </div>

                <label className="block text-xs font-semibold text-muted-foreground mb-2 px-1">
                  Tell us what you want in this feature (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                  placeholder="e.g. I'd love a daily reading streak, or kid-friendly themes…"
                  rows={3}
                  className="w-full rounded-2xl px-4 py-3 text-sm bg-white/80 dark:bg-white/5 border border-border focus:border-violet-400 dark:focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all text-foreground placeholder:text-muted-foreground/70 resize-none"
                  data-testid="input-feedback-comment"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground/70">{comment.length}/1000</span>
                  {savedFeedback && comment.trim() !== savedComment.trim() && (
                    <button
                      type="button"
                      onClick={saveComment}
                      disabled={savingComment}
                      className="text-xs font-bold text-violet-600 dark:text-violet-300 hover:text-violet-700 dark:hover:text-violet-200 disabled:opacity-50"
                      data-testid="button-save-comment"
                    >
                      {savingComment ? "Saving…" : "Save note"}
                    </button>
                  )}
                </div>

                {thanks && (
                  <div
                    className="mt-4 text-center text-sm font-semibold text-violet-700 dark:text-violet-300 animate-in fade-in"
                    data-testid="text-feedback-thanks"
                  >
                    {thanks === "interested"
                      ? "🎉 Thanks! We'll keep you posted."
                      : "💛 Got it — we appreciate the honesty."}
                  </div>
                )}
              </>
            )}
          </section>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Built with care by the AmyNest team · Coming soon
          </p>
        </div>
      </div>
    </Layout>
  );
}

function FeedbackButton({
  kind, label, selected, submitting, onClick,
}: {
  kind: FeedbackKind;
  label: string;
  selected: boolean;
  submitting: boolean;
  onClick: () => void;
}) {
  const isInterested = kind === "interested";
  const baseGradient = isInterested
    ? "from-violet-500 to-pink-500"
    : "from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-600";
  const glow = isInterested
    ? "shadow-[0_8px_30px_-8px_rgba(168,85,247,0.6)]"
    : "shadow-[0_8px_30px_-8px_rgba(100,116,139,0.4)]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={submitting}
      data-testid={`button-feedback-${kind}`}
      className={`relative overflow-hidden rounded-2xl px-4 py-3.5 font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-70
        ${selected
          ? `bg-gradient-to-br ${baseGradient} text-white ${glow}`
          : "bg-white/80 dark:bg-white/5 border border-border text-foreground hover:border-violet-300 dark:hover:border-violet-500/40"
        }`}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : selected ? (
          isInterested ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />
        ) : null}
        {label}
      </span>
    </button>
  );
}
