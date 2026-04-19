export type LangKey = "en" | "hi" | "hinglish";

export type QuickBehaviorKey =
  | "tantrum"
  | "crying"
  | "not_listening"
  | "good_behavior"
  | "low_energy"
  | "sharing"
  | "calm";

export type TriggerKey =
  | "hunger"
  | "sleep"
  | "screen_time"
  | "environment"
  | "unknown";

export type BehaviorType = "positive" | "negative" | "neutral";

export interface QuickBehaviorDef {
  emoji: string;
  type: BehaviorType;
  color: string;
  label: Record<LangKey, string>;
  behaviorText: Record<LangKey, string>;
}

export const QUICK_BEHAVIORS: Record<QuickBehaviorKey, QuickBehaviorDef> = {
  tantrum: {
    emoji: "😡",
    type: "negative",
    color: "#EF4444",
    label: { en: "Tantrum", hi: "गुस्सा", hinglish: "Tantrum" },
    behaviorText: {
      en: "Tantrum / Meltdown",
      hi: "नखरे / गुस्सा",
      hinglish: "Tantrum / Meltdown",
    },
  },
  crying: {
    emoji: "😭",
    type: "negative",
    color: "#F59E0B",
    label: { en: "Crying", hi: "रोना", hinglish: "Rona" },
    behaviorText: {
      en: "Crying Episode",
      hi: "रोने का दौर",
      hinglish: "Crying episode",
    },
  },
  not_listening: {
    emoji: "🚫",
    type: "negative",
    color: "#8B5CF6",
    label: { en: "Not Listening", hi: "न मानना", hinglish: "Nahi Sun Raha" },
    behaviorText: {
      en: "Not Listening",
      hi: "बात नहीं मान रहा",
      hinglish: "Nahi sun raha",
    },
  },
  good_behavior: {
    emoji: "😊",
    type: "positive",
    color: "#10B981",
    label: { en: "Good Behavior", hi: "अच्छा व्यवहार", hinglish: "Acha Kiya" },
    behaviorText: {
      en: "Good Behavior",
      hi: "अच्छा व्यवहार",
      hinglish: "Acha behavior kiya",
    },
  },
  low_energy: {
    emoji: "😴",
    type: "neutral",
    color: "#6B7280",
    label: { en: "Low Energy", hi: "थका हुआ", hinglish: "Thaka Hua" },
    behaviorText: {
      en: "Low Energy / Tired",
      hi: "कम ऊर्जा / थका हुआ",
      hinglish: "Low energy / thaka hua",
    },
  },
  sharing: {
    emoji: "🤝",
    type: "positive",
    color: "#06B6D4",
    label: { en: "Sharing", hi: "बाँटना", hinglish: "Share Karna" },
    behaviorText: {
      en: "Shared with others",
      hi: "दूसरों के साथ बाँटा",
      hinglish: "Dusron ke saath share kiya",
    },
  },
  calm: {
    emoji: "😌",
    type: "positive",
    color: "#34D399",
    label: { en: "Calm", hi: "शांत", hinglish: "Shant Raha" },
    behaviorText: {
      en: "Stayed calm",
      hi: "शांत रहा",
      hinglish: "Shant raha",
    },
  },
};

export const TRIGGERS: Record<TriggerKey, { emoji: string; label: Record<LangKey, string> }> = {
  hunger: {
    emoji: "🍽️",
    label: { en: "Hunger", hi: "भूख", hinglish: "Bhookh" },
  },
  sleep: {
    emoji: "😴",
    label: { en: "Sleepy", hi: "नींद", hinglish: "Neend" },
  },
  screen_time: {
    emoji: "📱",
    label: { en: "Screen Time", hi: "स्क्रीन टाइम", hinglish: "Screen time" },
  },
  environment: {
    emoji: "🏠",
    label: { en: "Environment", hi: "माहौल", hinglish: "Environment" },
  },
  unknown: {
    emoji: "❓",
    label: { en: "Not sure", hi: "पता नहीं", hinglish: "Pata nahi" },
  },
};

export const SOLUTIONS: Record<QuickBehaviorKey, Record<LangKey, string[]>> = {
  tantrum: {
    en: [
      "Stay calm — your calm is contagious",
      "Get down to their eye level",
      "Name the emotion: 'I see you're frustrated'",
      "Give them a safe space to feel it out",
    ],
    hi: [
      "शांत रहें — आपकी शांति बच्चे को प्रभावित करती है",
      "उनके स्तर पर आएं और आँखें मिलाएं",
      "भावना को नाम दें: 'मैं देख रही हूँ तुम गुस्से में हो'",
      "उन्हें सुरक्षित महसूस कराएं",
    ],
    hinglish: [
      "Aap shant rahen — aapki shanti infectious hoti hai",
      "Unke level pe aa ke aankhein milayein",
      "Feeling ko naam dein: 'Main dekh rahi hoon tum frustrated ho'",
      "Unhe safe space do feel karne ke liye",
    ],
  },
  crying: {
    en: [
      "Validate their feelings — 'It's okay to cry'",
      "Offer a hug without forcing it",
      "Distract with a favorite activity or toy",
      "Check for hunger or tiredness first",
    ],
    hi: [
      "उनकी भावनाओं को स्वीकारें — 'रोना ठीक है'",
      "बिना दबाव के गले लगाने की पेशकश करें",
      "पसंदीदा खिलौने या गतिविधि से ध्यान भटकाएं",
      "पहले भूख या थकान जाँचें",
    ],
    hinglish: [
      "Unki feelings ko validate karein — 'Rona theek hai'",
      "Bina force kiye hug offer karein",
      "Favorite toy ya activity se distract karein",
      "Pehle bhookh ya thakan check karein",
    ],
  },
  not_listening: {
    en: [
      "Make eye contact before speaking",
      "Use short, clear instructions (one at a time)",
      "Get down to their level physically",
      "Give choices: 'Do you want to first or second?'",
    ],
    hi: [
      "बोलने से पहले आँख मिलाएं",
      "छोटे और स्पष्ट निर्देश दें (एक-एक करके)",
      "शारीरिक रूप से उनके स्तर पर आएं",
      "विकल्प दें: 'पहले यह करना है या वो?'",
    ],
    hinglish: [
      "Bolne se pehle aankhein milayein",
      "Chote aur clear instructions dein (ek ek karke)",
      "Unke level pe physically aa jaein",
      "Choice dein: 'Pehle yeh karna hai ya woh?'",
    ],
  },
  good_behavior: {
    en: [
      "Praise specifically: 'I loved how you shared your snack!'",
      "Give a small reward or sticker",
      "Tell someone else in front of them",
      "Write it in a 'win book' together",
    ],
    hi: [
      "विशेष रूप से प्रशंसा करें: 'मुझे बहुत अच्छा लगा कि तुमने स्नैक बाँटा!'",
      "छोटा इनाम या स्टिकर दें",
      "उनके सामने किसी और को बताएं",
      "मिलकर 'जीत की किताब' में लिखें",
    ],
    hinglish: [
      "Specific praise karein: 'Mujhe bahut achha laga ki tumne snack share kiya!'",
      "Chota reward ya sticker dein",
      "Unke samne kisi aur ko bataein",
      "Milkar 'win book' mein likhen",
    ],
  },
  low_energy: {
    en: [
      "Check sleep schedule and adjust bedtime",
      "Offer a nutritious snack",
      "Short outdoor walk can boost energy",
      "Reduce screen time before activity",
    ],
    hi: [
      "सोने का समय जाँचें और बदलें",
      "पौष्टिक नाश्ता दें",
      "थोड़ी बाहर की सैर ऊर्जा बढ़ा सकती है",
      "गतिविधि से पहले स्क्रीन टाइम कम करें",
    ],
    hinglish: [
      "Sone ka samay check karein aur adjust karein",
      "Nutritious snack dein",
      "Thodi bahar ki walk energy badhaa sakti hai",
      "Activity se pehle screen time kam karein",
    ],
  },
  sharing: {
    en: [
      "Celebrate the moment enthusiastically",
      "Add +10 reward points",
      "Model sharing yourself regularly",
    ],
    hi: [
      "उत्साहपूर्वक इस पल का जश्न मनाएं",
      "+10 इनाम अंक जोड़ें",
      "खुद भी नियमित रूप से बाँटने का उदाहरण दें",
    ],
    hinglish: [
      "Is moment ko enthusiastically celebrate karein",
      "+10 reward points jodein",
      "Khud bhi regularly sharing ka example dein",
    ],
  },
  calm: {
    en: [
      "Acknowledge: 'You handled that so well!'",
      "Note what helped them stay calm",
      "Reinforce with a sticker or hug",
    ],
    hi: [
      "स्वीकार करें: 'तुमने इसे बहुत अच्छे से संभाला!'",
      "नोट करें कि क्या चीज़ शांत रहने में मदद की",
      "स्टिकर या गले से सुदृढ़ करें",
    ],
    hinglish: [
      "Acknowledge karein: 'Tumne ise bahut achhe se handle kiya!'",
      "Note karein ki kya cheez shant rehne mein help ki",
      "Sticker ya hug se reinforce karein",
    ],
  },
};

export interface LogEntry {
  id: number;
  childId?: number;
  type: string;
  behavior: string;
  notes?: string | null;
  date: string;
  createdAt?: string;
}

function hourFromDate(d: string): number {
  return new Date(d).getHours();
}

function triggerFromNotes(notes: string | null | undefined): TriggerKey | null {
  if (!notes) return null;
  const m = notes.match(/\[trigger:(\w+)\]/);
  return m ? (m[1] as TriggerKey) : null;
}

export interface BehaviorInsight {
  text: string;
  icon: string;
}

export function buildAmyInsights(logs: LogEntry[], lang: LangKey): BehaviorInsight[] {
  const insights: BehaviorInsight[] = [];
  if (logs.length === 0) return insights;

  const negLogs = logs.filter((l) => l.type === "negative");
  const posLogs = logs.filter((l) => l.type === "positive");

  if (negLogs.length >= 2) {
    const hours = negLogs.map((l) => hourFromDate(l.createdAt ?? l.date));
    const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);
    const timeLabel =
      avgHour < 12
        ? lang === "en" ? "morning" : lang === "hi" ? "सुबह" : "subah"
        : avgHour < 17
        ? lang === "en" ? "afternoon" : lang === "hi" ? "दोपहर" : "dopahar"
        : lang === "en" ? "evening" : lang === "hi" ? "शाम" : "shaam";

    const insightText =
      lang === "en"
        ? `Challenging behaviors tend to happen in the ${timeLabel}. Consider adjusting routines around this time.`
        : lang === "hi"
        ? `चुनौतीपूर्ण व्यवहार ${timeLabel} में ज़्यादा दिखता है। इस समय की दिनचर्या बदलने की कोशिश करें।`
        : `Challenging behaviors ${timeLabel} mein zyada hoti hain. Is time ki routine adjust karein.`;
    insights.push({ text: insightText, icon: "🕐" });
  }

  const triggerCounts: Partial<Record<TriggerKey, number>> = {};
  logs.forEach((l) => {
    const t = triggerFromNotes(l.notes);
    if (t) triggerCounts[t] = (triggerCounts[t] ?? 0) + 1;
  });
  const topTrigger = (Object.entries(triggerCounts) as [TriggerKey, number][]).sort(
    (a, b) => b[1] - a[1]
  )[0];
  if (topTrigger && topTrigger[1] >= 2) {
    const tLabel = TRIGGERS[topTrigger[0]].label[lang];
    const t =
      lang === "en"
        ? `${tLabel} seems to be a common trigger. Watch for it and prepare in advance.`
        : lang === "hi"
        ? `${tLabel} एक सामान्य ट्रिगर लग रहा है। पहले से तैयार रहें।`
        : `${tLabel} ek common trigger lag raha hai. Pehle se taiyar rahein.`;
    insights.push({ text: t, icon: "⚡" });
  }

  const total = logs.length;
  const posRatio = posLogs.length / total;
  if (posRatio >= 0.6 && total >= 3) {
    const t =
      lang === "en"
        ? "Great week! Positive behaviors are dominating. Keep the momentum going."
        : lang === "hi"
        ? "बहुत अच्छा! सकारात्मक व्यवहार ज़्यादा हैं। इसी तरह जारी रखें।"
        : "Bahut achha! Positive behaviors zyada hain. Isi tarah chalte rahein.";
    insights.push({ text: t, icon: "🌟" });
  } else if (negLogs.length > posLogs.length && total >= 3) {
    const t =
      lang === "en"
        ? "Challenging days — try adding a calming activity before bedtime."
        : lang === "hi"
        ? "मुश्किल दिन हैं — सोने से पहले शांत गतिविधि आज़माएं।"
        : "Mushkil din hain — sone se pehle calming activity try karein.";
    insights.push({ text: t, icon: "💡" });
  }

  return insights;
}

export function computeScore(logs: LogEntry[]): number {
  if (logs.length === 0) return 50;
  const pos = logs.filter((l) => l.type === "positive").length;
  const neg = logs.filter((l) => l.type === "negative").length;
  const neu = logs.filter((l) => l.type === "neutral").length;
  const raw = (pos * 15 - neg * 8 + neu * 2) / Math.max(logs.length, 1);
  const norm = Math.min(100, Math.max(0, 50 + raw * 5));
  return Math.round(norm);
}

export function scoreLabel(score: number, lang: LangKey): string {
  if (score >= 80)
    return lang === "en" ? "Excellent 🌟" : lang === "hi" ? "बेहतरीन 🌟" : "Excellent 🌟";
  if (score >= 60)
    return lang === "en" ? "Good 👍" : lang === "hi" ? "अच्छा 👍" : "Achha 👍";
  if (score >= 40)
    return lang === "en" ? "Okay 😐" : lang === "hi" ? "ठीक 😐" : "Theek 😐";
  return lang === "en" ? "Needs attention 💙" : lang === "hi" ? "ध्यान दें 💙" : "Dhyan den 💙";
}

export const UI_LABELS: Record<LangKey, {
  quickLog: string;
  todaySummary: string;
  amyInsights: string;
  weeklyTrends: string;
  solutions: string;
  situationMode: string;
  loggedToday: string;
  positive: string;
  challenging: string;
  neutral: string;
  score: string;
  trigger: string;
  selectTrigger: string;
  tap1Log: string;
  childHelp: string;
  childAngry: string;
  childNotListening: string;
  noInsights: string;
  noDataYet: string;
  days: string[];
  pointsEarned: string;
}> = {
  en: {
    quickLog: "Quick Log",
    todaySummary: "Today's Summary",
    amyInsights: "Amy AI Insights",
    weeklyTrends: "Weekly Trends",
    solutions: "Solutions & Tips",
    situationMode: "Quick Help 🆘",
    loggedToday: "Logged today",
    positive: "Positive",
    challenging: "Challenging",
    neutral: "Neutral",
    score: "Score",
    trigger: "Trigger",
    selectTrigger: "What triggered it?",
    tap1Log: "Tap once to log instantly",
    childHelp: "Child crying",
    childAngry: "Child angry",
    childNotListening: "Not listening",
    noInsights: "Log a few behaviors to unlock Amy's pattern insights.",
    noDataYet: "No behaviors logged yet. Start tapping below!",
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    pointsEarned: "pts earned",
  },
  hi: {
    quickLog: "जल्दी लॉग करें",
    todaySummary: "आज का सारांश",
    amyInsights: "Amy AI की जानकारी",
    weeklyTrends: "साप्ताहिक रुझान",
    solutions: "सुझाव और उपाय",
    situationMode: "तुरंत मदद 🆘",
    loggedToday: "आज लॉग हुए",
    positive: "सकारात्मक",
    challenging: "चुनौतीपूर्ण",
    neutral: "सामान्य",
    score: "अंक",
    trigger: "कारण",
    selectTrigger: "क्या वजह रही?",
    tap1Log: "एक बार टैप करें — तुरंत लॉग हो जाएगा",
    childHelp: "बच्चा रो रहा है",
    childAngry: "बच्चा गुस्से में है",
    childNotListening: "नहीं सुन रहा",
    noInsights: "Amy के पैटर्न देखने के लिए कुछ व्यवहार लॉग करें।",
    noDataYet: "अभी तक कोई व्यवहार लॉग नहीं किया। नीचे टैप करें!",
    days: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
    pointsEarned: "अंक मिले",
  },
  hinglish: {
    quickLog: "Quick Log Karein",
    todaySummary: "Aaj ka Summary",
    amyInsights: "Amy AI Insights",
    weeklyTrends: "Weekly Trends",
    solutions: "Solutions aur Tips",
    situationMode: "Quick Help 🆘",
    loggedToday: "Aaj logged kiye",
    positive: "Positive",
    challenging: "Challenging",
    neutral: "Normal",
    score: "Score",
    trigger: "Trigger",
    selectTrigger: "Kya trigger tha?",
    tap1Log: "Ek tap mein log karein",
    childHelp: "Bacha ro raha hai",
    childAngry: "Bacha gusse mein hai",
    childNotListening: "Nahi sun raha",
    noInsights: "Amy ke pattern dekhne ke liye kuch behaviors log karein.",
    noDataYet: "Abhi tak koi behavior log nahi kiya. Neeche tap karein!",
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    pointsEarned: "pts mile",
  },
};

export const SITUATION_HELP: Record<
  "crying" | "angry" | "not_listening",
  Record<LangKey, string[]>
> = {
  crying: {
    en: [
      "Kneel to their level and make gentle eye contact",
      "Say: 'I'm here with you, it's okay to cry'",
      "Offer a quiet hug — don't try to stop the tears",
    ],
    hi: [
      "उनके स्तर पर झुकें और नरम आँख मिलाएं",
      "कहें: 'मैं यहाँ हूँ, रोना ठीक है'",
      "शांत गले मिलें — आँसू रोकने की कोशिश न करें",
    ],
    hinglish: [
      "Unke level pe jhuken aur gentle aankhein milayen",
      "Kahein: 'Main yahan hoon, rona theek hai'",
      "Quiet hug offar karein — aansu rokne ki koshish mat karein",
    ],
  },
  angry: {
    en: [
      "Do NOT match their energy — stay slow and calm",
      "Remove triggers if possible (screen, toy conflict)",
      "After calm: talk about what happened",
    ],
    hi: [
      "उनकी ऊर्जा से मेल मत खाएं — धीमे और शांत रहें",
      "अगर संभव हो तो ट्रिगर हटाएं (स्क्रीन, खिलौना संघर्ष)",
      "शांत होने के बाद: बात करें कि क्या हुआ",
    ],
    hinglish: [
      "Unki energy se match mat karein — slow aur calm rahein",
      "Agar possible ho to triggers hatayein (screen, toy conflict)",
      "Shant hone ke baad: baat karein kya hua",
    ],
  },
  not_listening: {
    en: [
      "Pause everything — get on their physical level",
      "Use their name once, then wait for eye contact",
      "Give a binary choice: 'Shoes first or jacket first?'",
    ],
    hi: [
      "सब कुछ रोकें — उनके शारीरिक स्तर पर आएं",
      "एक बार नाम लें, फिर आँख मिलने का इंतज़ार करें",
      "दो विकल्प दें: 'पहले जूते या पहले जैकेट?'",
    ],
    hinglish: [
      "Sab kuch rokein — unke physical level pe aayein",
      "Ek baar naam lein, phir aankhein milne ka intezaar karein",
      "Do choice dein: 'Pehle joote ya pehle jacket?'",
    ],
  },
};

export const QUICK_BEHAVIOR_KEYS: QuickBehaviorKey[] = [
  "tantrum",
  "crying",
  "not_listening",
  "good_behavior",
  "low_energy",
  "sharing",
  "calm",
];

export const TRIGGER_KEYS: TriggerKey[] = [
  "hunger",
  "sleep",
  "screen_time",
  "environment",
  "unknown",
];

export function encodeTriggerNote(trigger: TriggerKey, extraNote?: string): string {
  return `[trigger:${trigger}]${extraNote ? " " + extraNote : ""}`;
}

export function decodeTrigger(notes: string | null | undefined): TriggerKey | null {
  return triggerFromNotes(notes);
}
