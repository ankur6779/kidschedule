import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useListChildren, getListChildrenQueryKey, useGenerateRoutine, useCreateRoutine, getListRoutinesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Calendar, User, Clock, GraduationCap, Car, Refrigerator, School, Briefcase, Heart, Star, Users, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, ExternalLink, RefreshCw, Home, Building2, UserCheck, PlusCircle, MinusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { getApiUrl } from "@/lib/api";
import { format } from "date-fns";

type MoodOption = { value: "happy" | "angry" | "lazy" | "normal"; label: string; emoji: string; hint: string; color: string };
const MOOD_OPTIONS: MoodOption[] = [
  { value: "happy",  label: "Happy",  emoji: "😊", hint: "Productive & energetic", color: "border-green-300 bg-green-50 text-green-800" },
  { value: "normal", label: "Normal", emoji: "😐", hint: "Balanced routine",       color: "border-blue-200  bg-blue-50  text-blue-800"  },
  { value: "lazy",   label: "Lazy",   emoji: "😴", hint: "Easier tasks + breaks",  color: "border-amber-300 bg-amber-50 text-amber-800" },
  { value: "angry",  label: "Upset",  emoji: "😡", hint: "Calming activities",     color: "border-rose-300  bg-rose-50  text-rose-800"  },
];

const TRAVEL_MODE_LABELS: Record<string, string> = {
  van: "🚐 Van / Bus",
  car: "🚗 Car",
  walk: "🚶 Walking",
  other: "✏️ Custom",
};

type RoutineItem = {
  time: string;
  activity: string;
  duration: number;
  category: string;
  notes?: string;
  status?: string;
};

type GeneratedRoutine = {
  title: string;
  items: RoutineItem[];
};

type ChildType = {
  id: number;
  name: string;
  age: number;
  childClass?: string | null;
  foodType?: string;
  schoolStartTime: string;
  schoolEndTime: string;
  wakeUpTime: string;
  sleepTime: string;
  travelMode: string;
  travelModeOther?: string | null;
  goals: string;
};

type FamilyResult = {
  child: ChildType;
  routine: GeneratedRoutine;
};

// ---- Parent Availability Types ----
type WorkType = "work_from_home" | "work_from_office" | "homemaker";

type ParentAvailEntry = {
  role: string;
  workType: WorkType | null;
  isWorking: boolean | null;
  workHours: string;
};

type ParentAvailData = {
  p1: ParentAvailEntry;
  p2: ParentAvailEntry | null;
  hasSecondParent: boolean;
};

const DEFAULT_P1: ParentAvailEntry = { role: "Mother", workType: null, isWorking: null, workHours: "" };
const DEFAULT_P2: ParentAvailEntry = { role: "Father", workType: null, isWorking: null, workHours: "" };

const AVAIL_KEY = (date: string) => `amynest_parent_avail_${date}`;

function loadAvailability(date: string): ParentAvailData {
  try {
    const raw = localStorage.getItem(AVAIL_KEY(date));
    if (raw) return JSON.parse(raw) as ParentAvailData;
  } catch {}
  return { p1: { ...DEFAULT_P1 }, p2: null, hasSecondParent: false };
}

function saveAvailability(date: string, data: ParentAvailData): void {
  try { localStorage.setItem(AVAIL_KEY(date), JSON.stringify(data)); } catch {}
}

function parentStatusLabel(entry: ParentAvailEntry): string {
  if (!entry.workType) return "Not set";
  if (entry.workType === "homemaker") return "Free all day 🏠";
  if (entry.isWorking === true) return entry.workHours ? `Busy (${entry.workHours}) 💼` : "Busy today 💼";
  if (entry.isWorking === false) return "Holiday — free all day 🎉";
  return "Work schedule not answered";
}

function isParentAvailComplete(entry: ParentAvailEntry): boolean {
  if (!entry.workType) return false;
  if (entry.workType === "homemaker") return true;
  return entry.isWorking !== null;
}

// ---- ParentAvailSection Component ----
const WORK_TYPE_OPTIONS: { value: WorkType; label: string; icon: React.ReactNode; hint: string }[] = [
  { value: "work_from_home",   label: "Work from Home",   icon: <Home className="h-4 w-4" />,      hint: "Remote worker" },
  { value: "work_from_office", label: "Work from Office", icon: <Building2 className="h-4 w-4" />, hint: "Office commute" },
  { value: "homemaker",        label: "Homemaker",        icon: <Heart className="h-4 w-4" />,     hint: "At home all day" },
];

function ParentEntryForm({
  entry,
  onChange,
  label,
}: {
  entry: ParentAvailEntry;
  onChange: (e: ParentAvailEntry) => void;
  label: string;
}) {
  const needsWorkingDayQ = entry.workType === "work_from_home" || entry.workType === "work_from_office";
  const roleOptions = ["Mother", "Father", "Parent"];

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-4">
      {/* Role selector */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{label} — Role</p>
        <div className="flex gap-2 flex-wrap">
          {roleOptions.map((r) => (
            <button
              key={r}
              onClick={() => onChange({ ...entry, role: r })}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                entry.role === r ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
              }`}
            >
              {r === "Mother" ? "👩 Mother" : r === "Father" ? "👨 Father" : "🧑 Parent"}
            </button>
          ))}
        </div>
      </div>

      {/* Work type */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Work Type</p>
        <div className="grid grid-cols-3 gap-2">
          {WORK_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...entry, workType: opt.value, isWorking: opt.value === "homemaker" ? null : entry.isWorking, workHours: "" })}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-xs font-bold transition-all ${
                entry.workType === opt.value
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border hover:border-primary/30 text-foreground"
              }`}
            >
              {opt.icon}
              <span className="text-center leading-tight">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conditional: is today a working day? */}
      {needsWorkingDayQ && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Is today a working day?</p>
          <div className="flex gap-2">
            {([
              { label: "💼 Yes, working", val: true },
              { label: "🎉 Holiday / Off", val: false },
            ] as const).map(({ label: l, val }) => (
              <button
                key={String(val)}
                onClick={() => onChange({ ...entry, isWorking: val })}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold border-2 transition-all text-xs ${
                  entry.isWorking === val
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:border-primary/40"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          {entry.isWorking === true && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
              The AI will assign independent or babysitter tasks during work hours.
            </div>
          )}
          {entry.isWorking === false && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">
              Great — the AI will add plenty of parent-child activities today!
            </div>
          )}
        </div>
      )}

      {/* Conditional: working hours input */}
      {needsWorkingDayQ && entry.isWorking === true && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Working Hours <span className="font-normal">(optional)</span></p>
          <div className="flex items-center bg-card border-2 border-border rounded-xl px-3 py-2 focus-within:border-primary transition-all gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={entry.workHours}
              onChange={(e) => onChange({ ...entry, workHours: e.target.value })}
              placeholder="e.g. 9:00 AM – 6:00 PM"
              className="bg-transparent border-none outline-none text-sm text-foreground w-full"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">The AI will use these exact hours to plan tasks correctly.</p>
        </div>
      )}

      {/* Homemaker info */}
      {entry.workType === "homemaker" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
          🏠 As a homemaker, you're free all day — the AI will include more parent-child bonding activities!
        </div>
      )}
    </div>
  );
}

function ParentAvailSection({
  stepNum,
  avail,
  onChange,
  date,
}: {
  stepNum: number;
  avail: ParentAvailData;
  onChange: (a: ParentAvailData) => void;
  date: string;
}) {
  const p1Complete = isParentAvailComplete(avail.p1);
  const p2Complete = !avail.hasSecondParent || isParentAvailComplete(avail.p2 ?? DEFAULT_P2);

  // Status badges for summary
  const p1Status = avail.p1.workType
    ? (avail.p1.workType === "homemaker" ? "free" : avail.p1.isWorking === true ? "busy" : avail.p1.isWorking === false ? "free" : "pending")
    : "pending";
  const p2Status = avail.hasSecondParent && avail.p2?.workType
    ? (avail.p2.workType === "homemaker" ? "free" : avail.p2.isWorking === true ? "busy" : avail.p2.isWorking === false ? "free" : "pending")
    : null;

  const statusColor = {
    busy: "bg-amber-100 text-amber-800 border-amber-300",
    free: "bg-green-100 text-green-800 border-green-300",
    pending: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">{stepNum}</div>
          <Label className="text-lg font-bold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Parent Schedule for{" "}
            <span className="text-primary font-bold">
              {new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </Label>
        </div>
        {/* Status summary */}
        {(p1Complete || p2Status !== null) && (
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {p1Complete && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusColor[p1Status as "busy" | "free" | "pending"]}`}>
                {avail.p1.role}: {p1Status === "busy" ? "Busy" : "Free"}
              </span>
            )}
            {p2Status && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusColor[p2Status as "busy" | "free"]}`}>
                {avail.p2?.role}: {p2Status === "busy" ? "Busy" : "Free"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Parent 1 */}
      <ParentEntryForm
        entry={avail.p1}
        label="Parent 1"
        onChange={(e) => onChange({ ...avail, p1: e })}
      />

      {/* Second parent toggle */}
      <button
        onClick={() => {
          if (avail.hasSecondParent) {
            onChange({ ...avail, hasSecondParent: false, p2: null });
          } else {
            onChange({ ...avail, hasSecondParent: true, p2: { ...DEFAULT_P2 } });
          }
        }}
        className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors py-1"
      >
        {avail.hasSecondParent
          ? <><MinusCircle className="h-4 w-4" /> Remove second parent</>
          : <><PlusCircle className="h-4 w-4" /> Add second parent (for co-parenting coordination)</>
        }
      </button>

      {/* Parent 2 */}
      {avail.hasSecondParent && avail.p2 && (
        <ParentEntryForm
          entry={avail.p2}
          label="Parent 2"
          onChange={(e) => onChange({ ...avail, p2: e })}
        />
      )}
    </div>
  );
}

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

function parseTimeToMinutes(t: string): number {
  const [timePart, period] = t.split(" ");
  const [hours, minutes] = timePart.split(":").map(Number);
  let h = hours;
  if (period === "PM" && hours !== 12) h += 12;
  if (period === "AM" && hours === 12) h = 0;
  return h * 60 + (minutes || 0);
}

function TiffinSummaryCard({ familyResults }: { familyResults: FamilyResult[] }) {
  const tiffinData = familyResults
    .map(({ child, routine }) => {
      const item = routine.items.find((i) => i.category === "tiffin");
      if (!item) return null;
      const options = item.notes?.startsWith("Options:")
        ? item.notes.replace("Options:", "").split("|").map((o) => o.trim()).filter(Boolean)
        : [];
      return { child, time: item.time, options };
    })
    .filter(Boolean) as { child: ChildType; time: string; options: string[] }[];

  if (tiffinData.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🍱</span>
        <div>
          <h3 className="font-quicksand font-bold text-amber-900 text-lg">Tiffin Box Suggestions</h3>
          <p className="text-amber-700 text-xs">For school-going kids — choose one per child</p>
        </div>
      </div>
      <div className="space-y-4">
        {tiffinData.map(({ child, time, options }) => (
          <div key={child.id} className="bg-white rounded-2xl p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-amber-100 text-amber-700 rounded-full px-3 py-0.5 text-xs font-bold flex items-center gap-1">
                <User className="h-3 w-3" />
                {child.name}
              </div>
              <span className="text-xs text-amber-600">Pack by {time}</span>
              <span className="text-xs text-amber-500 ml-1">
                {child.foodType === "non_veg" ? "🍗 Non-veg" : "🥦 Veg"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {options.map((opt, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium"
                >
                  <span className="text-amber-500">🥘</span>
                  {opt}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CombinedTimeline({ familyResults }: { familyResults: FamilyResult[] }) {
  const childColors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-rose-500", "bg-orange-500"];

  const allItems = familyResults
    .flatMap(({ child, routine }, ci) =>
      routine.items.map((item) => ({ ...item, childName: child.name, childId: child.id, colorClass: childColors[ci % childColors.length] }))
    )
    .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

  return (
    <div className="space-y-2">
      {allItems.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 hover:border-primary/20 transition-all">
          <div className="text-xs font-bold text-muted-foreground w-16 shrink-0 text-right">{item.time}</div>
          <div className={`w-2 h-2 rounded-full shrink-0 ${item.colorClass}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground truncate">{item.activity}</span>
              <Badge variant="outline" className={`text-xs px-1.5 py-0 ${item.colorClass.replace("bg-", "text-").replace("-500", "-700")} border-current/30`}>
                {item.childName}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">{item.duration}m · {item.category}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function IndividualRoutineSection({ result }: { result: FamilyResult }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary rounded-full p-1.5">
            <User className="h-4 w-4" />
          </div>
          <div className="text-left">
            <div className="font-bold text-foreground">{result.child.name}</div>
            <div className="text-xs text-muted-foreground">{result.routine.title} · {result.routine.items.length} activities</div>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
          {result.routine.items.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-2 rounded-xl hover:bg-muted/30">
              <div className="text-xs font-bold text-muted-foreground w-14 shrink-0 text-right pt-0.5">{item.time}</div>
              <div className="flex-1">
                <div className="text-sm font-medium">{item.activity}</div>
                <div className="text-xs text-muted-foreground">{item.duration}m</div>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">{item.category}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoutineGenerate() {
  const [_, setLocation] = useLocation();
  const [mode, setMode] = useState<"single" | "family">("single");

  // Single mode
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [hasSchool, setHasSchool] = useState<boolean | null>(null);
  const [specialPlans, setSpecialPlans] = useState("");
  const [fridgeItems, setFridgeItems] = useState("");
  const [mood, setMood] = useState<"happy" | "angry" | "lazy" | "normal">("normal");

  // Per-date parent availability
  const [parentAvail, setParentAvail] = useState<ParentAvailData>(() => loadAvailability(format(new Date(), "yyyy-MM-dd")));

  // Family mode
  const [familyChildSettings, setFamilyChildSettings] = useState<Record<number, { hasSchool: boolean | null; selected: boolean }>>({});
  const [familyDate, setFamilyDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [familyParentAvail, setFamilyParentAvail] = useState<ParentAvailData>(() => loadAvailability(format(new Date(), "yyyy-MM-dd")));
  const [familySpecialPlans, setFamilySpecialPlans] = useState("");
  const [familyFridgeItems, setFamilyFridgeItems] = useState("");
  const [familyProgress, setFamilyProgress] = useState<{ current: number; total: number; currentName: string } | null>(null);
  const [familyResults, setFamilyResults] = useState<FamilyResult[] | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Existing routine check
  const [existingRoutine, setExistingRoutine] = useState<{ exists: boolean; routineId?: number } | null>(null);
  const [overrideMode, setOverrideMode] = useState(false);
  const checkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  const { data: children, isLoading: loadingChildren } = useListChildren({
    query: { queryKey: getListChildrenQueryKey() }
  });

  const generateMutation = useGenerateRoutine();
  const createMutation = useCreateRoutine();

  // Load/save single-mode parent availability per date
  useEffect(() => { setParentAvail(loadAvailability(date)); }, [date]);
  useEffect(() => { saveAvailability(date, parentAvail); }, [date, parentAvail]);

  // Load/save family-mode parent availability per date
  useEffect(() => { setFamilyParentAvail(loadAvailability(familyDate)); }, [familyDate]);
  useEffect(() => { saveAvailability(familyDate, familyParentAvail); }, [familyDate, familyParentAvail]);

  // Auto-detect weekends for single mode
  useEffect(() => {
    const d = new Date(date + "T00:00:00");
    const day = d.getDay(); // 0=Sun, 6=Sat
    if (day === 0 || day === 6) {
      setHasSchool(false);
    }
  }, [date]);

  // Check for existing routine when child + date both selected
  useEffect(() => {
    if (!selectedChild || !date) {
      setExistingRoutine(null);
      setOverrideMode(false);
      return;
    }
    if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current);
    checkDebounceRef.current = setTimeout(() => {
      authFetch(getApiUrl(`/api/routines/check?childId=${selectedChild}&date=${date}`))
        .then((r) => r.ok ? r.json() : null)
        .then((data: any) => {
          setExistingRoutine(data ?? null);
          if (data?.exists) setOverrideMode(false);
        })
        .catch(() => setExistingRoutine(null));
    }, 400);
    return () => { if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current); };
  }, [selectedChild, date]);

  // Auto-detect weekends for family mode and pre-set hasSchool=false
  useEffect(() => {
    const d = new Date(familyDate + "T00:00:00");
    const day = d.getDay();
    const isWeekend = day === 0 || day === 6;
    if (isWeekend && children && children.length > 0) {
      setFamilyChildSettings((prev) => {
        const next = { ...prev };
        children.forEach((c) => {
          if (next[c.id]) {
            next[c.id] = { ...next[c.id], hasSchool: false };
          }
        });
        return next;
      });
    }
  }, [familyDate, children]);

  // Initialize family child settings when children load
  useEffect(() => {
    if (children && children.length > 0) {
      setFamilyChildSettings((prev) => {
        const next = { ...prev };
        children.forEach((c) => {
          if (!(c.id in next)) {
            next[c.id] = { hasSchool: null, selected: true };
          }
        });
        return next;
      });
    }
  }, [children]);

  // Build parent avail payload for mutation
  function buildParentAvailPayload(avail: ParentAvailData) {
    const p1 = avail.p1;
    const p2 = avail.hasSecondParent ? avail.p2 : null;
    return {
      parent1Role: p1.role || undefined,
      parent1WorkType: p1.workType || undefined,
      parent1IsWorking: p1.workType !== "homemaker" && p1.isWorking !== null ? p1.isWorking : undefined,
      parent1WorkHours: p1.workType !== "homemaker" && p1.isWorking ? (p1.workHours || undefined) : undefined,
      parent2Role: p2?.role || undefined,
      parent2WorkType: p2?.workType || undefined,
      parent2IsWorking: p2 && p2.workType !== "homemaker" && p2.isWorking !== null ? p2.isWorking : undefined,
      parent2WorkHours: p2 && p2.workType !== "homemaker" && p2.isWorking ? (p2.workHours || undefined) : undefined,
    };
  }

  const isFormValid = selectedChild && date && hasSchool !== null;
  const isGenerating = generateMutation.isPending || createMutation.isPending;

  const selectedChildData = children?.find((c) => c.id === selectedChild) as ChildType | undefined;

  // Single mode generate
  const handleGenerate = (forceOverride = false) => {
    if (!isFormValid) return;

    // Block if routine exists and user hasn't confirmed override
    if (existingRoutine?.exists && !forceOverride && !overrideMode) return;

    generateMutation.mutate(
      {
        data: {
          childId: selectedChild!,
          date,
          hasSchool: hasSchool ?? undefined,
          specialPlans: specialPlans.trim() || undefined,
          fridgeItems: fridgeItems.trim() || undefined,
          mood: mood !== "normal" ? mood : undefined,
          ...buildParentAvailPayload(parentAvail),
        }
      },
      {
        onSuccess: (generatedData) => {
          const shouldOverride = forceOverride || overrideMode || existingRoutine?.exists;
          createMutation.mutate(
            {
              data: {
                childId: selectedChild!,
                date,
                title: generatedData.title,
                items: generatedData.items,
                override: shouldOverride,
              }
            },
            {
              onSuccess: (savedRoutine) => {
                toast({ title: shouldOverride ? "🔄 Routine replaced!" : "✨ Routine generated!" });
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

  // Family mode generate — sequential
  const handleFamilyGenerate = async () => {
    if (!children) return;
    const selectedChildren = children.filter(
      (c) => familyChildSettings[c.id]?.selected && familyChildSettings[c.id]?.hasSchool !== null
    ) as ChildType[];

    if (selectedChildren.length === 0) {
      toast({ title: "Please select at least one child and set their school status.", variant: "destructive" });
      return;
    }

    setFamilyResults(null);
    const results: FamilyResult[] = [];

    for (let i = 0; i < selectedChildren.length; i++) {
      const child = selectedChildren[i];
      setFamilyProgress({ current: i + 1, total: selectedChildren.length, currentName: child.name });

      try {
        const generated = await new Promise<GeneratedRoutine>((resolve, reject) => {
          generateMutation.mutate(
            {
              data: {
                childId: child.id,
                date: familyDate,
                hasSchool: familyChildSettings[child.id]?.hasSchool ?? undefined,
                specialPlans: familySpecialPlans.trim() || undefined,
                fridgeItems: familyFridgeItems.trim() || undefined,
                ...buildParentAvailPayload(familyParentAvail),
              }
            },
            {
              onSuccess: (data) => resolve(data as GeneratedRoutine),
              onError: reject,
            }
          );
        });

        results.push({ child, routine: generated });
      } catch {
        toast({ title: `Failed to generate routine for ${child.name}`, variant: "destructive" });
      }
    }

    setFamilyProgress(null);
    setFamilyResults(results);
  };

  // Save all family routines
  const handleSaveAll = async () => {
    if (!familyResults) return;
    setIsSavingAll(true);
    let saved = 0;

    for (const { child, routine } of familyResults) {
      try {
        await new Promise<void>((resolve, reject) => {
          createMutation.mutate(
            {
              data: {
                childId: child.id,
                date: familyDate,
                title: routine.title,
                items: routine.items,
              }
            },
            {
              onSuccess: () => { saved++; resolve(); },
              onError: reject,
            }
          );
        });
      } catch {
        toast({ title: `Failed to save routine for ${child.name}`, variant: "destructive" });
      }
    }

    setIsSavingAll(false);
    if (saved > 0) {
      queryClient.invalidateQueries({ queryKey: getListRoutinesQueryKey() });
      toast({ title: `✨ Saved ${saved} routine${saved > 1 ? "s" : ""}!` });
      setLocation("/routines");
    }
  };

  const isGeneratingFamily = !!familyProgress;

  const familySelectedCount = Object.values(familyChildSettings).filter((s) => s.selected).length;
  const familyReadyCount = Object.entries(familyChildSettings)
    .filter(([, s]) => s.selected && s.hasSchool !== null).length;

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

      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-muted rounded-2xl">
        <button
          onClick={() => setMode("single")}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            mode === "single" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-4 w-4" />
          Single Child
        </button>
        <button
          onClick={() => setMode("family")}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            mode === "family" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          Family Routine
        </button>
      </div>

      {/* ==================== SINGLE MODE ==================== */}
      {mode === "single" && (
        <>
          {isGenerating ? (
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-card mt-4">
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
                          {(child as ChildType).childClass && (
                            <span className="text-xs opacity-70">· {(child as ChildType).childClass}</span>
                          )}
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
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <span className="text-muted-foreground text-xs">Diet:</span>
                        <span className="text-xs font-medium">{selectedChildData.foodType === "non_veg" ? "🍗 Non-Vegetarian" : "🥦 Vegetarian"}</span>
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
                      onChange={(e) => { setDate(e.target.value); setExistingRoutine(null); setOverrideMode(false); }}
                      className="bg-transparent border-none outline-none text-foreground font-medium w-full text-lg"
                    />
                  </div>

                  {/* Existing routine warning */}
                  {existingRoutine?.exists && !overrideMode && (
                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-900 text-sm">Routine already exists for this date!</p>
                          <p className="text-amber-700 text-xs mt-0.5">
                            {selectedChildData?.name ?? "This child"} already has a routine on{" "}
                            {new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/routines/${existingRoutine.routineId}`}>
                          <button className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                            View Existing Routine
                          </button>
                        </Link>
                        <button
                          onClick={() => setOverrideMode(true)}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Override & Regenerate
                        </button>
                      </div>
                    </div>
                  )}

                  {overrideMode && (
                    <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-3 flex items-center gap-3">
                      <RefreshCw className="h-4 w-4 text-orange-600 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-orange-900">Override mode active</p>
                        <p className="text-xs text-orange-700">The existing routine will be replaced when you generate.</p>
                      </div>
                      <button onClick={() => setOverrideMode(false)} className="text-xs text-orange-600 underline font-medium">Cancel</button>
                    </div>
                  )}
                </div>

                {/* Step 3 — School today? */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">3</div>
                    <Label className="text-lg font-bold flex items-center gap-2">
                      <School className="h-5 w-5 text-primary" />
                      Is there school on this day?
                    </Label>
                    {(() => {
                      const d = new Date(date + "T00:00:00");
                      const day = d.getDay();
                      return (day === 0 || day === 6) ? (
                        <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">🏖️ Weekend auto-detected</span>
                      ) : null;
                    })()}
                  </div>
                  <ToggleGroup
                    value={hasSchool}
                    onChange={setHasSchool}
                    options={[
                      ["Yes, school day", true, "🏫"],
                      ["No, day off", false, "🏖️"],
                    ]}
                  />
                  {hasSchool === true && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm text-amber-800">
                      🍱 The AI will suggest a tiffin lunchbox for your child and plan school-day blocks.
                    </div>
                  )}
                  {hasSchool === false && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm text-amber-800">
                      The AI will skip school blocks and add outdoor play, hobby activities, and family time instead.
                    </div>
                  )}
                </div>

                {/* Step 4 — Parent availability for this date */}
                <ParentAvailSection
                  stepNum={4}
                  avail={parentAvail}
                  onChange={setParentAvail}
                  date={date}
                />

                {/* Step 5 — Special plans */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">5</div>
                    <Label className="text-lg font-bold flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Any special plans today? <span className="text-sm font-normal text-muted-foreground">(optional)</span>
                    </Label>
                  </div>
                  <Input
                    placeholder="e.g. birthday party at 4pm, doctor's appointment at 11am, outing to the park..."
                    value={specialPlans}
                    onChange={(e) => setSpecialPlans(e.target.value)}
                    className="rounded-2xl h-12 pl-4"
                  />
                  <p className="text-xs text-muted-foreground">The AI will adjust the entire routine around your special plans.</p>
                </div>

                {/* Step 6 — Fridge Items */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">6</div>
                    <Label className="text-lg font-bold">What's in your fridge? <span className="text-sm font-normal text-muted-foreground">(optional)</span></Label>
                  </div>
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
                  <p className="text-xs text-muted-foreground">The AI will suggest meals and tiffin using only what you have.</p>
                </div>

                {/* Mood Selector */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">7</div>
                    <Label className="text-lg font-bold">How is your child feeling today?</Label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {MOOD_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setMood(opt.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                          mood === opt.value
                            ? `${opt.color} border-2 shadow-sm scale-105`
                            : "bg-card border-border hover:border-primary/40 hover:bg-muted"
                        }`}
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="font-bold text-sm">{opt.label}</span>
                        <span className="text-[10px] text-center opacity-70 leading-tight">{opt.hint}</span>
                      </button>
                    ))}
                  </div>
                  {mood !== "normal" && (
                    <div className="bg-muted/60 border border-border rounded-xl px-3 py-2 text-xs text-foreground/70">
                      🎯 AI will adapt the routine for a <strong>{mood}</strong> mood day — {MOOD_OPTIONS.find(o => o.value === mood)?.hint?.toLowerCase()}.
                    </div>
                  )}
                </div>

                {/* What the AI uses */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-sm text-foreground/70 space-y-1">
                  <p className="font-bold text-foreground text-sm mb-2">✨ What the AI considers:</p>
                  <ul className="space-y-1 list-none">
                    <li>🏫 School status — includes or skips school blocks</li>
                    <li>🍱 Tiffin suggestion — 3 options for school-going kids</li>
                    <li>👩‍💼 Parent work type — homemaker, WFH, or office schedule</li>
                    <li>💼 Working day check — busy vs. free affects task assignment</li>
                    <li>🕘 Work hours — tasks planned around exact busy windows</li>
                    <li>👨‍👩‍👧 Co-parent coordination — smart role assignment when both parents added</li>
                    <li>🌟 Special plans — adjusts the whole day around them</li>
                    <li>❤️ Family bonding — always adds 2–3 quality moments</li>
                    <li>⏰ Wake-up & bedtime for accurate time slots</li>
                    <li>🥦 Child's food preference — veg or non-veg</li>
                    <li>🍽️ Fridge ingredients for meal suggestions</li>
                    <li>😊 Child's mood — adjusts tone & activity intensity</li>
                  </ul>
                </div>

                <div className="pt-2">
                  {existingRoutine?.exists && !overrideMode ? (
                    <p className="text-center text-sm text-amber-700 font-medium bg-amber-50 border border-amber-200 rounded-2xl py-3 px-4">
                      ⚠️ Choose <strong>View Existing Routine</strong> or <strong>Override & Regenerate</strong> above to continue.
                    </p>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleGenerate(false)}
                        disabled={!isFormValid || isGenerating}
                        size="lg"
                        className={`w-full rounded-full h-14 text-lg font-bold shadow-sm transition-all ${overrideMode ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                      >
                        {overrideMode ? (
                          <><RefreshCw className="h-5 w-5 mr-2" />Regenerate & Override</>
                        ) : (
                          <><Sparkles className="h-5 w-5 mr-2" />Generate Smart Routine</>
                        )}
                      </Button>
                      {!isFormValid && (
                        <p className="text-center text-xs text-muted-foreground mt-2">
                          Please select a child and answer the school question to continue.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ==================== FAMILY MODE ==================== */}
      {mode === "family" && (
        <>
          {/* Generating state */}
          {isGeneratingFamily && (
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-card mt-4">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                  <div className="relative bg-primary/10 text-primary w-20 h-20 rounded-full flex items-center justify-center">
                    <Users className="h-10 w-10 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="font-quicksand text-2xl font-bold mb-2">
                    Building {familyProgress?.currentName}'s routine...
                  </h3>
                  <p className="text-muted-foreground">
                    {familyProgress?.current} of {familyProgress?.total} children
                  </p>
                </div>
                <div className="w-full max-w-xs bg-muted rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${((familyProgress?.current ?? 0) / (familyProgress?.total ?? 1)) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Family results */}
          {!isGeneratingFamily && familyResults && (
            <div className="space-y-6">
              {/* Success banner */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="font-bold text-green-800">Family routine ready!</p>
                  <p className="text-xs text-green-700">{familyResults.length} routine{familyResults.length > 1 ? "s" : ""} generated for {familyDate}</p>
                </div>
              </div>

              {/* SECTION 3: Tiffin Suggestions */}
              <TiffinSummaryCard familyResults={familyResults} />

              {/* SECTION 2: Combined Timeline */}
              <Card className="rounded-3xl border-none shadow-sm bg-card">
                <CardContent className="p-5">
                  <h3 className="font-quicksand font-bold text-foreground text-lg mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Combined Family Timeline
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {familyResults.map(({ child }, i) => {
                      const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-rose-500", "bg-orange-500"];
                      return (
                        <div key={child.id} className="flex items-center gap-1.5 text-xs font-medium">
                          <div className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`} />
                          {child.name}
                        </div>
                      );
                    })}
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-1">
                    <CombinedTimeline familyResults={familyResults} />
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 1: Individual routines */}
              <Card className="rounded-3xl border-none shadow-sm bg-card">
                <CardContent className="p-5">
                  <h3 className="font-quicksand font-bold text-foreground text-lg mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Individual Routines
                  </h3>
                  <div className="space-y-3">
                    {familyResults.map((result) => (
                      <IndividualRoutineSection key={result.child.id} result={result} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="rounded-full flex-1"
                  onClick={() => setFamilyResults(null)}
                >
                  Regenerate
                </Button>
                <Button
                  onClick={handleSaveAll}
                  disabled={isSavingAll}
                  size="lg"
                  className="rounded-full flex-1 font-bold"
                >
                  {isSavingAll ? (
                    <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 animate-spin" /> Saving...</span>
                  ) : (
                    <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Save All Routines</span>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Family form */}
          {!isGeneratingFamily && !familyResults && (
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-card mt-4">
              <CardContent className="p-6 sm:p-8 space-y-8">

                {/* Step 1 — Select children */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">1</div>
                    <Label className="text-lg font-bold">Which children to include?</Label>
                  </div>

                  {loadingChildren ? (
                    <div className="space-y-3">
                      <div className="animate-pulse bg-muted h-24 rounded-2xl" />
                      <div className="animate-pulse bg-muted h-24 rounded-2xl" />
                    </div>
                  ) : children?.length === 0 ? (
                    <p className="text-sm text-destructive p-3 bg-destructive/10 rounded-xl w-full border border-destructive/20">
                      Please add child profiles first. <Link href="/children/new" className="underline font-bold">Add a child →</Link>
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {children?.map((child) => {
                        const settings = familyChildSettings[child.id] ?? { hasSchool: null, selected: true };
                        return (
                          <div
                            key={child.id}
                            className={`rounded-2xl border-2 overflow-hidden transition-all ${
                              settings.selected ? "border-primary/40 bg-primary/5" : "border-border bg-card opacity-60"
                            }`}
                          >
                            {/* Child header */}
                            <div className="flex items-center gap-3 p-4">
                              <button
                                onClick={() => setFamilyChildSettings((prev) => ({
                                  ...prev,
                                  [child.id]: { ...settings, selected: !settings.selected }
                                }))}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                  settings.selected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                                }`}
                              >
                                {settings.selected && <CheckCircle2 className="h-3 w-3" />}
                              </button>
                              <div className="flex-1">
                                <div className="font-bold text-foreground flex items-center gap-2">
                                  {child.name}
                                  <span className="text-xs text-muted-foreground font-normal">age {child.age}</span>
                                  {(child as ChildType).childClass && (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-md font-medium">{(child as ChildType).childClass}</span>
                                  )}
                                  <span className="text-xs text-muted-foreground font-normal">
                                    {(child as ChildType).foodType === "non_veg" ? "🍗" : "🥦"}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  School: {child.schoolStartTime}–{child.schoolEndTime} · Wake: {child.wakeUpTime}
                                </div>
                              </div>
                            </div>

                            {/* School toggle for this child */}
                            {settings.selected && (
                              <div className="px-4 pb-4">
                                <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
                                  <School className="h-3 w-3" />
                                  School today for {child.name}?
                                </p>
                                <div className="flex gap-2">
                                  {[
                                    { label: "🏫 Yes, school", val: true },
                                    { label: "🏖️ Day off", val: false },
                                  ].map(({ label, val }) => (
                                    <button
                                      key={String(val)}
                                      onClick={() => setFamilyChildSettings((prev) => ({
                                        ...prev,
                                        [child.id]: { ...settings, hasSchool: val }
                                      }))}
                                      className={`flex-1 py-2 px-3 rounded-xl font-bold border-2 transition-all text-xs ${
                                        settings.hasSchool === val
                                          ? "bg-primary text-primary-foreground border-primary"
                                          : "bg-card text-foreground border-border hover:border-primary/40"
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                      value={familyDate}
                      onChange={(e) => setFamilyDate(e.target.value)}
                      className="bg-transparent border-none outline-none text-foreground font-medium w-full text-lg"
                    />
                  </div>
                </div>

                {/* Step 3 — Parent availability for this date */}
                <ParentAvailSection
                  stepNum={3}
                  avail={familyParentAvail}
                  onChange={setFamilyParentAvail}
                  date={familyDate}
                />

                {/* Step 4 — Special plans */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">4</div>
                    <Label className="text-lg font-bold flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Any special family plans? <span className="text-sm font-normal text-muted-foreground">(optional)</span>
                    </Label>
                  </div>
                  <Input
                    placeholder="e.g. family outing, cousin's birthday party, sports day..."
                    value={familySpecialPlans}
                    onChange={(e) => setFamilySpecialPlans(e.target.value)}
                    className="rounded-2xl h-12 pl-4"
                  />
                </div>

                {/* Step 5 — Fridge */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">5</div>
                    <Label className="text-lg font-bold">What's in your fridge? <span className="text-sm font-normal text-muted-foreground">(optional)</span></Label>
                  </div>
                  <div className="relative">
                    <Refrigerator className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      placeholder="e.g. eggs, paneer, spinach, chicken, rice, tomatoes..."
                      value={familyFridgeItems}
                      onChange={(e) => setFamilyFridgeItems(e.target.value)}
                      className="pl-9 resize-none rounded-2xl min-h-[80px]"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Tiffin info */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                  <p className="font-bold mb-1">🍱 Smart Tiffin Planning</p>
                  <p>For each school-going child, the AI will suggest 3 tiffin/lunchbox options respecting their food preference (veg/non-veg). A combined tiffin summary will be shown at the top of the results.</p>
                </div>

                <Button
                  onClick={handleFamilyGenerate}
                  disabled={isGeneratingFamily || familySelectedCount === 0}
                  size="lg"
                  className="w-full rounded-full h-14 text-lg font-bold shadow-sm"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Generate Family Routine
                  {familyReadyCount > 0 && familySelectedCount > 0 && (
                    <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                      {familyReadyCount}/{familySelectedCount} ready
                    </span>
                  )}
                </Button>
                {familySelectedCount > 0 && familyReadyCount < familySelectedCount && (
                  <p className="text-center text-xs text-muted-foreground -mt-4">
                    Set school status for all selected children to continue.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
