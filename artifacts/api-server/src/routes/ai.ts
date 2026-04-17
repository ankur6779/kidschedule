import { Router, type IRouter } from "express";
import { GetRecipeBody, GetRecipeResponse, AskAssistantBody, AskAssistantResponse } from "@workspace/api-zod";
import { findRecipe } from "../lib/recipe-database.js";
import { getParentingAdvice } from "../lib/parenting-faq.js";

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

// AI-powered parenting assistant — uses OpenAI, rate-limited on frontend (5/day)
router.post("/ai/assistant-ai", async (req, res): Promise<void> => {
  const parsed = AskAssistantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { question, childName, childAge } = parsed.data;

  try {
    const { openai } = await import("@workspace/integrations-openai-ai-server");

    const systemPrompt = `You are Amy, a warm and knowledgeable parenting expert and child development specialist.
You give practical, evidence-based parenting advice with genuine empathy and zero judgment.
Your responses are conversational, warm, and deeply actionable — never generic or preachy.
Keep responses to 3-4 clear paragraphs. Be specific and age-appropriate.
Always acknowledge the parent's feelings first before giving advice.`;

    const childContext = childName
      ? `My child ${childName}${childAge ? ` (${childAge} years old)` : ""}: `
      : "";

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${childContext}${question}` },
      ],
      max_tokens: 650,
    });

    const answer =
      completion.choices[0]?.message?.content ??
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
