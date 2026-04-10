import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { GetRecipeBody, GetRecipeResponse, AskAssistantBody, AskAssistantResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/ai/recipe", async (req, res): Promise<void> => {
  const parsed = GetRecipeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { mealName, childAge, foodType, allergies } = parsed.data;

  const dietLabel = foodType === "veg" ? "vegetarian" : "non-vegetarian (or vegetarian)";
  const allergyNote = allergies ? `IMPORTANT: Avoid these allergens: ${allergies}.` : "";

  const prompt = `You are a friendly family chef. Create a simple, quick, kid-friendly recipe for: "${mealName}".

CONSTRAINTS:
- Diet: ${dietLabel}
- Child age: ${childAge ?? "school-age"} years
${allergyNote}
- Keep it simple, healthy, and quick (under 30 minutes if possible)
- Use common household ingredients
- Portions for 1 child + 1 adult

Return a JSON object with:
- name: the recipe name
- prepTime: e.g. "5 minutes"
- cookTime: e.g. "10 minutes"
- servings: e.g. "2 servings"
- ingredients: array of strings (each ingredient with quantity)
- steps: array of objects with { step: number, instruction: string }
- tips: optional string with 1-2 helpful tips for parents

Return ONLY valid JSON, no markdown.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const recipe = JSON.parse(content);
  res.json(GetRecipeResponse.parse(recipe));
});

router.post("/ai/assistant", async (req, res): Promise<void> => {
  const parsed = AskAssistantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { question, childName, childAge } = parsed.data;

  const childContext = childName && childAge
    ? `The parent is asking about their child ${childName}, who is ${childAge} years old.`
    : childName
    ? `The parent is asking about their child ${childName}.`
    : "";

  const prompt = `You are AmyNest's AI Parenting Assistant — warm, supportive, and practical.

${childContext}

Parent's question: "${question}"

Please give:
1. A clear, empathetic acknowledgment of the concern
2. 2-4 practical, actionable steps or tips
3. Any important things to watch out for
4. An encouraging closing note

Keep the tone friendly, supportive, and never judgmental. Use simple language, avoid medical jargon. Format your response in clear paragraphs — do NOT use JSON. Keep it concise (200-350 words).`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const answer = completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response. Please try again.";
  res.json(AskAssistantResponse.parse({ answer }));
});

export default router;
