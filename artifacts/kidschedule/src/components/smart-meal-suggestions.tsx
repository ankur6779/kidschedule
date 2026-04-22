import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { AmyIcon } from "@/components/amy-icon";
import { TiffinFeedbackPanel, loadHistory as loadTiffinHistory } from "@/components/tiffin-feedback-panel";
import { getLearningSignals, type TiffinHistory } from "@workspace/tiffin-feedback";
import {
  Utensils,
  X,
  Volume2,
  VolumeX,
  Plus,
  ChefHat,
  Flame,
  Clock,
  Search,
  Sparkles,
} from "lucide-react";

type MealTag = "Healthy" | "Quick" | "Protein" | "Veg" | "Non-Veg" | "Sweet";

interface RankedMeal {
  id: string;
  title: string;
  emoji: string;
  bgGradient: [string, string];
  region: string;
  category: "kids_tiffin" | "parent_healthy";
  ingredients: string[];
  steps: string[];
  calories: number;
  tags: MealTag[];
  prepMinutes: number;
  audioText: string;
  isVeg: boolean;
  matchedIngredients: string[];
  missingIngredients: string[];
}

interface SuggestionResult {
  meals: RankedMeal[];
  amyMessage: string;
  usedFallback: boolean;
}

type Audience = "kids_tiffin" | "parent_healthy";

const FRIDGE_QUICK = [
  "milk", "bread", "paneer", "egg", "rice", "dal",
  "potato", "onion", "tomato", "curd", "cheese", "oats",
];

const STORAGE_FRIDGE = "amynest.fridge_items.v1";
const STORAGE_VOICE = "amynest.tts_voice.v1";

function loadFridge(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_FRIDGE);
    return raw ? (JSON.parse(raw) as string[]).slice(0, 30) : [];
  } catch {
    return [];
  }
}

function saveFridge(items: string[]) {
  try {
    localStorage.setItem(STORAGE_FRIDGE, JSON.stringify(items));
  } catch {}
}

function loadVoicePref(): "female" | "male" {
  try {
    const v = localStorage.getItem(STORAGE_VOICE);
    return v === "male" ? "male" : "female";
  } catch {
    return "female";
  }
}

export function SmartMealSuggestions() {
  const authFetch = useAuthFetch();
  const [audience, setAudience] = useState<Audience>("kids_tiffin");
  const [region, setRegion] = useState<string>("pan_indian");
  const [isVeg, setIsVeg] = useState<boolean | undefined>(undefined);
  const [childAge, setChildAge] = useState<number | undefined>(undefined);
  const [fridge, setFridge] = useState<string[]>(() => loadFridge());
  const [fridgeInput, setFridgeInput] = useState("");
  const [allMeals, setAllMeals] = useState<RankedMeal[]>([]);
  const [amyMessage, setAmyMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [openMeal, setOpenMeal] = useState<RankedMeal | null>(null);
  const [tiffinHistory, setTiffinHistory] = useState<TiffinHistory>(() => loadTiffinHistory());
  const [manualSearch, setManualSearch] = useState(0);
  // Rotating display offset — each click shows a different window of 5 meals
  const [displayOffset, setDisplayOffset] = useState(0);
  const [searchFlash, setSearchFlash] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const learning = useMemo(() => getLearningSignals(tiffinHistory), [tiffinHistory]);

  // 5 meals shown at a time, rotating through the full ranked pool
  const DISPLAY_COUNT = 5;
  const displayedMeals = useMemo(() => {
    if (allMeals.length === 0) return [];
    const doubled = [...allMeals, ...allMeals]; // allow wrap-around
    return doubled.slice(displayOffset, displayOffset + DISPLAY_COUNT);
  }, [allMeals, displayOffset]);

  // Derived data object for TiffinFeedbackPanel compat
  const data = useMemo(
    () => allMeals.length > 0 ? { meals: allMeals, amyMessage, usedFallback: false } : null,
    [allMeals, amyMessage],
  );

  const handleFindCook = () => {
    if (allMeals.length > 0) {
      // Already have a pool — just rotate the display window immediately
      setDisplayOffset(prev => (prev + DISPLAY_COUNT) % Math.max(allMeals.length, 1));
    }
    // Also re-fetch in the background for fresh results
    setManualSearch(n => n + 1);
    setSearchFlash(true);
    setTimeout(() => setSearchFlash(false), 800);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };

  // Pull region + diet from parent profile + first child age once
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      authFetch("/api/parent-profile").then(r => r.ok ? r.json() : null).catch(() => null),
      authFetch("/api/children").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([profile, children]) => {
      if (cancelled) return;
      if (profile?.region) setRegion(profile.region);
      if (profile?.foodType === "veg") setIsVeg(true);
      if (Array.isArray(children) && children[0]?.age != null) {
        setChildAge(Number(children[0].age));
      }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist fridge
  useEffect(() => { saveFridge(fridge); }, [fridge]);

  // Fetch suggestions whenever core inputs change (not manualSearch — rotation is client-side)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(false);
    const params = new URLSearchParams();
    params.set("region", region);
    params.set("audience", audience);
    if (fridge.length > 0) params.set("fridge", fridge.join(","));
    if (audience === "kids_tiffin" && childAge != null) {
      params.set("childAge", String(childAge));
    }
    if (isVeg === true) params.set("isVeg", "true");
    if (audience === "kids_tiffin") {
      if (learning.liked.length > 0) params.set("liked", learning.liked.join(","));
      if (learning.disliked.length > 0) params.set("disliked", learning.disliked.join(","));
    }
    // /api/meals/suggest is now a public endpoint — plain fetch, no auth needed
    fetch(`/api/meals/suggest?${params.toString()}`)
      .then(r => r.ok ? r.json() : null)
      .then((r: SuggestionResult | null) => {
        if (!cancelled) {
          setAllMeals(r?.meals ?? []);
          setAmyMessage(r?.amyMessage ?? "");
          setDisplayOffset(0);
          setLoading(false);
          setFetchError(!r);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setFetchError(true);
        }
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, audience, fridge, childAge, isVeg, learning.liked.join(","), learning.disliked.join(","), manualSearch]);

  const addFridgeItem = (raw: string) => {
    const v = raw.trim().toLowerCase();
    if (!v) return;
    setFridge(prev => prev.includes(v) ? prev : [...prev, v].slice(0, 30));
    setFridgeInput("");
  };
  const removeFridgeItem = (v: string) => setFridge(prev => prev.filter(x => x !== v));

  return (
    <div className="rounded-2xl border border-violet-100 dark:border-violet-400/20 bg-gradient-to-br from-violet-50/60 via-white to-amber-50/40 dark:from-violet-500/8 dark:via-slate-900/30 dark:to-amber-500/8 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-violet-100 dark:border-violet-400/15 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-lg shrink-0">
            🍱
          </div>
          <div className="min-w-0">
            <p className="font-quicksand font-bold text-[15px] text-foreground truncate">Smart Tiffin & Meal Suggestions</p>
            <p className="text-[11px] text-muted-foreground truncate">Personalised by region, fridge & age</p>
          </div>
        </div>
        {/* Audience toggle */}
        <div className="flex bg-white/70 dark:bg-slate-900/40 border border-border rounded-full p-0.5 shrink-0">
          <button
            onClick={() => setAudience("kids_tiffin")}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
              audience === "kids_tiffin"
                ? "bg-violet-600 text-white shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="meals-tab-kids"
          >
            Kids
          </button>
          <button
            onClick={() => setAudience("parent_healthy")}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
              audience === "parent_healthy"
                ? "bg-violet-600 text-white shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="meals-tab-parent"
          >
            Parent
          </button>
        </div>
      </div>

      {/* 🍱 Tiffin Feedback — daily input + Top Liked + Amy hint */}
      {audience === "kids_tiffin" && (
        <TiffinFeedbackPanel
          pickableMeals={(data?.meals ?? []).map(m => ({
            id: m.id, title: m.title, emoji: m.emoji, tag: m.tags[0],
          }))}
          onChange={setTiffinHistory}
        />
      )}

      {/* Amy AI message */}
      {data && (
        <div className="px-4 pt-3">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/50 border border-violet-100 dark:border-violet-400/20">
            <AmyIcon size={18} bounce />
            <p className="text-[12.5px] leading-snug text-foreground/90"
               dangerouslySetInnerHTML={{ __html: amyMessageHTML(data.amyMessage) }} />
          </div>
        </div>
      )}

      {/* Fridge input */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
          <Search className="h-3 w-3" /> What's in your fridge? <span className="text-muted-foreground/60 normal-case font-medium">(optional)</span>
        </div>
        <div className="flex gap-2">
          <input
            value={fridgeInput}
            onChange={e => setFridgeInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addFridgeItem(fridgeInput); } }}
            placeholder="e.g. paneer"
            className="flex-1 h-9 px-3 rounded-lg border border-border bg-white dark:bg-slate-900/40 text-sm focus:outline-none focus:border-violet-400"
            data-testid="meals-fridge-input"
          />
          <button
            onClick={() => addFridgeItem(fridgeInput)}
            className="h-9 px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>

        {/* Quick chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {FRIDGE_QUICK.filter(x => !fridge.includes(x)).slice(0, 8).map(x => (
            <button
              key={x}
              onClick={() => addFridgeItem(x)}
              className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-border hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 text-muted-foreground hover:text-foreground transition-all"
            >
              + {x}
            </button>
          ))}
        </div>

        {fridge.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {fridge.map(x => (
              <span key={x} className="inline-flex items-center gap-1 text-[11px] font-bold pl-2 pr-1 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/25 text-violet-700 dark:text-violet-200 border border-violet-200 dark:border-violet-400/30">
                {x}
                <button onClick={() => removeFridgeItem(x)} className="hover:bg-violet-200 dark:hover:bg-violet-400/30 rounded-full p-0.5">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* CTA: Find What I Can Cook */}
        <button
          onClick={handleFindCook}
          className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
            searchFlash
              ? "bg-orange-500 text-white scale-[0.97] shadow-lg"
              : "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg hover:scale-[1.01]"
          }`}
          data-testid="meals-find-cook-btn"
        >
          <Search className="h-4 w-4" />
          🔍 Find What I Can Cook
          <Sparkles className="h-3.5 w-3.5 opacity-80" />
        </button>
      </div>

      {/* Cards — Netflix style horizontal scroll */}
      <div ref={resultsRef} className="mt-3 px-1 pb-4">
        {loading ? (
          <div className="flex gap-3 px-3 overflow-hidden">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="shrink-0 w-[160px] h-[200px] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="mx-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/20 text-center">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Meals load nahi hue. Retry karo.</p>
            <button onClick={() => setManualSearch(n => n + 1)} className="mt-2 text-xs text-red-600 underline">Retry</button>
          </div>
        ) : displayedMeals.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-3 pb-2 scroll-smooth" style={{ scrollbarWidth: "thin" }}>
            {displayedMeals.map((m, i) => (
              <MealCard
                key={`${m.id}-${displayOffset}-${i}`}
                meal={m}
                showCalories={audience === "parent_healthy"}
                onOpen={() => setOpenMeal(m)}
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-muted-foreground">No meals found. Try removing a fridge item.</div>
        )}
      </div>

      {/* Recipe modal — rendered via portal so it escapes overflow:hidden */}
      {openMeal && createPortal(
        <RecipeModal
          meal={openMeal}
          showCalories={audience === "parent_healthy"}
          onClose={() => setOpenMeal(null)}
        />,
        document.body,
      )}
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────
function MealCard({
  meal, showCalories, onOpen, style,
}: { meal: RankedMeal; showCalories: boolean; onOpen: () => void; style?: React.CSSProperties }) {
  const tag = meal.tags[0] ?? "Healthy";
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onOpen(); }}
      style={style}
      className="group shrink-0 snap-start w-[160px] rounded-2xl overflow-hidden border border-border bg-card hover:border-violet-300 dark:hover:border-violet-500/50 hover:shadow-md active:scale-95 transition-all text-left animate-in fade-in"
      data-testid={`meal-card-${meal.id}`}
    >
      <div
        className="relative h-[100px] flex items-center justify-center text-[52px]"
        style={{
          background: `linear-gradient(135deg, ${meal.bgGradient[0]}, ${meal.bgGradient[1]})`,
        }}
      >
        <span className="drop-shadow-sm group-hover:scale-110 transition-transform">{meal.emoji}</span>
        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wide bg-white/85 text-foreground px-1.5 py-0.5 rounded-full shadow-sm">
          {tag}
        </span>
        {meal.matchedIngredients.length > 0 && (
          <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
            ✓ {meal.matchedIngredients.length}
          </span>
        )}
      </div>
      <div className="p-2.5 space-y-1">
        <p className="font-bold text-[12.5px] text-foreground leading-tight line-clamp-2">{meal.title}</p>
        <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground flex-wrap">
          <span className="inline-flex items-center gap-0.5"><Clock className="h-3 w-3" /> {meal.prepMinutes}m</span>
          {showCalories && (
            <span className="inline-flex items-center gap-0.5"><Flame className="h-3 w-3 text-orange-500" /> {meal.calories}</span>
          )}
        </div>
        <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">Tap for recipe →</p>
      </div>
    </button>
  );
}

// ─── Modal + TTS ─────────────────────────────────────────────────────────
function RecipeModal({
  meal, showCalories, onClose,
}: { meal: RankedMeal; showCalories: boolean; onClose: () => void }) {
  const [speaking, setSpeaking] = useState(false);
  const [voicePref, setVoicePref] = useState<"female" | "male">(() => loadVoicePref());
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop speech + handle Escape key when modal unmounts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickVoice = (pref: "female" | "male"): SpeechSynthesisVoice | undefined => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
    const all = window.speechSynthesis.getVoices();
    if (all.length === 0) return undefined;
    const indian = all.filter(v => /en[-_]?IN/i.test(v.lang) || /india/i.test(v.name));
    const pool = indian.length > 0 ? indian : all.filter(v => v.lang.startsWith("en"));
    if (pool.length === 0) return undefined;
    const isMale = (v: SpeechSynthesisVoice) => /male|david|alex|fred|mark/i.test(v.name);
    const isFemale = (v: SpeechSynthesisVoice) => /female|samantha|victoria|karen|tessa|veena|kate|zira/i.test(v.name);
    const filtered = pref === "male" ? pool.find(isMale) : pool.find(isFemale);
    return filtered ?? pool[0];
  };

  const handleReadAloud = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Read Aloud is not supported in this browser.");
      return;
    }
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(meal.audioText);
    u.rate = 0.95;
    u.pitch = 1.0;
    const voice = pickVoice(voicePref);
    if (voice) u.voice = voice;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utterRef.current = u;
    synth.speak(u);
    setSpeaking(true);
  };

  const switchVoice = (pref: "female" | "male") => {
    setVoicePref(pref);
    try { localStorage.setItem(STORAGE_VOICE, pref); } catch {}
    if (speaking && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div
          className="relative h-[180px] flex items-center justify-center text-[96px] rounded-t-3xl"
          style={{ background: `linear-gradient(135deg, ${meal.bgGradient[0]}, ${meal.bgGradient[1]})` }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/85 hover:bg-white text-foreground flex items-center justify-center shadow-md"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="drop-shadow-sm">{meal.emoji}</span>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h3 className="font-quicksand font-black text-xl text-foreground leading-tight">{meal.title}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {meal.tags.map(t => (
                <span key={t} className="text-[10.5px] font-bold uppercase tracking-wide bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-200 px-2 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
              <span className="text-[10.5px] font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> {meal.prepMinutes} min
              </span>
              {showCalories && (
                <span className="text-[10.5px] font-bold uppercase tracking-wide bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Flame className="h-2.5 w-2.5" /> {meal.calories} kcal
                </span>
              )}
            </div>
          </div>

          {/* Read Aloud */}
          <div className="rounded-2xl border border-violet-100 dark:border-violet-400/25 bg-violet-50/60 dark:bg-violet-500/10 p-3">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleReadAloud}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-3.5 py-2 rounded-full"
                data-testid="meal-read-aloud"
              >
                {speaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                {speaking ? "Stop" : "Read Aloud"}
              </button>
              <div className="flex bg-white/70 dark:bg-slate-900/40 border border-border rounded-full p-0.5">
                <button
                  onClick={() => switchVoice("female")}
                  className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                    voicePref === "female" ? "bg-violet-600 text-white" : "text-muted-foreground"
                  }`}
                >
                  ♀ Female
                </button>
                <button
                  onClick={() => switchVoice("male")}
                  className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                    voicePref === "male" ? "bg-violet-600 text-white" : "text-muted-foreground"
                  }`}
                >
                  ♂ Male
                </button>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <p className="font-bold text-sm text-foreground mb-2 inline-flex items-center gap-1.5">
              <Utensils className="h-3.5 w-3.5 text-violet-500" /> Ingredients
            </p>
            <div className="flex flex-wrap gap-1.5">
              {meal.ingredients.map(ing => {
                const matched = meal.matchedIngredients.some(m => ing.includes(m) || m.includes(ing));
                return (
                  <span
                    key={ing}
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                      matched
                        ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-200"
                        : "bg-muted border-border text-foreground/70"
                    }`}
                  >
                    {matched ? "✓ " : ""}{ing}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Steps */}
          <div>
            <p className="font-bold text-sm text-foreground mb-2 inline-flex items-center gap-1.5">
              <ChefHat className="h-3.5 w-3.5 text-violet-500" /> Steps
            </p>
            <ol className="space-y-2">
              {meal.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-snug">
                  <span className="shrink-0 h-5 w-5 rounded-full bg-violet-600 text-white text-[11px] font-black flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// Render **bold** markers from the local Amy message template safely.
function amyMessageHTML(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
