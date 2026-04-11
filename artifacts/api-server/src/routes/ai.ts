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

export default router;
