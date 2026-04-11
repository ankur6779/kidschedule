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

// Rule-based parenting assistant — zero API cost
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

export default router;
