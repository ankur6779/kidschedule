import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetRecentRoutines, getGetRecentRoutinesQueryKey, useGetBehaviorStats, getGetBehaviorStatsQueryKey, useListRoutines, getListRoutinesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Calendar, Users, Star, ArrowRight, Activity, TrendingUp, TrendingDown, Minus, Clock, CheckCircle2, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";

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

function TodayScheduleCard({ routines }: { routines: Routine[] }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRoutines = routines.filter((r) => r.date.slice(0, 10) === todayStr);

  if (todayRoutines.length === 0) return null;

  // Get current time in minutes
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Merge all today's items and find current/upcoming
  const allItems = todayRoutines.flatMap((r) =>
    r.items.map((item) => ({ ...item, childName: r.childName, routineId: r.id }))
  ).sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

  // Find current item (the one whose time has passed but next one hasn't started)
  let currentIdx = -1;
  for (let i = 0; i < allItems.length; i++) {
    const itemMinutes = parseTimeToMinutes(allItems[i].time);
    const nextMinutes = i + 1 < allItems.length ? parseTimeToMinutes(allItems[i + 1].time) : 24 * 60;
    if (itemMinutes <= nowMinutes && nowMinutes < nextMinutes) {
      currentIdx = i;
      break;
    }
  }

  // Show: current + next 2 upcoming
  const displayItems = currentIdx >= 0
    ? allItems.slice(currentIdx, currentIdx + 3)
    : allItems.filter((item) => parseTimeToMinutes(item.time) > nowMinutes).slice(0, 3);

  if (displayItems.length === 0) return null;

  return (
    <Card className="rounded-2xl shadow-sm border-border/50 overflow-hidden">
      <CardHeader className="bg-primary/5 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="font-quicksand text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Today's Schedule
          </CardTitle>
          <Link href="/routines" className="text-xs font-medium text-primary hover:underline flex items-center">
            View all <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {displayItems.map((item, idx) => {
          const isCurrent = currentIdx >= 0 && idx === 0;
          return (
            <Link key={`${item.routineId}-${idx}`} href={`/routines/${item.routineId}`}>
              <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${isCurrent ? "bg-primary text-primary-foreground" : "bg-muted/30 hover:bg-muted/60"}`}>
                <div className="text-xs font-bold w-12 shrink-0 text-right opacity-80">{item.time}</div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm truncate ${item.status === "completed" ? "line-through opacity-60" : ""}`}>{item.activity}</div>
                  <div className={`text-[10px] ${isCurrent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {item.childName} · {item.duration}m
                  </div>
                </div>
                {isCurrent && (
                  <div className="shrink-0 bg-white/20 text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">NOW</div>
                )}
                {item.status === "completed" && !isCurrent && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                )}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
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

  const { data: stats, isLoading: loadingStats } = useGetBehaviorStats({
    query: { queryKey: getGetBehaviorStatsQueryKey() }
  });

  const streak = computeStreak((allRoutines ?? []) as Routine[]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <header>
        <h1 className="font-quicksand text-3xl font-bold text-foreground">
          {getGreeting()}{displayName ? `, ${displayName}` : ""}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's a look at how things are going today.</p>
      </header>

      {/* Today's Schedule + Streak row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <TodayScheduleCard routines={(allRoutines ?? []) as Routine[]} />
        </div>

        {/* Streak mini-card */}
        <Link href="/progress">
          <Card className={`rounded-2xl border-none shadow-sm cursor-pointer hover:shadow-md transition-all h-full ${streak >= 3 ? "bg-gradient-to-br from-orange-400 to-rose-500" : streak > 0 ? "bg-gradient-to-br from-orange-100 to-amber-100" : "bg-muted/30 border border-dashed border-border"}`}>
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center min-h-[80px]">
              <div className={`text-3xl mb-1 ${streak === 0 ? "grayscale opacity-40" : ""}`}>🔥</div>
              <div className={`font-black text-2xl ${streak >= 3 ? "text-white" : streak > 0 ? "text-orange-700" : "text-muted-foreground"}`}>
                {streak}
              </div>
              <div className={`text-xs font-bold ${streak >= 3 ? "text-white/80" : streak > 0 ? "text-orange-600" : "text-muted-foreground"}`}>
                {streak === 1 ? "Day Streak" : "Day Streak"}
              </div>
              <div className={`text-[10px] mt-1 ${streak >= 3 ? "text-white/60" : "text-muted-foreground"}`}>
                {streak === 0 ? "Start today!" : "Tap for progress"}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {loadingSummary ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <Card className="rounded-2xl border-none shadow-sm bg-primary/10">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-primary font-medium text-sm">Routines</span>
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">{summary?.routinesGeneratedThisWeek || 0}</span>
                  <span className="text-xs text-primary/70">this week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-accent/10">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-accent font-medium text-sm">Great Job</span>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-accent">{summary?.positiveBehaviorsToday || 0}</span>
                  <span className="text-xs text-accent/70">today</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-destructive/10">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-destructive font-medium text-sm">Challenging</span>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-destructive">{summary?.negativeBehaviorsToday || 0}</span>
                  <span className="text-xs text-destructive/70">today</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="rounded-2xl border-none shadow-sm bg-secondary/20">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground/70 font-medium text-sm">Children</span>
                  <Users className="h-4 w-4 text-foreground/50" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">{summary?.totalChildren || 0}</span>
                  <span className="text-xs text-foreground/50">total</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
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
    </div>
  );
}
