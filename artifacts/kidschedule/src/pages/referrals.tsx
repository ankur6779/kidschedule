import { useMemo, useState } from "react";
import { Gift, Copy, Check, Share2, Mail, MessageCircle, Trophy, Sparkles, Lock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useReferrals } from "@/hooks/use-referrals";
import { AmyIcon } from "@/components/amy-icon";

function buildLink(code: string): string {
  if (typeof window === "undefined") return `?ref=${code}`;
  const url = new URL(window.location.origin);
  url.searchParams.set("ref", code);
  return url.toString();
}

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export default function ReferralsPage() {
  const { payload, isLoading } = useReferrals();
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const stats = payload?.stats;
  const referrals = payload?.referrals ?? [];
  const link = useMemo(() => (stats ? buildLink(stats.code) : ""), [stats]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-muted-foreground animate-pulse">Loading your referral dashboard…</div>
      </div>
    );
  }

  const validProgress = Math.min(100, (stats.validReferrals / stats.validThreshold) * 100);
  const paidProgress = Math.min(100, (stats.paidReferrals / stats.paidThreshold) * 100);
  const rewardsLeft = Math.max(0, stats.rewardCap - stats.rewardsGranted);
  const bonusDays = daysLeft(stats.bonusExpiresAt);
  const capReached = stats.rewardsGranted >= stats.rewardCap;

  const validShort = Math.max(0, stats.validThreshold - stats.validReferrals);
  const paidShort = Math.max(0, stats.paidThreshold - stats.paidReferrals);
  const message = capReached
    ? "Maxed out — you've earned the lifetime referral cap. Thank you for spreading Amy! 🎉"
    : stats.rewardsAvailable > 0
    ? `🎉 You unlocked ${stats.rewardsAvailable * stats.rewardDays} days of premium via referrals!`
    : validShort === 0 && paidShort === 0
    ? "Almost there — your reward is being processed."
    : `Invite ${validShort > 0 ? `${validShort} more friend${validShort > 1 ? "s" : ""}` : ""}${
        validShort > 0 && paidShort > 0 ? " + " : ""
      }${paidShort > 0 ? `${paidShort} paid user` : ""} to unlock ${stats.rewardDays} days free.`;

  const copy = async (kind: "code" | "link", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // ignore
    }
  };

  const share = async () => {
    const text = `I'm using Amy AI for parenting — try it with my code ${stats.code} and we both get premium! ${link}`;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Try Amy AI", text, url: link });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    copy("link", text);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <Gift className="h-3.5 w-3.5" /> Invite & Earn Premium
          </div>
          <h1 className="font-quicksand text-2xl sm:text-3xl font-extrabold leading-tight">
            Get {stats.rewardDays} days free for every {stats.validThreshold} friends 🎁
          </h1>
          <p className="text-sm sm:text-base text-white/90 max-w-xl">
            {message}
          </p>
          {bonusDays !== null && bonusDays > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold">
              <Calendar className="h-3.5 w-3.5" />
              {bonusDays} bonus day{bonusDays === 1 ? "" : "s"} active
            </div>
          )}
        </div>
      </div>

      {/* Code + share card */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <AmyIcon size={22} bounce />
          <h2 className="font-quicksand text-lg font-bold">Your referral code</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3">
            <span className="font-mono text-2xl font-extrabold tracking-widest text-primary">
              {stats.code}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => copy("code", stats.code)}
            >
              {copied === "code" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied === "code" ? "Copied" : "Copy"}
            </Button>
          </div>
          <Button onClick={share} className="gap-2 sm:w-auto">
            <Share2 className="h-4 w-4" />
            Share invite
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-2.5">
          <code className="text-xs sm:text-sm text-muted-foreground truncate flex-1">{link}</code>
          <button
            type="button"
            onClick={() => copy("link", link)}
            className="text-xs font-semibold text-primary hover:underline shrink-0"
          >
            {copied === "link" ? "Copied!" : "Copy link"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Try Amy AI with my code ${stats.code} — we both get premium! ${link}`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent("Try Amy AI")}&body=${encodeURIComponent(`Hey! Try Amy AI with my code ${stats.code} — we both get premium. ${link}`)}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted/50 transition"
          >
            <Mail className="h-4 w-4" /> Email
          </a>
        </div>
      </div>

      {/* Progress card */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-quicksand text-lg font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" /> Progress
          </h2>
          <Badge variant="secondary" className="font-bold">
            {stats.rewardsGranted} / {stats.rewardCap} rewards
          </Badge>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-semibold">Friends invited</span>
            <span className="text-muted-foreground tabular-nums">
              {stats.validReferrals} / {stats.validThreshold}
            </span>
          </div>
          <Progress value={validProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">
            Friends who signed up & used Amy AI
          </p>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-semibold">Paid sign-ups</span>
            <span className="text-muted-foreground tabular-nums">
              {stats.paidReferrals} / {stats.paidThreshold}
            </span>
          </div>
          <Progress value={paidProgress} className="h-2 [&>div]:bg-emerald-500" />
          <p className="text-xs text-muted-foreground mt-1.5">
            At least 1 must purchase a paid plan
          </p>
        </div>

        {capReached ? (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-50 dark:bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200 inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            You've earned the maximum {stats.rewardCap * stats.rewardDays} days of bonus premium. Thank you!
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-muted/30 p-3 text-sm">
            <span className="font-semibold">{rewardsLeft}</span> more reward{rewardsLeft === 1 ? "" : "s"} available — up to{" "}
            <span className="font-semibold">{rewardsLeft * stats.rewardDays} days</span> of free premium.
          </div>
        )}
      </div>

      {/* Recent referrals */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm">
        <h2 className="font-quicksand text-lg font-bold mb-3">Your referrals</h2>
        {referrals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <Lock className="h-5 w-5 mx-auto mb-2 opacity-50" />
            No referrals yet. Share your code to get started!
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      r.status === "paid"
                        ? "bg-emerald-500"
                        : r.status === "valid"
                        ? "bg-violet-500"
                        : "bg-amber-400"
                    }`}
                  />
                  <span className="text-sm font-semibold truncate">Friend #{r.id}</span>
                </div>
                <Badge
                  variant={r.status === "paid" ? "default" : "secondary"}
                  className={`text-[10px] uppercase font-bold ${
                    r.status === "paid"
                      ? "bg-emerald-500 hover:bg-emerald-500"
                      : r.status === "valid"
                      ? "bg-violet-500 hover:bg-violet-500 text-white"
                      : ""
                  }`}
                >
                  {r.status === "paid" ? "Paid" : r.status === "valid" ? "Active" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rules */}
      <div className="text-xs text-muted-foreground space-y-1.5 px-2">
        <p>
          <strong>How it works:</strong> Earn {stats.rewardDays} days of free premium when{" "}
          {stats.validThreshold} friends sign up using your code AND at least{" "}
          {stats.paidThreshold} of them buys any paid plan.
        </p>
        <p>
          Bonus time stacks on top of your existing premium and is capped at{" "}
          {stats.rewardCap * stats.rewardDays} days lifetime.
        </p>
      </div>
    </div>
  );
}
