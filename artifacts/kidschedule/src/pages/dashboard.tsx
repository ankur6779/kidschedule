import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetRecentRoutines, getGetRecentRoutinesQueryKey, useGetBehaviorStats, getGetBehaviorStatsQueryKey, useListRoutines, getListRoutinesQueryKey, useListChildren, getListChildrenQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Calendar, Users, Star, ArrowRight, Activity, TrendingUp, TrendingDown, Minus, Clock, CheckCircle2, Sparkles, Trophy, Bot, Brain, Heart, Target, ChevronRight, MessageCircleHeart } from "lucide-react";
import { getAgeGroup, getAgeGroupInfo, formatAge } from "@/lib/age-groups";
import { AmyIcon } from "@/components/amy-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { getTotalPoints, getBadges, getRewards, redeemReward, type Reward } from "@/lib/rewards";

type RoutineItem = {
  time: string;
  activity: string;
  duration: number;
  category: string;
  notes?: string;
  status?: string;
};

type Routine = {
  id: number;
  childId: number;
  childName: string;
  date: string;
  title: string;
  items: RoutineItem[];
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function parseTimeToMinutes(t: string): number {
  const [timePart, period] = (t ?? "").split(" ");
  const [hours, minutes] = timePart.split(":").map(Number);
  let h = hours;
  if (period === "PM" && hours !== 12) h += 12;
  if (period === "AM" && hours === 12) h = 0;
  return h * 60 + (minutes || 0);
}

function computeStreak(routines: Routine[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateSet = new Set(routines.map((r) => r.date.slice(0, 10)));
  let streak = 0;
  while (true) {
    const d = new Date(today);
    d.setDate(d.getDate() - streak);
    const key = d.toISOString().slice(0, 10);
    if (dateSet.has(key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Hero Greeting (soft gradient) ─────────────────────────────────────────
function HeroGreeting({ displayName, hasChildren }: { displayName: string; hasChildren: boolean }) {
  const greeting = getGreeting();
  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-100 via-rose-100 to-violet-100 p-6 sm:p-7 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
      <div aria-hidden className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/40 blur-2xl" />
      <div aria-hidden className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-white/30 blur-2xl" />
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-800/80">{greeting}</p>
        <h1 className="font-quicksand text-[22px] sm:text-3xl font-black text-foreground mt-1.5 leading-tight">
          👋 Hi{displayName ? `, ${displayName}` : ""}, let's make today easier
        </h1>
        <p className="text-sm text-foreground/70 mt-2 leading-relaxed">
          {hasChildren
            ? "We've planned your child's day for you ❤️"
            : "Let's set up your child's first routine 🌟"}
        </p>
      </div>
    </div>
  );
}

// ─── Children Profile Strip (horizontal scroll) ────────────────────────────
function ChildrenStrip({ children }: { children: any[] }) {
  if (children.length === 0) return null;
  return (
    <div className="-mx-1">
      <div className="flex items-center justify-between px-1 mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Your little ones</p>
        <Link href="/children" className="text-xs font-semibold text-primary hover:underline">Manage</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x snap-mandatory">
        {children.map((c: any, i: number) => {
          const ageMonths = c.ageMonths ?? 0;
          const group = getAgeGroup(c.age, ageMonths);
          const info = getAgeGroupInfo(group);
          return (
            <Link key={c.id} href={`/children/${c.id}`}>
              <div
                className={`shrink-0 snap-start min-w-[180px] sm:min-w-[200px] rounded-3xl border-2 ${info.bgColor} p-4 transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer animate-in fade-in slide-in-from-left-3 duration-500`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl shrink-0">
                    {info.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-black text-sm leading-tight truncate ${info.color}`}>{c.name}</p>
                    <p className="text-[11px] text-foreground/60 mt-0.5">{formatAge(c.age, ageMonths)}</p>
                  </div>
                </div>
                <p className="text-[11px] text-foreground/60 mt-2.5 italic">
                  Personalised for {c.name}
                </p>
              </div>
            </Link>
          );
        })}
        <Link href="/children/new">
          <div className="shrink-0 snap-start min-w-[140px] rounded-3xl border-2 border-dashed border-border bg-muted/20 p-4 flex items-center justify-center text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
            <div>
              <div className="text-2xl mb-1">➕</div>
              <p className="text-xs font-bold text-foreground/70">Add child</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

// ─── Now / Next Timeline ───────────────────────────────────────────────────
function NowNextTimeline({ routines }: { routines: Routine[] }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRoutines = routines.filter((r) => r.date.slice(0, 10) === todayStr);

  if (todayRoutines.length === 0) {
    return (
      <Card className="rounded-3xl shadow-sm border-2 border-dashed bg-gradient-to-br from-sky-50 to-blue-50 overflow-hidden">
        <CardContent className="p-6 text-center space-y-3">
          <div className="text-4xl">🗓️</div>
          <p className="font-bold text-foreground">No plan for today yet</p>
          <p className="text-xs text-muted-foreground">Tap below to create today's routine in one tap.</p>
          <Link href="/routines/generate">
            <button className="mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-sm px-5 py-2.5 shadow-md hover:shadow-lg active:scale-95 transition-all">
              <Sparkles className="h-4 w-4" />
              Plan My Child's Day
            </button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const allItems = todayRoutines.flatMap((r) =>
    r.items.map((item) => ({ ...item, childName: r.childName, routineId: r.id }))
  ).sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

  let currentIdx = -1;
  for (let i = 0; i < allItems.length; i++) {
    const itemMinutes = parseTimeToMinutes(allItems[i].time);
    const nextMinutes = i + 1 < allItems.length ? parseTimeToMinutes(allItems[i + 1].time) : 24 * 60;
    if (itemMinutes <= nowMinutes && nowMinutes < nextMinutes) { currentIdx = i; break; }
  }

  const displayItems = currentIdx >= 0
    ? allItems.slice(currentIdx, currentIdx + 3)
    : allItems.filter((item) => parseTimeToMinutes(item.time) > nowMinutes).slice(0, 3);

  if (displayItems.length === 0) {
    return (
      <Card className="rounded-3xl shadow-sm border-none overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardContent className="p-5 text-center space-y-1">
          <div className="text-3xl">🌙</div>
          <p className="font-bold text-emerald-800">Day complete!</p>
          <p className="text-xs text-emerald-700/70">Time to relax and recharge</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl shadow-sm border-none overflow-hidden bg-white">
      <CardHeader className="pb-3 bg-gradient-to-r from-violet-50 to-pink-50">
        <div className="flex items-center justify-between">
          <CardTitle className="font-quicksand text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-600" />
            Today's Timeline
          </CardTitle>
          <Link href="/routines" className="text-xs font-bold text-violet-600 hover:underline flex items-center">
            View all <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {displayItems.map((item, idx) => {
          const isCurrent = currentIdx >= 0 && idx === 0;
          const isNext = idx === (currentIdx >= 0 ? 1 : 0);
          const completed = item.status === "completed";
          return (
            <Link key={`${item.routineId}-${idx}`} href={`/routines/${item.routineId}`}>
              <div
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all hover:scale-[1.01] ${
                  isCurrent
                    ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md"
                    : "bg-muted/30 hover:bg-muted/60"
                }`}
              >
                <div className={`flex flex-col items-center w-14 shrink-0 ${isCurrent ? "text-white" : "text-foreground/70"}`}>
                  <div className="text-xs font-bold">{item.time}</div>
                  {isCurrent && <span className="mt-1 text-[9px] font-black uppercase bg-white/25 px-1.5 py-0.5 rounded-full">Now</span>}
                  {!isCurrent && isNext && <span className="mt-1 text-[9px] font-black uppercase bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">Next</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm ${completed ? "line-through opacity-60" : ""}`} style={{ wordBreak: "break-word", whiteSpace: "normal" }}>
                    {item.activity}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isCurrent ? "text-white/80" : "text-muted-foreground"}`}>
                    {item.childName} · {item.duration}m
                  </div>
                </div>
                {completed && !isCurrent && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Goal-Based Cards (TinyPal style) ──────────────────────────────────────
function GoalCards() {
  const goals = [
    { id: "sleep",    emoji: "😴", title: "Better Sleep",      desc: "Bedtime routines & calm rituals", grad: "from-indigo-100 to-blue-100",  ring: "border-indigo-200",  text: "text-indigo-900" },
    { id: "screen",   emoji: "📱", title: "Less Screen Time",  desc: "Healthy limits without battles",  grad: "from-emerald-100 to-teal-100", ring: "border-emerald-200", text: "text-emerald-900" },
    { id: "eating",   emoji: "🍽️", title: "Better Eating",     desc: "Picky-eater wins & nutrition",    grad: "from-orange-100 to-amber-100", ring: "border-orange-200",  text: "text-orange-900" },
    { id: "emotions", emoji: "❤️", title: "Emotional Control", desc: "Tantrum-free, calmer days",       grad: "from-rose-100 to-pink-100",    ring: "border-rose-200",    text: "text-rose-900" },
  ];
  return (
    <div className="-mx-1">
      <div className="flex items-center justify-between px-1 mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Goals you can work on</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x snap-mandatory">
        {goals.map((g, i) => (
          <Link key={g.id} href="/parenting-hub">
            <div
              className={`shrink-0 snap-start w-[200px] sm:w-[220px] rounded-3xl border-2 ${g.ring} bg-gradient-to-br ${g.grad} p-4 transition-all hover:scale-[1.03] hover:shadow-md cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="text-3xl mb-2">{g.emoji}</div>
              <p className={`font-black text-sm leading-tight ${g.text}`}>{g.title}</p>
              <p className="text-[11px] text-foreground/60 mt-1 leading-snug">{g.desc}</p>
              <div className={`mt-3 inline-flex items-center gap-1 text-[11px] font-bold ${g.text}`}>
                Explore <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Need Help Today? (Emotional Support) ──────────────────────────────────
function NeedHelpCard() {
  const helps = [
    { emoji: "😫", label: "Not listening",  bg: "bg-rose-100 border-rose-200 text-rose-900 hover:bg-rose-200" },
    { emoji: "😴", label: "Sleep issue",    bg: "bg-indigo-100 border-indigo-200 text-indigo-900 hover:bg-indigo-200" },
    { emoji: "🍽️", label: "Eating problem", bg: "bg-orange-100 border-orange-200 text-orange-900 hover:bg-orange-200" },
  ];
  return (
    <Card className="rounded-3xl shadow-sm border-none overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircleHeart className="h-5 w-5 text-rose-500" />
          <h3 className="font-quicksand font-black text-base">Need help today?</h3>
        </div>
        <p className="text-xs text-foreground/60 mb-3">Tap a topic to chat with Amy AI 💬</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {helps.map((h) => (
            <Link key={h.label} href="/assistant">
              <button className={`w-full text-left rounded-2xl border-2 ${h.bg} px-3 py-3 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2`}>
                <span className="text-xl">{h.emoji}</span>
                <span className="leading-tight">{h.label}</span>
              </button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Rewards Card ───────────────────────────────────────────────────────────
function RewardsCard({ streak }: { streak: number }) {
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState<ReturnType<typeof getBadges>>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null);

  useEffect(() => {
    setPoints(getTotalPoints());
    setBadges(getBadges());
    setRewards(getRewards());
  }, []);

  const handleRedeem = (reward: Reward) => {
    const ok = redeemReward(reward, "Child");
    if (ok) {
      setPoints(getTotalPoints());
      setRedeemMsg(`🎉 Redeemed: ${reward.emoji} ${reward.label}!`);
      setTimeout(() => setRedeemMsg(null), 3000);
    } else {
      setRedeemMsg(`❌ Not enough points (need ${reward.cost})`);
      setTimeout(() => setRedeemMsg(null), 2000);
    }
  };

  return (
    <Card className="rounded-2xl shadow-sm border-border/50 overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 bg-gradient-to-r from-violet-50/60 to-indigo-50/40">
        <div className="flex items-center justify-between">
          <CardTitle className="font-quicksand text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-violet-600" />
            Rewards & Points
          </CardTitle>
          <div className="flex items-center gap-1.5 bg-violet-100 text-violet-700 rounded-full px-3 py-1">
            <Star className="h-3.5 w-3.5 fill-violet-500" />
            <span className="font-black text-sm">{points}</span>
            <span className="text-xs font-medium">pts</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {redeemMsg && (
          <div className="text-sm font-medium text-center py-1.5 px-3 bg-green-50 border border-green-200 rounded-xl text-green-800">
            {redeemMsg}
          </div>
        )}
        {/* Badges */}
        {badges.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Badges Earned</p>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <div key={b.id} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 text-xs font-bold text-amber-800">
                  {b.emoji} {b.label}
                </div>
              ))}
            </div>
          </div>
        )}
        {badges.length === 0 && (
          <p className="text-xs text-muted-foreground">Complete tasks to earn badges! Complete a task to unlock <strong>🌟 First Day Completed</strong>.</p>
        )}
        {/* Reward Store */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Reward Store</p>
          <div className="space-y-2">
            {rewards.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{r.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.cost} pts</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRedeem(r)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                    points >= r.cost
                      ? "bg-violet-600 text-white hover:bg-violet-700"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  Redeem
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AI Co-Parent Suggestions ────────────────────────────────────────────────
function CoParentCard({ routines, streak }: { routines: Routine[]; streak: number }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRoutines = routines.filter((r) => r.date.slice(0, 10) === todayStr);
  const allItems = todayRoutines.flatMap((r) => r.items);
  const total = allItems.length;
  const completed = allItems.filter((i) => i.status === "completed").length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hour = new Date().getHours();

  const suggestions: { emoji: string; text: string; color: string }[] = [];

  if (total === 0) {
    suggestions.push({ emoji: "📅", text: "No routine for today yet. Generate one to get started!", color: "bg-blue-50 border-blue-200 text-blue-800" });
  } else if (pct < 30 && hour >= 14) {
    suggestions.push({ emoji: "⚡", text: "Your child seems behind today — try shorter, easier tasks to build momentum.", color: "bg-amber-50 border-amber-200 text-amber-800" });
  } else if (pct >= 80) {
    suggestions.push({ emoji: "🌟", text: "Amazing progress today! Consider a small reward to celebrate.", color: "bg-green-50 border-green-200 text-green-800" });
  }

  if (hour >= 15 && hour <= 17) {
    suggestions.push({ emoji: "❤️", text: "Good time for a 15-min bonding activity — a quick walk or board game goes a long way.", color: "bg-rose-50 border-rose-200 text-rose-800" });
  }

  if (streak >= 3) {
    suggestions.push({ emoji: "🔥", text: `You're on a ${streak}-day streak! Keep the momentum going — consistency builds habits.`, color: "bg-orange-50 border-orange-200 text-orange-800" });
  } else if (streak === 0 && hour < 10) {
    suggestions.push({ emoji: "☀️", text: "Fresh start today! Generate a routine to set a positive tone for the day.", color: "bg-sky-50 border-sky-200 text-sky-800" });
  }

  if (hour >= 19) {
    suggestions.push({ emoji: "🌙", text: "Wind-down time! Make sure screen time ends 30 min before sleep for better rest.", color: "bg-indigo-50 border-indigo-200 text-indigo-800" });
  }

  const display = suggestions.slice(0, 3);

  return (
    <Card className="rounded-2xl shadow-sm border-border/50 overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 bg-gradient-to-r from-violet-50/40 to-pink-50/30">
        <CardTitle className="font-quicksand text-base flex items-center gap-2">
          <AmyIcon size={24} bounce />
          Amy AI Suggests
        </CardTitle>
        <CardDescription>Caring nudges from Amy 💜</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-2.5">
        {display.map((s, i) => (
          <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border text-sm ${s.color}`}>
            <span className="text-base shrink-0 mt-0.5">{s.emoji}</span>
            <p className="leading-snug">{s.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Parent Score Card ───────────────────────────────────────────────────────
function ParentScoreCard({ routines, streak }: { routines: Routine[]; streak: number }) {
  const last7 = routines.slice(0, 7);
  const totalItems = last7.flatMap((r) => r.items).length;
  const completedItems = last7.flatMap((r) => r.items).filter((i) => i.status === "completed").length;
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const daysActive = last7.length;
  const streakBonus = Math.min(streak * 5, 30);
  const score = Math.min(Math.round(completionRate * 0.5 + daysActive * 5 + streakBonus), 100);

  const percentile = score >= 80 ? 90 : score >= 60 ? 70 : score >= 40 ? 50 : score >= 20 ? 30 : 15;
  const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";
  const gradeColor = score >= 80 ? "text-green-600" : score >= 60 ? "text-blue-600" : score >= 40 ? "text-amber-600" : "text-red-600";

  return (
    <Card className="rounded-2xl shadow-sm border-border/50 overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 bg-gradient-to-r from-green-50/50 to-emerald-50/30">
        <CardTitle className="font-quicksand text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-green-600" />
          Your Parent Score
        </CardTitle>
        <CardDescription>Based on last 7 days of activity</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={score >= 80 ? "#22c55e" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444"}
                strokeWidth="3" strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-black ${gradeColor}`}>{grade}</span>
              <span className="text-[9px] text-muted-foreground font-medium">{score}/100</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold text-foreground">
              You're doing better than <span className="text-primary font-black">{percentile}%</span> of parents!
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Task completion</span>
                <span className="font-bold text-foreground">{completionRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Days active</span>
                <span className="font-bold text-foreground">{daysActive}/7</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-accent h-1.5 rounded-full transition-all" style={{ width: `${(daysActive / 7) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
        {score < 60 && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-2.5">
            💡 Tip: Complete at least 5 tasks per day to boost your score this week!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Onboarding Screen ───────────────────────────────────────────────────────
function OnboardingScreen({ displayName }: { displayName: string }) {
  const features = [
    { icon: <Brain className="h-5 w-5" />, emoji: "🧠", label: "Amy AI Routine Generator", desc: "Smart daily schedules tailored to your child's age and needs.", color: "from-blue-500 to-indigo-500", bg: "bg-blue-50 border-blue-100" },
    { icon: <TrendingUp className="h-5 w-5" />, emoji: "📊", label: "Progress Tracking", desc: "Monitor growth, streaks, and milestones in one beautiful view.", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 border-emerald-100" },
    { icon: <Target className="h-5 w-5" />, emoji: "🎯", label: "Daily Activities", desc: "Age-based activities that build skills while keeping kids engaged.", color: "from-orange-500 to-amber-500", bg: "bg-orange-50 border-orange-100" },
    { icon: <Star className="h-5 w-5" />, emoji: "🧩", label: "Learning & Puzzles", desc: "Adaptive daily puzzles that grow harder as your child levels up.", color: "from-violet-500 to-purple-500", bg: "bg-violet-50 border-violet-100" },
    { icon: <Heart className="h-5 w-5" />, emoji: "❤️", label: "Parenting Tips", desc: "Expert-curated tips, sleep guides, and milestone insights.", color: "from-rose-500 to-pink-500", bg: "bg-rose-50 border-rose-100" },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-start animate-in fade-in duration-700">

      {/* ── Hero gradient card ───────────────────────────────── */}
      <div className="w-full rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 mb-8 text-white text-center relative overflow-hidden shadow-xl">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-12 translate-x-12 blur-sm" />
        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-white/10 translate-y-10 -translate-x-10 blur-sm" />

        {/* Illustration */}
        <div className="relative z-10 flex justify-center mb-5">
          <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* Ground */}
            <ellipse cx="80" cy="128" rx="55" ry="8" fill="white" fillOpacity="0.15" />
            {/* Parent body */}
            <rect x="42" y="68" width="26" height="48" rx="13" fill="white" fillOpacity="0.9" />
            {/* Parent head */}
            <circle cx="55" cy="55" r="18" fill="white" fillOpacity="0.95" />
            {/* Parent face — eyes */}
            <circle cx="49" cy="53" r="2.5" fill="#6366F1" />
            <circle cx="61" cy="53" r="2.5" fill="#6366F1" />
            {/* Parent smile */}
            <path d="M49 60 Q55 65 61 60" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Parent arm reaching out */}
            <path d="M68 82 Q88 72 96 78" stroke="white" strokeOpacity="0.9" strokeWidth="10" strokeLinecap="round" />
            {/* Child body */}
            <rect x="90" y="88" width="22" height="36" rx="11" fill="white" fillOpacity="0.85" />
            {/* Child head */}
            <circle cx="101" cy="76" r="14" fill="white" fillOpacity="0.95" />
            {/* Child face — eyes */}
            <circle cx="96.5" cy="74" r="2" fill="#EC4899" />
            <circle cx="105.5" cy="74" r="2" fill="#EC4899" />
            {/* Child smile */}
            <path d="M97 80 Q101 84 105 80" stroke="#EC4899" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            {/* Stars */}
            <text x="22" y="42" fontSize="16" fill="white" fillOpacity="0.7">✨</text>
            <text x="120" y="50" fontSize="12" fill="white" fillOpacity="0.6">⭐</text>
            <text x="118" y="100" fontSize="10" fill="white" fillOpacity="0.5">🌟</text>
          </svg>
        </div>

        {/* Welcome text */}
        <div className="relative z-10 space-y-2">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest">Meet Amy AI</p>
          <h1 className="text-3xl font-black leading-tight">
            👋 Hi{displayName ? `, ${displayName}` : ""} 😊
          </h1>
          <p className="text-blue-100 text-lg font-medium">I'm Amy — your smart parenting partner ❤️</p>
          <p className="text-blue-200/90 text-sm max-w-xs mx-auto leading-relaxed mt-1">
            Create personalised routines, track progress, and make parenting easier — one day at a time.
          </p>
        </div>
      </div>

      {/* ── Motivation line ──────────────────────────────────── */}
      <div className="w-full flex items-center justify-center gap-2 mb-7">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <p className="text-sm font-bold text-muted-foreground px-3 text-center">
          Start your child's smart routine today 🚀
        </p>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
      </div>

      {/* ── Feature highlights ───────────────────────────────── */}
      <div className="w-full grid grid-cols-1 gap-3 mb-8">
        {features.map((f, i) => (
          <div
            key={f.label}
            className={`flex items-center gap-4 rounded-2xl border p-4 ${f.bg} animate-in slide-in-from-bottom-4 duration-500`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
              {f.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground">{f.emoji} {f.label}</p>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">{f.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* ── Primary CTA ──────────────────────────────────────── */}
      <div className="w-full space-y-3">
        <Link href="/children/new">
          <button className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5" />
            ✨ Create Your First Child Profile
          </button>
        </Link>

        {/* ── AI Coach CTA ───────────────────────────────────── */}
        <Link href="/ai-coach">
          <button className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Parenting Coach — get a plan now
          </button>
        </Link>

        {/* ── Secondary CTA ──────────────────────────────────── */}
        <Link href="/parenting-hub">
          <button className="w-full h-12 rounded-2xl border-2 border-border bg-background text-foreground font-bold text-sm hover:bg-muted/50 hover:border-primary/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
            <BookOpenIcon />
            Explore Parenting Hub
          </button>
        </Link>
      </div>

      {/* ── Bottom note ──────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground text-center mt-6 pb-4">
        Takes less than 1 minute to set up · Works for ages 0–15 years
      </p>
    </div>
  );
}

function BookOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useUser();
  const authFetch = useAuthFetch();
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    authFetch("/api/parent-profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.name) setProfileName(data.name);
      })
      .catch(() => {});
  }, []);

  const displayName = profileName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "";

  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: routines, isLoading: loadingRoutines } = useGetRecentRoutines({
    query: { queryKey: getGetRecentRoutinesQueryKey() }
  });

  const { data: allRoutines } = useListRoutines(undefined, {
    query: { queryKey: getListRoutinesQueryKey() }
  });

  const { data: childrenList } = useListChildren({
    query: { queryKey: getListChildrenQueryKey() }
  });

  const { data: stats, isLoading: loadingStats } = useGetBehaviorStats({
    query: { queryKey: getGetBehaviorStatsQueryKey() }
  });

  const streak = computeStreak((allRoutines ?? []) as Routine[]);

  // Show onboarding for new users with no child profiles yet
  const noChildren = !loadingSummary && (summary?.totalChildren ?? 0) === 0;
  if (noChildren) {
    return <OnboardingScreen displayName={displayName} />;
  }

  // Show skeleton while loading for first-time load
  if (loadingSummary) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-64 rounded-2xl" />
        <Skeleton className="h-4 w-48 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-500 pb-8">

      {/* ── Hero greeting (TinyPal-style soft gradient) ─────────── */}
      <HeroGreeting displayName={displayName} hasChildren={(childrenList?.length ?? 0) > 0} />

      {/* ── Children profile strip (horizontal scroll) ──────────── */}
      <ChildrenStrip children={childrenList ?? []} />

      {/* ── Now / Next timeline + Streak ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <NowNextTimeline routines={(allRoutines ?? []) as Routine[]} />
        </div>

        {/* Streak mini-card — softer pastel */}
        <Link href="/progress">
          <Card className={`rounded-3xl border-none shadow-sm cursor-pointer hover:shadow-md transition-all h-full ${streak >= 3 ? "bg-gradient-to-br from-orange-300 to-rose-400" : streak > 0 ? "bg-gradient-to-br from-amber-100 to-orange-100" : "bg-gradient-to-br from-muted/30 to-muted/10 border-2 border-dashed border-border"}`}>
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center min-h-[100px]">
              <div className={`text-3xl mb-1 ${streak === 0 ? "grayscale opacity-40" : ""}`}>🔥</div>
              <div className={`font-black text-2xl ${streak >= 3 ? "text-white" : streak > 0 ? "text-orange-700" : "text-muted-foreground"}`}>
                {streak}
              </div>
              <div className={`text-xs font-bold ${streak >= 3 ? "text-white/85" : streak > 0 ? "text-orange-600" : "text-muted-foreground"}`}>
                Day Streak
              </div>
              <div className={`text-[10px] mt-1 ${streak >= 3 ? "text-white/70" : "text-muted-foreground"}`}>
                {streak === 0 ? "Start today!" : "Tap for progress"}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Goal-Based Cards (TinyPal style) ────────────────────── */}
      <GoalCards />

      {/* ── Need Help Today? (Emotional Support) ────────────────── */}
      <NeedHelpCard />

      {/* ── Summary Stats — softer pastel ───────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {loadingSummary ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-violet-50 to-purple-50">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-violet-700 font-bold text-xs">Routines</span>
                  <Calendar className="h-4 w-4 text-violet-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-violet-700">{summary?.routinesGeneratedThisWeek || 0}</span>
                  <span className="text-[10px] text-violet-500/80">this week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-emerald-700 font-bold text-xs">Great Job</span>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-700">{summary?.positiveBehaviorsToday || 0}</span>
                  <span className="text-[10px] text-emerald-500/80">today</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-rose-50 to-pink-50">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-rose-700 font-bold text-xs">Challenging</span>
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-rose-700">{summary?.negativeBehaviorsToday || 0}</span>
                  <span className="text-[10px] text-rose-500/80">today</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-700 font-bold text-xs">Children</span>
                  <Users className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-700">{summary?.totalChildren || 0}</span>
                  <span className="text-[10px] text-amber-500/80">total</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Today's Suggestion + Parent Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CoParentCard routines={(allRoutines ?? []) as Routine[]} streak={streak} />
        <ParentScoreCard routines={(allRoutines ?? []) as Routine[]} streak={streak} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Routines */}
        <Card className="rounded-2xl shadow-sm border-border/50 overflow-hidden flex flex-col">
          <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-quicksand text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Recent Routines
                </CardTitle>
                <CardDescription>Latest generated schedules</CardDescription>
              </div>
              <Link href="/routines" className="text-sm font-medium text-primary hover:underline flex items-center">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {loadingRoutines ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : routines && routines.length > 0 ? (
              <div className="divide-y divide-border/50">
                {routines.map((routine) => {
                  const items = routine.items as RoutineItem[];
                  const done = items.filter((i) => i.status === "completed").length;
                  const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
                  return (
                    <Link key={routine.id} href={`/routines/${routine.id}`} className="block hover:bg-muted/30 transition-colors p-4 group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{routine.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span className="inline-flex items-center justify-center rounded-full bg-secondary/50 px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                              {routine.childName}
                            </span>
                            <span>{new Date(routine.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {items.length > 0 && (
                            <div className="text-right">
                              <div className="text-xs font-bold text-foreground">{pct}%</div>
                              <div className="text-[10px] text-muted-foreground">{done}/{items.length}</div>
                            </div>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground h-full min-h-[200px]">
                <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p>No routines created yet.</p>
                <Link href="/routines/generate" className="mt-4 text-primary font-medium hover:underline">
                  Create your first routine
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Behavior Highlights */}
        <Card className="rounded-2xl shadow-sm border-border/50 overflow-hidden flex flex-col">
          <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-quicksand text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-accent" />
                  Behavior Highlights
                </CardTitle>
                <CardDescription>Overall stats by child</CardDescription>
              </div>
              <Link href="/behavior" className="text-sm font-medium text-accent hover:underline flex items-center">
                Log behavior <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {loadingStats ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : stats && stats.length > 0 ? (
              <div className="divide-y divide-border/50">
                {stats.map((stat) => (
                  <div key={stat.childId} className="p-4">
                    <h4 className="font-bold text-foreground mb-3">{stat.childName}</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 flex-1 bg-accent/10 rounded-lg p-2">
                        <div className="bg-accent/20 p-1 rounded-md text-accent">
                          <TrendingUp className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-bold text-accent">{stat.positive}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 bg-destructive/10 rounded-lg p-2">
                        <div className="bg-destructive/20 p-1 rounded-md text-destructive">
                          <TrendingDown className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-bold text-destructive">{stat.negative}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 bg-muted rounded-lg p-2">
                        <div className="bg-foreground/10 p-1 rounded-md text-foreground/70">
                          <Minus className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-bold text-foreground/70">{stat.neutral}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground h-full min-h-[200px]">
                <Star className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p>No behavior logged yet.</p>
                <Link href="/behavior" className="mt-4 text-accent font-medium hover:underline">
                  Track a behavior
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rewards Card */}
      <RewardsCard streak={streak} />

      {/* ── Friendly Primary CTA ────────────────────────────────── */}
      <Link href="/routines/generate">
        <button className="w-full h-14 rounded-3xl bg-gradient-to-r from-violet-500 via-pink-500 to-rose-500 text-white font-black text-base shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5" />
          ✨ Plan My Child's Day
        </button>
      </Link>
    </div>
  );
}
