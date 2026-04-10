import { useState } from "react";
import { useLocation, Link, useParams } from "wouter";
import { useGetRoutine, getGetRoutineQueryKey, useDeleteRoutine, getListRoutinesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Calendar as CalendarIcon, User, Trash2, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

export default function RoutineDetail() {
  const [_, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const routineId = parseInt(params.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: routine, isLoading } = useGetRoutine(routineId, {
    query: {
      enabled: !!routineId,
      queryKey: getGetRoutineQueryKey(routineId),
    }
  });

  const deleteMutation = useDeleteRoutine();

  const handleDelete = () => {
    deleteMutation.mutate(
      { id: routineId },
      {
        onSuccess: () => {
          toast({ title: "Routine deleted" });
          queryClient.invalidateQueries({ queryKey: getListRoutinesQueryKey() });
          setLocation("/routines");
        },
        onError: () => {
          toast({ title: "Failed to delete routine", variant: "destructive" });
        }
      }
    );
  };

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("meal") || cat.includes("eat") || cat.includes("food") || cat.includes("snack") || cat.includes("breakfast") || cat.includes("lunch") || cat.includes("dinner")) return "bg-primary/20 text-primary-foreground border-primary/30";
    if (cat.includes("sleep") || cat.includes("nap") || cat.includes("bed") || cat.includes("rest") || cat.includes("quiet")) return "bg-blue-500/20 text-blue-900 border-blue-500/30 dark:text-blue-100";
    if (cat.includes("play") || cat.includes("fun") || cat.includes("active") || cat.includes("outside") || cat.includes("park")) return "bg-accent/20 text-accent-foreground border-accent/30";
    if (cat.includes("school") || cat.includes("learn") || cat.includes("study") || cat.includes("homework")) return "bg-secondary text-secondary-foreground border-secondary/50";
    if (cat.includes("hygiene") || cat.includes("bath") || cat.includes("teeth") || cat.includes("potty") || cat.includes("dress")) return "bg-purple-500/20 text-purple-900 border-purple-500/30 dark:text-purple-100";
    return "bg-muted text-foreground border-border";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
        <div className="h-12 w-3/4 bg-muted animate-pulse rounded-xl" />
        <div className="space-y-4 mt-8">
          {[1, 2, 3, 4, 5].map(i => (
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
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
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

        <div>
          <div className="flex items-center gap-2 text-sm text-primary font-medium mb-2">
            <Sparkles className="h-4 w-4" />
            AI Generated Schedule
          </div>
          <h1 className="font-quicksand text-3xl sm:text-4xl font-bold text-foreground">
            {routine.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 bg-secondary/30 text-secondary-foreground border border-secondary/50 px-3 py-1 rounded-full text-sm font-medium">
              <User className="h-3.5 w-3.5" />
              {routine.childName}
            </div>
            <div className="flex items-center gap-1.5 bg-muted px-3 py-1 rounded-full text-sm font-medium text-foreground/80">
              <CalendarIcon className="h-3.5 w-3.5" />
              {new Date(routine.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      </header>

      <div className="relative mt-8">
        {/* Timeline line */}
        <div className="absolute left-[39px] sm:left-[55px] top-4 bottom-4 w-0.5 bg-border/60 z-0 rounded-full" />

        <div className="space-y-4 relative z-10">
          {routine.items && routine.items.map((item, index) => (
            <div key={index} className="flex gap-4 sm:gap-6 group">
              {/* Time column */}
              <div className="flex flex-col items-center pt-3 w-[80px] sm:w-[110px] shrink-0 bg-background">
                <div className="text-sm font-bold text-foreground text-right w-full pr-2 sm:pr-4 bg-background">
                  {item.time}
                </div>
                <div className="text-xs text-muted-foreground font-medium text-right w-full pr-2 sm:pr-4">
                  {item.duration}m
                </div>
              </div>

              {/* Activity Card */}
              <Card className={`flex-1 rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 hover-elevate ${
                item.category.toLowerCase().includes('sleep') ? 'opacity-80 hover:opacity-100' : ''
              }`}>
                <div className="p-4 sm:p-5 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 bottom-0 w-2 ${getCategoryColor(item.category).split(' ')[0].replace('/20', '')}`} />
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-bold text-lg text-foreground leading-tight">
                        {item.activity}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider shrink-0 ${getCategoryColor(item.category)} border`}>
                        {item.category}
                      </span>
                    </div>
                    
                    {item.notes && (
                      <p className="text-muted-foreground text-sm mt-1 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/50">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 flex justify-center pb-8 border-t border-border/50 pt-8">
        <Button asChild variant="outline" className="rounded-full shadow-sm hover-elevate">
          <Link href="/behavior">
            Log Behavior for Today
          </Link>
        </Button>
      </div>
    </div>
  );
}
