import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db, aiCacheTable } from "@workspace/db";
import { logger } from "../lib/logger.js";
import { attachImagesToSteps } from "../lib/image-map.js";

const router: IRouter = Router();

// ─── Types ────────────────────────────────────────────────────────────────
interface CoachStep {
  heading: string;
  subheading: string;
  explanation: string;
  tip: string;
  image_prompt: string;
  image?: string; // attached server-side from imageMap
}

interface CoachPlan {
  title: string;
  reason: string;
  steps: CoachStep[];
}

interface CoachInput {
  childName?: string;
  age?: string | number;
  problem?: string;
  triggers?: string | string[];
  goal?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────
const NAMESPACE = "ai_coach";
const DB_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MEMORY_TTL_MS = 10 * 60 * 1000; // 10 min hot cache
const MEMORY_MAX = 200;

// L1 in-memory hot cache
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

// ─── Cache key generation (normalized: lowercase, trimmed, separated) ────
function buildCacheKey(input: CoachInput): string {
  const norm = (s: unknown): string =>
    String(s ?? "").toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 60);
  const triggers = Array.isArray(input.triggers)
    ? input.triggers.map(norm).sort().join(",")
    : norm(input.triggers);
  const raw = `${norm(input.problem)}__${norm(input.age)}__${norm(input.goal)}__${triggers}`;
  // Hash to keep keys uniform-length, while staying deterministic
  return createHash("sha1").update(raw).digest("hex");
}

// ─── Validation ──────────────────────────────────────────────────────────
const clip = (s: unknown, max: number): string =>
  typeof s === "string" ? s.trim().slice(0, max) : "";

function validateStep(s: unknown): s is CoachStep {
  if (!s || typeof s !== "object") return false;
  const o = s as Record<string, unknown>;
  return ["heading", "subheading", "explanation", "tip", "image_prompt"].every(
    (k) => typeof o[k] === "string" && (o[k] as string).trim().length > 0
  );
}

function validatePlan(p: unknown): p is CoachPlan {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.title === "string" && o.title.trim().length > 0 &&
    typeof o.reason === "string" && o.reason.trim().length > 0 &&
    Array.isArray(o.steps) && o.steps.length >= 4 && o.steps.length <= 7 &&
    o.steps.every(validateStep)
  );
}

// ─── Fallback plan (when AI unavailable) ─────────────────────────────────
function fallbackPlan(input: CoachInput): CoachPlan {
  const name = input.childName || "your child";
  const problem = input.problem || "this behavior";
  return {
    title: `Helping ${name} with ${problem}`,
    reason:
      "Young children are still developing emotional regulation. What looks like 'misbehavior' is often a signal that a need (sleep, connection, autonomy, or sensory input) isn't being met.",
    steps: [
      { heading: "Connect before you correct", subheading: "Connection → Cooperation",
        explanation: `Get on ${name}'s eye level, name what you see, and acknowledge the feeling before redirecting.`,
        tip: `Try: "I see you're really frustrated. That's hard. I'm here."`,
        image_prompt: "soft pastel illustration of parent kneeling to child eye-level" },
      { heading: "Offer two good choices", subheading: "Autonomy → Less resistance",
        explanation: `Power struggles fade when ${name} feels in control of small things.`,
        tip: `"Do you want to brush teeth before or after pyjamas?"`,
        image_prompt: "soft illustration child choosing between two options" },
      { heading: "Hold the limit, kindly", subheading: "Calm + firm = trust",
        explanation: "It's okay if your child doesn't like the limit. Hold it warmly, not harshly.",
        tip: `"You don't have to like it. The answer is still no, and I love you."`,
        image_prompt: "soft illustration parent holding boundary warmly" },
      { heading: "Repair after rupture", subheading: "Repair > perfection",
        explanation: "When you lose your cool, come back and reconnect.",
        tip: `"Earlier I yelled. That wasn't your fault. I'm sorry. I love you."`,
        image_prompt: "warm illustration parent and child hugging" },
      { heading: "Be consistent for 2 weeks", subheading: "Consistency → Predictability",
        explanation: "New routines feel hard for the first 7–14 days. Stay the course.",
        tip: "Pick ONE strategy and use it the same way every time for 14 days.",
        image_prompt: "soft calendar illustration with hearts" },
    ],
  };
}

// ─── DB cache helpers (graceful: never throw to caller) ──────────────────
async function dbGet(cacheKey: string): Promise<CoachPlan | null> {
  try {
    const rows = await db.select().from(aiCacheTable).where(eq(aiCacheTable.cacheKey, cacheKey)).limit(1);
    const row = rows[0];
    if (!row) return null;
    const age = Date.now() - new Date(row.createdAt).getTime();
    if (age > DB_CACHE_TTL_MS) return null;
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

// ─── POST /ai-coach — text plan + attached predefined images ─────────────
router.post("/ai-coach", async (req, res): Promise<void> => {
  pruneMem();
  const raw: CoachInput = req.body ?? {};
  const input: CoachInput = {
    childName: clip(raw.childName, 60),
    age: clip(raw.age, 30),
    problem: clip(raw.problem, 400),
    triggers: Array.isArray(raw.triggers)
      ? raw.triggers.filter((t): t is string => typeof t === "string").slice(0, 12).map((t) => clip(t, 40))
      : clip(raw.triggers, 200),
    goal: clip(raw.goal, 200),
  };

  if (!input.problem || input.problem.length < 3) {
    res.status(400).json({ error: "problem field required (min 3 chars)" });
    return;
  }

  const cacheKey = buildCacheKey(input);
  const problemForImages = String(input.problem);

  // L1: memory cache
  const mem = memCache.get(cacheKey);
  if (mem && Date.now() - mem.ts < MEMORY_TTL_MS) {
    memStats.hits++;
    logger.info({ cacheKey: cacheKey.slice(0, 8), source: "memory", stats: memStats }, "ai-coach cache hit");
    res.json({ plan: mem.plan, cached: true, source: "memory" });
    return;
  }

  // L2: DB cache
  const dbHit = await dbGet(cacheKey);
  if (dbHit) {
    // Re-attach images (in case mapping changed) and warm the L1
    const refreshed: CoachPlan = { ...dbHit, steps: attachImagesToSteps(dbHit.steps, problemForImages) };
    memCache.set(cacheKey, { plan: refreshed, ts: Date.now() });
    memStats.dbHits++;
    logger.info({ cacheKey: cacheKey.slice(0, 8), source: "db", stats: memStats }, "ai-coach cache hit");
    res.json({ plan: refreshed, cached: true, source: "db" });
    return;
  }

  memStats.misses++;
  memStats.aiCalls++;
  logger.info({ cacheKey: cacheKey.slice(0, 8), stats: memStats }, "ai-coach cache miss — calling AI");

  // Cache miss → call AI
  const childName = input.childName?.trim() || "the child";
  const age = String(input.age || "").trim() || "unspecified age";
  const triggers = Array.isArray(input.triggers) ? input.triggers.join(", ") : (input.triggers || "");

  const systemPrompt = `You are an expert parenting coach trained in child psychology, neuroscience, and gentle-discipline research (Dan Siegel, Becky Kennedy, Mona Delahooke style).
You give parents calm, practical, science-based guidance with zero judgment.
You speak warmly and personally. You NEVER use generic advice — every step is specific to the child's age and situation.
Your output is ALWAYS valid JSON only — no markdown, no commentary, no code fences.`;

  const userPrompt = `Create a personalized 5-step action plan for this parenting situation.

Child name: ${childName}
Age: ${age}
Problem: ${input.problem}
Common triggers: ${triggers || "not specified"}
Parent's goal: ${input.goal || "improve the situation calmly"}

Return ONLY valid JSON in this exact shape:
{
  "title": "short empathetic title that names the problem",
  "reason": "2-3 sentence simple-science explanation of WHY this behavior happens at this age (mention the developing brain / nervous system / specific developmental need)",
  "steps": [
    {
      "heading": "short imperative step title (3-6 words)",
      "subheading": "memorable formula like 'Connection → Cooperation' (3-5 words with arrow)",
      "explanation": "2-3 sentence concrete explanation of what to do and why, using ${childName}'s name",
      "tip": "ONE specific actionable line — exact words to say or exact action to take",
      "image_prompt": "single sentence describing a soft pastel parenting illustration that matches this step (no text in image)"
    }
  ]
}

Rules:
- Exactly 5 steps
- Use ${childName}'s name in at least 3 steps
- Tone: warm, calm, non-judgmental, specific
- Each tip must be immediately usable today
- Output ONLY the JSON object, nothing else`;

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
      max_completion_tokens: 2500,
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

  // Attach predefined images (zero-cost, cyclic from imageMap)
  plan = { ...plan, steps: attachImagesToSteps(plan.steps, problemForImages) };

  // Cache: memory always; DB only if AI succeeded
  memCache.set(cacheKey, { plan, ts: Date.now() });
  if (aiOk) await dbSet(cacheKey, input, plan);

  res.json({ plan, cached: false, source: "ai", fallback: !aiOk });
});

export default router;
