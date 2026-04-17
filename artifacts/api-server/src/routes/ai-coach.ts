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
  deep_explanation: string;
  actions: string[];
  example: string;
  mistake_to_avoid: string;
  micro_task: string;
  duration: string;
  image?: string;
}

interface CoachPlan {
  title: string;
  root_cause: string;
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
const NAMESPACE = "ai_coach_v3";
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
  // Namespace is part of the raw key so a version bump (v2 → v3) produces a
  // completely different cacheKey — old rows can never be served to the new schema.
  const raw = `${NAMESPACE}_${norm(input.goal)}_${norm(input.ageGroup)}_${norm(input.severity)}_${triggers}_${norm(input.routine)}`;
  return createHash("sha1").update(raw).digest("hex");
}

const isStr = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

function validateWin(w: unknown): w is Win {
  if (!w || typeof w !== "object") return false;
  const o = w as Record<string, unknown>;
  return (
    typeof o.win === "number" &&
    isStr(o.title) &&
    isStr(o.objective) &&
    isStr(o.deep_explanation) &&
    Array.isArray(o.actions) && o.actions.length >= 3 && o.actions.length <= 6 &&
    o.actions.every(isStr) &&
    isStr(o.example) &&
    isStr(o.mistake_to_avoid) &&
    isStr(o.micro_task) &&
    isStr(o.duration)
  );
}

function validatePlan(p: unknown): p is CoachPlan {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  if (!isStr(o.title) || !isStr(o.root_cause) || !isStr(o.summary)) return false;
  if (!Array.isArray(o.wins) || o.wins.length < 10 || o.wins.length > 12) return false;
  if (!o.wins.every(validateWin)) return false;
  // Ensure wins are numbered 1..N in order
  return o.wins.every((w, i) => (w as Win).win === i + 1);
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
  const mk = (
    n: number, title: string, objective: string, deep: string,
    actions: string[], example: string, mistake: string, micro: string, dur: string
  ): Win => ({
    win: n, title, objective, deep_explanation: deep, actions,
    example, mistake_to_avoid: mistake, micro_task: micro, duration: dur,
  });
  return {
    title: label,
    root_cause:
      `At ${ageGroup}, the prefrontal cortex (the brain's brake pedal) is still developing — kids physically cannot self-regulate the way adults can. What looks like 'misbehaviour' is usually a nervous system that's overloaded, an unmet need (sleep, hunger, connection), or a developmental skill that hasn't been built yet.`,
    summary:
      `This is a structured 12-step plan that moves from connection → consistent expectations → skill-building → repair → habit lock-in. Don't rush — each win is a complete module designed to actually shift the underlying pattern, not just paper over it.`,
    wins: [
      mk(1, "Connect before you correct",
         "Open communication so your child listens",
         "Children's brains literally cannot access logic when they feel disconnected or threatened. Connection lowers cortisol, activates the prefrontal cortex, and tells the nervous system 'I'm safe' — only THEN can a child receive guidance. Skip this step and every other strategy will feel like pushing a boulder uphill.",
         ["Get on eye level before speaking — physically lower yourself", "Name what you see without judgment ('I see you're upset, your body is moving fast')", "Wait 10 full seconds in silence before giving any instruction", "Touch shoulder or offer hand if welcomed"],
         "Sara's 4-year-old was throwing toys. Instead of 'Stop that!', she knelt down and said 'Looks like something is really frustrating.' He paused, said 'I wanted the red one.' Connection took 30 seconds; the meltdown was avoided.",
         "Talking to your child from across the room or while distracted by your phone — they read this as 'not safe to listen' even if your words are kind.",
         "Today: try 5 minutes of 'special time' — child picks the activity, phone away, fully present.",
         "2–3 days"),
      mk(2, "Identify the real trigger",
         "Stop guessing — find the actual root",
         "90% of recurring behaviour has a predictable trigger: hunger, tired, transition, sensory overload, or unmet emotional need. When you can name the trigger, you stop fighting the behaviour and start solving the cause. This is the single biggest shift parents make.",
         ["Track for 3 days: what time, what happened just before, last meal, last sleep", "Look for patterns (4pm meltdown = hunger; pre-bath = transition)", "Ask your child softly when calm: 'What was hardest today?'"],
         "Maya tracked her 5-year-old's tantrums for 3 days — every single one happened between 5–6pm. Earlier dinner = problem solved.",
         "Treating every meltdown as 'bad behaviour' rather than data — the behaviour IS the message.",
         "Today: keep a 3-line note in your phone every time the behaviour shows up — time, situation, what was happening 30 min before.",
         "3 days"),
      mk(3, "Set ONE clear expectation",
         "Reduce confusion and decision fatigue",
         `Children at ${ageGroup} can hold 1–2 rules in working memory at a time. When parents juggle 10 expectations, kids freeze, comply randomly, or push back hard. ONE clear, repeated, positively-phrased rule beats 10 vague ones every time.`,
         ["Pick the single most important rule for this week", "Phrase positively ('We use gentle hands') not negatively ('Don't hit')", "Repeat it the same exact way every time it applies"],
         "Instead of 'Don't run, don't yell, don't hit your sister' — Anna chose ONE: 'In our home we keep our bodies safe.' Repeated that line for a week.",
         "Adding a new rule each time something annoys you — kids tune out the noise.",
         "Write ONE rule on a sticky note. Stick it on the fridge. Use it when needed.",
         "3–4 days"),
      mk(4, "Offer two real choices",
         "Give autonomy without losing the limit",
         "Autonomy is a core developmental need (self-determination theory). When children feel they have NO control, they create some — by resisting. Two limited choices give them genuine agency while you keep the boundary that matters.",
         ["'Do you want X or Y?' — both options must be acceptable to you", "Never offer a choice during a full meltdown — wait for calm", "Honour the choice once made"],
         "Bath fight every night. Dad switched from 'Time for bath' to 'Bath now or in 5 minutes?' — fights stopped in 2 days.",
         "Offering fake choices ('Do you want to do X or do you want a time-out?') — kids feel tricked.",
         "At one transition today, swap a command for a choice.",
         "3–4 days"),
      mk(5, "Co-regulate before correcting",
         "Lend your calm — borrow theirs later",
         "Children regulate through their parent's nervous system before they can do it alone. When you're activated, they amplify; when you're calm, they slowly settle. This is biological co-regulation (Stephen Porges' Polyvagal Theory) — not a parenting trick.",
         ["Lower your voice instead of raising it", "Drop your shoulders, soften your face", "Breathe slowly and visibly — they will mirror you", "Validate first ('This is hard'), correct later"],
         "Priya started doing 4-7-8 breathing audibly when her son melted down. Within a week he was breathing with her.",
         "Trying to teach a regulation skill mid-meltdown — the lesson can only land afterward.",
         "Practice 4-in / 7-hold / 8-out breathing twice today, before any tough moment.",
         "1 week"),
      mk(6, "Hold the limit kindly",
         "Stay warm AND firm — they aren't opposites",
         "Kids feel safer when limits hold even under pressure. A wobbling limit teaches 'if I push hard enough, the rule changes' — which makes future pushes louder. Holding the limit while staying warm is the gentle-discipline gold standard.",
         ["Validate the feeling, hold the limit: 'I know — and the answer is still no'", "Stay nearby, don't lecture, don't punish in heat", "Repeat the rule once, then stop talking"],
         "'I see you really want more screen time. Screen time is done for today. I'm right here if you want a hug.' Said calmly, on repeat.",
         "Caving when the meltdown gets loud — this teaches escalation works.",
         "Today: pick ONE limit you've been wobbling on. Hold it warmly today.",
         "1 week"),
      mk(7, "Build the missing skill",
         "Don't punish what hasn't been taught",
         "Most repeated behaviour problems are missing skills, not missing motivation. A child who can't transition needs transition practice; a child who lashes out needs anger-language practice. Skills are built through low-stakes repetition, not consequences.",
         ["Name the skill out loud ('We're learning how to wait')", "Practice during calm moments, not during crisis", "Praise the attempt, not just the success"],
         "5-year-old kept hitting when frustrated. Mom made a 'feelings poster' and practiced naming feelings during car rides — hitting dropped in 2 weeks.",
         "Expecting a child to do something they've never been taught to do.",
         "Pick ONE skill (waiting, sharing, transitioning) — practice for 3 minutes during calm time today.",
         "1–2 weeks"),
      mk(8, "Repair after rupture",
         "Repair > perfection — every time",
         "Every parent loses it sometimes. What matters is what happens next. Repair (owning your part, reconnecting) builds attachment security and teaches your child that mistakes are recoverable — one of the most important life skills they'll ever learn.",
         ["When you lose your cool, return when calm", "Take ownership: 'I yelled. That wasn't your fault. I'm sorry.'", "Reconnect physically — hug, sit together, read a book"],
         "After yelling at her son, Lina sat next to him 10 minutes later: 'I yelled. That was about my stress, not you. I love you.' He hugged her back.",
         "Pretending the rupture didn't happen, OR over-apologising in a way that puts the child in a parental role.",
         "Tonight: bedtime check-in — 'Best part of today? Hardest part?'",
         "Ongoing"),
      mk(9, "Track tiny wins daily",
         "Notice progress so you don't give up",
         "Behaviour change is invisible day-to-day but obvious week-to-week. Without a tracking system, your brain remembers only the bad moments and concludes 'nothing is working' — when real progress is happening underneath.",
         ["Each evening, write ONE thing that went 5% better", "Look for partial wins — '20 sec less screaming' is a win", "Share the win with your child the next morning"],
         "Raj's wins jar: 'Bedtime took 25 min instead of 40.' After 2 weeks, the jar full of small wins kept him going.",
         "Comparing to other families' kids — your only baseline is YOUR child last week.",
         "Tonight: text yourself or a partner ONE small win.",
         "1 week"),
      mk(10, "Hold consistency for 14 days",
         "Lock in the new pattern",
         "Behaviours rewire after 14–21 days of consistent response. Most parents quit at day 5 because that's when kids ESCALATE — testing whether the new boundary is real. Holding through the day-5 burst is when the real change happens.",
         ["Use the same response every time, every day, even when tired", "Expect a 'protest burst' around day 5 — this means it's working", "Resist switching strategies — give it the full 14 days"],
         "Asha gave up at day 6 every time. The 7th time she pushed through — by day 12 her daughter was sleeping through the night.",
         "Switching tactics mid-stream because 'it's not working yet' — change needs runway.",
         "Mark a calendar each day you held the new approach — visible streak.",
         "2 weeks"),
      mk(11, "Maintain through setbacks",
         "Regression is part of the path, not the end of it",
         "Kids regress before big developmental leaps and during stress (illness, new sibling, school changes). A regression isn't failure — it's a sign your child is reorganising. Return to the basics: connect first, hold the limit, repair.",
         ["Expect regression around big transitions", "Drop expectations slightly — return to win 1 (connect)", "Don't restart the plan — resume from where you were"],
         "Two months in, a stomach bug + new school caused a setback. Parents went back to extra connection time for 4 days — pattern returned.",
         "Treating regression as evidence the plan failed and abandoning it.",
         "When setback hits: extra 5 min of special time daily for 3 days.",
         "Ongoing"),
      mk(12, "Make it a family value",
         "Move from rules to identity",
         "The deepest behaviour change happens when 'we don't hit' becomes 'we are a gentle family' — when the behaviour expresses identity, not just compliance. This is what makes change last into the teen years and beyond.",
         ["Use 'we' language: 'In our home we…'", "Tell stories of family identity: 'We're the family that talks it out'", "Notice and name when your child lives the value"],
         "Family motto on the fridge: 'We are kind, we are brave, we try again.' Kids quoted it back during arguments.",
         "Skipping this final step — without identity, behaviour reverts to baseline under stress.",
         "Tonight at dinner: ask 'What's one thing our family is really good at?'",
         "Ongoing"),
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

  const systemPrompt = `You are a child psychologist and parenting expert combining behavioural science, neuroscience, attachment theory, and habit-formation research (Dan Siegel, Becky Kennedy, Mona Delahooke, Tina Payne Bryson, Stephen Porges, BJ Fogg).
You give parents DEEP, complete, step-by-step solutions — never short generic tips.
Every win you write must feel like a complete module a parent can implement and see results from.
You ALWAYS return valid JSON only. No markdown, no commentary, no code fences, no preamble.`;

  const userPrompt = `Build a complete 12-win behaviour-change plan for this parenting goal.

Goal: ${goalLabel}
Child age group: ${input.ageGroup} years
Severity: ${input.severity}
Common triggers: ${triggers}
Current routine/approach: ${input.routine}

Return ONLY valid JSON in this EXACT shape:
{
  "title": "Empathetic title naming the goal in 4-6 words",
  "root_cause": "3-4 sentence neuroscience/developmental explanation of WHY this challenge happens at this age. Reference brain development, nervous system, or a specific developmental need. Be specific, not generic.",
  "summary": "2 sentence overview of how the 12 wins progress from connection → diagnosis → skill-building → consistency → identity",
  "wins": [
    {
      "win": 1,
      "title": "Clear imperative step name (3-6 words)",
      "objective": "ONE sentence: what this step fixes for parent and child",
      "deep_explanation": "5-6 lines explaining WHY this works (neuroscience, developmental psychology, or behavioural science). Reference a researcher/principle. Make a parent who reads ONLY this section understand the science.",
      "actions": ["Specific action 1 (concrete, doable today)", "Specific action 2", "Specific action 3", "Specific action 4 (optional)"],
      "example": "ONE realistic 2-3 sentence story of a parent applying this step and what shifted",
      "mistake_to_avoid": "ONE sentence naming the most common parenting mistake that undermines this step",
      "micro_task": "ONE small task the parent can do TODAY in under 5 minutes to start practising this win",
      "duration": "How long to practice (e.g. '2-3 days', '1 week', '2 weeks', 'Ongoing')"
    }
  ]
}

STRICT RULES:
- EXACTLY 12 wins, numbered 1 through 12 in order
- Progression must follow: (1-2) Connect & diagnose root cause → (3-4) Set expectations & give autonomy → (5-7) Build regulation & skills → (8-9) Repair & track → (10-11) Consistency & setbacks → (12) Family identity
- Each win is a COMPLETE module — no overlaps, no repetition
- Tone: warm, calm, non-judgmental, specific to ${input.ageGroup} years
- Each "actions" array MUST have 3-5 items
- Examples must feel real, with names and specifics — not abstract
- Reference at least 5 different researchers/principles across the 12 wins
- "deep_explanation" must be substantive — not 1 line
- Output ONLY the JSON object — no other text`;

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
      max_completion_tokens: 8000,
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
