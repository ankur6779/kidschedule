import { useState } from "react";
import { Link } from "wouter";
import { useListChildren, getListChildrenQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { getAgeGroup, getAgeGroupInfo } from "@/lib/age-groups";
import { InfantMode, type InfantShowOnly } from "@/components/infant-mode";
import { SkillFocusSection, StorySection, ParentTasksSection } from "@/components/age-based-sections";
import { ToddlerPreschoolMode, type ToddlerShowOnly } from "@/components/toddler-preschool-mode";
import { DailyPuzzle } from "@/components/daily-puzzle";
import { InfantSleepTracker } from "@/components/infant-sleep-tracker";
import { BabySleepAssistant } from "@/components/baby-sleep-assistant";
import { AmazingFacts } from "@/components/amazing-facts";
import { DailyKidsActivity } from "@/components/daily-kids-activity";
import type { AgeGroup } from "@/lib/age-groups";

// ─── Category definitions ─────────────────────────────────────
type CategoryDef = { id: string; emoji: string; label: string; colors: string; activeColors: string };

const INFANT_CATEGORIES: CategoryDef[] = [
  { id: "sleep",       emoji: "🌙", label: "Sleep",       colors: "bg-indigo-50 border-indigo-200 text-indigo-800",  activeColors: "bg-indigo-500 border-indigo-500 text-white" },
  { id: "facts",       emoji: "🌟", label: "Facts",       colors: "bg-amber-50 border-amber-200 text-amber-800",     activeColors: "bg-amber-500 border-amber-500 text-white" },
  { id: "feeding",     emoji: "🍼", label: "Feeding",     colors: "bg-orange-50 border-orange-200 text-orange-800",  activeColors: "bg-orange-500 border-orange-500 text-white" },
  { id: "health",      emoji: "🏥", label: "Health",      colors: "bg-red-50 border-red-200 text-red-800",           activeColors: "bg-red-500 border-red-500 text-white" },
  { id: "development", emoji: "🧠", label: "Development", colors: "bg-blue-50 border-blue-200 text-blue-800",        activeColors: "bg-blue-500 border-blue-500 text-white" },
  { id: "bonding",     emoji: "❤️", label: "Bonding",    colors: "bg-pink-50 border-pink-200 text-pink-800",        activeColors: "bg-pink-500 border-pink-500 text-white" },
  { id: "lullaby",     emoji: "🎵", label: "Lullabies",   colors: "bg-purple-50 border-purple-200 text-purple-800",  activeColors: "bg-purple-500 border-purple-500 text-white" },
  { id: "vaccines",    emoji: "💉", label: "Vaccines",    colors: "bg-green-50 border-green-200 text-green-800",     activeColors: "bg-green-500 border-green-500 text-white" },
  { id: "memory",      emoji: "📸", label: "Memories",    colors: "bg-yellow-50 border-yellow-200 text-yellow-800",  activeColors: "bg-yellow-500 border-yellow-500 text-white" },
];

const TODDLER_CATEGORIES: CategoryDef[] = [
  { id: "daily-activity", emoji: "🎨", label: "Daily Activity", colors: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800", activeColors: "bg-fuchsia-500 border-fuchsia-500 text-white" },
  { id: "activity", emoji: "🎯", label: "Activities",  colors: "bg-blue-50 border-blue-200 text-blue-800",       activeColors: "bg-blue-500 border-blue-500 text-white" },
  { id: "skill",    emoji: "🧠", label: "Skills",      colors: "bg-violet-50 border-violet-200 text-violet-800",  activeColors: "bg-violet-500 border-violet-500 text-white" },
  { id: "task",     emoji: "❤️", label: "Parent Tasks", colors: "bg-rose-50 border-rose-200 text-rose-800",      activeColors: "bg-rose-500 border-rose-500 text-white" },
  { id: "fun",      emoji: "🎮", label: "Fun",          colors: "bg-green-50 border-green-200 text-green-800",    activeColors: "bg-green-500 border-green-500 text-white" },
  { id: "story",    emoji: "📖", label: "Stories",      colors: "bg-amber-50 border-amber-200 text-amber-800",    activeColors: "bg-amber-500 border-amber-500 text-white" },
  { id: "facts",    emoji: "🌟", label: "Facts",        colors: "bg-yellow-50 border-yellow-200 text-yellow-800", activeColors: "bg-yellow-500 border-yellow-500 text-white" },
];

const PRESCHOOL_CATEGORIES: CategoryDef[] = [
  { id: "daily-activity", emoji: "🎨", label: "Daily Activity", colors: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800", activeColors: "bg-fuchsia-500 border-fuchsia-500 text-white" },
  { id: "activity", emoji: "🎯", label: "Activities",   colors: "bg-blue-50 border-blue-200 text-blue-800",       activeColors: "bg-blue-500 border-blue-500 text-white" },
  { id: "skill",    emoji: "🧠", label: "Skills",       colors: "bg-violet-50 border-violet-200 text-violet-800",  activeColors: "bg-violet-500 border-violet-500 text-white" },
  { id: "task",     emoji: "❤️", label: "Parent Tasks", colors: "bg-rose-50 border-rose-200 text-rose-800",       activeColors: "bg-rose-500 border-rose-500 text-white" },
  { id: "fun",      emoji: "🎮", label: "Fun",           colors: "bg-green-50 border-green-200 text-green-800",    activeColors: "bg-green-500 border-green-500 text-white" },
  { id: "story",    emoji: "📖", label: "Stories",       colors: "bg-amber-50 border-amber-200 text-amber-800",    activeColors: "bg-amber-500 border-amber-500 text-white" },
  { id: "puzzle",   emoji: "🧩", label: "Daily Puzzle",  colors: "bg-indigo-50 border-indigo-200 text-indigo-800", activeColors: "bg-indigo-500 border-indigo-500 text-white" },
  { id: "facts",    emoji: "🌟", label: "Facts",         colors: "bg-yellow-50 border-yellow-200 text-yellow-800", activeColors: "bg-yellow-500 border-yellow-500 text-white" },
];

const OLDER_CATEGORIES: CategoryDef[] = [
  { id: "daily-activity", emoji: "🎨", label: "Daily Activity", colors: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800", activeColors: "bg-fuchsia-500 border-fuchsia-500 text-white" },
  { id: "skills",  emoji: "🧠", label: "Skill Focus",  colors: "bg-violet-50 border-violet-200 text-violet-800",  activeColors: "bg-violet-500 border-violet-500 text-white" },
  { id: "stories", emoji: "📖", label: "Stories",      colors: "bg-amber-50 border-amber-200 text-amber-800",    activeColors: "bg-amber-500 border-amber-500 text-white" },
  { id: "tasks",   emoji: "💝", label: "Parent Tasks",  colors: "bg-rose-50 border-rose-200 text-rose-800",      activeColors: "bg-rose-500 border-rose-500 text-white" },
  { id: "puzzle",  emoji: "🧩", label: "Daily Puzzle",  colors: "bg-indigo-50 border-indigo-200 text-indigo-800", activeColors: "bg-indigo-500 border-indigo-500 text-white" },
  { id: "facts",   emoji: "🌟", label: "Facts",         colors: "bg-yellow-50 border-yellow-200 text-yellow-800", activeColors: "bg-yellow-500 border-yellow-500 text-white" },
];

// ─── Category Pill Grid ────────────────────────────────────────
function CategoryGrid({
  categories,
  selected,
  onSelect,
}: {
  categories: CategoryDef[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Choose a category</p>
        {selected && (
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Show All
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {categories.map((cat) => {
          const isActive = selected === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(isActive ? null : cat.id)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 transition-all duration-200 font-semibold text-xs shadow-none hover:shadow-sm ${
                isActive ? cat.activeColors + " shadow-sm" : cat.colors
              }`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="leading-tight text-center">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Older kids accordion wrappers ────────────────────────────
function OlderSection({
  id,
  emoji,
  label,
  selected,
  onToggle,
  children,
}: {
  id: string;
  emoji: string;
  label: string;
  selected: string | null;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  const isOpen = selected === id;
  return (
    <div className={`rounded-3xl border-2 overflow-hidden transition-all ${isOpen ? "border-primary/40" : "border-border"}`}>
      <button
        onClick={() => onToggle(id)}
        className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${isOpen ? "bg-primary/5" : "bg-card hover:bg-muted/40"}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <span className="font-bold text-base">{label}</span>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>
      {isOpen && <div className="px-0 pb-0">{children}</div>}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function ParentingHub() {
  const { data: children = [], isLoading } = useListChildren({
    query: { queryKey: getListChildrenQueryKey() },
  });
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const childList = (children as any[]) ?? [];

  const effectiveChild = selectedChildId
    ? childList.find((c: any) => c.id === selectedChildId) ?? childList[0]
    : childList[0];

  const ageGroup: AgeGroup | null = effectiveChild
    ? getAgeGroup(effectiveChild.age, (effectiveChild as any).ageMonths ?? 0)
    : null;

  const totalAgeMonths       = effectiveChild ? (effectiveChild.age * 12) + ((effectiveChild as any).ageMonths ?? 0) : 0;
  const isInfant           = ageGroup === "infant";
  const isToddlerOrPreschool = ageGroup === "toddler" || ageGroup === "preschool";
  const isOlder            = !isInfant && !isToddlerOrPreschool;

  const categories = isInfant
    ? INFANT_CATEGORIES
    : ageGroup === "preschool"
    ? PRESCHOOL_CATEGORIES
    : isToddlerOrPreschool
    ? TODDLER_CATEGORIES
    : OLDER_CATEGORIES;

  // Reset category when child changes
  const handleChildSelect = (id: number) => {
    setSelectedChildId(id);
    setSelectedCategory(null);
  };

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
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
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
                onClick={() => handleChildSelect(child.id)}
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
            Personalised for {effectiveChild.name}
          </span>
        </div>
      )}

      {/* ── Category selector ──────────────────────────────── */}
      {effectiveChild && ageGroup && (
        <CategoryGrid
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      )}

      {/* ── Content ────────────────────────────────────────── */}
      {effectiveChild && ageGroup && (
        <div className="space-y-5">

          {/* INFANT — Sleep Tracker + Assistant */}
          {isInfant && (!selectedCategory || selectedCategory === "sleep") && (
            <>
              <InfantSleepTracker
                childName={effectiveChild.name}
                ageMonths={(effectiveChild.age * 12) + ((effectiveChild as any).ageMonths ?? 0)}
              />
              <BabySleepAssistant
                childName={effectiveChild.name}
                ageMonths={(effectiveChild.age * 12) + ((effectiveChild as any).ageMonths ?? 0)}
              />
            </>
          )}

          {/* INFANT — Amazing Facts */}
          {isInfant && (!selectedCategory || selectedCategory === "facts") && (
            <AmazingFacts childName={effectiveChild.name} ageGroup={ageGroup} />
          )}

          {/* INFANT — Other categories */}
          {isInfant && selectedCategory && selectedCategory !== "sleep" && selectedCategory !== "facts" && (
            <InfantMode
              childName={effectiveChild.name}
              ageYears={effectiveChild.age}
              ageMonths={(effectiveChild as any).ageMonths ?? 0}
              showOnly={selectedCategory as InfantShowOnly | null}
            />
          )}

          {/* TODDLER / PRESCHOOL — Daily Activity */}
          {isToddlerOrPreschool && (!selectedCategory || selectedCategory === "daily-activity") && (
            <DailyKidsActivity childName={effectiveChild.name} ageMonths={totalAgeMonths} />
          )}

          {/* TODDLER / PRESCHOOL */}
          {isToddlerOrPreschool && (selectedCategory !== "daily-activity") && (
            <ToddlerPreschoolMode
              ageGroup={ageGroup as "toddler" | "preschool"}
              childName={effectiveChild.name}
              ageYears={effectiveChild.age}
              ageMonths={(effectiveChild as any).ageMonths ?? 0}
              showOnly={selectedCategory as ToddlerShowOnly | null}
            />
          )}

          {/* PRESCHOOL PUZZLE (3–5 yrs) — shown when no category selected or "puzzle" selected */}
          {isToddlerOrPreschool && ageGroup === "preschool" && (!selectedCategory || selectedCategory === "puzzle") && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-lg">🧩</span>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Daily Puzzle</p>
              </div>
              <DailyPuzzle
                childName={effectiveChild.name}
                ageGroup={ageGroup}
                ageYears={effectiveChild.age}
              />
            </div>
          )}

          {/* TODDLER / PRESCHOOL — Amazing Facts */}
          {isToddlerOrPreschool && (!selectedCategory || selectedCategory === "facts") && (
            <AmazingFacts childName={effectiveChild.name} ageGroup={ageGroup} />
          )}

          {/* OLDER KIDS — accordion sections */}
          {isOlder && (
            <div className="space-y-3">

              {/* Daily Activity — only for early_school under 8 years (< 96 months) */}
              {totalAgeMonths < 96 && (
                <OlderSection
                  id="daily-activity"
                  emoji="🎨"
                  label="Today's Daily Activity"
                  selected={selectedCategory}
                  onToggle={(id) => setSelectedCategory(selectedCategory === id ? null : id)}
                >
                  <div className="p-3">
                    <DailyKidsActivity childName={effectiveChild.name} ageMonths={totalAgeMonths} />
                  </div>
                </OlderSection>
              )}

              <OlderSection
                id="skills"
                emoji="🧠"
                label="Skills to Focus On"
                selected={selectedCategory}
                onToggle={(id) => setSelectedCategory(selectedCategory === id ? null : id)}
              >
                <div className="p-4">
                  <SkillFocusSection group={ageGroup} childName={effectiveChild.name} />
                </div>
              </OlderSection>

              <OlderSection
                id="stories"
                emoji="📖"
                label="Story Time"
                selected={selectedCategory}
                onToggle={(id) => setSelectedCategory(selectedCategory === id ? null : id)}
              >
                <div className="p-4">
                  <StorySection group={ageGroup} childName={effectiveChild.name} />
                </div>
              </OlderSection>

              <OlderSection
                id="tasks"
                emoji="💝"
                label="Your Parent Tasks"
                selected={selectedCategory}
                onToggle={(id) => setSelectedCategory(selectedCategory === id ? null : id)}
              >
                <div className="p-4">
                  <ParentTasksSection group={ageGroup} childName={effectiveChild.name} />
                </div>
              </OlderSection>

              <OlderSection
                id="puzzle"
                emoji="🧩"
                label="Daily Puzzle"
                selected={selectedCategory}
                onToggle={(id) => setSelectedCategory(selectedCategory === id ? null : id)}
              >
                <div className="p-4">
                  <DailyPuzzle
                    childName={effectiveChild.name}
                    ageGroup={ageGroup}
                    ageYears={effectiveChild.age}
                  />
                </div>
              </OlderSection>

              <OlderSection
                id="facts"
                emoji="🌟"
                label="Amazing Facts"
                selected={selectedCategory}
                onToggle={(id) => setSelectedCategory(selectedCategory === id ? null : id)}
              >
                <div className="p-4">
                  <AmazingFacts childName={effectiveChild.name} ageGroup={ageGroup} />
                </div>
              </OlderSection>
            </div>
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
          Tap a category to explore tips, activities &amp; stories
        </p>
      </div>
    </div>
  );
}
