import { useState } from "react";
import { Link } from "wouter";
import { useListChildren, getListChildrenQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Calendar, Sparkles } from "lucide-react";
import { getAgeGroup, getAgeGroupInfo } from "@/lib/age-groups";
import { InfantMode } from "@/components/infant-mode";
import { SkillFocusSection, StorySection, ParentTasksSection } from "@/components/age-based-sections";
import { ToddlerPreschoolMode } from "@/components/toddler-preschool-mode";
import type { AgeGroup } from "@/lib/age-groups";

export default function ParentingHub() {
  const { data: children = [], isLoading } = useListChildren({
    query: { queryKey: getListChildrenQueryKey() },
  });
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const childList = (children as any[]) ?? [];

  const effectiveChild = selectedChildId
    ? childList.find((c: any) => c.id === selectedChildId) ?? childList[0]
    : childList[0];

  const ageGroup: AgeGroup | null = effectiveChild
    ? getAgeGroup(effectiveChild.age, (effectiveChild as any).ageMonths ?? 0)
    : null;

  const isInfant           = ageGroup === "infant";
  const isToddlerOrPreschool = ageGroup === "toddler" || ageGroup === "preschool";

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-muted-foreground animate-pulse">Loading Parenting Hub…</div>
      </div>
    );
  }

  // ── No children ──────────────────────────────────────────────
  if (childList.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader />
        <Card className="rounded-3xl border-2 border-dashed">
          <CardContent className="p-10 text-center space-y-4">
            <div className="text-5xl">👶</div>
            <h3 className="font-bold text-lg">Add a child to get started</h3>
            <p className="text-sm text-muted-foreground">
              Add your child's profile to unlock age-personalised tips, stories, and activities.
            </p>
            <Link href="/children/new">
              <button className="mt-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                Add Child
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main layout ──────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <PageHeader />

      {/* Child selector — only shown when there are multiple children */}
      {childList.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {childList.map((child: any) => {
            const group = getAgeGroup(child.age, (child as any).ageMonths ?? 0);
            const info  = getAgeGroupInfo(group);
            const isSelected = effectiveChild?.id === child.id;
            return (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card border-border hover:border-primary/50"
                }`}
              >
                <span className="text-xl">{info.emoji}</span>
                <div className="text-left">
                  <p className="font-bold text-sm leading-tight">{child.name}</p>
                  <p className={`text-[10px] ${isSelected ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                    {info.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Age group badge */}
      {effectiveChild && ageGroup && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="rounded-full px-3 py-1 font-semibold text-xs gap-1.5">
            {getAgeGroupInfo(ageGroup).emoji} {getAgeGroupInfo(ageGroup).label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Content tailored for {effectiveChild.name}
          </span>
        </div>
      )}

      {/* Age-based content */}
      {effectiveChild && ageGroup && (
        <div className="space-y-6">
          {isInfant && (
            <InfantMode
              childName={effectiveChild.name}
              ageYears={effectiveChild.age}
              ageMonths={(effectiveChild as any).ageMonths ?? 0}
            />
          )}

          {isToddlerOrPreschool && (
            <ToddlerPreschoolMode
              ageGroup={ageGroup as "toddler" | "preschool"}
              childName={effectiveChild.name}
              ageYears={effectiveChild.age}
              ageMonths={(effectiveChild as any).ageMonths ?? 0}
            />
          )}

          {!isInfant && !isToddlerOrPreschool && (
            <>
              <SkillFocusSection group={ageGroup} childName={effectiveChild.name} />
              <StorySection group={ageGroup} childName={effectiveChild.name} />
              <ParentTasksSection group={ageGroup} childName={effectiveChild.name} />
            </>
          )}
        </div>
      )}

      {/* Bottom link to routine */}
      <div className="text-center pt-2">
        <Link href="/routines/generate">
          <button className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
            <Calendar className="h-4 w-4" />
            Generate today's routine
          </button>
        </Link>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex items-start gap-3">
      <Link href="/dashboard">
        <button className="mt-0.5 p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </Link>
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-emerald-600" />
          Parenting Hub
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Age-appropriate tips, stories &amp; learning activities
        </p>
      </div>
    </div>
  );
}
