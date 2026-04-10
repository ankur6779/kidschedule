import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetRecentRoutines, getGetRecentRoutinesQueryKey, useGetBehaviorStats, getGetBehaviorStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Calendar, Users, Star, ArrowRight, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Dashboard() {
  const { user } = useUser();
  const firstName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "";

  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: routines, isLoading: loadingRoutines } = useGetRecentRoutines({
    query: { queryKey: getGetRecentRoutinesQueryKey() }
  });

  const { data: stats, isLoading: loadingStats } = useGetBehaviorStats({
    query: { queryKey: getGetBehaviorStatsQueryKey() }
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <header>
        <h1 className="font-quicksand text-3xl font-bold text-foreground">
          {getGreeting()}{firstName ? `, ${firstName}` : ""}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's a look at how things are going today.</p>
      </header>

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
                {routines.map((routine) => (
                  <Link key={routine.id} href={`/routines/${routine.id}`} className="block hover:bg-muted/30 transition-colors p-4 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{routine.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span className="inline-flex items-center justify-center rounded-full bg-secondary/50 px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            {routine.childName}
                          </span>
                          <span>{new Date(routine.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
                    </div>
                  </Link>
                ))}
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
