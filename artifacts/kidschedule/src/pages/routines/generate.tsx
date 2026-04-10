import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useListChildren, getListChildrenQueryKey, useGenerateRoutine, useCreateRoutine, getListRoutinesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Calendar, User, Clock, GraduationCap, Car, Refrigerator, School, Briefcase, Heart, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { format } from "date-fns";

const TRAVEL_MODE_LABELS: Record<string, string> = {
  van: "🚐 Van / Bus",
  car: "🚗 Car",
  walk: "🚶 Walking",
  other: "✏️ Custom",
};

function ToggleGroup({
  value,
  onChange,
  options,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  options: [string, boolean, string][];
}) {
  return (
    <div className="flex gap-3">
      {options.map(([label, val, emoji]) => (
        <button
          key={String(val)}
          onClick={() => onChange(val)}
          className={`flex-1 py-3 px-4 rounded-2xl font-bold border-2 transition-all text-sm flex items-center justify-center gap-2 ${
            value === val
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted"
          }`}
        >
          {emoji} {label}
        </button>
      ))}
    </div>
  );
}

export default function RoutineGenerate() {
  const [_, setLocation] = useLocation();
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [hasSchool, setHasSchool] = useState<boolean | null>(null);
  const [isWorkingDay, setIsWorkingDay] = useState<boolean | null>(null);
  const [specialPlans, setSpecialPlans] = useState("");
  const [fridgeItems, setFridgeItems] = useState("");
  const [parentWorkType, setParentWorkType] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  const { data: children, isLoading: loadingChildren } = useListChildren({
    query: { queryKey: getListChildrenQueryKey() }
  });

  const generateMutation = useGenerateRoutine();
  const createMutation = useCreateRoutine();

  useEffect(() => {
    authFetch("/api/parent-profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data: any) => {
        if (data?.workType) setParentWorkType(data.workType);
      })
      .catch(() => {});
  }, []);

  const showWorkingDayQuestion = parentWorkType === "work_from_office" || parentWorkType === "work_from_home";

  const isFormValid = selectedChild && date && hasSchool !== null;
  const isGenerating = generateMutation.isPending || createMutation.isPending;

  const selectedChildData = children?.find((c) => c.id === selectedChild);

  const handleGenerate = () => {
    if (!isFormValid) return;

    generateMutation.mutate(
      {
        data: {
          childId: selectedChild!,
          date,
          hasSchool: hasSchool ?? undefined,
          isWorkingDay: showWorkingDayQuestion && isWorkingDay !== null ? isWorkingDay : undefined,
          specialPlans: specialPlans.trim() || undefined,
          fridgeItems: fridgeItems.trim() || undefined,
        }
      },
      {
        onSuccess: (generatedData) => {
          createMutation.mutate(
            {
              data: {
                childId: selectedChild!,
                date,
                title: generatedData.title,
                items: generatedData.items,
              }
            },
            {
              onSuccess: (savedRoutine) => {
                toast({ title: "✨ Routine generated!" });
                queryClient.invalidateQueries({ queryKey: getListRoutinesQueryKey() });
                setLocation(`/routines/${savedRoutine.id}`);
              },
              onError: () => toast({ title: "Failed to save routine", variant: "destructive" }),
            }
          );
        },
        onError: () => toast({ title: "Failed to generate routine", variant: "destructive" }),
      }
    );
  };

  const stepCount = showWorkingDayQuestion ? 5 : 4;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/routines"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="font-quicksand text-3xl font-bold text-foreground">Generate Routine</h1>
          <p className="text-muted-foreground mt-1">AI builds a smart daily plan around your schedule.</p>
        </div>
      </header>

      {isGenerating ? (
        <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-card mt-8">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative bg-primary/10 text-primary w-20 h-20 rounded-full flex items-center justify-center">
                <Sparkles className="h-10 w-10 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="font-quicksand text-2xl font-bold mb-2">Crafting the perfect day...</h3>
              <p className="text-muted-foreground">
                Analyzing school schedule, parent availability, special plans, and behavior history to build a smart routine with family bonding time.
              </p>
            </div>
            <div className="w-full max-w-xs bg-muted rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-primary h-full rounded-full w-1/2 animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-card mt-4">
          <CardContent className="p-6 sm:p-8 space-y-8">

            {/* Step 1 — Select Child */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">1</div>
                <Label className="text-lg font-bold">Who is this schedule for?</Label>
              </div>

              <div className="flex flex-wrap gap-3">
                {loadingChildren ? (
                  <div className="animate-pulse bg-muted h-12 w-32 rounded-xl" />
                ) : children?.length === 0 ? (
                  <p className="text-sm text-destructive p-3 bg-destructive/10 rounded-xl w-full border border-destructive/20">
                    Please add a child profile first to generate routines.
                  </p>
                ) : (
                  children?.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child.id)}
                      className={`px-4 py-3 rounded-2xl font-bold transition-all border-2 flex items-center gap-2 ${
                        selectedChild === child.id
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted"
                      }`}
                    >
                      <User className="h-4 w-4" />
                      {child.name}
                      <span className="text-xs opacity-70">age {child.age}</span>
                    </button>
                  ))
                )}
              </div>

              {selectedChildData && (
                <div className="bg-muted/50 rounded-2xl p-4 space-y-2 border border-border/50">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Profile Summary</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-foreground/80">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      Wake: <strong>{selectedChildData.wakeUpTime}</strong>
                    </div>
                    <div className="flex items-center gap-2 text-foreground/80">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      Sleep: <strong>{selectedChildData.sleepTime}</strong>
                    </div>
                    <div className="flex items-center gap-2 text-foreground/80">
                      <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                      School: <strong>{selectedChildData.schoolStartTime}–{selectedChildData.schoolEndTime}</strong>
                    </div>
                    <div className="flex items-center gap-2 text-foreground/80">
                      <Car className="h-3.5 w-3.5 text-muted-foreground" />
                      Travel: <strong>
                        {selectedChildData.travelMode === "other"
                          ? selectedChildData.travelModeOther || "Other"
                          : TRAVEL_MODE_LABELS[selectedChildData.travelMode] ?? selectedChildData.travelMode}
                      </strong>
                    </div>
                  </div>
                  {selectedChildData.goals && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">🎯 {selectedChildData.goals}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2 — Date */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</div>
                <Label className="text-lg font-bold">Which day?</Label>
              </div>
              <div className="flex items-center bg-card border-2 border-border rounded-2xl px-4 py-3 focus-within:border-primary transition-all max-w-sm">
                <Calendar className="h-5 w-5 text-muted-foreground mr-3" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-foreground font-medium w-full text-lg"
                />
              </div>
            </div>

            {/* Step 3 — School today? */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">3</div>
                <Label className="text-lg font-bold flex items-center gap-2">
                  <School className="h-5 w-5 text-primary" />
                  Is there school on this day?
                </Label>
              </div>
              <ToggleGroup
                value={hasSchool}
                onChange={setHasSchool}
                options={[
                  ["Yes, school day", true, "🏫"],
                  ["No, day off", false, "🏖️"],
                ]}
              />
              {hasSchool === false && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm text-amber-800">
                  The AI will skip school blocks and add outdoor play, hobby activities, and family time instead.
                </div>
              )}
            </div>

            {/* Step 4 — Parent working day? (only for WFH/office parents) */}
            {showWorkingDayQuestion && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">4</div>
                  <Label className="text-lg font-bold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Is this a working day for you?
                  </Label>
                </div>
                <ToggleGroup
                  value={isWorkingDay}
                  onChange={setIsWorkingDay}
                  options={[
                    ["Working day", true, "💼"],
                    ["Holiday / Day off", false, "🎉"],
                  ]}
                />
                {isWorkingDay === false && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-sm text-green-800">
                    The AI will plan more joint parent-child activities since you're free all day!
                  </div>
                )}
                {isWorkingDay === true && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-sm text-blue-800">
                    The AI will assign independent tasks during your work hours and parent-child activities after work.
                  </div>
                )}
              </div>
            )}

            {/* Step 5 (or 4) — Special plans */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">
                  {showWorkingDayQuestion ? "5" : "4"}
                </div>
                <Label className="text-lg font-bold flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Any special plans today? <span className="text-sm font-normal text-muted-foreground">(optional)</span>
                </Label>
              </div>
              <div className="relative">
                <Input
                  placeholder="e.g. birthday party at 4pm, doctor's appointment at 11am, outing to the park..."
                  value={specialPlans}
                  onChange={(e) => setSpecialPlans(e.target.value)}
                  className="rounded-2xl h-12 pl-4"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The AI will adjust the entire routine around your special plans.
              </p>
            </div>

            {/* Step 6 (or 5) — Fridge Items */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">
                  {showWorkingDayQuestion ? "6" : "5"}
                </div>
                <Label className="text-lg font-bold">What's in your fridge? <span className="text-sm font-normal text-muted-foreground">(optional)</span></Label>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Refrigerator className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    placeholder="e.g. eggs, spinach, chicken, rice, tomatoes, milk, apples..."
                    value={fridgeItems}
                    onChange={(e) => setFridgeItems(e.target.value)}
                    className="pl-9 resize-none rounded-2xl min-h-[80px]"
                    rows={2}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The AI will suggest meals using only what you have. Leave blank for general meal suggestions.
                </p>
              </div>
            </div>

            {/* What the AI uses */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-sm text-foreground/70 space-y-1">
              <p className="font-bold text-foreground text-sm mb-2">✨ What the AI considers:</p>
              <ul className="space-y-1 list-none">
                <li>🏫 School status — includes or skips school blocks</li>
                <li>👨‍👩‍👧 Parent availability — joint vs. independent activities</li>
                <li>🌟 Special plans — adjusts the whole day around them</li>
                <li>❤️ Family bonding — always adds 2–3 quality moments</li>
                <li>⏰ Wake-up & bedtime for accurate time slots</li>
                <li>🚌 Travel mode for realistic commute durations</li>
                <li>📊 Recent behavior history to adapt the plan</li>
                <li>🍽️ Food preferences, diet type & fridge ingredients</li>
              </ul>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleGenerate}
                disabled={!isFormValid || isGenerating}
                size="lg"
                className="w-full rounded-full h-14 text-lg font-bold shadow-sm transition-all"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Smart Routine
              </Button>
              {!isFormValid && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Please select a child and answer the school question to continue.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
