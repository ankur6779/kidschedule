// @workspace/infant-problems
// Research-based static dataset for infant parent problems (0–2 years).
// All content is local — no API calls. Tri-lingual (en / hi / hin).

export type Lang = "en" | "hi" | "hin";

export interface LocalizedText {
  en: string;
  hi: string;
  hin: string;
}

export interface InfantProblem {
  id: string;
  emoji: string;
  title: LocalizedText;
  description: LocalizedText;     // short one-liner shown on card
  reason: LocalizedText;          // (A) Possible Reason
  solution: LocalizedText[];      // (B) What You Can Do — 2-3 steps
  insight: LocalizedText;         // (C) Amy AI Insight
  reassure: LocalizedText;        // (D) Reassurance line
}

export const INFANT_PROBLEMS: InfantProblem[] = [
  {
    id: "baby-not-sleeping",
    emoji: "😴",
    title: {
      en: "Baby not sleeping",
      hi: "बच्चा सो नहीं रहा",
      hin: "Baby so nahi raha",
    },
    description: {
      en: "Trouble falling or staying asleep",
      hi: "सोने या सोते रहने में परेशानी",
      hin: "Sone ya sote rehne mein dikkat",
    },
    reason: {
      en: "Overtiredness, overstimulation, or irregular sleep timing.",
      hi: "अत्यधिक थकान, ज़्यादा उत्तेजना या असमान नींद का समय।",
      hin: "Bahut zyada thakaan, overstimulation ya irregular sleep timing.",
    },
    solution: [
      { en: "Follow a consistent sleep routine.", hi: "एक नियमित सोने की दिनचर्या अपनाएँ।", hin: "Ek consistent sleep routine follow karein." },
      { en: "Reduce noise and light before sleep.", hi: "सोने से पहले शोर और रोशनी कम करें।", hin: "Sone se pehle noise aur light kam karein." },
      { en: "Watch sleep cues like rubbing eyes.", hi: "आँख मलने जैसे नींद के संकेत देखें।", hin: "Aankh malne jaise sleep cues notice karein." },
    ],
    insight: {
      en: "Babies need predictable sleep patterns to feel secure.",
      hi: "बच्चों को सुरक्षित महसूस करने के लिए अनुमानित नींद के पैटर्न चाहिए।",
      hin: "Babies ko secure feel karne ke liye predictable sleep patterns chahiye.",
    },
    reassure: {
      en: "This is very common and improves with routine.",
      hi: "यह बहुत आम है और दिनचर्या से सुधर जाता है।",
      hin: "Yeh bahut common hai aur routine ke saath behtar ho jaata hai.",
    },
  },
  {
    id: "excessive-crying",
    emoji: "😭",
    title: { en: "Excessive crying", hi: "बहुत ज़्यादा रोना", hin: "Bahut zyada rona" },
    description: { en: "Long or frequent crying spells", hi: "लंबे या बार-बार रोने के दौरे", hin: "Lambe ya baar-baar crying spells" },
    reason: {
      en: "Hunger, discomfort, tiredness, or need for attention.",
      hi: "भूख, असुविधा, थकान या ध्यान की ज़रूरत।",
      hin: "Bhookh, discomfort, thakaan ya attention ki zarurat.",
    },
    solution: [
      { en: "Check feeding and diaper first.", hi: "सबसे पहले दूध और डायपर देखें।", hin: "Pehle feeding aur diaper check karein." },
      { en: "Try gentle rocking or holding.", hi: "धीरे से झुलाएँ या गोद में लें।", hin: "Halke se jhulayein ya god mein lein." },
      { en: "Use a calm voice and eye contact.", hi: "शांत आवाज़ और आँखों से संपर्क रखें।", hin: "Shaant awaaz aur eye contact use karein." },
    ],
    insight: {
      en: "Crying is the baby's main way to communicate.",
      hi: "रोना बच्चे का बात करने का मुख्य तरीका है।",
      hin: "Rona baby ka main communicate karne ka tareeka hai.",
    },
    reassure: {
      en: "You are doing the right thing by responding calmly.",
      hi: "शांति से जवाब देकर आप सही कर रहे हैं।",
      hin: "Calmly respond karke aap sahi kar rahe hain.",
    },
  },
  {
    id: "feeding-issues",
    emoji: "🍼",
    title: { en: "Feeding issues", hi: "दूध पीने की समस्या", hin: "Feeding ki problem" },
    description: { en: "Refusing or struggling with feeds", hi: "दूध पीने से इंकार या कठिनाई", hin: "Feed lene se mana ya dikkat" },
    reason: {
      en: "Growth phase changes or distraction.",
      hi: "वृद्धि चरण में बदलाव या ध्यान भटकना।",
      hin: "Growth phase changes ya distraction.",
    },
    solution: [
      { en: "Feed in a calm environment.", hi: "शांत माहौल में दूध पिलाएँ।", hin: "Calm environment mein feed karein." },
      { en: "Keep feeding timing consistent.", hi: "दूध पिलाने का समय नियमित रखें।", hin: "Feeding timing consistent rakhein." },
      { en: "Avoid force feeding.", hi: "ज़बरदस्ती न खिलाएँ।", hin: "Force feeding avoid karein." },
    ],
    insight: {
      en: "Appetite varies during development phases.",
      hi: "विकास के दौरान भूख बदलती रहती है।",
      hin: "Development phases mein appetite badalti rehti hai.",
    },
    reassure: {
      en: "Small changes in feeding are normal.",
      hi: "खाने में छोटे बदलाव सामान्य हैं।",
      hin: "Feeding mein chote changes normal hain.",
    },
  },
  {
    id: "teething-discomfort",
    emoji: "🦷",
    title: { en: "Teething discomfort", hi: "दांत निकलने की तकलीफ", hin: "Teething ki takleef" },
    description: { en: "Sore gums and fussiness", hi: "मसूड़ों में दर्द और चिड़चिड़ापन", hin: "Mason mein dard aur chidchidapan" },
    reason: {
      en: "Emerging teeth causing gum irritation.",
      hi: "नए दांत आने से मसूड़ों में जलन।",
      hin: "Naye teeth aane se gum irritation.",
    },
    solution: [
      { en: "Use clean teething toys.", hi: "साफ टीथिंग खिलौने दें।", hin: "Clean teething toys dein." },
      { en: "Gently massage the gums.", hi: "मसूड़ों की हल्की मालिश करें।", hin: "Gums ki halki maalish karein." },
      { en: "Offer cold (not frozen) items.", hi: "ठंडी (जमी हुई नहीं) चीज़ें दें।", hin: "Thandi (frozen nahi) cheezein offer karein." },
    ],
    insight: {
      en: "Teething can cause mild discomfort and irritability.",
      hi: "दांत निकलने से हल्की तकलीफ़ और चिड़चिड़ापन हो सकता है।",
      hin: "Teething se halki discomfort aur irritability ho sakti hai.",
    },
    reassure: {
      en: "This phase will pass soon.",
      hi: "यह दौर जल्द ही गुज़र जाएगा।",
      hin: "Yeh phase jaldi guzar jayega.",
    },
  },
  {
    id: "not-eating-solids",
    emoji: "🥄",
    title: { en: "Not eating solids", hi: "ठोस आहार न खाना", hin: "Solid food nahi khaa raha" },
    description: { en: "Refusing new textures of food", hi: "नए स्वाद-बनावट से इंकार", hin: "Naye textures se mana karna" },
    reason: {
      en: "Adjustment phase to new textures.",
      hi: "नई बनावट के साथ ढलने का समय।",
      hin: "Naye textures ke saath adjust hone ka phase.",
    },
    solution: [
      { en: "Introduce slowly.", hi: "धीरे-धीरे शुरू करें।", hin: "Dheere-dheere introduce karein." },
      { en: "Repeat foods multiple times.", hi: "एक ही खाना कई बार दें।", hin: "Same food multiple times repeat karein." },
      { en: "Do not pressure the child.", hi: "बच्चे पर दबाव न डालें।", hin: "Bachhe par pressure mat daalein." },
    ],
    insight: {
      en: "Babies need time to accept new foods.",
      hi: "बच्चों को नए खाने को अपनाने में समय लगता है।",
      hin: "Babies ko naye foods accept karne mein time lagta hai.",
    },
    reassure: {
      en: "Repetition helps acceptance.",
      hi: "दोहराने से स्वीकार्यता बढ़ती है।",
      hin: "Repetition se acceptance badhti hai.",
    },
  },
  {
    id: "frequent-night-waking",
    emoji: "🌙",
    title: { en: "Frequent night waking", hi: "बार-बार रात में उठना", hin: "Raat mein baar-baar uthna" },
    description: { en: "Waking multiple times at night", hi: "रात में कई बार जागना", hin: "Raat mein kai baar jaagna" },
    reason: {
      en: "Sleep cycle transitions or hunger.",
      hi: "नींद के चरण बदलना या भूख।",
      hin: "Sleep cycle transitions ya bhookh.",
    },
    solution: [
      { en: "Keep the night environment calm.", hi: "रात का माहौल शांत रखें।", hin: "Raat ka environment calm rakhein." },
      { en: "Avoid stimulation during the night.", hi: "रात में उत्तेजना से बचें।", hin: "Raat mein stimulation avoid karein." },
      { en: "Maintain a consistent bedtime.", hi: "सोने का समय नियमित रखें।", hin: "Bedtime consistent rakhein." },
    ],
    insight: {
      en: "Night waking is normal in early development.",
      hi: "शुरुआती विकास में रात में जागना सामान्य है।",
      hin: "Early development mein night waking normal hai.",
    },
    reassure: {
      en: "Sleep improves gradually.",
      hi: "नींद धीरे-धीरे बेहतर होती है।",
      hin: "Neend dheere-dheere behtar hoti hai.",
    },
  },
  {
    id: "always-irritable",
    emoji: "😣",
    title: { en: "Baby always irritable", hi: "बच्चा हमेशा चिड़चिड़ा", hin: "Baby hamesha irritable" },
    description: { en: "Frequent fussiness or upset mood", hi: "बार-बार चिड़चिड़ापन या ख़राब मूड", hin: "Baar-baar fussy ya upset mood" },
    reason: {
      en: "Overstimulation or tiredness.",
      hi: "ज़्यादा उत्तेजना या थकान।",
      hin: "Overstimulation ya thakaan.",
    },
    solution: [
      { en: "Reduce noise and screen exposure.", hi: "शोर और स्क्रीन कम करें।", hin: "Noise aur screen exposure kam karein." },
      { en: "Follow a routine.", hi: "एक दिनचर्या अपनाएँ।", hin: "Routine follow karein." },
      { en: "Give quiet time.", hi: "शांत समय दें।", hin: "Quiet time dein." },
    ],
    insight: {
      en: "Babies need calm environments to regulate emotions.",
      hi: "भावनाओं को संभालने के लिए बच्चों को शांत माहौल चाहिए।",
      hin: "Emotions regulate karne ke liye babies ko calm environment chahiye.",
    },
    reassure: {
      en: "This is manageable with small changes.",
      hi: "छोटे बदलावों से यह संभल जाता है।",
      hin: "Chote changes se yeh manageable hai.",
    },
  },
  {
    id: "not-reaching-milestones",
    emoji: "🌱",
    title: { en: "Not reaching milestones", hi: "मील के पत्थर तक नहीं पहुँचना", hin: "Milestones tak nahi pahunch raha" },
    description: { en: "Slower growth signs or skills", hi: "धीमी विकास संकेत या कौशल", hin: "Slow development signs ya skills" },
    reason: {
      en: "Natural variation in development pace.",
      hi: "विकास की गति में स्वाभाविक अंतर।",
      hin: "Development pace mein natural variation.",
    },
    solution: [
      { en: "Encourage daily play.", hi: "रोज़ खेल को बढ़ावा दें।", hin: "Roz play encourage karein." },
      { en: "Give tummy time.", hi: "टमी टाइम दें।", hin: "Tummy time dein." },
      { en: "Interact frequently.", hi: "बार-बार बातचीत करें।", hin: "Frequently interact karein." },
    ],
    insight: {
      en: "Each baby develops at their own pace.",
      hi: "हर बच्चा अपनी गति से विकसित होता है।",
      hin: "Har baby apni pace par develop karta hai.",
    },
    reassure: {
      en: "Observe gently, avoid panic.",
      hi: "धीरे से देखें, घबराएँ नहीं।",
      hin: "Gently observe karein, panic mat karein.",
    },
  },
  {
    id: "separation-anxiety-infant",
    emoji: "🫂",
    title: { en: "Separation anxiety", hi: "अलग होने की चिंता", hin: "Separation anxiety" },
    description: { en: "Distress when parent leaves", hi: "माता-पिता के जाने पर परेशानी", hin: "Parent ke jaane par pareshaani" },
    reason: { en: "Attachment development.", hi: "लगाव का विकास।", hin: "Attachment ka development." },
    solution: [
      { en: "Practice short separations.", hi: "छोटे अलगाव का अभ्यास करें।", hin: "Chote separations practice karein." },
      { en: "Reassure before leaving.", hi: "जाने से पहले आश्वासन दें।", hin: "Jaane se pehle reassure karein." },
      { en: "Return with calm behavior.", hi: "शांत व्यवहार के साथ लौटें।", hin: "Calm behavior ke saath wapas aayein." },
    ],
    insight: { en: "This shows strong bonding.", hi: "यह मज़बूत लगाव दिखाता है।", hin: "Yeh strong bonding dikhata hai." },
    reassure: { en: "This phase is temporary.", hi: "यह दौर अस्थायी है।", hin: "Yeh phase temporary hai." },
  },
  {
    id: "overstimulation",
    emoji: "🌀",
    title: { en: "Overstimulation", hi: "अधिक उत्तेजना", hin: "Overstimulation" },
    description: { en: "Too much input at once", hi: "एक साथ बहुत कुछ", hin: "Ek saath bahut kuch" },
    reason: {
      en: "Too much noise, activity, or screen exposure.",
      hi: "बहुत ज़्यादा शोर, गतिविधि या स्क्रीन।",
      hin: "Bahut zyada noise, activity ya screen exposure.",
    },
    solution: [
      { en: "Reduce environment stimulation.", hi: "माहौल की उत्तेजना कम करें।", hin: "Environment stimulation kam karein." },
      { en: "Create a calm routine.", hi: "एक शांत दिनचर्या बनाएँ।", hin: "Calm routine banayein." },
      { en: "Use soft lighting.", hi: "मद्धम रोशनी रखें।", hin: "Soft lighting use karein." },
    ],
    insight: {
      en: "Babies process limited stimulation at a time.",
      hi: "बच्चे एक समय में सीमित उत्तेजना संभाल पाते हैं।",
      hin: "Babies ek time par limited stimulation process karte hain.",
    },
    reassure: {
      en: "A calm environment helps regulation.",
      hi: "शांत माहौल नियमन में मदद करता है।",
      hin: "Calm environment regulation mein help karta hai.",
    },
  },
];

export const INFANT_PROBLEM_IDS: ReadonlySet<string> = new Set(
  INFANT_PROBLEMS.map((p) => p.id),
);

export function isInfantProblemId(id: string | null | undefined): boolean {
  return !!id && INFANT_PROBLEM_IDS.has(id);
}

export function getInfantProblem(id: string): InfantProblem | undefined {
  return INFANT_PROBLEMS.find((p) => p.id === id);
}

export function pickLang(text: LocalizedText, lang: string | undefined): string {
  const code = normalizeLang(lang);
  return text[code];
}

export function normalizeLang(lang: string | undefined): Lang {
  if (!lang) return "en";
  const l = lang.toLowerCase();
  if (l === "hin" || l.startsWith("hinglish")) return "hin";
  if (l.startsWith("hi")) return "hi";
  return "en";
}
