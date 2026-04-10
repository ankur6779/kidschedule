import { useState } from "react";
import { useLocation } from "wouter";
import { useListChildren, getListChildrenQueryKey, useListBehaviors, getListBehaviorsQueryKey, useCreateBehaviorLog, useDeleteBehaviorLog, useGetBehaviorStats, getGetBehaviorStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, TrendingUp, TrendingDown, Minus, Trash2, Save, Calendar, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function BehaviorTracker() {
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<"positive" | "negative" | "neutral" | null>(null);
  const [behavior, setBehavior] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: children, isLoading: loadingChildren } = useListChildren({
    query: { queryKey: getListChildrenQueryKey() }
  });

  const { data: recentLogs, isLoading: loadingLogs } = useListBehaviors(
    { date: format(new Date(), "yyyy-MM-dd") },
    { query: { queryKey: getListBehaviorsQueryKey({ date: format(new Date(), "yyyy-MM-dd") }) } }
  );

  const createMutation = useCreateBehaviorLog();
  const deleteMutation = useDeleteBehaviorLog();

  const isFormValid = selectedChild && selectedType && behavior.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    createMutation.mutate(
      {
        data: {
          childId: selectedChild,
          date,
          type: selectedType,
          behavior,
          notes: notes || undefined,
        }
      },
      {
        onSuccess: () => {
          toast({ title: "Behavior logged successfully" });
          setBehavior("");
          setNotes("");
          setSelectedType(null);
          // Don't reset selectedChild or date to allow rapid logging
          
          queryClient.invalidateQueries({ queryKey: getListBehaviorsQueryKey({ date }) });
          queryClient.invalidateQueries({ queryKey: getGetBehaviorStatsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to log behavior", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Log deleted" });
          queryClient.invalidateQueries({ queryKey: getListBehaviorsQueryKey({ date }) });
          queryClient.invalidateQueries({ queryKey: getGetBehaviorStatsQueryKey() });
        },
      }
    );
  };

  const presetBehaviors = {
    positive: ["Listened the first time", "Shared toys", "Ate all their dinner", "Got ready independently", "Helped with chores"],
    negative: ["Tantrum/Meltdown", "Hitting/Biting", "Refused to eat", "Bedtime stalling", "Not sharing"],
    neutral: ["Quiet play time", "Extra screen time", "Skipped nap", "Tried something new"],
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      <header>
        <h1 className="font-quicksand text-3xl font-bold text-foreground">Behavior Tracker</h1>
        <p className="text-muted-foreground mt-1">Quickly log highlights and challenges</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Logger Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Select Child */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">1</div>
                    <Label className="text-lg font-bold">Who is this for?</Label>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {loadingChildren ? (
                      <div className="animate-pulse bg-muted h-12 w-32 rounded-xl" />
                    ) : children?.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-destructive p-3 bg-destructive/10 rounded-xl w-full border border-destructive/20">
                        Please add a child profile first.
                      </p>
                    ) : (
                      children?.map(child => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => setSelectedChild(child.id)}
                          className={`px-4 py-3 rounded-2xl font-bold transition-all border-2 ${
                            selectedChild === child.id 
                              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                              : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted"
                          }`}
                        >
                          {child.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Select Type */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</div>
                    <Label className="text-lg font-bold">What kind of behavior?</Label>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedType("positive")}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        selectedType === "positive" 
                          ? "bg-accent/10 border-accent text-accent" 
                          : "bg-card border-border hover:border-accent/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <TrendingUp className={`h-6 w-6 ${selectedType === "positive" ? "text-accent" : ""}`} />
                      <span className="font-bold text-sm">Positive</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedType("negative")}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        selectedType === "negative" 
                          ? "bg-destructive/10 border-destructive text-destructive" 
                          : "bg-card border-border hover:border-destructive/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <TrendingDown className={`h-6 w-6 ${selectedType === "negative" ? "text-destructive" : ""}`} />
                      <span className="font-bold text-sm">Challenge</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedType("neutral")}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        selectedType === "neutral" 
                          ? "bg-foreground/5 border-foreground/30 text-foreground" 
                          : "bg-card border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Minus className={`h-6 w-6 ${selectedType === "neutral" ? "text-foreground" : ""}`} />
                      <span className="font-bold text-sm">Neutral</span>
                    </button>
                  </div>
                </div>

                {/* 3. Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">3</div>
                      <Label className="text-lg font-bold">What happened?</Label>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      <Calendar className="h-3 w-3" />
                      <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-transparent border-none outline-none text-foreground font-medium w-[110px]"
                      />
                    </div>
                  </div>
                  
                  {selectedType && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {presetBehaviors[selectedType].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setBehavior(preset)}
                          className="text-xs px-3 py-1.5 bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors border border-transparent hover:border-primary/20 font-medium"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <Input 
                    placeholder="Short description (e.g. 'Ate all their vegetables')" 
                    value={behavior}
                    onChange={(e) => setBehavior(e.target.value)}
                    className="rounded-xl h-12 bg-muted/50 border-transparent focus-visible:bg-background text-base"
                  />
                  
                  <div className="pt-2">
                    <Label className="text-sm font-bold text-muted-foreground mb-2 block">Extra notes (optional)</Label>
                    <Textarea 
                      placeholder="Any context or triggers?" 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[80px] rounded-xl bg-muted/50 border-transparent focus-visible:bg-background resize-none text-sm"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={!isFormValid || createMutation.isPending} 
                  className="w-full rounded-full h-14 text-lg font-bold shadow-sm hover-elevate transition-all"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Log Behavior
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* History Sidebar */}
        <div className="lg:col-span-5">
          <Card className="rounded-3xl border-none shadow-sm h-full bg-card/50 overflow-hidden flex flex-col">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="font-quicksand text-lg">Today's Log</CardTitle>
              <CardDescription>Activity for {format(new Date(date), "MMMM d, yyyy")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              {loadingLogs ? (
                <div className="p-6 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentLogs && recentLogs.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {recentLogs.map((log) => {
                    const typeConfig = {
                      positive: { icon: TrendingUp, color: "text-accent", bg: "bg-accent/10 border-accent/20" },
                      negative: { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
                      neutral: { icon: Minus, color: "text-foreground", bg: "bg-foreground/5 border-foreground/10" },
                    }[log.type as "positive" | "negative" | "neutral"] || { icon: Star, color: "text-primary", bg: "bg-primary/10 border-primary/20" };
                    
                    const Icon = typeConfig.icon;

                    return (
                      <div key={log.id} className="p-4 group hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 p-2 rounded-xl border shrink-0 ${typeConfig.bg} ${typeConfig.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-sm truncate">{log.childName}</span>
                              <button 
                                onClick={() => handleDelete(log.id)}
                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="text-sm font-medium text-foreground mt-0.5 leading-snug">{log.behavior}</p>
                            {log.notes && (
                              <p className="text-xs text-muted-foreground mt-1 italic">{log.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center h-full text-muted-foreground">
                  <Star className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p>No behavior logged for this day.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
