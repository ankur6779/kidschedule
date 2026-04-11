// ─────────────────────────────────────────────────────────────
// AmyNest Voice System — Hindi + English, Female / Male
// Zero-cost: uses browser speechSynthesis only
// ─────────────────────────────────────────────────────────────

const KEY_ENABLED   = "amynest_voice_enabled";
const KEY_LANG      = "amynest_voice_lang";     // "en" | "hi"
const KEY_GENDER    = "amynest_voice_gender";   // "female" | "male"
const KEY_VOICE_NAME = "amynest_voice_name";    // specific voice name override

export type VoiceLang   = "en" | "hi";
export type VoiceGender = "female" | "male";

export interface VoiceSettings {
  enabled: boolean;
  lang: VoiceLang;
  gender: VoiceGender;
  voiceName: string | null;
}

export function getVoiceSettings(): VoiceSettings {
  return {
    enabled:   localStorage.getItem(KEY_ENABLED) === "true",
    lang:      (localStorage.getItem(KEY_LANG) as VoiceLang)     ?? "hi",
    gender:    (localStorage.getItem(KEY_GENDER) as VoiceGender) ?? "female",
    voiceName: localStorage.getItem(KEY_VOICE_NAME),
  };
}

export function saveVoiceSettings(patch: Partial<VoiceSettings>): void {
  if (patch.enabled   !== undefined) localStorage.setItem(KEY_ENABLED, patch.enabled ? "true" : "false");
  if (patch.lang      !== undefined) localStorage.setItem(KEY_LANG, patch.lang);
  if (patch.gender    !== undefined) localStorage.setItem(KEY_GENDER, patch.gender);
  if (patch.voiceName !== undefined) {
    if (patch.voiceName === null) localStorage.removeItem(KEY_VOICE_NAME);
    else localStorage.setItem(KEY_VOICE_NAME, patch.voiceName);
  }
}

// Legacy compat exports
export function isVoiceEnabled(): boolean           { return getVoiceSettings().enabled; }
export function setVoiceEnabled(val: boolean): void { saveVoiceSettings({ enabled: val }); }
export function getSavedVoiceName(): string | null  { return getVoiceSettings().voiceName; }
export function saveVoiceName(name: string): void   { saveVoiceSettings({ voiceName: name }); }

// ─── Voice loading ────────────────────────────────────────────

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) { resolve([]); return; }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    const onChanged = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onChanged);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", onChanged);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onChanged);
      resolve(window.speechSynthesis.getVoices());
    }, 2500);
  });
}

// ─── Gender detection ─────────────────────────────────────────

const FEMALE_KEYWORDS = [
  "female", "woman", "girl", "zira", "hazel", "susan", "karen",
  "samantha", "victoria", "moira", "fiona", "tessa", "veena",
  "priya", "aditi", "heera", "lekha", "swara",
];
const MALE_KEYWORDS = [
  "male", "man", "guy", "david", "james", "daniel", "george",
  "rishi", "hemant", "kalpana", "prabhat",
];

function isFemale(v: SpeechSynthesisVoice): boolean {
  const name = v.name.toLowerCase();
  return FEMALE_KEYWORDS.some((k) => name.includes(k));
}
function isMale(v: SpeechSynthesisVoice): boolean {
  const name = v.name.toLowerCase();
  return MALE_KEYWORDS.some((k) => name.includes(k));
}

// ─── Labeled voice list for UI ───────────────────────────────

export interface LabeledVoice {
  voice: SpeechSynthesisVoice;
  label: string;
}

export async function getVoicesForLang(lang: VoiceLang): Promise<LabeledVoice[]> {
  const voices = await loadVoices();
  const hindi   = voices.filter((v) => v.lang.toLowerCase().startsWith("hi"));
  const enIN    = voices.filter((v) => v.lang.toLowerCase() === "en-in");
  const enOther = voices.filter((v) => v.lang.toLowerCase().startsWith("en") && v.lang.toLowerCase() !== "en-in");

  let pool: SpeechSynthesisVoice[];
  if (lang === "hi") {
    pool = hindi.length > 0 ? hindi : [...enIN, ...enOther];
  } else {
    pool = [...enIN, ...enOther];
  }

  // Sort: female first, then Indian variants, then local
  const sorted = [...pool].sort((a, b) => {
    const scoreOf = (v: SpeechSynthesisVoice) => {
      let s = 0;
      if (isFemale(v)) s += 20;
      const l = v.lang.toLowerCase();
      if (l === "en-in" || l.startsWith("hi")) s += 10;
      if (v.localService) s += 5;
      return s;
    };
    return scoreOf(b) - scoreOf(a);
  });

  // Build human-readable labels
  const fCount: Record<string, number> = {};
  const mCount: Record<string, number> = {};
  const uCount: Record<string, number> = {};

  return sorted.map((v) => {
    const l = v.lang.toLowerCase();
    const langLabel = l.startsWith("hi") ? "Hindi" : l === "en-in" ? "English Indian" : "English";
    let genderLabel: string;
    if (isFemale(v)) {
      fCount[langLabel] = (fCount[langLabel] ?? 0) + 1;
      genderLabel = `Female${fCount[langLabel] > 1 ? " " + fCount[langLabel] : ""}`;
    } else if (isMale(v)) {
      mCount[langLabel] = (mCount[langLabel] ?? 0) + 1;
      genderLabel = `Male${mCount[langLabel] > 1 ? " " + mCount[langLabel] : ""}`;
    } else {
      uCount[langLabel] = (uCount[langLabel] ?? 0) + 1;
      genderLabel = `Voice ${uCount[langLabel]}`;
    }
    return { voice: v, label: `${langLabel} ${genderLabel}` };
  });
}

// Legacy compat
export async function getEnglishVoices(): Promise<SpeechSynthesisVoice[]> {
  const voices = await loadVoices();
  return voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
}

// ─── Voice picker ─────────────────────────────────────────────

async function pickVoice(settings: VoiceSettings): Promise<SpeechSynthesisVoice | null> {
  const voices = await loadVoices();
  if (!voices.length) return null;

  // Honour a specific saved voice name first
  if (settings.voiceName) {
    const saved = voices.find((v) => v.name === settings.voiceName);
    if (saved) return saved;
  }

  const hindi   = voices.filter((v) => v.lang.toLowerCase().startsWith("hi"));
  const enIN    = voices.filter((v) => v.lang.toLowerCase() === "en-in");
  const enOther = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));

  const genderOk = (v: SpeechSynthesisVoice) =>
    settings.gender === "female" ? (isFemale(v) || !isMale(v)) : (isMale(v) || !isFemale(v));

  const priority =
    settings.lang === "hi"
      ? [
          hindi.filter(genderOk),
          hindi,
          enIN.filter(genderOk),
          enIN,
          enOther.filter(genderOk),
          voices,
        ]
      : [
          enIN.filter(genderOk),
          enIN,
          enOther.filter(genderOk),
          enOther,
          voices.filter(genderOk),
          voices,
        ];

  for (const pool of priority) {
    if (pool.length > 0) return pool[0];
  }
  return null;
}

// ─── Core speak ───────────────────────────────────────────────

export async function speak(text: string): Promise<void> {
  const settings = getVoiceSettings();
  if (!settings.enabled) return;
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const voice = await pickVoice(settings);

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate   = 0.88;
  utter.pitch  = 1.0;
  utter.volume = 1.0;
  if (voice) {
    utter.voice = voice;
    utter.lang  = voice.lang;
  } else {
    utter.lang = settings.lang === "hi" ? "hi-IN" : "en-IN";
  }
  window.speechSynthesis.speak(utter);
}

// ─── Task announcements ───────────────────────────────────────

const HINDI_MSGS = [
  (n: string, t: string) => `${n}, अब समय है ${t} का! चलो शुरू करते हैं!`,
  (n: string, t: string) => `हाय ${n}! ${t} का समय आ गया।`,
  (n: string, t: string) => `${n}, ${t} करने का वक़्त है! तैयार हो जाओ!`,
];
const ENGLISH_MSGS = [
  (n: string, t: string) => `Hey ${n}! Time for ${t}. You've got this!`,
  (n: string, t: string) => `${n}, it's ${t} time! Let's go!`,
  (n: string, t: string) => `Hi ${n}! Your next activity is ${t}. Ready?`,
];

export async function announceCurrentTask(childName: string, activity: string): Promise<void> {
  const settings = getVoiceSettings();
  if (!settings.enabled) return;
  const msgs = settings.lang === "hi" ? HINDI_MSGS : ENGLISH_MSGS;
  const msg   = msgs[Math.floor(Math.random() * msgs.length)](childName, activity);
  await speak(msg);
}
