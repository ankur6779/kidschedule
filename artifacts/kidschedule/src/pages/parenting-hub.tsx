import { useState } from "react";
import { Link } from "wouter";
import { useListChildren, getListChildrenQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Brain, Sparkles, Heart, Palette,
  ChevronDown, ChevronUp, MessageCircleHeart,
  Calendar, ArrowRight,
} from "lucide-react";
import { getAgeGroup, getAgeGroupInfo } from "@/lib/age-groups";
import { InfantMode, type InfantShowOnly } from "@/components/infant-mode";
import { SkillFocusSection, StorySection, ParentTasksSection } from "@/components/age-based-sections";
import { ToddlerPreschoolMode, type ToddlerShowOnly } from "@/components/toddler-preschool-mode";
import { DailyPuzzle } from "@/components/daily-puzzle";
import { InfantSleepTracker } from "@/components/infant-sleep-tracker";
import { BabySleepAssistant } from "@/components/baby-sleep-assistant";
import { AmazingFacts } from "@/components/amazing-facts";
import { DailyKidsActivity } from "@/components/daily-kids-activity";
import { DailyTips } from "@/components/daily-tips";
import { ParentingArticles } from "@/components/parenting-articles";
import { AmyIcon } from "@/components/amy-icon";
import type { AgeGroup } from "@/lib/age-groups";

// ─── Section Wrapper ─────────────────────────────────────────────────────────
interface SectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accentClass: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function HubSection({ id, icon, title, description, accentClass, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${open ? "border-primary/30" : "border-border/60"}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-4 transition-colors text-left ${
          open ? "bg-primary/5" : "bg-card hover:bg-muted/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accentClass}`}>
            {icon}
          </div>
          <div>
            <p className="font-quicksand font-bold text-base text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {open
          ? <ChevronUp className="h-5 w-5 text-primary shrink-0" />
          : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
        }
      </button>
      {open && (
        <div className="px-4 pb-5 pt-2 bg-background/60 border-t border-border/40">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Amy AI Suggestions Section ───────────────────────────────────────────────
const AMY_PROMPTS = [
  { emoji: "😴", label: "Sleep problems", prompt: "My child is having trouble sleeping. What should I do?" },
  { emoji: "😤", label: "Tantrums",       prompt: "My child is having frequent tantrums. How should I handle this?" },
  { emoji: "🥦", label: "Picky eating",   prompt: "My child is a picky eater. What strategies can help?" },
  { emoji: "📚", label: "School anxiety", prompt: "My child is anxious about going to school. How can I help?" },
  { emoji: "📱", label: "Screen time",    prompt: "How much screen time is appropriate for my child's age?" },
  { emoji: "💬", label: "Language",       prompt: "How can I support my child's language and speech development?" },
];

function AmyAISuggestionsSection() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Tap a topic and Amy will give you warm, practical parenting advice — instantly.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {AMY_PROMPTS.map(p => (
          <Link key={p.label} href={`/assistant?q=${encodeURIComponent(p.prompt)}`}>
            <button className="w-full text-left flex items-center gap-2.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 px-3 py-2.5 transition-all">
              <span className="text-xl shrink-0">{p.emoji}</span>
              <span className="text-sm font-semibold text-foreground">{p.label}</span>
            </button>
          </Link>
        ))}
      </div>
      <Link href="/assistant">
        <Button variant="outline" className="w-full rounded-xl gap-2 text-sm font-semibold">
          <AmyIcon size={20} bounce />
          Ask Amy anything
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>
      </Link>
    </div>
  );
}

// ─── Emotional Support Section ────────────────────────────────────────────────
const EMOTIONAL_CARDS = [
  {
    emoji: "🫂",
    title: "I'm feeling overwhelmed",
    subtitle: "It's okay. You're not alone.",
    prompt: "I'm feeling completely overwhelmed as a parent. What can I do to feel better?",
    bg: "bg-rose-50 border-rose-200 hover:border-rose-400",
  },
  {
    emoji: "😰",
    title: "My child seems anxious",
    subtitle: "Let's figure this out together.",
    prompt: "My child seems anxious and worried a lot. How can I help them?",
    bg: "bg-amber-50 border-amber-200 hover:border-amber-400",
  },
  {
    emoji: "😔",
    title: "We're struggling to connect",
    subtitle: "Small steps can make a big difference.",
    prompt: "I feel like my child and I aren't connecting well. How can we build a stronger bond?",
    bg: "bg-violet-50 border-violet-200 hover:border-violet-400",
  },
  {
    emoji: "😮‍💨",
    title: "I need a parenting break",
    subtitle: "Self-care is part of good parenting.",
    prompt: "I'm a parent who needs some time for myself. How can I take care of my own wellbeing?",
    bg: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
  },
];

function EmotionalSupportSection() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Parenting is hard. Amy is here to listen and help — no judgment.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {EMOTIONAL_CARDS.map(card => (
          <Link key={card.title} href={`/assistant?q=${encodeURIComponent(card.prompt)}`}>
            <button className={`w-full text-left rounded-2xl border-2 px-4 py-3 transition-all ${card.bg}`}>
              <span className="text-2xl block mb-1">{card.emoji}</span>
              <p className="font-bold text-sm text-foreground leading-tight">{card.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
            </button>
          </Link>
        ))}
      </div>
      <div className="bg-gradient-to-r from-pink-50 to-violet-50 border border-pink-200 rounded-2xl p-4 flex gap-3 items-start">
        <AmyIcon size={36} />
        <div>
          <p className="font-bold text-sm text-foreground">You're doing better than you think 💜</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Research shows that the fact you're seeking information and support makes you an above-average parent. The worry itself is evidence of love.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Activities Section ───────────────────────────────────────────────────────
interface ActivitiesSectionProps {
  ageGroup: AgeGroup;
  effectiveChild: any;
  totalAgeMonths: number;
}

function ActivitiesSection({ ageGroup, effectiveChild, totalAgeMonths }: ActivitiesSectionProps) {
  const isInfant = ageGroup === "infant";
  const isToddlerOrPreschool = ageGroup === "toddler" || ageGroup === "preschool";
  const isOlder = !isInfant && !isToddlerOrPreschool;

  return (
    <div className="space-y-4">
      {/* INFANT */}
      {isInfant && (
        <>
          <InfantSleepTracker
            childName={effectiveChild.name}
            ageMonths={totalAgeMonths}
          />
          <BabySleepAssistant
            childName={effectiveChild.name}
            ageMonths={totalAgeMonths}
          />
          <AmazingFacts childName={effectiveChild.name} ageGroup={ageGroup} />
          <InfantMode
            childName={effectiveChild.name}
            ageYears={effectiveChild.age}
            ageMonths={(effectiveChild as any).ageMonths ?? 0}
            showOnly={null}
          />
        </>
      )}

      {/* TODDLER / PRESCHOOL */}
      {isToddlerOrPreschool && (
        <>
          <DailyKidsActivity childName={effectiveChild.name} ageMonths={totalAgeMonths} />
          <ToddlerPreschoolMode
            ageGroup={ageGroup as "toddler" | "preschool"}
            childName={effectiveChild.name}
            ageYears={effectiveChild.age}
            ageMonths={(effectiveChild as any).ageMonths ?? 0}
            showOnly={null}
          />
          {ageGroup === "preschool" && (
            <DailyPuzzle
              childName={effectiveChild.name}
              ageGroup={ageGroup}
              ageYears={effectiveChild.age}
            />
          )}
          <AmazingFacts childName={effectiveChild.name} ageGroup={ageGroup} />
        </>
      )}

      {/* OLDER KIDS */}
      {isOlder && (
        <>
          {totalAgeMonths < 96 && (
            <DailyKidsActivity childName={effectiveChild.name} ageMonths={totalAgeMonths} />
          )}
          <SkillFocusSection group={ageGroup} childName={effectiveChild.name} />
          <StorySection group={ageGroup} childName={effectiveChild.name} />
          <DailyPuzzle
            childName={effectiveChild.name}
            ageGroup={ageGroup}
            ageYears={effectiveChild.age}
          />
          <ParentTasksSection group={ageGroup} childName={effectiveChild.name} />
          <AmazingFacts childName={effectiveChild.name} ageGroup={ageGroup} />
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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

  const totalAgeMonths = effectiveChild
    ? (effectiveChild.age * 12) + ((effectiveChild as any).ageMonths ?? 0)
    : 0;

  const handleChildSelect = (id: number) => {
    setSelectedChildId(id);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-muted-foreground animate-pulse">Loading Parenting Hub…</div>
      </div>
    );
  }

  // ── No children ───────────────────────────────────────────────────────────
  if (childList.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader />
        <Card className="rounded-3xl border-2 border-dashed">
          <CardContent className="p-10 text-center space-y-4">
            <AmyIcon size={56} bounce />
            <h3 className="font-bold text-lg">Add a child to get started</h3>
            <p className="text-sm text-muted-foreground">
              Add your child's profile to unlock age-personalised tips, articles, and activities.
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

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      <PageHeader />

      {/* Child selector */}
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

      {/* Age group pill */}
      {effectiveChild && ageGroup && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="rounded-full px-3 py-1 font-semibold text-xs gap-1.5">
            {getAgeGroupInfo(ageGroup).emoji} {getAgeGroupInfo(ageGroup).label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Personalised for <strong>{effectiveChild.name}</strong>
          </span>
        </div>
      )}

      {/* ── 5 Sections ──────────────────────────────────────────────────── */}
      <div className="space-y-3">

        {/* 1. Amy AI Suggestions */}
        <HubSection
          id="amy-ai"
          icon={<AmyIcon size={22} bounce />}
          title="Ask Amy AI"
          description="Get warm, practical parenting advice"
          accentClass="bg-gradient-to-br from-amber-100 to-rose-100"
          defaultOpen
        >
          <AmyAISuggestionsSection />
        </HubSection>

        {/* 2. Parenting Articles */}
        <HubSection
          id="articles"
          icon={<BookOpen className="h-5 w-5 text-emerald-600" />}
          title="Parenting Articles"
          description="Research-based, age-matched reading"
          accentClass="bg-emerald-100"
          defaultOpen
        >
          {effectiveChild ? (
            <ParentingArticles childAgeMonths={totalAgeMonths} />
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Select a child to see matched articles</p>
          )}
        </HubSection>

        {/* 3. Daily Tips */}
        {effectiveChild && ageGroup && (
          <HubSection
            id="daily-tips"
            icon={<Sparkles className="h-5 w-5 text-violet-600" />}
            title="Daily Tips"
            description="Amy AI picks today's best tips for you"
            accentClass="bg-violet-100"
            defaultOpen
          >
            <DailyTips ageGroup={ageGroup} childName={effectiveChild.name} />
          </HubSection>
        )}

        {/* 4. Emotional Support */}
        <HubSection
          id="emotional"
          icon={<Heart className="h-5 w-5 text-rose-500" />}
          title="Emotional Support"
          description="For the tough parenting days"
          accentClass="bg-rose-100"
        >
          <EmotionalSupportSection />
        </HubSection>

        {/* 5. Activities & Learning */}
        {effectiveChild && ageGroup && (
          <HubSection
            id="activities"
            icon={<Palette className="h-5 w-5 text-fuchsia-600" />}
            title="Activities & Learning"
            description="Age-based games, stories & skills"
            accentClass="bg-fuchsia-100"
          >
            <ActivitiesSection
              ageGroup={ageGroup}
              effectiveChild={effectiveChild}
              totalAgeMonths={totalAgeMonths}
            />
          </HubSection>
        )}

      </div>

      {/* AI Coach (Ask AMY) — prominent feature card */}
      <Link href="/ai-coach">
        <div className="mt-2 rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 p-5 text-white shadow-lg cursor-pointer hover:shadow-xl active:scale-[0.99] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-quicksand font-extrabold text-lg leading-tight">AI Coach (Ask AMY)</p>
              <p className="text-xs text-white/85 mt-0.5">Personalised plans for your child</p>
            </div>
            <button className="shrink-0 bg-white text-violet-700 font-bold text-xs px-4 py-2 rounded-full hover:bg-white/95">
              Start →
            </button>
          </div>
        </div>
      </Link>

      {/* Bottom CTA */}
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

// ─── Page Header ─────────────────────────────────────────────────────────────
function PageHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <h1 className="font-quicksand text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-emerald-600" />
          Parenting Hub
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Articles, tips, activities & emotional support — all in one place
        </p>
      </div>
      <Link href="/assistant">
        <button className="shrink-0 flex items-center gap-2 bg-gradient-to-br from-amber-100 via-rose-100 to-violet-200 rounded-2xl px-3 py-2 border border-border hover:border-primary/40 transition-all">
          <AmyIcon size={24} bounce />
          <span className="text-xs font-bold text-foreground">Ask Amy</span>
          <MessageCircleHeart className="h-4 w-4 text-rose-500" />
        </button>
      </Link>
    </div>
  );
}
