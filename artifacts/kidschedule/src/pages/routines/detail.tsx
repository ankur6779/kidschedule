import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, Link, useParams } from "wouter";
import { useGetRoutine, getGetRoutineQueryKey, useDeleteRoutine, getListRoutinesQueryKey, useGetChild, getGetChildQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { getActivityImage } from "@/lib/activity-images";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar as CalendarIcon, User, Trash2, Sparkles, Check, SkipForward, Clock, Bell, BellOff, Share2, Copy, ChefHat, Timer, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ItemStatus = "pending" | "completed" | "skipped" | "delayed";

type RoutineItem = {
  time: string;
  activity: string;
  duration: number;
  category: string;
  notes?: string;
  status?: ItemStatus;
};

const CATEGORY_STYLES: Record<string, string> = {
  morning:    "bg-amber-100 text-amber-800 border-amber-200",
  meal:       "bg-orange-100 text-orange-800 border-orange-200",
  school:     "bg-blue-100 text-blue-800 border-blue-200",
  travel:     "bg-indigo-100 text-indigo-800 border-indigo-200",
  homework:   "bg-purple-100 text-purple-800 border-purple-200",
  play:       "bg-green-100 text-green-800 border-green-200",
  exercise:   "bg-lime-100 text-lime-800 border-lime-200",
  screen:     "bg-cyan-100 text-cyan-800 border-cyan-200",
  hygiene:    "bg-pink-100 text-pink-800 border-pink-200",
  sleep:      "bg-slate-100 text-slate-600 border-slate-200",
  "wind-down":"bg-violet-100 text-violet-700 border-violet-200",
  bonding:    "bg-rose-100 text-rose-800 border-rose-200",
  tiffin:     "bg-amber-100 text-amber-800 border-amber-200",
};

const STATUS_STYLES: Record<ItemStatus, string> = {
  pending:   "",
  completed: "border-green-400 bg-green-50",
  skipped:   "border-dashed border-muted-foreground/30 opacity-60",
  delayed:   "border-amber-400 bg-amber-50",
};

function parse12hToMinutes(timeStr: string): number {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return -1;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function shiftScheduleFromIndex(items: RoutineItem[], fromIndex: number, delayMinutes: number): RoutineItem[] {
  const updated = [...items];
  for (let i = fromIndex; i < updated.length; i++) {
    const mins = parse12hToMinutes(updated[i].time);
    if (mins >= 0) {
      updated[i] = { ...updated[i], time: minutesToTime(mins + delayMinutes) };
    }
  }
  return updated;
}

export default function RoutineDetail() {
  const [_, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const routineId = parseInt(params.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  const [localItems, setLocalItems] = useState<RoutineItem[] | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [babysitterInfo, setBabysitterInfo] = useState<{ name: string; mobileNumber?: string | null } | null>(null);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [recipeData, setRecipeData] = useState<any>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const notifTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { data: routine, isLoading } = useGetRoutine(routineId, {
    query: { enabled: !!routineId, queryKey: getGetRoutineQueryKey(routineId) }
  });

  const childId = (routine as any)?.childId ?? 0;
  const { data: childData } = useGetChild(childId, {
    query: { enabled: !!childId, queryKey: getGetChildQueryKey(childId) }
  });
  const childPhotoUrl: string | null = (childData as any)?.photoUrl ?? null;

  useEffect(() => {
    if (routine?.items && !localItems) {
      setLocalItems(routine.items as RoutineItem[]);
    }
    // Fetch babysitter assigned to this child
    if (routine?.childId) {
      authFetch(`/api/children/${routine.childId}`)
        .then((r) => r.ok ? r.json() : null)
        .then((child: any) => {
          if (child?.babysitterId) {
            authFetch("/api/babysitters")
              .then((r) => r.json())
              .then((sitters: { id: number; name: string; mobileNumber?: string | null }[]) => {
                const sitter = sitters.find((s) => s.id === child.babysitterId);
                if (sitter) setBabysitterInfo(sitter);
              });
          }
        })
        .catch(() => {});
    }
  }, [routine]);

  const buildShareMessage = () => {
    if (!routine) return "";
    const lines = [
      `📅 ${routine.title}`,
      `👧 Child: ${routine.childName}`,
      `📆 Date: ${new Date(routine.date).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}`,
      "",
      "📋 ROUTINE:",
      ...items.map((item) => `• ${item.time} — ${item.activity} (${item.duration} min)${item.notes ? `\n  💡 ${item.notes}` : ""}`),
      "",
      "— Sent via AmyNest",
    ];
    return lines.join("\n");
  };

  const copyShareMessage = () => {
    const msg = buildShareMessage();
    navigator.clipboard.writeText(msg).then(() => {
      toast({ title: "Copied!", description: "Routine copied. Paste it into WhatsApp or SMS." });
    });
  };

  const fetchRecipe = async (mealName: string) => {
    setSelectedMeal(mealName);
    setRecipeData(null);
    setRecipeOpen(true);
    setRecipeLoading(true);
    try {
      const res = await authFetch(getApiUrl("/api/ai/recipe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealName, childAge: routine?.childName ? undefined : undefined }),
      });
      if (!res.ok) throw new Error("Failed to fetch recipe");
      const data = await res.json();
      setRecipeData(data);
    } catch {
      toast({ title: "Could not load recipe", variant: "destructive" });
      setRecipeOpen(false);
    } finally {
      setRecipeLoading(false);
    }
  };

  const deleteMutation = useDeleteRoutine();

  // Save items to backend
  const saveItemsMutation = useMutation({
    mutationFn: async (items: RoutineItem[]) => {
      const res = await authFetch(getApiUrl(`/api/routines/${routineId}/items`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetRoutineQueryKey(routineId) });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(
      { id: routineId },
      {
        onSuccess: () => {
          toast({ title: "Routine deleted" });
          queryClient.invalidateQueries({ queryKey: getListRoutinesQueryKey() });
          setLocation("/routines");
        },
        onError: () => toast({ title: "Failed to delete routine", variant: "destructive" }),
      }
    );
  };

  const updateItemStatus = useCallback((index: number, status: ItemStatus) => {
    setLocalItems((prev) => {
      if (!prev) return prev;
      let updated = prev.map((item, i) => i === index ? { ...item, status } : item);

      // Adaptive: if marked delayed, shift next items by 15 min
      if (status === "delayed") {
        updated = shiftScheduleFromIndex(updated, index + 1, 15);
        toast({ title: "⏱ Schedule shifted +15 min", description: "Remaining tasks adjusted for the delay." });
      }

      saveItemsMutation.mutate(updated);
      return updated;
    });
  }, [saveItemsMutation, toast]);

  // Notifications
  const scheduleNotifications = useCallback((items: RoutineItem[]) => {
    notifTimersRef.current.forEach(clearTimeout);
    notifTimersRef.current = [];

    const now = new Date();
    const todayBase = new Date(now);
    todayBase.setSeconds(0, 0);

    items.forEach((item, i) => {
      const mins = parse12hToMinutes(item.time);
      if (mins < 0) return;

      const taskDate = new Date(todayBase);
      taskDate.setHours(Math.floor(mins / 60), mins % 60, 0, 0);

      const msUntilTask = taskDate.getTime() - Date.now();
      if (msUntilTask <= 0) return;

      const timerId = setTimeout(() => {
        new Notification(`⏰ Time for: ${item.activity}`, {
          body: item.notes || `${item.duration} min · ${item.category}`,
          icon: "/amynest-logo.png",
          tag: `routine-${routineId}-${i}`,
        });
      }, msUntilTask);

      notifTimersRef.current.push(timerId);
    });
  }, [routineId]);

  const toggleNotifications = async () => {
    if (!("Notification" in window)) {
      toast({ title: "Notifications not supported", description: "Your browser does not support notifications.", variant: "destructive" });
      return;
    }
    if (notificationsEnabled) {
      notifTimersRef.current.forEach(clearTimeout);
      notifTimersRef.current = [];
      setNotificationsEnabled(false);
      toast({ title: "Notifications disabled" });
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      const items = localItems ?? (routine?.items as RoutineItem[]) ?? [];
      scheduleNotifications(items);
      setNotificationsEnabled(true);
      toast({ title: "🔔 Notifications enabled!", description: "You'll be notified before each task." });
    } else {
      toast({ title: "Permission denied", description: "Enable notifications in your browser settings.", variant: "destructive" });
    }
  };

  useEffect(() => () => notifTimersRef.current.forEach(clearTimeout), []);

  const getCategoryStyle = (category: string) => {
    const key = Object.keys(CATEGORY_STYLES).find((k) => category.toLowerCase().includes(k));
    return key ? CATEGORY_STYLES[key] : "bg-muted text-foreground border-border";
  };

  const items = localItems ?? (routine?.items as RoutineItem[]) ?? [];

  const completedCount = items.filter((i) => i.status === "completed").length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
        <div className="h-12 w-3/4 bg-muted animate-pulse rounded-xl" />
        <div className="space-y-4 mt-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-bold mb-2">Routine not found</h2>
        <Button asChild><Link href="/routines">Back to Routines</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-3xl mx-auto pb-10">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="rounded-full -ml-2 text-muted-foreground hover:text-foreground">
            <Link href="/routines">
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleNotifications}
              className="rounded-full gap-2"
            >
              {notificationsEnabled ? (
                <><BellOff className="h-4 w-4" /> Notifications On</>
              ) : (
                <><Bell className="h-4 w-4" /> Notify Me</>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareOpen(true)}
              className="rounded-full gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this routine?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this schedule. You can always generate a new one.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Delete Routine
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-primary font-medium mb-2">
            <Sparkles className="h-4 w-4" />
            AI Generated Schedule
          </div>
          <h1 className="font-quicksand text-3xl sm:text-4xl font-bold text-foreground">{routine.title}</h1>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 bg-secondary/30 text-secondary-foreground border border-secondary/50 px-3 py-1 rounded-full text-sm font-medium">
              {childPhotoUrl ? (
                <img src={childPhotoUrl} alt={routine.childName} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
              {routine.childName}
            </div>
            <div className="flex items-center gap-1.5 bg-muted px-3 py-1 rounded-full text-sm font-medium text-foreground/80">
              <CalendarIcon className="h-3.5 w-3.5" />
              {new Date(routine.date).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="bg-muted rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2 text-sm font-medium">
              <span className="text-foreground">{completedCount} of {totalCount} tasks done</span>
              <span className="text-primary font-bold">{progress}%</span>
            </div>
            <div className="h-2.5 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <div className="relative mt-2">
        <div className="absolute left-[39px] sm:left-[55px] top-4 bottom-4 w-0.5 bg-border/60 z-0 rounded-full" />

        <div className="space-y-3 relative z-10">
          {items.map((item, index) => {
            const status = item.status ?? "pending";
            const catStyle = getCategoryStyle(item.category);
            const statusStyle = STATUS_STYLES[status];

            return (
              <div key={index} className="flex gap-4 sm:gap-6 group">
                {/* Time column */}
                <div className="flex flex-col items-center pt-3 w-[80px] sm:w-[110px] shrink-0 bg-background">
                  <div className="text-sm font-bold text-foreground text-right w-full pr-2 sm:pr-4">{item.time}</div>
                  <div className="text-xs text-muted-foreground font-medium text-right w-full pr-2 sm:pr-4">{item.duration}m</div>
                </div>

                {/* Activity Card */}
                <Card className={`flex-1 rounded-2xl shadow-sm border-2 overflow-hidden transition-all duration-200 hover:shadow-md ${item.category === "bonding" && !statusStyle ? "border-rose-200" : statusStyle || "border-border"}`}>
                  {item.category === "bonding" && (
                    <div className="bg-rose-50 border-b border-rose-100 px-4 py-1.5 flex items-center gap-1.5">
                      <span className="text-rose-500 text-xs">❤️</span>
                      <span className="text-rose-600 text-xs font-bold">Family Bonding Time</span>
                    </div>
                  )}
                  {item.category === "tiffin" && (
                    <div className="bg-amber-50 border-b border-amber-100 px-4 py-1.5 flex items-center gap-1.5">
                      <span className="text-amber-500 text-xs">🍱</span>
                      <span className="text-amber-700 text-xs font-bold">Tiffin / Lunchbox Prep</span>
                    </div>
                  )}
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        {/* Activity Illustration */}
                        <div className="relative shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-muted/50 shadow-sm">
                          {(() => {
                            const seed = (routineId ?? 0) * 100 + index;
                            const imgData = getActivityImage(item.category, item.activity, seed);
                            return (
                              <>
                                <img
                                  src={imgData.src}
                                  alt={item.activity}
                                  className={`w-full h-full object-cover ${status === "skipped" ? "grayscale opacity-50" : status === "completed" ? "opacity-80" : ""}`}
                                />
                                {imgData.variant === "negative" && (
                                  <div className="absolute bottom-0.5 right-0.5 bg-amber-400 rounded-full text-[8px] w-4 h-4 flex items-center justify-center">⚠️</div>
                                )}
                                {status === "completed" && (
                                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                    <div className="bg-green-500 rounded-full w-5 h-5 flex items-center justify-center">
                                      <span className="text-white text-[10px] font-black">✓</span>
                                    </div>
                                  </div>
                                )}
                                {/* Child photo avatar overlay */}
                                {childPhotoUrl && (
                                  <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full border-2 border-background overflow-hidden bg-muted shadow-sm">
                                    <img src={childPhotoUrl} alt={routine?.childName} className="w-full h-full object-cover" />
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-base text-foreground leading-tight ${status === "skipped" ? "line-through text-muted-foreground" : ""}`}>
                            {item.activity}
                          </h3>
                          {item.notes && item.notes.startsWith("Options:") ? (
                            <div className="mt-1.5 space-y-1.5">
                              <p className="text-xs text-muted-foreground font-medium">🍽️ Today's options:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {item.notes.replace("Options:", "").split("|").map((opt, oi) => {
                                  const meal = opt.trim();
                                  return (
                                    <button
                                      key={oi}
                                      onClick={() => fetchRecipe(meal)}
                                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
                                    >
                                      <ChefHat className="h-3 w-3" />
                                      {meal}
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground">Tap a meal to view its recipe</p>
                            </div>
                          ) : item.notes ? (
                            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{item.notes}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {status === "completed" && <Badge className="bg-green-100 text-green-700 border-green-200 rounded-full text-xs font-bold">✓ Done</Badge>}
                          {status === "skipped" && <Badge className="bg-muted text-muted-foreground border-border rounded-full text-xs font-bold">Skipped</Badge>}
                          {status === "delayed" && <Badge className="bg-amber-100 text-amber-700 border-amber-200 rounded-full text-xs font-bold">⏱ Delayed</Badge>}
                          <Badge className={`rounded-full text-xs font-bold border ${catStyle}`}>
                            {item.category}
                          </Badge>
                        </div>
                      </div>

                      {/* Status action buttons */}
                      {status !== "completed" && status !== "skipped" && (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => updateItemStatus(index, "completed")}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors border border-green-200"
                          >
                            <Check className="h-3 w-3" /> Complete
                          </button>
                          <button
                            onClick={() => updateItemStatus(index, "delayed")}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors border border-amber-200"
                          >
                            <Clock className="h-3 w-3" /> Delayed (+15m)
                          </button>
                          <button
                            onClick={() => updateItemStatus(index, "skipped")}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors border border-border"
                          >
                            <SkipForward className="h-3 w-3" /> Skip
                          </button>
                        </div>
                      )}

                      {/* Undo for completed/skipped */}
                      {(status === "completed" || status === "skipped") && (
                        <button
                          onClick={() => updateItemStatus(index, "pending")}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
                        >
                          ↩ Undo
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-center pb-8 border-t border-border/50 pt-8">
        <Button asChild variant="outline" className="rounded-full shadow-sm">
          <Link href="/behavior">Log Today's Behavior</Link>
        </Button>
      </div>

      {/* Recipe Dialog */}
      <Dialog open={recipeOpen} onOpenChange={setRecipeOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-quicksand flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-orange-500" />
              {recipeLoading ? "Loading Recipe..." : (recipeData?.name ?? selectedMeal)}
            </DialogTitle>
          </DialogHeader>

          {recipeLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="bg-orange-50 text-orange-500 w-16 h-16 rounded-full flex items-center justify-center">
                <ChefHat className="h-8 w-8 animate-bounce" />
              </div>
              <p className="text-muted-foreground text-sm">Generating recipe...</p>
            </div>
          )}

          {recipeData && !recipeLoading && (
            <div className="space-y-5">
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center bg-orange-50 rounded-xl p-2.5 text-center">
                  <Timer className="h-4 w-4 text-orange-500 mb-1" />
                  <p className="text-xs font-bold text-foreground">{recipeData.prepTime}</p>
                  <p className="text-xs text-muted-foreground">Prep</p>
                </div>
                <div className="flex flex-col items-center bg-red-50 rounded-xl p-2.5 text-center">
                  <Timer className="h-4 w-4 text-red-500 mb-1" />
                  <p className="text-xs font-bold text-foreground">{recipeData.cookTime}</p>
                  <p className="text-xs text-muted-foreground">Cook</p>
                </div>
                <div className="flex flex-col items-center bg-green-50 rounded-xl p-2.5 text-center">
                  <Users className="h-4 w-4 text-green-600 mb-1" />
                  <p className="text-xs font-bold text-foreground">{recipeData.servings}</p>
                  <p className="text-xs text-muted-foreground">Serves</p>
                </div>
              </div>

              <Separator />

              {/* Ingredients */}
              <div>
                <h4 className="font-bold text-sm mb-2 text-foreground">Ingredients</h4>
                <ul className="space-y-1.5">
                  {recipeData.ingredients?.map((ing: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <span className="text-orange-400 font-bold mt-0.5">•</span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* Steps */}
              <div>
                <h4 className="font-bold text-sm mb-3 text-foreground">Instructions</h4>
                <ol className="space-y-3">
                  {recipeData.steps?.map((s: { step: number; instruction: string }) => (
                    <li key={s.step} className="flex gap-3">
                      <span className="bg-orange-100 text-orange-700 font-bold text-xs rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">{s.step}</span>
                      <p className="text-sm text-foreground/80 leading-relaxed">{s.instruction}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {recipeData.tips && (
                <>
                  <Separator />
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-amber-800 mb-1">💡 Parent Tip</p>
                    <p className="text-xs text-amber-700 leading-relaxed">{recipeData.tips}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-quicksand flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share Routine
            </DialogTitle>
          </DialogHeader>

          {babysitterInfo && (
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-bold text-primary">{babysitterInfo.name[0]?.toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold text-sm">{babysitterInfo.name}</p>
                {babysitterInfo.mobileNumber && (
                  <p className="text-xs text-muted-foreground">{babysitterInfo.mobileNumber}</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded-xl p-3 text-sm font-mono whitespace-pre-wrap text-foreground/80 max-h-64 overflow-y-auto">
            {buildShareMessage()}
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={copyShareMessage} className="rounded-xl w-full">
              <Copy className="h-4 w-4 mr-2" />
              Copy Routine Text
            </Button>
            {babysitterInfo?.mobileNumber && (
              <a
                href={`https://wa.me/${babysitterInfo.mobileNumber.replace(/\D/g, "")}?text=${encodeURIComponent(buildShareMessage())}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="rounded-xl w-full">
                  💬 Open in WhatsApp
                </Button>
              </a>
            )}
            <p className="text-xs text-center text-muted-foreground">
              Copy the text above and paste it into WhatsApp, SMS, or any messaging app.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
