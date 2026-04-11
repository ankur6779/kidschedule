// ─── Static Recipe Database — Zero API Cost ──────────────────────────────────
// Pre-defined healthy kid-friendly recipes for common meals.

export type Recipe = {
  name: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: string[];
  steps: { step: number; instruction: string }[];
  tips?: string;
};

const VEG_RECIPES: Recipe[] = [
  {
    name: "Vegetable Upma",
    prepTime: "5 minutes",
    cookTime: "15 minutes",
    servings: "2 servings",
    ingredients: [
      "1 cup semolina (sooji/rava)",
      "1 small onion, finely chopped",
      "1 small carrot, diced",
      "1/2 cup green peas",
      "2 tbsp oil or ghee",
      "1/2 tsp mustard seeds",
      "8-10 curry leaves",
      "Salt to taste",
      "2 cups water",
      "Lemon juice (optional)",
    ],
    steps: [
      { step: 1, instruction: "Dry roast semolina in a pan for 2-3 minutes until light golden. Set aside." },
      { step: 2, instruction: "Heat oil, add mustard seeds and let them splutter. Add curry leaves." },
      { step: 3, instruction: "Add onion and sauté for 2 minutes. Add carrot and peas, cook for 3 minutes." },
      { step: 4, instruction: "Add 2 cups water and salt. Bring to a boil." },
      { step: 5, instruction: "Slowly add roasted semolina while stirring continuously to avoid lumps." },
      { step: 6, instruction: "Cook on low flame for 3-4 minutes, stirring. Add a squeeze of lemon. Serve hot." },
    ],
    tips: "Add ghee at the end for extra flavour. You can include any vegetables your child likes.",
  },
  {
    name: "Paneer Paratha",
    prepTime: "15 minutes",
    cookTime: "15 minutes",
    servings: "2 servings (4 parathas)",
    ingredients: [
      "2 cups whole wheat flour",
      "1 cup crumbled paneer",
      "1 tsp cumin powder",
      "Salt to taste",
      "1/4 tsp garam masala",
      "Ghee or butter for cooking",
      "Water as needed",
    ],
    steps: [
      { step: 1, instruction: "Mix flour with water and knead into a soft dough. Rest for 10 minutes." },
      { step: 2, instruction: "Mix paneer with cumin powder, salt, and garam masala." },
      { step: 3, instruction: "Divide dough into balls. Flatten one, place paneer filling in center, seal and roll gently into a paratha." },
      { step: 4, instruction: "Cook on a hot griddle (tawa) with ghee, flip when golden spots appear. Cook both sides." },
      { step: 5, instruction: "Serve with curd or pickle." },
    ],
    tips: "Let kids add extra ghee themselves — it makes the meal more fun and they eat more!",
  },
  {
    name: "Dal Rice",
    prepTime: "10 minutes",
    cookTime: "25 minutes",
    servings: "2-3 servings",
    ingredients: [
      "1 cup rice",
      "1/2 cup yellow dal (moong or toor)",
      "1 small tomato, chopped",
      "1/4 tsp turmeric",
      "1 tsp ghee",
      "Salt to taste",
      "Cumin seeds, 1/2 tsp",
    ],
    steps: [
      { step: 1, instruction: "Wash rice and dal separately." },
      { step: 2, instruction: "Pressure cook dal with tomato, turmeric, salt, and 2 cups water for 3 whistles." },
      { step: 3, instruction: "Cook rice separately with 2 cups water." },
      { step: 4, instruction: "Heat ghee in a small pan, add cumin seeds, let them splutter, pour over dal." },
      { step: 5, instruction: "Serve dal over rice with a spoon of ghee on top." },
    ],
    tips: "Dal rice is a nutritional powerhouse — protein, carbs, and iron in one bowl. Add a dollop of ghee for healthy fats.",
  },
  {
    name: "Vegetable Fried Rice",
    prepTime: "10 minutes",
    cookTime: "15 minutes",
    servings: "2 servings",
    ingredients: [
      "2 cups cooked rice (day-old works best)",
      "1/2 cup mixed vegetables (carrot, beans, corn, peas)",
      "2 tbsp soy sauce",
      "1 tbsp oil",
      "2 garlic cloves, minced",
      "Salt and pepper to taste",
      "Spring onions for garnish",
    ],
    steps: [
      { step: 1, instruction: "Heat oil in a wok or large pan. Add garlic and sauté for 30 seconds." },
      { step: 2, instruction: "Add vegetables and stir-fry on high heat for 3-4 minutes." },
      { step: 3, instruction: "Add rice and mix well. Pour soy sauce, mix thoroughly." },
      { step: 4, instruction: "Season with salt and pepper. Stir-fry for 2 more minutes." },
      { step: 5, instruction: "Garnish with spring onions and serve hot." },
    ],
    tips: "Use leftover rice for best results. Kids love this — it's colourful and you can sneak in any vegetable.",
  },
  {
    name: "Palak Paneer",
    prepTime: "10 minutes",
    cookTime: "20 minutes",
    servings: "2-3 servings",
    ingredients: [
      "200g paneer, cubed",
      "2 cups fresh spinach (palak), blanched",
      "1 onion, chopped",
      "1 tomato, chopped",
      "1 tsp ginger-garlic paste",
      "1 tsp cumin seeds",
      "Salt, garam masala to taste",
      "2 tbsp oil or butter",
      "Fresh cream (optional)",
    ],
    steps: [
      { step: 1, instruction: "Blanch spinach for 2 minutes in hot water, drain, and blend to a smooth puree." },
      { step: 2, instruction: "Heat oil, add cumin seeds. Add onion and cook until golden." },
      { step: 3, instruction: "Add ginger-garlic paste and tomato. Cook until oil separates." },
      { step: 4, instruction: "Add spinach puree, salt, and garam masala. Simmer for 5 minutes." },
      { step: 5, instruction: "Add paneer cubes and cook for 3-4 minutes. Finish with a swirl of cream." },
    ],
    tips: "Mild in spice, rich in iron and calcium. Serve with soft rotis for young children.",
  },
  {
    name: "Masala Dosa",
    prepTime: "5 minutes (with ready batter)",
    cookTime: "20 minutes",
    servings: "2 servings (4 dosas)",
    ingredients: [
      "2 cups dosa batter (store-bought or ready)",
      "3 medium potatoes, boiled and mashed",
      "1 onion, sliced",
      "1/4 tsp turmeric",
      "1 tsp mustard seeds",
      "Salt to taste",
      "Oil for cooking",
      "Coconut chutney and sambar for serving",
    ],
    steps: [
      { step: 1, instruction: "Heat oil, add mustard seeds, let them pop. Add onion and cook until soft." },
      { step: 2, instruction: "Add turmeric and mashed potatoes. Mix well. Add salt. Filling is ready." },
      { step: 3, instruction: "Heat a non-stick pan/tawa. Pour a ladle of batter and spread in a circle." },
      { step: 4, instruction: "Drizzle oil on edges. Cook until golden and crisp on bottom." },
      { step: 5, instruction: "Place potato filling in centre, fold dosa. Serve with chutney." },
    ],
    tips: "Kids love the crispy texture! Let them dip in chutney — makes them eat more enthusiastically.",
  },
  {
    name: "Oats Porridge with Banana",
    prepTime: "2 minutes",
    cookTime: "8 minutes",
    servings: "1-2 servings",
    ingredients: [
      "1 cup rolled oats",
      "2 cups milk",
      "1 ripe banana, sliced",
      "1 tsp honey",
      "A pinch of cinnamon",
      "A few nuts or raisins (optional)",
    ],
    steps: [
      { step: 1, instruction: "Add oats and milk to a saucepan. Cook on medium heat, stirring constantly." },
      { step: 2, instruction: "Cook for 5-7 minutes until oats are soft and porridge thickens." },
      { step: 3, instruction: "Pour into a bowl. Top with sliced banana, honey, and cinnamon." },
      { step: 4, instruction: "Add nuts or raisins for extra crunch." },
    ],
    tips: "A power breakfast — high fibre and slow-releasing energy keeps kids full and focused all morning.",
  },
  {
    name: "Rajma Chawal (Kidney Bean Curry with Rice)",
    prepTime: "5 minutes",
    cookTime: "30 minutes",
    servings: "3-4 servings",
    ingredients: [
      "1 can (400g) kidney beans or 1.5 cups soaked overnight",
      "1 cup rice",
      "1 onion, finely chopped",
      "2 tomatoes, pureed",
      "1 tsp ginger-garlic paste",
      "1 tsp cumin, coriander powder",
      "1/4 tsp garam masala",
      "2 tbsp oil",
      "Salt to taste",
    ],
    steps: [
      { step: 1, instruction: "If using soaked beans, pressure cook until soft (4-5 whistles). Drain canned beans." },
      { step: 2, instruction: "Heat oil, add onion and cook golden. Add ginger-garlic paste, cook 1 minute." },
      { step: 3, instruction: "Add tomato puree and spices. Cook until oil separates." },
      { step: 4, instruction: "Add beans with 1 cup water. Simmer 15 minutes until thick and flavourful." },
      { step: 5, instruction: "Serve hot over steamed rice." },
    ],
    tips: "Delhi's comfort food — kids who resist vegetables love rajma! Rich in protein and fibre.",
  },
];

const NONVEG_RECIPES: Recipe[] = [
  {
    name: "Egg Bhurji (Scrambled Spiced Eggs)",
    prepTime: "5 minutes",
    cookTime: "10 minutes",
    servings: "2 servings",
    ingredients: [
      "4 eggs",
      "1 small onion, finely chopped",
      "1 tomato, finely chopped",
      "1 green chilli (optional for kids)",
      "1/4 tsp turmeric",
      "Salt to taste",
      "2 tbsp oil or butter",
      "Fresh coriander",
    ],
    steps: [
      { step: 1, instruction: "Beat eggs with salt in a bowl." },
      { step: 2, instruction: "Heat oil, add onion and cook until translucent (2 minutes)." },
      { step: 3, instruction: "Add tomato and turmeric. Cook for 2-3 minutes." },
      { step: 4, instruction: "Pour beaten eggs and stir continuously on medium heat." },
      { step: 5, instruction: "Cook until eggs are just set — soft and fluffy. Garnish with coriander." },
      { step: 6, instruction: "Serve with toasted bread or paratha." },
    ],
    tips: "Skip green chilli for young children. Add a little butter at the end for creaminess — kids love it!",
  },
  {
    name: "Chicken Curry",
    prepTime: "15 minutes",
    cookTime: "35 minutes",
    servings: "3-4 servings",
    ingredients: [
      "500g chicken, cut into pieces",
      "2 onions, finely chopped",
      "2 tomatoes, pureed",
      "1 tbsp ginger-garlic paste",
      "1 tsp cumin, coriander, turmeric",
      "1/2 tsp garam masala",
      "3 tbsp oil",
      "Salt to taste",
      "Fresh coriander for garnish",
    ],
    steps: [
      { step: 1, instruction: "Heat oil, add onion and cook until deep golden (8-10 minutes)." },
      { step: 2, instruction: "Add ginger-garlic paste and cook 2 minutes." },
      { step: 3, instruction: "Add tomato puree and all spices. Cook until oil separates (5 minutes)." },
      { step: 4, instruction: "Add chicken pieces, coat with masala. Add 1 cup water." },
      { step: 5, instruction: "Cover and cook on medium heat for 25 minutes, stirring occasionally." },
      { step: 6, instruction: "Garnish with coriander. Serve with rice or roti." },
    ],
    tips: "For young children, use boneless chicken and keep the curry mild. A nutritious, protein-rich meal.",
  },
  {
    name: "Egg Fried Rice",
    prepTime: "10 minutes",
    cookTime: "15 minutes",
    servings: "2-3 servings",
    ingredients: [
      "2 cups cooked rice",
      "3 eggs",
      "1/2 cup mixed vegetables",
      "2 tbsp soy sauce",
      "1 tbsp oil",
      "2 garlic cloves, minced",
      "Salt and pepper",
      "Spring onions for garnish",
    ],
    steps: [
      { step: 1, instruction: "Heat oil in a wok. Add garlic and cook 30 seconds." },
      { step: 2, instruction: "Add vegetables and stir-fry on high heat for 3 minutes." },
      { step: 3, instruction: "Push vegetables to side. Scramble eggs in the empty space until set." },
      { step: 4, instruction: "Mix everything together, add rice and soy sauce." },
      { step: 5, instruction: "Stir-fry on high heat for 2-3 minutes. Season and serve." },
    ],
    tips: "A favourite with kids! Use leftover rice for best results. Can swap soy sauce for coconut aminos for younger children.",
  },
  {
    name: "Chicken Biryani",
    prepTime: "20 minutes",
    cookTime: "40 minutes",
    servings: "4 servings",
    ingredients: [
      "500g chicken, cleaned",
      "2 cups basmati rice",
      "2 onions, sliced",
      "1 cup yogurt",
      "1 tbsp ginger-garlic paste",
      "Whole spices: 2 bay leaves, 4 cardamom, 1 inch cinnamon",
      "Biryani masala, 2 tsp",
      "Saffron in warm milk (optional)",
      "Ghee and oil",
      "Salt, fresh mint leaves",
    ],
    steps: [
      { step: 1, instruction: "Marinate chicken with yogurt, ginger-garlic paste, biryani masala, and salt for at least 15 minutes." },
      { step: 2, instruction: "Soak basmati rice for 20 minutes. Par-boil rice until 70% cooked. Drain." },
      { step: 3, instruction: "Fry onions until deep golden (barista). Set aside." },
      { step: 4, instruction: "In a heavy-bottom pot, layer: chicken masala at bottom, rice on top, fried onions, mint, and saffron milk." },
      { step: 5, instruction: "Cover with dough or foil (dum). Cook on very low flame for 25-30 minutes." },
      { step: 6, instruction: "Open gently, mix from sides. Serve with raita." },
    ],
    tips: "Weekend special for the whole family! Reduce spice levels for young children by using less biryani masala.",
  },
  {
    name: "Boiled Egg with Toast",
    prepTime: "2 minutes",
    cookTime: "10 minutes",
    servings: "1-2 servings",
    ingredients: [
      "2 eggs",
      "2 bread slices",
      "Butter for toast",
      "Salt and pepper",
      "A pinch of chaat masala (optional)",
    ],
    steps: [
      { step: 1, instruction: "Place eggs in cold water in a saucepan. Bring to boil." },
      { step: 2, instruction: "For soft-boiled: cook 6-7 minutes. For hard-boiled: cook 10-12 minutes." },
      { step: 3, instruction: "Transfer to cold water immediately to stop cooking. Peel after 2 minutes." },
      { step: 4, instruction: "Toast bread and spread butter." },
      { step: 5, instruction: "Slice eggs, sprinkle salt and pepper. Serve with toast." },
    ],
    tips: "The quickest protein-rich breakfast! Younger children may prefer soft-boiled eggs — easier to chew.",
  },
];

// Keyword → recipe mapping for smart matching
const KEYWORD_MAP: Record<string, string> = {
  upma: "Vegetable Upma",
  "rava upma": "Vegetable Upma",
  paratha: "Paneer Paratha",
  "paneer paratha": "Paneer Paratha",
  "dal rice": "Dal Rice",
  "dal chawal": "Dal Rice",
  rice: "Dal Rice",
  "fried rice": "Vegetable Fried Rice",
  "veg fried rice": "Vegetable Fried Rice",
  "egg fried rice": "Egg Fried Rice",
  palak: "Palak Paneer",
  spinach: "Palak Paneer",
  dosa: "Masala Dosa",
  "masala dosa": "Masala Dosa",
  oats: "Oats Porridge with Banana",
  porridge: "Oats Porridge with Banana",
  rajma: "Rajma Chawal (Kidney Bean Curry with Rice)",
  "kidney bean": "Rajma Chawal (Kidney Bean Curry with Rice)",
  "egg bhurji": "Egg Bhurji (Scrambled Spiced Eggs)",
  "scrambled egg": "Egg Bhurji (Scrambled Spiced Eggs)",
  bhurji: "Egg Bhurji (Scrambled Spiced Eggs)",
  "chicken curry": "Chicken Curry",
  chicken: "Chicken Curry",
  biryani: "Chicken Biryani",
  "chicken biryani": "Chicken Biryani",
  "boiled egg": "Boiled Egg with Toast",
  egg: "Egg Bhurji (Scrambled Spiced Eggs)",
};

export function findRecipe(mealName: string, foodType: string): Recipe {
  const lower = mealName.toLowerCase();

  // Try keyword match first
  for (const [keyword, recipeName] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      const isEgg = keyword.includes("egg") || recipeName.toLowerCase().includes("egg");
      const isChicken = keyword.includes("chicken") || recipeName.toLowerCase().includes("chicken");
      const isNonVeg = isEgg || isChicken;
      if (foodType === "veg" && isNonVeg) continue;

      const pool = foodType === "veg" ? VEG_RECIPES : [...NONVEG_RECIPES, ...VEG_RECIPES];
      const match = pool.find((r) => r.name === recipeName);
      if (match) return match;
    }
  }

  // Fallback: return first recipe matching food type
  const pool = foodType === "veg" ? VEG_RECIPES : NONVEG_RECIPES;
  // Pick based on meal name hash for some variety
  let h = 0;
  for (const c of mealName) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return pool[Math.abs(h) % pool.length]!;
}
