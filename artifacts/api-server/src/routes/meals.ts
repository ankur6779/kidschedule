import { Router, type IRouter } from "express";
import { suggestMeals, type MealRegion } from "../lib/meal-suggestions";

const router: IRouter = Router();

const ALLOWED_REGIONS: ReadonlySet<string> = new Set<MealRegion>([
  "north_indian", "south_indian", "bengali", "gujarati",
  "maharashtrian", "punjabi", "pan_indian", "global",
]);

const MAX_FRIDGE_ITEMS = 30;
const MAX_ITEM_LEN = 24;
const MAX_AGE = 18;

// GET /api/meals/suggest?region=...&audience=kids_tiffin|parent_healthy
//   &fridge=milk,bread,paneer&childAge=5&isVeg=true
router.get("/meals/suggest", (req, res) => {
  // Region — whitelist; fallback to pan_indian
  const regionRaw = String(req.query.region ?? "").toLowerCase().trim();
  const region: MealRegion = (ALLOWED_REGIONS.has(regionRaw) ? regionRaw : "pan_indian") as MealRegion;

  // Audience — whitelist
  const audienceRaw = String(req.query.audience ?? "").toLowerCase().trim();
  const audience: "kids_tiffin" | "parent_healthy" =
    audienceRaw === "parent_healthy" ? "parent_healthy" : "kids_tiffin";

  // Fridge — clamp count + per-item length, dedupe
  const fridgeRaw = String(req.query.fridge ?? "");
  const fridgeItems = Array.from(
    new Set(
      fridgeRaw
        .split(",")
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0 && s.length <= MAX_ITEM_LEN)
    )
  ).slice(0, MAX_FRIDGE_ITEMS);

  // Child age — clamp to [0, MAX_AGE]
  let childAge: number | undefined = undefined;
  if (req.query.childAge != null && req.query.childAge !== "") {
    const n = Number(req.query.childAge);
    if (Number.isFinite(n)) {
      childAge = Math.max(0, Math.min(MAX_AGE, Math.floor(n)));
    }
  }

  // isVeg — strict tri-state
  const isVegParam = req.query.isVeg;
  const isVeg = isVegParam === "true" ? true : isVegParam === "false" ? false : undefined;

  const result = suggestMeals({
    region,
    audience,
    fridgeItems,
    childAge,
    isVeg,
    hour: new Date().getHours(),
  });

  res.set("Cache-Control", "private, max-age=60");
  res.json(result);
});

export default router;
