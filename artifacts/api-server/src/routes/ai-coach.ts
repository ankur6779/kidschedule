import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// ─── Types ────────────────────────────────────────────────────────────────
interface CoachStep {
  heading: string;
  subheading: string;
  explanation: string;
  tip: string;
  image_prompt: string;
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

// ─── In-memory caches (bounded LRU-ish via Map insertion order) ──────────
const PLAN_TTL_MS = 10 * 60 * 1000;
const IMAGE_TTL_MS = 60 * 60 * 1000;
const PLAN_CACHE_MAX = 200;
const IMAGE_CACHE_MAX = 300;

const planCache = new Map<string, { plan: CoachPlan; ts: number }>();
const imageCache = new Map<string, { dataUrl: string; ts: number }>();

function hashInput(obj: unknown): string {
  return createHash("sha1").update(JSON.stringify(obj)).digest("hex").slice(0, 16);
}

function pruneCache<T>(map: Map<string, { ts: number } & T>, ttl: number, maxEntries: number) {
  const now = Date.now();
  for (const [k, v] of map.entries()) if (now - v.ts > ttl) map.delete(k);
  while (map.size > maxEntries) {
    const oldestKey = map.keys().next().value;
    if (!oldestKey) break;
    map.delete(oldestKey);
  }
}

// ─── Input validation helpers ────────────────────────────────────────────
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
      {
        heading: "Connect before you correct",
        subheading: "Connection → Cooperation",
        explanation: `Get on ${name}'s eye level, name what you see, and acknowledge the feeling before redirecting. This activates the part of the brain that can listen.`,
        tip: `Try: "I see you're really frustrated. That's hard. I'm here."`,
        image_prompt: "soft pastel illustration of parent kneeling to child eye-level, warm tones",
      },
      {
        heading: "Offer two good choices",
        subheading: "Autonomy → Less resistance",
        explanation: `Power struggles fade when ${name} feels in control of small things. Offer two options that both work for you.`,
        tip: `"Do you want to brush teeth before or after pyjamas?"`,
        image_prompt: "soft illustration child choosing between two options, pastel colors",
      },
      {
        heading: "Hold the limit, kindly",
        subheading: "Calm + firm = trust",
        explanation:
          "It's okay if your child doesn't like the limit. Your job is to hold it warmly, not to make them happy about it.",
        tip: `"You don't have to like it. The answer is still no, and I love you."`,
        image_prompt: "soft illustration parent holding boundary warmly, pastel watercolor",
      },
      {
        heading: "Repair after rupture",
        subheading: "Repair > perfection",
        explanation:
          "When you lose your cool (we all do), come back and reconnect. Repair teaches your child that relationships can survive hard moments.",
        tip: `"Earlier I yelled. That wasn't your fault. I'm sorry. I love you."`,
        image_prompt: "warm illustration parent and child hugging after a tough moment, soft tones",
      },
      {
        heading: "Be consistent for 2 weeks",
        subheading: "Consistency → Predictability",
        explanation:
          "New routines feel hard for the first 7–14 days. Stay the course — your child's nervous system is learning what to expect.",
        tip: "Pick ONE strategy and use it the same way every time for 14 days.",
        image_prompt: "soft calendar illustration with hearts, pastel colors, parenting theme",
      },
    ],
  };
}

// ─── POST /ai-coach — generate text plan ─────────────────────────────────
router.post("/ai-coach", async (req, res): Promise<void> => {
  pruneCache(planCache, PLAN_TTL_MS, PLAN_CACHE_MAX);
  const raw: CoachInput = req.body ?? {};

  // Sanitize + cap all input lengths
  const input: CoachInput = {
    childName: clip(raw.childName, 60),
    age: clip(raw.age, 30),
    problem: clip(raw.problem, 400),
    triggers: Array.isArray(raw.triggers)
      ? raw.triggers.filter((t): t is string => typeof t === "string").slice(0, 12).map((t) => clip(t, 40))
      : clip(raw.triggers, 200),
    goal: clip(raw.goal, 200),
  };

  if (!input.problem || String(input.problem).length < 3) {
    res.status(400).json({ error: "problem field required (min 3 chars)" });
    return;
  }

  const triggers = Array.isArray(input.triggers) ? input.triggers.join(", ") : (input.triggers || "");
  const cacheKey = hashInput({ ...input, triggers });

  const cached = planCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < PLAN_TTL_MS) {
    res.json({ plan: cached.plan, cached: true });
    return;
  }

  const childName = input.childName?.trim() || "the child";
  const age = String(input.age || "").trim() || "unspecified age";

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
- No generic advice like "be patient" — every line is concrete
- Output ONLY the JSON object, nothing else`;

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
    let plan: CoachPlan;
    try {
      const parsed = JSON.parse(rawContent);
      if (validatePlan(parsed)) {
        plan = parsed;
      } else {
        logger.warn({ raw: rawContent.slice(0, 200) }, "ai-coach plan failed validation");
        plan = fallbackPlan(input);
      }
    } catch (err) {
      logger.warn({ err, raw: rawContent.slice(0, 200) }, "ai-coach JSON parse failed");
      plan = fallbackPlan(input);
    }

    planCache.set(cacheKey, { plan, ts: Date.now() });
    res.json({ plan, cached: false });
  } catch (err) {
    logger.error({ err }, "ai-coach OpenAI error");
    const plan = fallbackPlan(input);
    planCache.set(cacheKey, { plan, ts: Date.now() });
    res.json({ plan, cached: false, fallback: true });
  }
});

// ─── POST /ai-coach/image — generate one image, cache by prompt hash ─────
router.post("/ai-coach/image", async (req, res): Promise<void> => {
  pruneCache(imageCache, IMAGE_TTL_MS, IMAGE_CACHE_MAX);
  const prompt = clip(req.body?.prompt, 240);
  if (!prompt || prompt.length < 5) {
    res.status(400).json({ error: "prompt required (5-240 chars)" });
    return;
  }

  // Strip any attempt at injection / disallowed terms (keep it kid-safe)
  const safePrompt = prompt
    .replace(/[<>{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stylePrompt = `${safePrompt}. Style: soft watercolor parenting illustration, pastel colors (peach, blush, sage, cream), warm lighting, kind faces, kid-friendly, no text, no words, no letters in image.`;
  const cacheKey = hashInput({ p: stylePrompt });

  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < IMAGE_TTL_MS) {
    res.json({ dataUrl: cached.dataUrl, cached: true });
    return;
  }

  try {
    const { generateImageBuffer } = await import(
      "@workspace/integrations-openai-ai-server/image"
    );
    const buffer = await generateImageBuffer(stylePrompt, "1024x1024");
    const dataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
    imageCache.set(cacheKey, { dataUrl, ts: Date.now() });
    res.json({ dataUrl, cached: false });
  } catch (err) {
    logger.error({ err, prompt: prompt.slice(0, 80) }, "ai-coach image error");
    res.status(502).json({ error: "image generation failed" });
  }
});

export default router;
