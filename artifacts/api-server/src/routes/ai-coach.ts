import { Router, type IRouter } from "express";
import { createHash, randomUUID } from "crypto";
import { eq, desc, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, aiCacheTable, userProgressTable } from "@workspace/db";
import { logger } from "../lib/logger.js";
import { attachImagesToWins, GOAL_IDS, type GoalId } from "../lib/image-map.js";

const router: IRouter = Router();

// ─── Types ────────────────────────────────────────────────────────────────
interface Win {
  win: number;
  title: string;
  objective: string;
  actions: string[];
  activity: string;
  science: string;
  duration: string;
  image?: string;
}

interface CoachPlan {
  title: string;
  summary: string;
  wins: Win[];
}

interface CoachInput {
  goal?: string;        // goal id slug
  ageGroup?: string;    // "2-4" | "5-7" | "8-10"
  severity?: string;    // "mild" | "moderate" | "severe"
  triggers?: string[];
  routine?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────
const NAMESPACE = "ai_coach_v2";
const DB_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MEMORY_TTL_MS = 10 * 60 * 1000;
const MEMORY_MAX = 200;

const memCache = new Map<string, { plan: CoachPlan; ts: number }>();
const memStats = { hits: 0, misses: 0, dbHits: 0, aiCalls: 0 };

function pruneMem() {
  const now = Date.now();
  for (const [k, v] of memCache.entries()) if (now - v.ts > MEMORY_TTL_MS) memCache.delete(k);
  while (memCache.size > MEMORY_MAX) {
    const oldest = memCache.keys().next().value;
    if (!oldest) break;
    memCache.delete(oldest);
  }
}

// ─── Validation helpers ──────────────────────────────────────────────────
const norm = (s: unknown): string =>
  String(s ?? "").toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "").slice(0, 60);

const clip = (s: unknown, max: number): string =>
  typeof s === "string" ? s.trim().slice(0, max) : "";

function buildCacheKey(input: CoachInput): string {
  const triggers = (input.triggers ?? []).map(norm).filter(Boolean).sort().join("-");
  const raw = `${norm(input.goal)}_${norm(input.ageGroup)}_${norm(input.severity)}_${triggers}_${norm(input.routine)}`;
  return createHash("sha1").update(raw).digest("hex");
}

function validateWin(w: unknown): w is Win {
  if (!w || typeof w !== "object") return false;
  const o = w as Record<string, unknown>;
  return (
    typeof o.win === "number" &&
    typeof o.title === "string" && o.title.trim().length > 0 &&
    typeof o.objective === "string" && o.objective.trim().length > 0 &&
    Array.isArray(o.actions) && o.actions.length >= 1 &&
    o.actions.every((a) => typeof a === "string" && a.trim().length > 0) &&
    typeof o.activity === "string" && o.activity.trim().length > 0 &&
    typeof o.science === "string" && o.science.trim().length > 0 &&
    typeof o.duration === "string" && o.duration.trim().length > 0
  );
}

function validatePlan(p: unknown): p is CoachPlan {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.title === "string" && o.title.trim().length > 0 &&
    typeof o.summary === "string" && o.summary.trim().length > 0 &&
    Array.isArray(o.wins) && o.wins.length >= 5 && o.wins.length <= 8 &&
    o.wins.every(validateWin)
  );
}

// ─── Goal display labels (used in fallback + prompts) ────────────────────
const GOAL_LABELS: Record<string, string> = {
  "balance-screen-time": "Balance Screen Time",
  "manage-tantrums": "Manage Tantrums",
  "change-stubborn-behaviour": "Change Stubborn Behaviour",
  "improve-sleep-patterns": "Improve Sleep Patterns",
  "encourage-independent-eating": "Encourage Independent Eating",
  "boost-concentration": "Boost Concentration",
  "navigate-fussy-eating": "Navigate Fussy Eating",
};

function fallbackPlan(input: CoachInput): CoachPlan {
  const label = GOAL_LABELS[input.goal ?? ""] ?? "Your Parenting Goal";
  const ageGroup = input.ageGroup || "your child's age";
  const mk = (n: number, t: string, o: string, acts: string[], activity: string, science: string, dur: string): Win => ({
    win: n, title: t, objective: o, actions: acts, activity, science, duration: dur,
  });
  return {
    title: label,
    summary:
      `At ${ageGroup}, your child's brain is still building self-regulation circuits. The goal isn't compliance — it's slowly building the skill of managing this behaviour through consistent, warm guidance.`,
    wins: [
      mk(1, "Connect before you correct", "Open communication so your child listens",
         ["Get on eye level before speaking", "Name what you see ('I see you're upset')", "Wait 10 seconds before giving instruction"],
         "5-minute 'special time': child picks the activity, you put your phone down, fully present.",
         "Connection activates the prefrontal cortex (Daniel Siegel) — kids cooperate when they feel safe.",
         "2–3 days"),
      mk(2, "Set ONE clear expectation", "Reduce confusion and power struggles",
         ["Pick the single most important rule", "Phrase it positively ('We use gentle hands') not negatively", "Repeat it the same way every day"],
         "Make a 'house rule' poster together with stickers your child chooses.",
         "Predictability lowers cortisol and supports executive function.",
         "3–4 days"),
      mk(3, "Offer two good choices", "Give autonomy without losing the limit",
         ["'Do you want X or Y?' — both must be acceptable to you", "Avoid open-ended questions during conflict", "Let the choice stand"],
         "Choice game: at one transition today, give two options for everything (shoes, snack, route).",
         "Autonomy is a core developmental need (self-determination theory) — choices reduce resistance.",
         "3–4 days"),
      mk(4, "Hold the limit, kindly", "Stay calm even when your child isn't",
         ["Lower your voice instead of raising it", "Validate the feeling, hold the limit ('I know — and the answer is no')", "Stay near, don't lecture"],
         "Practice your own breathing: 4 in, 7 hold, 8 out — twice — before responding to a hard moment.",
         "Calm parents co-regulate — kids borrow your nervous system to settle theirs (Mona Delahooke).",
         "1 week"),
      mk(5, "Repair after rupture", "Repair > perfection",
         ["When you lose your cool, come back later", "Take ownership ('I yelled — that wasn't your fault')", "Reconnect physically (hug, sit together)"],
         "Bedtime check-in: 'Best part of today? Hardest part?' — every night for 7 days.",
         "Repair builds attachment security and teaches kids that mistakes are recoverable (John Gottman).",
         "1 week"),
      mk(6, "Track tiny wins", "Notice progress so you don't give up",
         ["Each evening, write down ONE thing that went better", "Look for 5% improvement, not 100%", "Share the win with your child"],
         "Make a 'wins jar' — drop a paper note in for any small success this week.",
         "Self-monitoring increases follow-through (Behavioural Activation research).",
         "1 week"),
      mk(7, "Stay consistent for 14 days", "Lock in the new pattern",
         ["Use the same response every time, every day", "Resist switching strategies if it 'isn't working' yet", "Expect a 'burst' of resistance around day 5"],
         "Mark a calendar each day you held the new approach — visible streak builds momentum.",
         "Behaviours change after roughly 14–21 days of consistent response (habit-formation research).",
         "2 weeks"),
    ],
  };
}

// ─── DB cache helpers ────────────────────────────────────────────────────
async function dbGet(cacheKey: string): Promise<CoachPlan | null> {
  try {
    const rows = await db.select().from(aiCacheTable).where(eq(aiCacheTable.cacheKey, cacheKey)).limit(1);
    const row = rows[0];
    if (!row) return null;
    if (Date.now() - new Date(row.createdAt).getTime() > DB_CACHE_TTL_MS) return null;
    return row.response as CoachPlan;
  } catch (err) {
    logger.warn({ err }, "ai-coach DB cache read failed");
    return null;
  }
}

async function dbSet(cacheKey: string, input: CoachInput, plan: CoachPlan): Promise<void> {
  try {
    await db
      .insert(aiCacheTable)
      .values({ cacheKey, namespace: NAMESPACE, input, response: plan })
      .onConflictDoUpdate({
        target: aiCacheTable.cacheKey,
        set: { input, response: plan, createdAt: new Date() },
      });
  } catch (err) {
    logger.warn({ err }, "ai-coach DB cache write failed");
  }
}

// ─── POST /ai-coach ──────────────────────────────────────────────────────
router.post("/ai-coach", async (req, res): Promise<void> => {
  pruneMem();
  const raw: CoachInput = req.body ?? {};
  const goal = norm(raw.goal);
  if (!GOAL_IDS.includes(goal as GoalId)) {
    res.status(400).json({ error: "invalid goal", validGoals: GOAL_IDS });
    return;
  }
  const input: CoachInput = {
    goal,
    ageGroup: clip(raw.ageGroup, 30) || "5-7",
    severity: clip(raw.severity, 30) || "moderate",
    triggers: Array.isArray(raw.triggers)
      ? raw.triggers.filter((t): t is string => typeof t === "string").slice(0, 8).map((t) => clip(t, 50))
      : [],
    routine: clip(raw.routine, 200) || "Inconsistent",
  };

  const cacheKey = buildCacheKey(input);
  const sessionId = randomUUID();

  // L1
  const mem = memCache.get(cacheKey);
  if (mem && Date.now() - mem.ts < MEMORY_TTL_MS) {
    memStats.hits++;
    logger.info({ cacheKey: cacheKey.slice(0, 8), source: "memory", stats: memStats }, "ai-coach cache hit");
    res.json({ plan: mem.plan, sessionId, cached: true, source: "memory" });
    return;
  }

  // L2
  const dbHit = await dbGet(cacheKey);
  if (dbHit) {
    const refreshed: CoachPlan = { ...dbHit, wins: attachImagesToWins(dbHit.wins, input.goal!) };
    memCache.set(cacheKey, { plan: refreshed, ts: Date.now() });
    memStats.dbHits++;
    logger.info({ cacheKey: cacheKey.slice(0, 8), source: "db", stats: memStats }, "ai-coach cache hit");
    res.json({ plan: refreshed, sessionId, cached: true, source: "db" });
    return;
  }

  memStats.misses++;
  memStats.aiCalls++;
  logger.info({ cacheKey: cacheKey.slice(0, 8), goal, stats: memStats }, "ai-coach cache miss — calling AI");

  const goalLabel = GOAL_LABELS[input.goal!] ?? input.goal;
  const triggers = (input.triggers ?? []).join(", ") || "not specified";

  const systemPrompt = `You are an expert parenting coach trained in child psychology, behavioural science, and gentle-discipline research (Dan Siegel, Becky Kennedy, Mona Delahooke, Tina Payne Bryson).
You give parents calm, practical, evidence-based guidance — never generic, never preachy.
You ALWAYS return valid JSON only. No markdown, no commentary, no code fences.`;

  const userPrompt = `Create a personalized 6-win action plan for this parenting goal.

Goal: ${goalLabel}
Child age group: ${input.ageGroup} years
Severity: ${input.severity}
Common triggers: ${triggers}
Current routine/approach: ${input.routine}

Return ONLY valid JSON in this EXACT shape:
{
  "title": "Short empathetic title naming the goal",
  "summary": "2-3 sentence simple-science explanation of WHY this challenge happens at this age (mention developing brain / nervous system / specific developmental need)",
  "wins": [
    {
      "win": 1,
      "title": "Short imperative win title (3-6 words)",
      "objective": "ONE sentence: what this step achieves for the parent and child",
      "actions": ["Action 1 (concrete, today)", "Action 2", "Action 3"],
      "activity": "ONE specific parent-child activity that takes <10 minutes and reinforces this win",
      "science": "ONE sentence research-backed reasoning (mention a researcher, study area, or principle)",
      "duration": "How long to practice before moving on (e.g. '2-3 days', '1 week', '2 weeks')"
    }
  ]
}

RULES:
- Exactly 6 wins, numbered 1-6
- Each win builds on the previous (progression: connect → set expectations → practice → consistency → repair → consolidate)
- Tone: warm, calm, non-judgmental, specific to age ${input.ageGroup} years
- Each "actions" array MUST have 2-4 items
- Activities and tips must be immediately doable today
- Reference behavioural-science principles in "science"
- Output ONLY the JSON object`;

  let plan: CoachPlan;
  let aiOk = true;
  try {
    const { openai } = await import("@workspace/integrations-openai-ai-server");
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 3500,
    });
    const rawContent = completion.choices[0]?.message?.content?.trim() ?? "";
    try {
      const parsed = JSON.parse(rawContent);
      plan = validatePlan(parsed) ? parsed : fallbackPlan(input);
    } catch {
      plan = fallbackPlan(input);
    }
  } catch (err) {
    logger.error({ err }, "ai-coach OpenAI error");
    plan = fallbackPlan(input);
    aiOk = false;
  }

  plan = { ...plan, wins: attachImagesToWins(plan.wins, input.goal!) };

  memCache.set(cacheKey, { plan, ts: Date.now() });
  if (aiOk) await dbSet(cacheKey, input, plan);

  res.json({ plan, sessionId, cached: false, source: "ai", fallback: !aiOk });
});

// ─── POST /ai-coach/feedback ─────────────────────────────────────────────
router.post("/ai-coach/feedback", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  const body = req.body ?? {};
  const sessionId = clip(body.sessionId, 64);
  const goalId = clip(body.goalId, 64);
  const planTitle = clip(body.planTitle, 200);
  const winNumber = Number(body.winNumber);
  const totalWins = Number(body.totalWins);
  const feedback = clip(body.feedback, 16).toLowerCase();

  if (!sessionId || !goalId || !planTitle ||
      !Number.isFinite(winNumber) || winNumber < 1 || winNumber > 20 ||
      !Number.isFinite(totalWins) || totalWins < 1 || totalWins > 20 ||
      !["yes", "somewhat", "no"].includes(feedback)) {
    res.status(400).json({ error: "invalid payload" });
    return;
  }

  try {
    await db.insert(userProgressTable).values({
      userId, sessionId, goalId, planTitle,
      winNumber: Math.floor(winNumber),
      totalWins: Math.floor(totalWins),
      feedback,
    }).onConflictDoUpdate({
      target: [userProgressTable.sessionId, userProgressTable.winNumber],
      set: { feedback, planTitle, totalWins: Math.floor(totalWins), createdAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "ai-coach feedback insert failed");
    res.status(500).json({ error: "failed to save feedback" });
  }
});

// ─── GET /ai-coach/progress ──────────────────────────────────────────────
router.get("/ai-coach/progress", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }

  try {
    const rows = await db
      .select()
      .from(userProgressTable)
      .where(eq(userProgressTable.userId, userId))
      .orderBy(desc(userProgressTable.createdAt))
      .limit(200);

    // group by sessionId
    const sessionsMap = new Map<string, {
      sessionId: string;
      goalId: string;
      planTitle: string;
      totalWins: number;
      completedWins: Set<number>;
      lastFeedback: string;
      lastUpdated: string;
      feedbacks: { win: number; feedback: string; at: string }[];
    }>();

    for (const r of rows) {
      let s = sessionsMap.get(r.sessionId);
      if (!s) {
        s = {
          sessionId: r.sessionId,
          goalId: r.goalId,
          planTitle: r.planTitle,
          totalWins: r.totalWins,
          completedWins: new Set(),
          lastFeedback: r.feedback,
          lastUpdated: r.createdAt.toISOString(),
          feedbacks: [],
        };
        sessionsMap.set(r.sessionId, s);
      }
      s.completedWins.add(r.winNumber);
      s.feedbacks.push({ win: r.winNumber, feedback: r.feedback, at: r.createdAt.toISOString() });
    }

    const sessions = Array.from(sessionsMap.values()).map((s) => ({
      sessionId: s.sessionId,
      goalId: s.goalId,
      goalLabel: GOAL_LABELS[s.goalId] ?? s.goalId,
      planTitle: s.planTitle,
      totalWins: s.totalWins,
      completed: s.completedWins.size,
      lastFeedback: s.lastFeedback,
      lastUpdated: s.lastUpdated,
      feedbacks: s.feedbacks.sort((a, b) => a.win - b.win),
    }));

    res.json({ sessions });
  } catch (err) {
    logger.error({ err }, "ai-coach progress query failed");
    res.status(500).json({ error: "failed to load progress" });
  }
});

export default router;
