import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import type { AgeGroup } from "@/lib/age-groups";

// ─── Puzzle data ──────────────────────────────────────────────────────────────

type Puzzle = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: "easy" | "medium" | "hard";
};

const PUZZLES: Puzzle[] = [
  // ── EASY (preschool, 3–5 years) ──────────────────────────────
  { id: "e01", difficulty: "easy", question: "What comes after A, B, C?", options: ["D", "E", "F", "G"], correctAnswer: "D" },
  { id: "e02", difficulty: "easy", question: "What color is the sky on a sunny day?", options: ["Green", "Blue", "Red", "Yellow"], correctAnswer: "Blue" },
  { id: "e03", difficulty: "easy", question: "How many fingers are on ONE hand?", options: ["4", "6", "5", "10"], correctAnswer: "5" },
  { id: "e04", difficulty: "easy", question: "Which animal says 'Moo'?", options: ["Dog", "Cat", "Cow", "Duck"], correctAnswer: "Cow" },
  { id: "e05", difficulty: "easy", question: "What shape is a ball?", options: ["Square", "Triangle", "Circle", "Rectangle"], correctAnswer: "Circle" },
  { id: "e06", difficulty: "easy", question: "What comes after the number 4?", options: ["3", "6", "7", "5"], correctAnswer: "5" },
  { id: "e07", difficulty: "easy", question: "Which fruit is yellow and curved?", options: ["Apple", "Banana", "Grape", "Mango"], correctAnswer: "Banana" },
  { id: "e08", difficulty: "easy", question: "How many wheels does a car have?", options: ["2", "3", "4", "6"], correctAnswer: "4" },
  { id: "e09", difficulty: "easy", question: "What do bees make?", options: ["Milk", "Honey", "Butter", "Juice"], correctAnswer: "Honey" },
  { id: "e10", difficulty: "easy", question: "Which is the biggest animal?", options: ["Cat", "Dog", "Elephant", "Rabbit"], correctAnswer: "Elephant" },
  { id: "e11", difficulty: "easy", question: "How many sides does a triangle have?", options: ["2", "4", "5", "3"], correctAnswer: "3" },
  { id: "e12", difficulty: "easy", question: "What do plants need to grow?", options: ["Sand and Ice", "Sun and Water", "Dark and Cold", "Wind and Fire"], correctAnswer: "Sun and Water" },
  { id: "e13", difficulty: "easy", question: "Which one can fly?", options: ["Dog", "Fish", "Bird", "Cat"], correctAnswer: "Bird" },
  { id: "e14", difficulty: "easy", question: "What color is grass?", options: ["Blue", "Red", "Yellow", "Green"], correctAnswer: "Green" },
  { id: "e15", difficulty: "easy", question: "How many days are in a week?", options: ["5", "6", "8", "7"], correctAnswer: "7" },
  { id: "e16", difficulty: "easy", question: "Which season is coldest?", options: ["Summer", "Spring", "Winter", "Autumn"], correctAnswer: "Winter" },
  { id: "e17", difficulty: "easy", question: "What do we use to brush our teeth?", options: ["Comb", "Spoon", "Toothbrush", "Towel"], correctAnswer: "Toothbrush" },
  { id: "e18", difficulty: "easy", question: "Which number is the biggest?", options: ["3", "7", "2", "5"], correctAnswer: "7" },

  // ── MEDIUM (early school, 6–10 years) ────────────────────────
  { id: "m01", difficulty: "medium", question: "What is 8 × 7?", options: ["54", "56", "63", "48"], correctAnswer: "56" },
  { id: "m02", difficulty: "medium", question: "Which planet is closest to the Sun?", options: ["Venus", "Earth", "Mercury", "Mars"], correctAnswer: "Mercury" },
  { id: "m03", difficulty: "medium", question: "How many months are in a year?", options: ["10", "11", "12", "13"], correctAnswer: "12" },
  { id: "m04", difficulty: "medium", question: "What is the capital of India?", options: ["Mumbai", "Delhi", "Chennai", "Kolkata"], correctAnswer: "Delhi" },
  { id: "m05", difficulty: "medium", question: "What is 144 ÷ 12?", options: ["11", "13", "10", "12"], correctAnswer: "12" },
  { id: "m06", difficulty: "medium", question: "Which gas do plants absorb from the air?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctAnswer: "Carbon Dioxide" },
  { id: "m07", difficulty: "medium", question: "How many zeros are in one million?", options: ["5", "7", "6", "8"], correctAnswer: "6" },
  { id: "m08", difficulty: "medium", question: "What is the opposite of 'transparent'?", options: ["Clear", "Shiny", "Opaque", "Glossy"], correctAnswer: "Opaque" },
  { id: "m09", difficulty: "medium", question: "If a dozen eggs = 12, how many are in 3 dozen?", options: ["30", "24", "36", "48"], correctAnswer: "36" },
  { id: "m10", difficulty: "medium", question: "Which is the largest ocean?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: "Pacific" },
  { id: "m11", difficulty: "medium", question: "How many sides does a hexagon have?", options: ["5", "7", "8", "6"], correctAnswer: "6" },
  { id: "m12", difficulty: "medium", question: "What do you call the study of stars?", options: ["Biology", "Geology", "Astronomy", "Chemistry"], correctAnswer: "Astronomy" },
  { id: "m13", difficulty: "medium", question: "What is 25% of 200?", options: ["40", "60", "25", "50"], correctAnswer: "50" },
  { id: "m14", difficulty: "medium", question: "Which instrument has 88 keys?", options: ["Guitar", "Violin", "Flute", "Piano"], correctAnswer: "Piano" },
  { id: "m15", difficulty: "medium", question: "What is the boiling point of water (°C)?", options: ["90", "100", "80", "110"], correctAnswer: "100" },
  { id: "m16", difficulty: "medium", question: "How many continents are on Earth?", options: ["5", "6", "7", "8"], correctAnswer: "7" },
  { id: "m17", difficulty: "medium", question: "What is the square root of 81?", options: ["7", "8", "10", "9"], correctAnswer: "9" },
  { id: "m18", difficulty: "medium", question: "A triangle has angles of 60°, 60° and ___?", options: ["90°", "60°", "45°", "80°"], correctAnswer: "60°" },

  // ── HARD (pre-teen, 10–15 years) ─────────────────────────────
  { id: "h01", difficulty: "hard", question: "A train travels at 60 km/h for 2.5 hours. How far does it go?", options: ["120 km", "150 km", "180 km", "90 km"], correctAnswer: "150 km" },
  { id: "h02", difficulty: "hard", question: "What is the value of π (pi) to 2 decimal places?", options: ["3.41", "3.12", "3.14", "3.17"], correctAnswer: "3.14" },
  { id: "h03", difficulty: "hard", question: "If 5x = 35, what is x?", options: ["5", "8", "6", "7"], correctAnswer: "7" },
  { id: "h04", difficulty: "hard", question: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "Jane Austen", "Shakespeare", "Tolstoy"], correctAnswer: "Shakespeare" },
  { id: "h05", difficulty: "hard", question: "What is the speed of light (approximately)?", options: ["200,000 km/s", "3,00,000 km/s", "1,50,000 km/s", "5,00,000 km/s"], correctAnswer: "3,00,000 km/s" },
  { id: "h06", difficulty: "hard", question: "What is the chemical symbol for Gold?", options: ["Go", "Gd", "Au", "Ag"], correctAnswer: "Au" },
  { id: "h07", difficulty: "hard", question: "In a class of 40, 60% are girls. How many boys are there?", options: ["20", "18", "24", "16"], correctAnswer: "16" },
  { id: "h08", difficulty: "hard", question: "What is the smallest prime number?", options: ["0", "3", "1", "2"], correctAnswer: "2" },
  { id: "h09", difficulty: "hard", question: "Which element has atomic number 1?", options: ["Helium", "Oxygen", "Carbon", "Hydrogen"], correctAnswer: "Hydrogen" },
  { id: "h10", difficulty: "hard", question: "What is 15% of 360?", options: ["48", "54", "60", "45"], correctAnswer: "54" },
  { id: "h11", difficulty: "hard", question: "The sum of angles in a quadrilateral is:", options: ["180°", "270°", "360°", "540°"], correctAnswer: "360°" },
  { id: "h12", difficulty: "hard", question: "If you fold a square paper in half twice, how many layers?", options: ["2", "4", "6", "8"], correctAnswer: "4" },
  { id: "h13", difficulty: "hard", question: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Body"], correctAnswer: "Mitochondria" },
  { id: "h14", difficulty: "hard", question: "Solve: 2² + 3² + 4² = ?", options: ["25", "27", "29", "30"], correctAnswer: "29" },
  { id: "h15", difficulty: "hard", question: "What is the freezing point of water in Fahrenheit?", options: ["0°F", "100°F", "32°F", "212°F"], correctAnswer: "32°F" },
  { id: "h16", difficulty: "hard", question: "If a rectangle is 12cm × 8cm, what is its perimeter?", options: ["40 cm", "96 cm", "32 cm", "20 cm"], correctAnswer: "40 cm" },
  { id: "h17", difficulty: "hard", question: "A palindrome reads the same forwards and backwards. Which of these is one?", options: ["'race'", "'level'", "'tiger'", "'panel'"], correctAnswer: "'level'" },
  { id: "h18", difficulty: "hard", question: "What fraction of a day is 6 hours?", options: ["1/3", "1/6", "1/4", "1/2"], correctAnswer: "1/4" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hard";

type PuzzleState = {
  date: string;
  difficulty: Difficulty;
  correctStreak: number;
  wrongStreak: number;
  totalCorrect: number;
  totalAttempted: number;
  usedIds: string[];
};

const LS_KEY = "amynest_puzzle_state";
const PUZZLES_PER_SESSION = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateSeed(dateStr: string, childName: string): number {
  const str = dateStr + childName;
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getDefaultDifficulty(ageGroup: AgeGroup): Difficulty {
  if (ageGroup === "preschool") return "easy";
  if (ageGroup === "early_school") return "medium";
  return "hard";
}

function adjustDifficulty(current: Difficulty, correctStreak: number, wrongStreak: number): Difficulty {
  if (correctStreak >= 3) {
    if (current === "easy") return "medium";
    if (current === "medium") return "hard";
  }
  if (wrongStreak >= 2) {
    if (current === "hard") return "medium";
    if (current === "medium") return "easy";
  }
  return current;
}

function pickPuzzles(difficulty: Difficulty, seed: number, usedIds: string[], count: number): Puzzle[] {
  const pool = PUZZLES.filter((p) => p.difficulty === difficulty && !usedIds.includes(p.id));
  // Fallback to same difficulty ignoring usedIds, then adjacent difficulty
  const fallback = PUZZLES.filter((p) => p.difficulty === difficulty);
  const source = pool.length >= count ? pool : fallback.length >= count ? fallback : PUZZLES;
  const shuffled = [...source].sort(() => {
    seed = ((seed * 1664525 + 1013904223) >>> 0);
    return (seed % 3) - 1;
  });
  return shuffled.slice(0, count);
}

function loadState(childName: string, ageGroup: AgeGroup): PuzzleState {
  try {
    const raw = localStorage.getItem(LS_KEY + "_" + childName);
    if (raw) {
      const parsed: PuzzleState = JSON.parse(raw);
      if (parsed.date === todayStr()) return parsed;
      // New day — keep difficulty progress but reset streaks/usedIds
      return {
        date: todayStr(),
        difficulty: parsed.difficulty,
        correctStreak: 0,
        wrongStreak: 0,
        totalCorrect: parsed.totalCorrect,
        totalAttempted: parsed.totalAttempted,
        usedIds: [],
      };
    }
  } catch {}
  return {
    date: todayStr(),
    difficulty: getDefaultDifficulty(ageGroup),
    correctStreak: 0,
    wrongStreak: 0,
    totalCorrect: 0,
    totalAttempted: 0,
    usedIds: [],
  };
}

function saveState(childName: string, state: PuzzleState) {
  try {
    localStorage.setItem(LS_KEY + "_" + childName, JSON.stringify(state));
  } catch {}
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────

const DIFF_STYLES: Record<Difficulty, { label: string; color: string }> = {
  easy:   { label: "Easy ⭐",   color: "bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-400/30" },
  medium: { label: "Medium ⭐⭐", color: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-400/30" },
  hard:   { label: "Hard ⭐⭐⭐",  color: "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-400/30" },
};

// ─── Main component ───────────────────────────────────────────────────────────

interface DailyPuzzleProps {
  childName: string;
  ageGroup: AgeGroup;
  ageYears: number;
}

export function DailyPuzzle({ childName, ageGroup, ageYears }: DailyPuzzleProps) {
  // Only show for 3+ years (preschool and above)
  if (ageGroup === "infant" || ageGroup === "toddler") return null;
  // Extra guard: ageYears < 3
  if (ageYears < 3) return null;

  return <PuzzleEngine childName={childName} ageGroup={ageGroup} />;
}

function PuzzleEngine({ childName, ageGroup }: { childName: string; ageGroup: AgeGroup }) {
  const [state, setState] = useState<PuzzleState>(() => loadState(childName, ageGroup));
  const [sessionPuzzles, setSessionPuzzles] = useState<Puzzle[]>([]);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null);
  const [sessionDone, setSessionDone] = useState(false);

  // Generate session puzzles based on today's seed + difficulty
  const initSession = useCallback((st: PuzzleState) => {
    const seed = dateSeed(st.date, childName);
    const puzzles = pickPuzzles(st.difficulty, seed, st.usedIds, PUZZLES_PER_SESSION);
    setSessionPuzzles(puzzles);
    setPuzzleIndex(0);
    setSelected(null);
    setSubmitted(false);
    setSessionDone(false);
    setLevelUpMsg(null);
  }, [childName]);

  useEffect(() => {
    initSession(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPuzzle = sessionPuzzles[puzzleIndex];

  const handleSubmit = () => {
    if (!selected || !currentPuzzle) return;
    setSubmitted(true);

    const isCorrect = selected === currentPuzzle.correctAnswer;

    setState((prev) => {
      const newCorrectStreak = isCorrect ? prev.correctStreak + 1 : 0;
      const newWrongStreak = isCorrect ? 0 : prev.wrongStreak + 1;
      const newDifficulty = adjustDifficulty(prev.difficulty, newCorrectStreak, newWrongStreak);
      const didLevelUp = newDifficulty !== prev.difficulty;

      if (didLevelUp) {
        setLevelUpMsg(
          newDifficulty === "medium" ? "🎉 Level Up! Medium difficulty unlocked!"
          : newDifficulty === "hard" ? "🚀 Excellent! Hard difficulty unlocked!"
          : "👍 Taking it steady — dropping to easier puzzles"
        );
      }

      const next: PuzzleState = {
        ...prev,
        difficulty: newDifficulty,
        correctStreak: newCorrectStreak,
        wrongStreak: newWrongStreak,
        totalCorrect: isCorrect ? prev.totalCorrect + 1 : prev.totalCorrect,
        totalAttempted: prev.totalAttempted + 1,
        usedIds: [...prev.usedIds, currentPuzzle.id],
      };
      saveState(childName, next);
      return next;
    });
  };

  const handleNext = () => {
    setLevelUpMsg(null);
    if (puzzleIndex + 1 >= sessionPuzzles.length) {
      setSessionDone(true);
    } else {
      setPuzzleIndex((i) => i + 1);
      setSelected(null);
      setSubmitted(false);
    }
  };

  const handleRestart = () => {
    const fresh: PuzzleState = {
      date: todayStr(),
      difficulty: state.difficulty,
      correctStreak: 0,
      wrongStreak: 0,
      totalCorrect: state.totalCorrect,
      totalAttempted: state.totalAttempted,
      usedIds: state.usedIds,
    };
    setState(fresh);
    saveState(childName, fresh);
    initSession(fresh);
  };

  if (sessionPuzzles.length === 0) return null;

  const diffStyle = DIFF_STYLES[state.difficulty];
  const isCorrect = submitted && selected === currentPuzzle?.correctAnswer;
  const isWrong = submitted && selected !== currentPuzzle?.correctAnswer;
  const sessionScore = state.usedIds.filter((id) =>
    sessionPuzzles.some((p) => p.id === id)
  ).length;

  // ── Session complete ──────────────────────────────────────────
  if (sessionDone) {
    const correctThisSession = sessionPuzzles.filter((p) =>
      state.usedIds.includes(p.id) && state.totalCorrect > 0
    ).length;
    const pct = Math.round((state.totalCorrect / Math.max(state.totalAttempted, 1)) * 100);
    return (
      <Card className="rounded-3xl border-2 border-emerald-200 dark:border-emerald-400/30 bg-gradient-to-br from-emerald-50 dark:from-emerald-500/15 to-green-50 dark:to-green-500/15 overflow-hidden">
        <CardContent className="p-6 text-center space-y-4">
          <div className="text-5xl">🏆</div>
          <h3 className="font-bold text-xl text-emerald-800 dark:text-emerald-200">Puzzle Session Complete!</h3>
          <p className="text-sm text-emerald-700 dark:text-emerald-200">
            Great job, {childName}! You've completed all {PUZZLES_PER_SESSION} puzzles today.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-emerald-200 dark:border-emerald-400/30">
              <p className="text-xs text-muted-foreground">Overall Accuracy</p>
              <p className="font-bold text-lg text-emerald-700 dark:text-emerald-200">{pct}%</p>
            </div>
            <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-emerald-200 dark:border-emerald-400/30">
              <p className="text-xs text-muted-foreground">Current Level</p>
              <p className="font-bold text-lg text-emerald-700 dark:text-emerald-200 capitalize">{state.difficulty}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Come back tomorrow for a new set of puzzles!</p>
          <button
            onClick={handleRestart}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Practice More
          </button>
        </CardContent>
      </Card>
    );
  }

  // ── Active puzzle ─────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-base flex items-center gap-2">
          🧩 Daily Puzzle
        </h3>
        <div className="flex items-center gap-2">
          <Badge className={`text-xs font-semibold border px-2.5 py-1 ${diffStyle.color}`}>
            {diffStyle.label}
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">
            {puzzleIndex + 1}/{PUZZLES_PER_SESSION}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${((puzzleIndex) / PUZZLES_PER_SESSION) * 100}%` }}
        />
      </div>

      {/* Puzzle card */}
      <Card className="rounded-3xl border-2 border-primary/10 overflow-hidden">
        <CardContent className="p-5 space-y-4">
          {/* Question */}
          <div className="bg-primary/5 rounded-2xl px-4 py-3">
            <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">🧠 Ask your child today's puzzle</p>
            <p className="font-bold text-base text-foreground leading-snug">{currentPuzzle?.question}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5">
            {currentPuzzle?.options.map((opt) => {
              const isThisCorrect = submitted && opt === currentPuzzle.correctAnswer;
              const isThisWrong = submitted && opt === selected && opt !== currentPuzzle.correctAnswer;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={submitted}
                  onClick={() => !submitted && setSelected(opt)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl border-2 font-medium text-sm transition-all ${
                    isThisCorrect
                      ? "bg-green-50 dark:bg-green-500/15 border-green-400 text-green-800 dark:text-green-200"
                      : isThisWrong
                      ? "bg-red-50 dark:bg-red-500/15 border-red-400 text-red-700 dark:text-red-200"
                      : selected === opt
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted/40 border-transparent hover:border-primary/30 hover:bg-muted/70"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isThisCorrect
                        ? "border-green-500 bg-green-500"
                        : isThisWrong
                        ? "border-red-500 bg-red-500"
                        : selected === opt
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {(isThisCorrect || (!isThisWrong && selected === opt && !submitted)) && (
                      <span className="h-2 w-2 rounded-full bg-white block" />
                    )}
                  </span>
                  {opt}
                  {isThisCorrect && <CheckCircle2 className="ml-auto h-4 w-4 text-green-600 flex-shrink-0" />}
                  {isThisWrong && <XCircle className="ml-auto h-4 w-4 text-red-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {submitted && (
            <div className={`rounded-2xl px-4 py-3 flex items-start gap-2.5 ${isCorrect ? "bg-green-50 dark:bg-green-500/15 border border-green-200 dark:border-green-400/30" : "bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-400/30"}`}>
              <span className="text-xl flex-shrink-0">{isCorrect ? "✅" : "❌"}</span>
              <div>
                <p className={`font-bold text-sm ${isCorrect ? "text-green-800 dark:text-green-200" : "text-amber-800 dark:text-amber-200"}`}>
                  {isCorrect ? "Correct! Great job! 🌟" : `Not quite! The answer is: ${currentPuzzle?.correctAnswer}`}
                </p>
                {isCorrect && state.correctStreak >= 2 && (
                  <p className="text-xs text-green-700 dark:text-green-200 mt-0.5">🔥 {state.correctStreak} in a row!</p>
                )}
              </div>
            </div>
          )}

          {/* Level up message */}
          {levelUpMsg && (
            <div className="rounded-2xl bg-violet-50 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-400/30 px-4 py-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-violet-600 flex-shrink-0" />
              <p className="text-sm font-bold text-violet-800 dark:text-violet-200">{levelUpMsg}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={!selected}
                className="flex-1 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
              >
                {puzzleIndex + 1 >= sessionPuzzles.length ? (
                  <><Trophy className="h-4 w-4" /> Finish</>
                ) : (
                  <>Next Puzzle <ChevronRight className="h-4 w-4" /></>
                )}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Overall accuracy: <strong className="text-foreground">{state.totalAttempted > 0 ? Math.round((state.totalCorrect / state.totalAttempted) * 100) : 0}%</strong></span>
        <span>Total solved: <strong className="text-foreground">{state.totalCorrect}</strong></span>
      </div>
    </div>
  );
}
