import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useListChildren, getListChildrenQueryKey, useGenerateRoutine, useCreateRoutine, getListRoutinesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, Calendar, User, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function RoutineGenerate() {
  const [_, setLocation] = useLocation();
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: children, isLoading: loadingChildren } = useListChildren({
    query: { queryKey: getListChildrenQueryKey() }
  });

  const generateMutation = useGenerateRoutine();
  const createMutation = useCreateRoutine();

  const isFormValid = selectedChild && date;
  const isGenerating = generateMutation.isPending || createMutation.isPending;

  const handleGenerate = () => {
    if (!isFormValid) return;

    generateMutation.mutate(
      {
        data: {
          childId: selectedChild,
          date,
        }
      },
      {
        onSuccess: (generatedData) => {
          const childName = children?.find(c => c.id === selectedChild)?.name || "";
          
          createMutation.mutate(
            {
              data: {
                childId: selectedChild,
                date,
                title: generatedData.title,
                items: generatedData.items,
              }
            },
            {
              onSuccess: (savedRoutine) => {
                toast({ title: "Routine generated successfully!" });
                queryClient.invalidateQueries({ queryKey: getListRoutinesQueryKey() });
                setLocation(`/routines/${savedRoutine.id}`);
              },
              onError: () => {
                toast({ title: "Failed to save routine", variant: "destructive" });
              }
            }
          );
        },
        onError: () => {
          toast({ title: "Failed to generate routine", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/routines">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-quicksand text-3xl font-bold text-foreground">
            Generate Routine
          </h1>
          <p className="text-muted-foreground mt-1">
            Let AI build a perfect day based on goals and school times.
          </p>
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
              <p className="text-muted-foreground">Analyzing school times, goals, and behavior history to create a structured schedule.</p>
            </div>
            <div className="w-full max-w-xs bg-muted rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-primary h-full rounded-full w-1/2 animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-card mt-4">
          <CardContent className="p-6 sm:p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">1</div>
                <Label className="text-lg font-bold">Who is this schedule for?</Label>
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
                      onClick={() => setSelectedChild(child.id)}
                      className={`px-4 py-3 rounded-2xl font-bold transition-all border-2 flex items-center gap-2 ${
                        selectedChild === child.id 
                          ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                          : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted"
                      }`}
                    >
                      <User className="h-4 w-4" />
                      {child.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</div>
                <Label className="text-lg font-bold">Which day?</Label>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-card border-2 border-border rounded-2xl px-4 py-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all flex-1 max-w-sm">
                  <Calendar className="h-5 w-5 text-muted-foreground mr-3" />
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent border-none outline-none text-foreground font-medium w-full text-lg"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border/50">
              <Button 
                onClick={handleGenerate} 
                disabled={!isFormValid || isGenerating} 
                size="lg" 
                className="w-full rounded-full h-14 text-lg font-bold shadow-sm hover-elevate transition-all bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Routine
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
