// Goal-specific prompt appendices.
// Each goal ID maps to a "family" of expert focus areas, psychological
// concepts, and must-include themes. The main prompt in ai-coach.ts
// already ships the base rules + JSON schema; this module returns the
// goal-specific section that is appended to differentiate output.

type GoalFamily =
  | "tantrum" | "aggression" | "defiance" | "emotional" | "separation"
  | "screen" | "focus" | "learning"
  | "eating"
  | "sleep"
  | "stubborn"
  | "coparenting" | "generic"
  // NEW families
  | "toddler" | "potty" | "siblings" | "selfcare" | "transitions";

interface FamilyPrompt {
  focus: string[];
  concepts: string[];
  mustInclude: string[];
  experts?: string[];
}

const FAMILIES: Record<GoalFamily, FamilyPrompt> = {
  tantrum: {
    focus: [
      "Emotional regulation and co-regulation between parent and child",
      "Preventing triggers before escalation (hunger, tiredness, transitions)",
      "Teaching the child to name and ride the feeling wave",
    ],
    concepts: [
      "Prefrontal cortex development and 'flipped lid' neuroscience",
      "Window of tolerance and nervous-system states",
      "Emotional validation and attuned responses",
    ],
    mustInclude: [
      "Wins that cover BEFORE a tantrum (prevention and connection)",
      "Wins that cover DURING a tantrum (co-regulation and safety)",
      "Wins that cover AFTER a tantrum (repair, teaching and reflection)",
    ],
    experts: ["Dan Siegel", "Tina Payne Bryson", "Mona Delahooke", "Stephen Porges"],
  },
  aggression: {
    focus: [
      "Reading hitting/biting as communication, not character",
      "Rebuilding impulse-control via tiny repeatable practices",
      "Restoring relationship safety after aggressive episodes",
    ],
    concepts: [
      "Fight-flight-freeze biology and sensory overload",
      "Mirror neurons and modelling of regulated behaviour",
      "Replacement behaviour training",
    ],
    mustInclude: [
      "A clear in-the-moment safety script (blocking without shaming)",
      "Teaching a specific replacement skill (words, body cues, signals)",
      "Repair ritual and rebuilding trust after each incident",
    ],
    experts: ["Mona Delahooke", "Ross Greene", "Dan Siegel"],
  },
  defiance: {
    focus: [
      "Cooperation through connection, not compliance through pressure",
      "Dissolving power struggles by sharing real control",
      "Making the 'yes path' easier than the 'no path'",
    ],
    concepts: [
      "Self-Determination Theory (autonomy, competence, relatedness)",
      "Choice architecture and limited real choices",
      "Collaborative Problem Solving",
    ],
    mustInclude: [
      "A script for giving two genuine choices inside a firm limit",
      "How to hold the limit warmly when pushback escalates",
      "How to build a week of small cooperation wins",
    ],
    experts: ["Deci & Ryan", "Ross Greene", "Diana Baumrind"],
  },
  emotional: {
    focus: [
      "Building the child's emotional vocabulary and interoception",
      "Parent as external regulator before internal regulation develops",
      "Daily rhythms that stabilise the nervous system",
    ],
    concepts: [
      "Polyvagal Theory and co-regulation",
      "Emotion granularity (naming feelings reduces intensity)",
      "Attachment security as the regulation platform",
    ],
    mustInclude: [
      "A feelings-naming practice that happens during CALM moments",
      "A breathing/body-based regulation tool both parent and child use",
      "A nightly check-in ritual that processes the day's emotions",
    ],
    experts: ["Stephen Porges", "Lisa Feldman Barrett", "Dan Siegel"],
  },
  separation: {
    focus: [
      "Secure-base behaviour and predictable goodbyes",
      "Gradual practice of independence in low-stakes settings",
      "Shrinking separation anxiety without dismissing the feeling",
    ],
    concepts: [
      "Attachment theory and the secure-base / safe-haven cycle",
      "Object permanence and 'return rituals'",
      "Gradual exposure and graduated independence",
    ],
    mustInclude: [
      "A consistent goodbye ritual (same words, same gesture, every time)",
      "A reunion ritual that reliably restores connection",
      "A graded practice ladder (2 min apart → 15 min → longer)",
    ],
    experts: ["John Bowlby", "Mary Ainsworth", "Circle of Security"],
  },
  screen: {
    focus: [
      "The dopamine-addiction cycle and attention hijacking",
      "Replacing screens with high-reward offline alternatives",
      "Environment redesign so willpower isn't needed",
    ],
    concepts: [
      "Dopamine regulation and variable-reward schedules",
      "Reward-system reset and boredom as fuel for creativity",
      "Behavioural environment design (Nudge, choice architecture)",
    ],
    mustInclude: [
      "A gradual weaning plan (not cold turkey) with exact minute-targets per day",
      "A menu of concrete offline alternatives matched to the child's interests",
      "A parent-consistency system so rules don't bend under protest",
    ],
    experts: ["Anna Lembke (Dopamine Nation)", "Nir Eyal", "Thaler & Sunstein"],
  },
  focus: {
    focus: [
      "Attention-span building through graded practice",
      "Reducing environmental distractions",
      "Single-tasking and deep-work habits appropriate for the age",
    ],
    concepts: [
      "Cognitive load theory and working-memory limits",
      "Attentional training and Pomodoro-style intervals for kids",
      "Screen-attention residue and recovery time",
    ],
    mustInclude: [
      "A specific focus-building exercise progression (by minutes)",
      "An environment-setup checklist (lighting, seating, no phone, etc.)",
      "How screens earlier in the day impact focus later",
    ],
    experts: ["John Sweller (cognitive load)", "Daniel Willingham", "Adam Gazzaley"],
  },
  learning: {
    focus: [
      "Intrinsic motivation over bribes or fear",
      "Growth mindset and productive struggle",
      "Making effort visible and celebrated",
    ],
    concepts: [
      "Growth vs fixed mindset (Dweck)",
      "Zone of Proximal Development (Vygotsky)",
      "Spaced repetition and retrieval practice",
    ],
    mustInclude: [
      "A process-praise script (praise effort, strategy, not ability)",
      "A homework/study routine that matches the child's attention span",
      "How to reframe failure as data, not identity",
    ],
    experts: ["Carol Dweck", "Lev Vygotsky", "Barbara Oakley"],
  },
  eating: {
    focus: [
      "Pressure-free mealtimes and autonomy building",
      "Repeated neutral exposure to new foods",
      "Restoring trust between child and hunger/fullness cues",
    ],
    concepts: [
      "Ellyn Satter's Division of Responsibility",
      "Mere-exposure effect and food neophobia",
      "Interoceptive awareness and self-regulation",
    ],
    mustInclude: [
      "What NOT to do at the table (no forcing, no bribing, no grazing)",
      "How to introduce new foods across 10-15 low-pressure exposures",
      "How to design the mealtime environment and parent tone",
    ],
    experts: ["Ellyn Satter", "Leann Birch"],
  },
  sleep: {
    focus: [
      "Circadian-rhythm regulation and light/dark cues",
      "Sleep associations the child can carry alone",
      "Bedtime resistance as a transition problem, not defiance",
    ],
    concepts: [
      "Melatonin cycle and bright-light/dim-light timing",
      "Habit loops (cue → routine → reward) applied to bedtime",
      "Extinction-burst research in gentle sleep training",
    ],
    mustInclude: [
      "A specific 30-45 minute pre-sleep routine (same order every night)",
      "A night-waking response ladder (calm, consistent, boring)",
      "A consistency system that survives weekends and travel",
    ],
    experts: ["Matthew Walker", "Richard Ferber", "Jodi Mindell"],
  },
  stubborn: {
    focus: [
      "Dismantling power struggles before they start",
      "Autonomy vs control — giving real micro-choices",
      "Building cooperation through predictable warmth + firmness",
    ],
    concepts: [
      "Choice architecture and two-option framing",
      "Positive reinforcement and specific praise",
      "Authoritative parenting (high warmth + high structure)",
    ],
    mustInclude: [
      "How to avoid the conflict entirely by changing the setup",
      "Scripts for offering controlled choices that the parent can live with",
      "A 7-day cooperation-building plan with tracked wins",
    ],
    experts: ["Diana Baumrind", "B.F. Skinner", "Ross Greene"],
  },
  coparenting: {
    focus: [
      "Unified adult front even when beliefs differ",
      "Boundaries with extended family without burning bridges",
      "Processing parent guilt so it doesn't leak into the child",
    ],
    concepts: [
      "Family-systems theory and triangulation",
      "Values-based parenting (ACT matrix) over rule-based",
      "Ruptures and repairs in the adult relationship",
    ],
    mustInclude: [
      "A weekly 15-minute parent-sync script (what's working, what's not)",
      "A diplomatic but firm phrase bank for grandparents/relatives",
      "A guilt-reframing practice the working parent can do in 3 minutes",
    ],
    experts: ["John Gottman", "Murray Bowen", "Becky Kennedy"],
  },
  generic: {
    focus: ["Deep, practical, science-based parenting solutions"],
    concepts: ["Neuroscience, behavioural psychology, habit formation"],
    mustInclude: ["Real-life actionable steps tailored to the stated goal"],
  },
  // ─── NEW FAMILIES ──────────────────────────────────────────────────
  toddler: {
    focus: [
      "2–4 yr brain: massive prefrontal-cortex pruning, almost no impulse control",
      "Autonomy explosion + still-developing language = behaviour IS the communication",
      "Co-regulation: parent's calm body lends regulation to the toddler's body",
    ],
    concepts: [
      "Erikson: Autonomy vs. Shame & Doubt stage (2–4 yrs)",
      "Daniel Siegel & Tina Bryson — 'flipped lid' / hand model of the brain",
      "Mona Delahooke — bottom-up vs top-down behaviour",
      "Stephen Porges — polyvagal regulation",
    ],
    mustInclude: [
      "A specific in-the-moment script (what to SAY in 10 words or less)",
      "A connection ritual that PREVENTS the next episode (≤5 min)",
      "A 'give them control inside a limit' choice script (two real options)",
      "A repair script for after the storm passes",
    ],
    experts: ["Dan Siegel", "Tina Payne Bryson", "Mona Delahooke", "Janet Lansbury", "Becky Kennedy"],
  },
  potty: {
    focus: [
      "Readiness signs (dryness intervals, body awareness, interest)",
      "Pressure-free, child-led process — accidents are NOT failures",
      "Day mastery before night; night-time dryness is largely physiological maturation",
    ],
    concepts: [
      "AAP toilet-training readiness (typical window 18 months – 3 yrs)",
      "ICCS (Brazelton) child-oriented approach — significantly fewer regressions",
      "Operant conditioning: tiny celebrations beat sticker charts long-term",
      "Antidiuretic hormone (ADH) maturation — night dryness ≠ effort",
    ],
    mustInclude: [
      "A clear readiness-check (yes/no) the parent can do this week",
      "Step-by-step day-1 plan (clothes off, timer, snack/drink loading)",
      "Exact words for accidents (no shame, no praise — neutral coaching)",
      "When to PAUSE training (regressions, illness, big life changes)",
    ],
    experts: ["T. Berry Brazelton", "AAP", "Jamie Glowacki", "Dr Steve Hodges"],
  },
  siblings: {
    focus: [
      "Each child's emotional bucket — rivalry is starvation, not malice",
      "Stop being the referee — coach skills, not verdicts",
      "Protect the relationship long-term, not the moment's peace",
    ],
    concepts: [
      "Adler/Dreikurs — sibling positions and the 'mistaken goal' of attention",
      "Faber & Mazlish — 'do not compare, describe what you see'",
      "Attachment theory — secure base required for prosocial sibling behaviour",
      "Conflict-resolution scaffolding (sportscasting → coaching → stepping back)",
    ],
    mustInclude: [
      "A 1:1 connection ritual (15 min/day per child) — the #1 evidence-based intervention",
      "A sportscasting script for live conflicts (describe, do not judge)",
      "A repair conversation after a hit/bite that builds empathy, not shame",
      "A 'no comparing' rephrase library (replace 'why can't you be like X')",
    ],
    experts: ["Adele Faber & Elaine Mazlish", "Janet Lansbury", "Laura Markham", "Becky Kennedy"],
  },
  selfcare: {
    focus: [
      "You cannot pour from an empty cup — parent regulation IS the intervention",
      "Burnout is a nervous-system state, not a willpower failure",
      "Tiny 2–10 min restoration beats hour-long fantasies you'll never get",
    ],
    concepts: [
      "Maslach burnout inventory — emotional exhaustion + depersonalisation + low efficacy",
      "Polyvagal theory — completing the stress cycle (Nagoski)",
      "Self-Compassion (Kristin Neff) — three components: kindness, common humanity, mindfulness",
      "Sleep deprivation cognition cost — 6 hrs × 10 nights ≈ 24 hrs awake",
    ],
    mustInclude: [
      "A 2-min nervous-system reset the parent can do mid-meltdown",
      "One boundary script to protect 10 min/day non-negotiable",
      "A reframe practice for guilt (specific cognitive-distortion challenge)",
      "A weekly 'minimum viable rest' plan that survives chaos",
    ],
    experts: ["Emily & Amelia Nagoski", "Kristin Neff", "Christina Maslach", "Becky Kennedy"],
  },
  transitions: {
    focus: [
      "Predictability is the antidote to transition anxiety",
      "Pre-loading (preview, rehearse, role-play) reduces in-the-moment overwhelm by ~50%",
      "Hold both feelings: this is hard AND we will be okay",
    ],
    concepts: [
      "Transitional objects (Winnicott) — anchor of safety in new spaces",
      "Bowlby attachment — secure base allows exploration of unfamiliar environments",
      "Cognitive rehearsal & habituation — repeated low-stakes exposure",
      "Story-based scripts (Carol Gray's Social Stories) for predictability",
    ],
    mustInclude: [
      "A pre-trip / pre-event preview ritual (visuals, story, what to expect)",
      "A 'comfort kit' packing list specific to the situation",
      "Day-of script for departure (no sneaking out, no over-explaining)",
      "A post-event decompression ritual to integrate the experience",
    ],
    experts: ["John Bowlby", "Donald Winnicott", "Carol Gray", "Tina Payne Bryson"],
  },
};

const GOAL_TO_FAMILY: Record<string, GoalFamily> = {
  // Behavior
  "manage-tantrums": "tantrum",
  "handle-aggression": "aggression",
  "reduce-defiance": "defiance",
  "emotional-regulation": "emotional",
  "separation-anxiety": "separation",
  "change-stubborn-behaviour": "stubborn",
  // Screen & Focus
  "balance-screen-time": "screen",
  "reduce-mobile-addiction": "screen",
  "reduce-shorts-overuse": "screen",
  "reduce-instant-gratification": "screen",
  "improve-focus-span": "focus",
  // Eating
  "encourage-independent-eating": "eating",
  "navigate-fussy-eating": "eating",
  "stop-junk-food-craving": "eating",
  "healthy-eating-routine": "eating",
  "improve-mealtime-behavior": "eating",
  // Sleep
  "improve-sleep-patterns": "sleep",
  "fix-bedtime-resistance": "sleep",
  "stop-night-waking": "sleep",
  "consistent-sleep-routine": "sleep",
  "reduce-late-sleeping": "sleep",
  // Learning
  "boost-concentration": "focus",
  "build-study-discipline": "learning",
  "increase-learning-interest": "learning",
  "reduce-homework-resistance": "learning",
  "develop-growth-mindset": "learning",
  // Parenting challenges
  "manage-grandparents-interference": "coparenting",
  "align-parenting-between-parents": "coparenting",
  "handle-working-parent-guilt": "coparenting",
  "set-consistent-family-rules": "coparenting",
  // Toddler Behavior (2–4)
  "toddler-tantrums": "toddler",
  "hitting-biting": "toddler",
  "no-phase": "toddler",
  "public-meltdowns": "toddler",
  "whining-and-clinginess": "toddler",
  // Daily Skills & Independence
  "potty-training-readiness": "potty",
  "potty-day-training": "potty",
  "potty-night-training": "potty",
  "potty-public-anxiety": "potty",
  "self-dressing": "potty",
  // Family Dynamics
  "sibling-rivalry": "siblings",
  "sharing-turn-taking": "siblings",
  "new-baby-adjustment": "siblings",
  "sibling-fights": "siblings",
  "favouritism-feelings": "siblings",
  // Parent Self-Care
  "parent-burnout": "selfcare",
  "anger-management-parent": "selfcare",
  "find-me-time": "selfcare",
  "parent-sleep": "selfcare",
  "mom-guilt": "selfcare",
  // Special Situations
  "travel-with-kids": "transitions",
  "hospital-doctor-visit": "transitions",
  "daycare-school-transition": "transitions",
  "welcoming-new-sibling": "transitions",
  "moving-houses": "transitions",
};

export function getGoalPromptSection(goalId: string, goalLabel: string): string {
  const family = GOAL_TO_FAMILY[goalId] ?? "generic";
  const f = FAMILIES[family];
  const bullets = (arr: string[]) => arr.map((x) => `- ${x}`).join("\n");
  const experts = f.experts?.length
    ? `\nGround your writing in the work of: ${f.experts.join(", ")}.`
    : "";

  return `

━━━ GOAL-SPECIFIC EXPERT BRIEF ━━━
Goal: ${goalLabel}

FOCUS (what every win should serve):
${bullets(f.focus)}

PSYCHOLOGY & NEUROSCIENCE CONCEPTS TO APPLY:
${bullets(f.concepts)}

THIS PLAN MUST INCLUDE:
${bullets(f.mustInclude)}${experts}

Write like a senior expert in THIS specific goal area — not a generalist. Every win should feel authored for "${goalLabel}" specifically, not recycled from a generic parenting manual.`;
}
