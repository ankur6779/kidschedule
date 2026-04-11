// ─── Rule-Based Routine Generator — Zero API Cost ──────────────────────────
// Replaces OpenAI calls with deterministic, age-appropriate schedule building.

export type AgeGroup = "infant" | "toddler" | "preschool" | "early_school" | "pre_teen";

export type ScheduleItem = {
  time: string;
  activity: string;
  duration: number;
  category: string;
  notes: string;
  status: "pending";
};

export type GeneratedRoutine = {
  title: string;
  items: ScheduleItem[];
};

export type RoutineParams = {
  childName: string;
  ageGroup: AgeGroup;
  totalAgeMonths: number;
  wakeUpTime: string;
  sleepTime: string;
  schoolStartTime: string;
  schoolEndTime: string;
  travelMode: string;
  hasSchool: boolean;
  mood: string;
  foodType: string;
  goals?: string;
  specialPlans?: string;
  p1Free: boolean;
  p2Free: boolean;
  bothBusy: boolean;
  childClass?: string;
  date: string;
  behaviorContext?: string;
};

// ─── Time helpers ─────────────────────────────────────────────────────────────

export function minsToTime(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const dh = h % 12 === 0 ? 12 : h % 12;
  return `${dh}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function timeToMins(t: string): number {
  if (!t) return 0;
  const cleaned = t.replace(/\s+/g, " ").trim();

  // 12-hour format: "7:00 AM", "12:30 PM"
  const m12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1]);
    const min = parseInt(m12[2]);
    const ampm = m12[3].toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + min;
  }

  // 24-hour format: "07:00", "19:30" — AI often returns this
  const m24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = parseInt(m24[1]);
    const min = parseInt(m24[2]);
    return h * 60 + min;
  }

  return 0;
}

// Seeded shuffle so output is deterministic per date+child
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dateSeed(date: string, childName: string): number {
  let h = 0;
  for (const c of date + childName) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[Math.abs(seed + offset) % arr.length];
}

// ─── Meal databases ───────────────────────────────────────────────────────────

const VEG_BREAKFAST = [
  "Idli with sambar | Upma with chutney | Poha with peanuts",
  "Paratha with curd | Aloo toast | Besan chilla with ketchup",
  "Dosa with coconut chutney | Rava idli | Moong dal chilla",
  "Oats porridge with banana | Bread butter with milk | Cornflakes with milk",
  "Paneer paratha | Vegetable uttapam | Semolina kheer",
];

const NONVEG_BREAKFAST = [
  "Egg omelette with toast | Egg bhurji with paratha | Boiled eggs with bread",
  "Egg dosa | Egg poha | Chicken sandwich",
  "Scrambled eggs with toast | Egg upma | Chicken paratha",
  "Oats with boiled egg | Egg roll | Bread omelette",
  "Egg uttapam | Egg idli | Chicken toast",
];

const VEG_LUNCH = [
  "Dal rice with sabzi | Rajma chawal | Chole rice",
  "Paneer sabzi with roti | Aloo gobi with phulka | Mixed veg curry with rice",
  "Sambar rice with papad | Kadhi rice | Palak dal with roti",
  "Veg pulao with raita | Lemon rice with chutney | Veg biryani",
  "Dal makhani with paratha | Baingan bharta with roti | Bhindi sabzi with dal",
];

const NONVEG_LUNCH = [
  "Chicken curry with rice | Egg curry with roti | Fish curry with rice",
  "Chicken biryani | Egg rice | Mutton curry with phulka",
  "Chicken dal rice | Egg dal roti | Fish fry with rice",
  "Keema with roti | Chicken rice | Prawn curry with rice",
  "Grilled chicken with dal | Egg biryani | Chicken sabzi with roti",
];

const VEG_DINNER = [
  "Roti with dal and sabzi | Khichdi with ghee | Vegetable soup with bread",
  "Paratha with curd | Mixed veg with roti | Dal rice light",
  "Dahi rice | Vegetable daliya | Oats with sabzi",
  "Chapati with palak paneer | Moong dal khichdi | Veg soup with roti",
  "Light upma | Rava dosa | Tomato soup with bread",
];

const NONVEG_DINNER = [
  "Chicken curry with roti | Egg dal with rice | Fish with chapati",
  "Chicken soup with bread | Egg curry light | Grilled chicken with veg",
  "Keema roti | Chicken stew | Prawn masala with rice",
  "Egg chapati | Chicken khichdi | Light fish curry",
  "Chicken noodle soup | Egg fried rice | Chicken daliya",
];

const VEG_SNACKS = [
  "Fruit bowl + milk | Banana + peanut butter | Apple slices + curd",
  "Vegetable upma | Sprouts chaat | Boiled corn with butter",
  "Poha | Idli with chutney | Bread with jam and milk",
  "Chikki + banana shake | Makhana + milk | Date and nut balls",
  "Vegetable sandwich | Dhokla | Paneer cubes with fruit",
];

const NONVEG_SNACKS = [
  "Boiled egg + banana | Egg toast | Chicken puff",
  "Egg sandwich | Chicken nuggets | Egg with fruit",
  "Boiled egg + fruit bowl | Chicken roll | Egg paratha slice",
  "Egg bhurji bread | Chicken popcorn | Egg omelette wrap",
  "Egg milkshake | Chicken sandwich | Boiled egg + milk",
];

const VEG_TIFFIN = [
  "Paneer paratha + curd | Veg sandwich | Upma in box",
  "Idli with sambar | Poha with peanuts | Besan chilla with chutney",
  "Cheese toast | Vegetable pulao | Aloo paratha + pickle",
  "Pasta with veg | Bread rolls | Veg fried rice",
  "Stuffed capsicum paratha | Tomato rice | Veg wrap",
];

const NONVEG_TIFFIN = [
  "Egg roll | Egg sandwich | Chicken frankie",
  "Egg fried rice wrap | Chicken paratha | Egg puff",
  "Boiled egg + bread | Chicken sandwich | Egg pasta",
  "Egg bhurji paratha | Chicken roll | Egg noodles box",
  "Chicken chapati roll | Egg rice | Mutton keema paratha",
];

// ─── Activity Pools per Age Group ─────────────────────────────────────────────

type Block = { activity: string; duration: number; category: string; notes: string };

const MORNING_HYGIENE: Record<AgeGroup, Block> = {
  infant:       { activity: "Morning Care & Diaper Change", duration: 20, category: "hygiene", notes: "Clean diaper, gentle wipe-down, fresh clothes. Talk softly to baby — narrate every step." },
  toddler:      { activity: "Morning Freshen Up", duration: 20, category: "hygiene", notes: "Wash face, brush teeth with parent's help, fresh clothes. Make it fun — sing a song!" },
  preschool:    { activity: "Morning Routine", duration: 25, category: "hygiene", notes: "Brush teeth, wash face, comb hair, get dressed. Praise every step they do independently." },
  early_school: { activity: "Morning Hygiene & Dress Up", duration: 30, category: "hygiene", notes: "Brush teeth, bathe/freshen up, comb hair, pack school bag the night before. No rush!" },
  pre_teen:     { activity: "Morning Routine", duration: 30, category: "hygiene", notes: "Shower, brush, dress, pack bag. Encourage to do this independently — builds discipline." },
};

const SLEEP_ANCHOR: Record<AgeGroup, Block> = {
  infant:       { activity: "Night Sleep", duration: 0, category: "sleep", notes: "Ensure a cool, dark, quiet room. Swaddle if baby prefers. White noise or lullaby helps." },
  toddler:      { activity: "Bedtime & Sleep", duration: 0, category: "sleep", notes: "Keep room dark and cool. Final cuddle time — whisper 'I love you'. No screens 1 hour before." },
  preschool:    { activity: "Lights Out — Sleep Time", duration: 0, category: "sleep", notes: "Consistent bedtime builds healthy sleep patterns. Read one last short story if they want." },
  early_school: { activity: "Sleep Time", duration: 0, category: "sleep", notes: "Aim for 9–10 hours of sleep. Switch off all screens. A consistent bedtime = better school performance." },
  pre_teen:     { activity: "Sleep Time", duration: 0, category: "sleep", notes: "Aim for 8–9 hours. Phone outside room. Sleep consistency improves mood and focus." },
};

const WIND_DOWN: Record<AgeGroup, Block[]> = {
  infant: [
    { activity: "Evening Bath & Massage", duration: 20, category: "hygiene", notes: "Warm bath relaxes baby. Gentle massage with baby oil after bath — promotes deep sleep." },
    { activity: "Feeding & Lullaby", duration: 20, category: "sleep", notes: "Last feed before sleep. Dim lights, soft music or humming lullaby. Establish this as a sleep cue." },
  ],
  toddler: [
    { activity: "Bath Time", duration: 20, category: "hygiene", notes: "Warm bath signals bedtime. Keep it calm — no active play in bath. Gentle soap, soft towel." },
    { activity: "Bedtime Story", duration: 15, category: "bonding", notes: "Read 1 picture book together. Let them choose the story — builds love for reading and bonding." },
    { activity: "Wind-Down & Cuddle", duration: 10, category: "wind-down", notes: "Dim lights, soft music. Cuddle time. Talk about 1 good thing from today." },
  ],
  preschool: [
    { activity: "Bath & Fresh Up", duration: 20, category: "hygiene", notes: "Cool down after the day. Brushing teeth after bath — build the habit early." },
    { activity: "Story Time", duration: 20, category: "bonding", notes: "Read together — let them predict the story ending. Great for imagination and vocabulary." },
    { activity: "Wind-Down", duration: 10, category: "wind-down", notes: "Dim lights, calm music. Ask: What was your favourite thing today? Give them a big hug." },
  ],
  early_school: [
    { activity: "Bath & Personal Hygiene", duration: 20, category: "hygiene", notes: "Freshen up for the night. Brush teeth, wash face. Good hygiene = good habits for life." },
    { activity: "Reading Time", duration: 20, category: "play", notes: "Let them choose any book — story, comics, anything they enjoy. Reading daily builds intelligence." },
    { activity: "Wind-Down & Reflection", duration: 15, category: "wind-down", notes: "No screens. Talk about the day: 1 win, 1 challenge, 1 thing to try tomorrow. Builds emotional intelligence." },
  ],
  pre_teen: [
    { activity: "Personal Hygiene", duration: 20, category: "hygiene", notes: "Shower, skincare routine, brush teeth. Help them establish their own evening routine." },
    { activity: "Reading or Journaling", duration: 20, category: "play", notes: "Free reading choice, or write 3 things they're grateful for today. Builds reflection habit." },
    { activity: "Wind-Down", duration: 10, category: "wind-down", notes: "Dim screen brightness 1 hour before sleep. Stretch or deep breathing for 5 min. No social media." },
  ],
};

const AFTERNOON_ACTIVITIES: Record<AgeGroup, Block[]> = {
  infant: [
    { activity: "Tummy Time", duration: 15, category: "play", notes: "Place baby on tummy on a soft mat. This builds neck and shoulder strength. Stay with baby." },
    { activity: "Sensory Play", duration: 20, category: "play", notes: "Show colorful rattles, soft toys, different textures. Stimulates sight, touch, and hearing." },
    { activity: "Outdoor Fresh Air", duration: 20, category: "play", notes: "Carry baby outside for fresh air and gentle sunlight. Narrate everything you see." },
    { activity: "Baby Massage", duration: 15, category: "hygiene", notes: "Gentle massage with coconut or baby oil. Promotes bonding, circulation, and sleep quality." },
    { activity: "Mirror Play", duration: 10, category: "play", notes: "Show baby their reflection — they love it! Builds self-awareness and social development." },
  ],
  toddler: [
    { activity: "Free Outdoor Play", duration: 30, category: "play", notes: "Park, garden, or open space. Let them run, jump, explore. Physical play is essential at this age." },
    { activity: "Creative Play", duration: 20, category: "play", notes: "Finger painting, play-doh, or building blocks. Don't correct — just encourage and praise." },
    { activity: "Puzzle & Shape Sorting", duration: 20, category: "play", notes: "Simple puzzles (4–8 pieces), shape sorters, stacking cups. Builds problem-solving and fine motor skills." },
    { activity: "Music & Dance", duration: 15, category: "play", notes: "Play nursery rhymes and dance together. Toddlers love moving to music — great for coordination." },
    { activity: "Water Play", duration: 20, category: "play", notes: "Supervised water play — pouring, splashing. Develops sensory awareness and keeps them cool." },
    { activity: "Book Time", duration: 15, category: "play", notes: "Flip through picture books. Name everything you see. Builds vocabulary and attention span." },
  ],
  preschool: [
    { activity: "Art & Craft", duration: 30, category: "play", notes: "Drawing, coloring, cutting shapes, making a collage. Let creativity lead — no 'wrong' art." },
    { activity: "Outdoor Play", duration: 30, category: "play", notes: "Swings, slides, running games, sandbox. 30 min of physical activity is vital for preschoolers." },
    { activity: "Pretend Play", duration: 25, category: "play", notes: "Role play as doctor, chef, teacher. Builds imagination, language, and social understanding." },
    { activity: "Alphabet & Numbers", duration: 20, category: "play", notes: "Trace letters in sand, count objects around the house. Make it a game — not a lesson." },
    { activity: "Puzzle Time", duration: 20, category: "play", notes: "15–24 piece puzzles build patience, logic, and spatial skills. Celebrate when it's done!" },
    { activity: "Music & Rhymes", duration: 15, category: "play", notes: "Sing action songs (Hokey Pokey, Wheels on the Bus). Movement + music = happy development." },
  ],
  early_school: [
    { activity: "Outdoor Sport", duration: 40, category: "play", notes: "Cricket, football, cycling, badminton, swimming — let them choose. Daily sport = focus + health." },
    { activity: "Creative Activity", duration: 30, category: "play", notes: "Draw, paint, write a short story, or make a craft. Creativity is the other half of intelligence." },
    { activity: "Board Games / Puzzles", duration: 30, category: "play", notes: "Chess, Ludo, Carrom, Snakes & Ladders. Builds strategy, patience, and healthy competition." },
    { activity: "Free Play Time", duration: 30, category: "play", notes: "Unstructured play — they decide! Builds independence, creativity, and self-direction." },
    { activity: "Reading for Pleasure", duration: 20, category: "play", notes: "Comics, fiction, non-fiction — their choice. 20 min of daily pleasure reading doubles vocabulary." },
    { activity: "Brain Games / Quiz", duration: 20, category: "play", notes: "Geography quiz, math puzzles, riddles. Make it a friendly family competition!" },
  ],
  pre_teen: [
    { activity: "Physical Fitness", duration: 30, category: "play", notes: "Running, yoga, gym exercises, team sport, dance. Daily exercise fights pre-teen stress and boosts mood." },
    { activity: "Hobby Time", duration: 40, category: "play", notes: "Music, art, coding, reading, cooking — their passion. Protect this time — hobbies build identity." },
    { activity: "Social Time", duration: 30, category: "play", notes: "Call or meet a friend. Social connection is critical at this age — don't skip it." },
    { activity: "Creative Project", duration: 30, category: "play", notes: "A drawing, video, story, or experiment they choose. Long-term projects build persistence." },
    { activity: "Digital Learning", duration: 25, category: "screen", notes: "Structured: Khan Academy, coding tutorials, documentaries. Not gaming — active learning." },
  ],
};

const BONDING_ACTIVITIES: Block[] = [
  { activity: "Story Time Together", duration: 20, category: "bonding", notes: "Read aloud together. Take turns reading pages. Ask 'What do you think happens next?'" },
  { activity: "Cooking Together", duration: 25, category: "bonding", notes: "Make something simple together — sandwich, salad, dosa. Kids who cook are more adventurous eaters." },
  { activity: "Outdoor Walk", duration: 25, category: "bonding", notes: "Walk and talk — no phones. Ask open questions: 'What made you smile today?' Great bonding time." },
  { activity: "Board Game / Card Game", duration: 30, category: "bonding", notes: "Ludo, Snakes & Ladders, UNO, Carrom. Let them win sometimes — builds confidence!" },
  { activity: "Art & Craft Together", duration: 30, category: "bonding", notes: "Make something together — drawing, origami, clay modeling. Display the finished work proudly." },
  { activity: "Movie / Show Time Together", duration: 40, category: "bonding", notes: "Watch something they enjoy — no phones during the show. Discuss it after: favourite part?" },
  { activity: "Dance & Music Time", duration: 20, category: "bonding", notes: "Put on their favourite song and dance together. Silly dancing = big smiles = strong bonds." },
  { activity: "Gardening Together", duration: 25, category: "bonding", notes: "Water plants, dig soil, plant seeds. Teaches patience, responsibility, and love of nature." },
];

const TODDLER_NAP: Block = { activity: "Afternoon Nap", duration: 90, category: "sleep", notes: "Toddlers need 1–2 hours of daytime sleep. Keep room cool and dark. Same time each day." };
const PRESCHOOL_REST: Block = { activity: "Quiet Rest Time", duration: 45, category: "sleep", notes: "Even if not sleeping, quiet time recharges energy. Books, soft toys — no screens." };

const TRAVEL_DURATION: Record<string, number> = {
  van: 20, car: 15, walk: 20, other: 20,
};

// ─── Title Templates ──────────────────────────────────────────────────────────

const TITLES: Record<AgeGroup, Record<string, string[]>> = {
  infant: {
    any: [
      "{name}'s Gentle Care Day 💝",
      "{name}'s Loving Day 👶",
      "{name}'s Nurture & Growth Day 🌱",
    ],
  },
  toddler: {
    school: ["{name}'s Playful School Day 🎒", "{name}'s Busy Toddler Day 🌈"],
    holiday: ["{name}'s Fun Play Day 🎉", "{name}'s Adventure Day 🌟", "{name}'s Happy Day 🎈"],
  },
  preschool: {
    school: ["{name}'s Creative School Day 🎨", "{name}'s Rainbow Learning Day 🌈"],
    holiday: ["{name}'s Imagination Day 🌟", "{name}'s Playful Holiday 🎉", "{name}'s Discovery Day 🔍"],
  },
  early_school: {
    school: ["{name}'s Power School Day 📚", "{name}'s Champion Study Day ⭐", "{name}'s Focus Day 🎯"],
    holiday: ["{name}'s Fun Family Day 🌻", "{name}'s Holiday Adventure 🎮", "{name}'s Chill Weekend 🏖️"],
  },
  pre_teen: {
    school: ["{name}'s Achievement Day 🎯", "{name}'s Goals Day 💪", "{name}'s Smart Study Day 📖"],
    holiday: ["{name}'s Recharge Day 🔋", "{name}'s Freedom Day 🌟", "{name}'s Growth Day 🚀"],
  },
};

function makeTitle(ageGroup: AgeGroup, childName: string, hasSchool: boolean, seed: number): string {
  const pool = ageGroup === "infant"
    ? TITLES.infant.any!
    : hasSchool
    ? (TITLES[ageGroup].school ?? TITLES[ageGroup].any ?? ["{name}'s Day"])
    : (TITLES[ageGroup].holiday ?? TITLES[ageGroup].any ?? ["{name}'s Day"]);
  const template = pick(pool, seed);
  return template.replace("{name}", childName);
}

// ─── Main Generator ───────────────────────────────────────────────────────────

export function generateRuleBasedRoutine(params: RoutineParams): GeneratedRoutine {
  const {
    childName, ageGroup, wakeUpTime, sleepTime,
    schoolStartTime, schoolEndTime, travelMode, hasSchool,
    mood, foodType, specialPlans, date,
    p1Free, p2Free, bothBusy,
  } = params;

  const seed = dateSeed(date, childName);
  const isVeg = foodType !== "nonveg";
  const travelMins = TRAVEL_DURATION[travelMode] ?? 20;

  // Parse times
  let cursor = timeToMins(wakeUpTime);
  const sleepMins = timeToMins(sleepTime);
  const schoolStartMins = timeToMins(schoolStartTime);
  const schoolEndMins = timeToMins(schoolEndTime);

  const items: ScheduleItem[] = [];

  const add = (block: Block | null, overrideMins?: number): void => {
    if (!block) return;
    const at = overrideMins !== undefined ? overrideMins : cursor;
    items.push({ ...block, time: minsToTime(at), status: "pending", notes: block.notes ?? "" });
    cursor = at + block.duration;
  };

  const gap = (mins: number) => { cursor += mins; };

  // ── Infant mode: simplified care blocks ──────────────────────────────────
  if (ageGroup === "infant") {
    add({ activity: "Morning Wake & Feed", duration: 30, category: "meal", notes: "Morning feed (breast/formula). Skin-to-skin cuddle after feeding. Talk and smile at baby." });
    add(MORNING_HYGIENE.infant);
    add({ activity: "Tummy Time", duration: 15, category: "play", notes: "Place on firm surface. Builds neck strength. Never leave unattended. 10–15 min max." });
    add({ activity: "Morning Nap", duration: 90, category: "sleep", notes: "Infants need 14–17 hours of sleep daily. Follow baby's cues — yawning means sleepy." });
    add({ activity: "Mid-Morning Feed", duration: 20, category: "meal", notes: `${isVeg ? "Breast milk or formula" : "Breast milk, formula, or age-appropriate solids if 6m+"}. Feed on demand.` });
    add({ activity: "Sensory Play", duration: 20, category: "play", notes: "High-contrast toys, rattles, soft textures. Stimulates brain development. Narrate what you're doing." });
    add({ activity: "Outdoor Fresh Air", duration: 20, category: "play", notes: "Short stroll or sit in fresh air. Gentle sunlight (avoid harsh midday sun). Great for vitamin D." });
    add({ activity: "Afternoon Feed", duration: 20, category: "meal", notes: "Feed before nap — not after. A full baby sleeps better. Burp gently after feeding." });
    add({ activity: "Afternoon Nap", duration: 90, category: "sleep", notes: "Longer nap window — 1.5–2 hours. Room temperature 22–24°C. No loud noise." });
    add({ activity: "Baby Massage & Play", duration: 25, category: "play", notes: "Gentle oil massage (coconut/baby oil). Great for circulation and bonding. Sing or hum while massaging." });
    add({ activity: "Evening Feed", duration: 20, category: "meal", notes: "Evening feed — keep baby awake during feeding to avoid night confusion. Burp well." });
    add(WIND_DOWN.infant[0]!);
    add(WIND_DOWN.infant[1]!);
    items.push({ ...SLEEP_ANCHOR.infant, time: minsToTime(sleepMins), status: "pending" });
    return { title: makeTitle("infant", childName, false, seed), items };
  }

  // ── Structured routine for toddler → pre_teen ─────────────────────────────

  // 1. Morning hygiene
  add(MORNING_HYGIENE[ageGroup]);

  // 2. Breakfast
  const bfOptions = isVeg ? VEG_BREAKFAST[seed % VEG_BREAKFAST.length]! : NONVEG_BREAKFAST[seed % NONVEG_BREAKFAST.length]!;
  const bfDuration = ageGroup === "toddler" ? 20 : ageGroup === "preschool" ? 20 : 25;
  add({ activity: "Breakfast", duration: bfDuration, category: "meal", notes: `Options: ${bfOptions}` });

  gap(5); // transition buffer

  // 3. Special plans injection
  if (specialPlans?.trim()) {
    const spMins = Math.min(60, Math.max(30, 45));
    add({ activity: specialPlans.trim(), duration: spMins, category: "play", notes: "Special activity for today — enjoy every moment!" });
    gap(5);
  }

  // 4. School block or no-school activities
  if (hasSchool && ageGroup !== "toddler" && ageGroup !== "infant") {
    // Tiffin preparation — 20 min before travel departure
    const tiffinStart = schoolStartMins - travelMins - 20;
    if (tiffinStart > cursor + 5) {
      // Fill pre-tiffin gap with a morning activity
      const morningFill = ageGroup === "preschool"
        ? { activity: "Morning Free Play", duration: 20, category: "play", notes: "Unstructured play time before school — keeps mornings relaxed and joyful." }
        : { activity: "Morning Reading / Revision", duration: 20, category: "homework", notes: "Light reading or reviewing yesterday's lesson. Starts the brain gently." };
      if (tiffinStart - cursor >= 20) add(morningFill);
    }
    const tiffinOpts = isVeg ? VEG_TIFFIN[seed % VEG_TIFFIN.length]! : NONVEG_TIFFIN[seed % NONVEG_TIFFIN.length]!;
    add({ activity: "Tiffin Box Preparation", duration: 20, category: "tiffin", notes: `Options: ${tiffinOpts}` });
    gap(5);
    add({ activity: `Travel to School (${travelMode})`, duration: travelMins, category: "travel", notes: `${travelMode === "walk" ? "Walking — great for morning energy!" : "Stay calm, avoid rushing. Play I-Spy or count trees on the way!"}` });
    const schoolDuration = schoolEndMins - schoolStartMins;
    add({ activity: "School Time", duration: schoolDuration > 0 ? schoolDuration : 360, category: "school", notes: `Class ${params.childClass ? params.childClass : ""} — stay focused, be kind to friends, ask questions!` }, schoolStartMins);
    cursor = schoolEndMins;
    add({ activity: `Return Home from School (${travelMode})`, duration: travelMins, category: "travel", notes: "Transition time — let them decompress. Don't ask about homework immediately." });
    const snackOpts = isVeg ? VEG_SNACKS[(seed + 1) % VEG_SNACKS.length]! : NONVEG_SNACKS[(seed + 1) % NONVEG_SNACKS.length]!;
    add({ activity: "After-School Snack", duration: 15, category: "meal", notes: `Options: ${snackOpts}` });
    gap(5);
    // Homework block for school-age kids
    if (ageGroup === "early_school" || ageGroup === "pre_teen") {
      const hwDur = ageGroup === "pre_teen" ? 60 : 40;
      add({ activity: "Homework & Study", duration: hwDur, category: "homework", notes: ageGroup === "pre_teen" ? "Pomodoro: 25 min focus, 5 min break. No phone. Review notes first, then do homework." : "Homework first — get it done early. Parent nearby to guide, not do. Praise effort!" });
      gap(5);
    }
  } else if (hasSchool && ageGroup === "toddler") {
    // Toddler school (playschool/daycare) simplified
    const playschoolDur = Math.min(schoolEndMins - schoolStartMins, 180);
    if (schoolStartMins > cursor + 10) {
      add({ activity: "Playschool Preparation", duration: 15, category: "morning", notes: "Pack small bag, water bottle. Hug and reassure — separation anxiety is normal at this age." });
    }
    add({ activity: "Playschool", duration: playschoolDur > 0 ? playschoolDur : 180, category: "school", notes: "Play, friends, songs, and stories. Wonderful early socialisation." }, schoolStartMins);
    cursor = schoolEndMins;
    const snackOpts = isVeg ? VEG_SNACKS[(seed + 2) % VEG_SNACKS.length]! : NONVEG_SNACKS[(seed + 2) % NONVEG_SNACKS.length]!;
    add({ activity: "Post-School Snack", duration: 15, category: "meal", notes: `Options: ${snackOpts}` });
  } else {
    // No school — fill morning with activities
    const morningPool = seededShuffle(AFTERNOON_ACTIVITIES[ageGroup], seed + 10);
    let filled = 0;
    const morningEnd = ageGroup === "toddler" ? cursor + 60 : cursor + 90;
    for (const act of morningPool) {
      if (cursor >= morningEnd || filled >= 2) break;
      add(act);
      gap(5);
      filled++;
    }
    if (ageGroup === "toddler" || ageGroup === "preschool") {
      const snackOpts = isVeg ? VEG_SNACKS[(seed + 3) % VEG_SNACKS.length]! : NONVEG_SNACKS[(seed + 3) % NONVEG_SNACKS.length]!;
      add({ activity: "Mid-Morning Snack", duration: 15, category: "meal", notes: `Options: ${snackOpts}` });
      gap(5);
    }
  }

  // 5. Toddler nap / preschool rest
  if (ageGroup === "toddler") {
    // Aim for nap around 1–2 PM
    const napTarget = Math.max(cursor + 30, 12 * 60 + 30);
    const lunchOpts = isVeg ? VEG_LUNCH[seed % VEG_LUNCH.length]! : NONVEG_LUNCH[seed % NONVEG_LUNCH.length]!;
    add({ activity: "Lunch", duration: 25, category: "meal", notes: `Options: ${lunchOpts}` }, napTarget - 30);
    gap(5);
    add(TODDLER_NAP);
    gap(10);
  } else if (ageGroup === "preschool") {
    const lunchOpts = isVeg ? VEG_LUNCH[(seed + 1) % VEG_LUNCH.length]! : NONVEG_LUNCH[(seed + 1) % NONVEG_LUNCH.length]!;
    add({ activity: "Lunch", duration: 25, category: "meal", notes: `Options: ${lunchOpts}` });
    gap(5);
    if (!hasSchool) add(PRESCHOOL_REST);
    gap(5);
  } else {
    // For early_school and pre_teen on school days, lunch already happened at school
    // On no-school days, add lunch
    if (!hasSchool) {
      const lunchOpts = isVeg ? VEG_LUNCH[(seed + 2) % VEG_LUNCH.length]! : NONVEG_LUNCH[(seed + 2) % NONVEG_LUNCH.length]!;
      add({ activity: "Lunch", duration: 30, category: "meal", notes: `Options: ${lunchOpts}` });
      gap(5);
      const snackOpts = isVeg ? VEG_SNACKS[(seed + 4) % VEG_SNACKS.length]! : NONVEG_SNACKS[(seed + 4) % NONVEG_SNACKS.length]!;
      add({ activity: "Afternoon Snack", duration: 15, category: "meal", notes: `Options: ${snackOpts}` });
      gap(5);
    }
  }

  // 6. Afternoon activities — pick from pool
  const dinnerMins = sleepMins - 90; // dinner ~90 min before sleep
  const windDownStart = sleepMins - (WIND_DOWN[ageGroup].reduce((s, b) => s + b.duration, 0));
  const activityBudget = windDownStart - cursor;

  const actPool = seededShuffle(AFTERNOON_ACTIVITIES[ageGroup], seed + 20);
  const bondPool = seededShuffle(BONDING_ACTIVITIES, seed + 30);
  let bondAdded = 0;
  let actIdx = 0;
  let bondIdx = 0;

  // Adjust activity durations for mood
  const moodMultiplier = mood === "lazy" ? 0.7 : mood === "happy" ? 1.1 : 1.0;
  const moodSkipHeavy = mood === "angry";

  while (cursor + 20 < windDownStart - 15) {
    const remaining = windDownStart - cursor;
    if (remaining < 20) break;

    // Interleave bonding activity every 2 activities (max 2-3 bonding per day)
    const useBonding = bondAdded < 2 && bondIdx < bondPool.length && (actIdx % 2 === 1 || !actPool[actIdx]);
    if (useBonding) {
      const bond = bondPool[bondIdx]!;
      const dur = Math.min(bond.duration, remaining - 10);
      if (dur >= 15) {
        add({ ...bond, duration: dur });
        bondAdded++;
        gap(5);
        bondIdx++;
      } else break;
    } else if (actIdx < actPool.length) {
      const act = actPool[actIdx]!;
      // Skip heavy homework activities when angry
      if (moodSkipHeavy && act.category === "homework") {
        actIdx++;
        continue;
      }
      const dur = Math.min(Math.round(act.duration * moodMultiplier), remaining - 10);
      if (dur >= 15) {
        add({ ...act, duration: dur });
        gap(5);
      }
      actIdx++;
    } else {
      break;
    }
  }

  // Add 3rd bonding if parent is free and time allows
  if (bondAdded < 3 && !bothBusy && (p1Free || p2Free) && bondIdx < bondPool.length) {
    const bond = bondPool[bondIdx]!;
    const remaining = windDownStart - cursor;
    if (remaining >= bond.duration + 10) {
      add(bond);
      gap(5);
    }
  }

  // Mood booster for angry/lazy
  if (mood === "angry" && cursor + 15 < windDownStart) {
    add({ activity: "Calming Walk or Deep Breathing", duration: 15, category: "play", notes: "Go for a short quiet walk together, or try 5 deep breaths together. No pressure, just support." });
    gap(5);
  }
  if (mood === "lazy" && cursor + 10 < windDownStart) {
    add({ activity: "Quick Energy Game", duration: 10, category: "play", notes: "Simple fun to boost energy: jumping jacks, freeze dance, or a silly race inside the house." });
    gap(5);
  }

  // 7. Screen time (age-appropriate) if budget allows
  const screenAllowed = ageGroup !== "infant" && cursor + 30 < dinnerMins;
  if (screenAllowed) {
    const screenDur = ageGroup === "toddler" ? 20 : ageGroup === "preschool" ? 25 : 30;
    const screenNote = ageGroup === "toddler" || ageGroup === "preschool"
      ? "Educational content only (phonics, colors, nursery rhymes). Co-watch with parent. Max 30 min/day."
      : ageGroup === "early_school"
      ? "Educational or entertainment (30 min max). No violent content. Sit 60 cm+ from screen."
      : "60 min max total screen time. Prefer documentaries, educational videos. Phone on Do Not Disturb.";
    if (cursor + screenDur + 10 <= dinnerMins) {
      add({ activity: "Screen Time", duration: screenDur, category: "screen", notes: screenNote });
      gap(5);
    }
  }

  // 8. Dinner
  const dinnerOpts = isVeg ? VEG_DINNER[seed % VEG_DINNER.length]! : NONVEG_DINNER[seed % NONVEG_DINNER.length]!;
  const dinnerDur = ageGroup === "toddler" ? 25 : 30;
  add({ activity: "Dinner", duration: dinnerDur, category: "meal", notes: `Options: ${dinnerOpts}` }, Math.max(cursor, dinnerMins - 30));
  gap(5);

  // 9. Wind-down sequence
  for (const block of WIND_DOWN[ageGroup]) {
    add(block);
  }

  // 10. Sleep anchor
  items.push({ ...SLEEP_ANCHOR[ageGroup], time: minsToTime(sleepMins), status: "pending" });

  const title = makeTitle(ageGroup, childName, hasSchool, seed);
  return { title, items };
}

// ─── Rule-Based Insights Generator ───────────────────────────────────────────

type RoutineStat = {
  childName: string;
  date: string;
  completionRate: number;
  completed: number;
  skipped: number;
  delayed: number;
  pending: number;
  total: number;
  categories: string[];
};

export type Insight = { type: "positive" | "warning" | "suggestion"; message: string; icon: string };
export type InsightsResult = { insights: Insight[]; summary: string };

export function generateRuleBasedInsights(stats: RoutineStat[]): InsightsResult {
  if (stats.length === 0) {
    return {
      insights: [{ type: "suggestion", message: "Start by generating your first routine to get weekly insights!", icon: "✨" }],
      summary: "No routine data yet. Generate some routines to see insights here.",
    };
  }

  const insights: Insight[] = [];
  const avgCompletion = Math.round(stats.reduce((s, r) => s + r.completionRate, 0) / stats.length);
  const totalSkipped = stats.reduce((s, r) => s + r.skipped, 0);
  const totalDelayed = stats.reduce((s, r) => s + r.delayed, 0);
  const totalCompleted = stats.reduce((s, r) => s + r.completed, 0);
  const recentStats = stats.slice(0, 7);
  const avgRecent = recentStats.length > 0
    ? Math.round(recentStats.reduce((s, r) => s + r.completionRate, 0) / recentStats.length)
    : avgCompletion;

  // Category analysis
  const catCounts: Record<string, number> = {};
  const catSkipped: Record<string, number> = {};
  for (const r of stats) {
    for (const c of r.categories) {
      catCounts[c] = (catCounts[c] ?? 0) + 1;
    }
  }

  // Child-level analysis
  const childStats: Record<string, { total: number; completed: number; days: number }> = {};
  for (const r of stats) {
    if (!childStats[r.childName]) childStats[r.childName] = { total: 0, completed: 0, days: 0 };
    childStats[r.childName]!.total += r.total;
    childStats[r.childName]!.completed += r.completed;
    childStats[r.childName]!.days += 1;
  }

  // Overall performance
  if (avgCompletion >= 80) {
    insights.push({ type: "positive", message: `Excellent routine consistency! Average completion rate of ${avgCompletion}% — your family is building strong habits.`, icon: "🏆" });
  } else if (avgCompletion >= 60) {
    insights.push({ type: "suggestion", message: `Good progress with ${avgCompletion}% average completion. Aim for 80% — try reducing the number of tasks to make the routine more achievable.`, icon: "📈" });
  } else {
    insights.push({ type: "warning", message: `Completion rate is ${avgCompletion}% — routines may be overloaded. Try a lighter schedule with 8–10 tasks instead of more.`, icon: "⚠️" });
  }

  // Trend analysis
  if (stats.length >= 7) {
    const older = stats.slice(7);
    const avgOlder = older.length > 0 ? Math.round(older.reduce((s, r) => s + r.completionRate, 0) / older.length) : avgRecent;
    if (avgRecent > avgOlder + 10) {
      insights.push({ type: "positive", message: `Routines are improving! This week's completion (${avgRecent}%) is better than last week (${avgOlder}%). Keep it up!`, icon: "🚀" });
    } else if (avgRecent < avgOlder - 10) {
      insights.push({ type: "warning", message: `Routine completion dipped this week (${avgRecent}% vs ${avgOlder}% before). Check if schedules are too packed or if there's extra stress.`, icon: "📉" });
    }
  }

  // Skipped tasks
  if (totalSkipped > stats.length * 2) {
    insights.push({ type: "warning", message: `${totalSkipped} tasks were skipped across routines. Review which tasks are frequently skipped — they may not be realistic or needed.`, icon: "⏭️" });
  } else if (totalSkipped === 0 && stats.length >= 3) {
    insights.push({ type: "positive", message: "Zero tasks skipped — wonderful routine adherence! Every planned activity is being followed through.", icon: "✅" });
  }

  // Delayed tasks
  if (totalDelayed > stats.length * 3) {
    insights.push({ type: "suggestion", message: "Many tasks are being delayed. Try adding 5-minute buffer gaps between activities — tight schedules create a domino effect of delays.", icon: "⏱️" });
  }

  // Child-specific insights
  for (const [name, data] of Object.entries(childStats)) {
    const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
    if (rate >= 85) {
      insights.push({ type: "positive", message: `${name} is crushing it with ${rate}% task completion — celebrate this consistency with them!`, icon: "⭐" });
    } else if (rate < 50 && data.days >= 3) {
      insights.push({ type: "suggestion", message: `${name}'s completion rate (${rate}%) suggests the routine may be too ambitious. Try 2–3 fewer activities per day.`, icon: "💡" });
    }
  }

  // Category-specific tips
  if (catCounts["screen"] && catCounts["screen"] > stats.length) {
    insights.push({ type: "suggestion", message: "Screen time appears daily in routines — ensure it stays within age-appropriate limits and is always scheduled, not spontaneous.", icon: "📱" });
  }
  if (catCounts["bonding"] && catCounts["bonding"] >= stats.length) {
    insights.push({ type: "positive", message: "Bonding activities are part of every routine — this is one of the most important investments you make in your child.", icon: "❤️" });
  }
  if (!catCounts["play"] || catCounts["play"] < stats.length / 2) {
    insights.push({ type: "suggestion", message: "Unstructured play time appears infrequently — children need at least 30 min of free play daily for healthy development.", icon: "🎮" });
  }

  // Encouragement if few routines
  if (stats.length <= 3) {
    insights.push({ type: "suggestion", message: `You have ${stats.length} routine${stats.length > 1 ? "s" : ""} so far. Generating routines daily for a week gives you meaningful insights and builds family rhythm!`, icon: "📅" });
  }

  // Keep max 6 insights
  const final = insights.slice(0, 6);

  const summaryParts = [
    `You have ${stats.length} routine${stats.length !== 1 ? "s" : ""} logged with an average completion of ${avgCompletion}%.`,
    avgCompletion >= 75
      ? "Your family is building excellent daily habits — keep the momentum going!"
      : "Every routine completed is progress — consistency beats perfection every time!",
  ];

  return { insights: final, summary: summaryParts.join(" ") };
}

// ─── Rule-Based Partial Regeneration ─────────────────────────────────────────

type ExistingItem = { time: string; activity: string; duration: number; category: string; notes?: string; status?: string };

export function generatePartialRoutine(params: {
  childName: string;
  ageGroup: AgeGroup;
  childAge: number;
  foodType: string;
  goals: string;
  keptItems: ExistingItem[];
  startMins: number;
  sleepMins: number;
  newActivity?: { name: string; duration?: number };
  date: string;
}): ScheduleItem[] {
  const { childName, ageGroup, foodType, keptItems, startMins, sleepMins, newActivity, date } = params;
  const seed = dateSeed(date, childName);
  const isVeg = foodType !== "nonveg";

  // Categories already present in kept items
  const usedActivities = new Set(keptItems.map((i) => i.activity.toLowerCase()));

  let cursor = startMins;
  const items: ScheduleItem[] = [];

  const add = (block: Block) => {
    if (cursor + block.duration > sleepMins - 30) return;
    items.push({ ...block, time: minsToTime(cursor), status: "pending", notes: block.notes ?? "" });
    cursor += block.duration + 5;
  };

  // Insert new activity first if requested
  if (newActivity) {
    add({
      activity: newActivity.name,
      duration: newActivity.duration ?? 30,
      category: "play",
      notes: "Added activity — enjoy!",
    });
  }

  // Pick activities not yet done
  const pool = seededShuffle([...AFTERNOON_ACTIVITIES[ageGroup], ...BONDING_ACTIVITIES], seed + cursor);
  let bondAdded = 0;
  for (const act of pool) {
    if (cursor + 20 >= sleepMins - 60) break;
    if (usedActivities.has(act.activity.toLowerCase())) continue;
    if (act.category === "bonding" && bondAdded >= 1) continue;
    add(act);
    usedActivities.add(act.activity.toLowerCase());
    if (act.category === "bonding") bondAdded++;
  }

  // Dinner if not already in kept items and not yet added
  const hasDinner = keptItems.some((i) => i.activity.toLowerCase().includes("dinner"));
  if (!hasDinner && cursor + 30 < sleepMins - 30) {
    const dinnerOpts = isVeg ? VEG_DINNER[seed % VEG_DINNER.length]! : NONVEG_DINNER[seed % NONVEG_DINNER.length]!;
    add({ activity: "Dinner", duration: 30, category: "meal", notes: `Options: ${dinnerOpts}` });
  }

  // Wind-down
  const wdBlocks = WIND_DOWN[ageGroup];
  for (const block of wdBlocks) {
    if (cursor + block.duration < sleepMins) add(block);
  }

  // Sleep anchor
  items.push({ ...SLEEP_ANCHOR[ageGroup], time: minsToTime(sleepMins), status: "pending" });

  return items;
}
