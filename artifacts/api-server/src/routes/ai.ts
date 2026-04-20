import { Router, type IRouter } from "express";
import { GetRecipeBody, GetRecipeResponse, AskAssistantBody, AskAssistantResponse } from "@workspace/api-zod";
import { findRecipe } from "../lib/recipe-database.js";
import { getParentingAdvice } from "../lib/parenting-faq.js";
import { aiUsageGate } from "../middlewares/aiUsageGate.js";

const router: IRouter = Router();

// Rule-based recipe lookup — zero API cost
router.post("/ai/recipe", async (req, res): Promise<void> => {
  const parsed = GetRecipeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { mealName, foodType } = parsed.data;
  const recipe = findRecipe(mealName, foodType ?? "veg");

  res.json(GetRecipeResponse.parse(recipe));
});

// Rule-based parenting assistant — zero API cost (static FAQ fallback)
router.post("/ai/assistant", async (req, res): Promise<void> => {
  const parsed = AskAssistantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { question, childName, childAge } = parsed.data;
  const answer = getParentingAdvice(question, childName ?? undefined, childAge ?? undefined);

  res.json(AskAssistantResponse.parse({ answer }));
});

// AI-powered parenting assistant — uses OpenAI, rate-limited server-side via aiUsageGate (free=5/day)
router.post("/ai/assistant-ai", aiUsageGate, async (req, res): Promise<void> => {
  const parsed = AskAssistantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { question, childName, childAge } = parsed.data;
  const langRaw = typeof req.body?.language === "string" ? req.body.language.toLowerCase().split("-")[0] : "en";
  const language: "en" | "hi" | "hinglish" = langRaw === "hi" ? "hi" : langRaw === "hinglish" ? "hinglish" : "en";

  // Optional conversation history — last few turns from the client (low-budget cap)
  type ChatTurn = { role: "user" | "assistant"; content: string };
  const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
  const history: ChatTurn[] = rawHistory
    .filter((m: unknown): m is ChatTurn =>
      !!m && typeof m === "object" &&
      ((m as ChatTurn).role === "user" || (m as ChatTurn).role === "assistant") &&
      typeof (m as ChatTurn).content === "string" &&
      (m as ChatTurn).content.trim().length > 0,
    )
    .slice(-6) // last 6 turns max — keeps tokens (and cost) low
    .map((m: ChatTurn) => ({ role: m.role, content: m.content.slice(0, 800) }));

  try {
    const { openai } = await import("@workspace/integrations-openai-ai-server");

    const langDirective =
      language === "hi"
        ? "\nIMPORTANT: Respond ENTIRELY in Hindi (Devanagari script). Use natural, warm conversational Hindi. Do not mix English."
        : language === "hinglish"
        ? "\nIMPORTANT: Respond in Hinglish — Roman-script Hindi mixed naturally with common English words (e.g. 'Aapke bachche ke liye routine set karna important hai'). Keep it warm and conversational."
        : "";

    const childLine = childName
      ? `\nThe parent's child is ${childName}${childAge ? `, age ${childAge}` : ""}. Use the name naturally when it adds warmth — do not force it into every sentence.`
      : "";

    const systemPrompt = `You are Amy — a warm, sharp, deeply human parenting coach who talks like a trusted friend who happens to be a child-development expert. You are NOT a chatbot and you must never sound like one.

CONVERSATION STYLE
- Sound like a real person texting a friend: natural, specific, sometimes one short sentence, sometimes two paragraphs — never a wall of bullet points unless the parent explicitly asks for steps.
- Reference what the parent has already told you in this chat. Build on the previous turn instead of repeating yourself.
- If the question is vague or you genuinely need one missing detail to give a useful answer (age, what already tried, when it happens), ask ONE short clarifying question first and stop. Don't dump a generic answer. Don't ask more than one.
- If you have enough context, skip the clarifier and answer directly.

ANSWER QUALITY
- Acknowledge the feeling in one sentence (only if the parent shared a struggle — skip the empathy line for casual or factual questions, it sounds fake).
- Give 1–3 concrete, age-appropriate things to actually try tonight or this week. Be specific (exact words to say, exact timing, exact swap) — not generic advice.
- Use evidence-based child development knowledge but explain it in plain language. No jargon, no preaching, no "as a parent you should…".
- If the parent's plan is fine, say so — don't invent a problem.
- Never refuse a normal parenting question. Never add medical/legal disclaimers unless the topic is genuinely safety-critical (medication, self-harm, abuse) — then briefly suggest a professional and continue helping.

LENGTH
- Default: 60–180 words. Match the parent's energy — short question gets a short answer.${childLine}${langDirective}`;

    const userTurn = `${question}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userTurn },
      ],
      max_tokens: 400,
    });

    const answer =
      completion.choices[0]?.message?.content?.trim() ||
      getParentingAdvice(question, childName ?? undefined, childAge ?? undefined);

    res.json(AskAssistantResponse.parse({ answer }));
  } catch {
    // Graceful fallback to static FAQ
    const answer = getParentingAdvice(question, childName ?? undefined, childAge ?? undefined);
    res.json(AskAssistantResponse.parse({ answer }));
  }
});

// Short-form parenting tip rewrite — strict 30-word output, low cost
router.post("/ai/rewrite-tip", async (req, res): Promise<void> => {
  const text = typeof req.body?.text === "string" ? req.body.text.slice(0, 400) : "";
  const childName = typeof req.body?.childName === "string" ? req.body.childName.slice(0, 60) : "";
  const language = req.body?.language === "hi" ? "hi" : "en";

  if (!text) {
    res.status(400).json({ error: "text required" });
    return;
  }

  // Hard cap helper — never return more than 30 words
  const cap = (s: string): string => {
    const words = s.replace(/\s+/g, " ").trim().split(" ");
    return words.length <= 30 ? words.join(" ") : words.slice(0, 30).join(" ") + "…";
  };

  try {
    const { openai } = await import("@workspace/integrations-openai-ai-server");

    const systemPrompt = language === "hi"
      ? `आप एक गर्मजोशी भरे पेरेंटिंग कोच हैं। दी गई सलाह को बच्चे के नाम के साथ व्यक्तिगत बनाकर एक छोटे, गर्म वाक्य में बदलें। अधिकतम 30 शब्द। केवल वाक्य लौटाएँ — कोई उद्धरण, कोई व्याख्या नहीं।`
      : `You are a warm parenting coach. Rewrite the given tip as one short, warm sentence personalized with the child's name. Maximum 30 words. Return only the sentence — no quotes, no explanation.`;

    const userPrompt = childName
      ? `Child name: ${childName}\nTip: ${text}`
      : `Tip: ${text}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 80,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? text;
    const cleaned = raw.replace(/^["'""]|["'""]$/g, "").trim();
    res.json({ rewritten: cap(cleaned || text) });
  } catch {
    // Graceful fallback — return original tip prefixed with name
    const fallback = childName
      ? (language === "hi" ? `${childName} के लिए — ${text}` : `For ${childName} — ${text}`)
      : text;
    res.json({ rewritten: cap(fallback) });
  }
});

export default router;
