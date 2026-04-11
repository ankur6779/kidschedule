const VOICE_ENABLED_KEY = "amynest_voice_enabled";
const VOICE_NAME_KEY = "amynest_voice_name";

export function isVoiceEnabled(): boolean {
  return localStorage.getItem(VOICE_ENABLED_KEY) === "true";
}

export function setVoiceEnabled(val: boolean): void {
  localStorage.setItem(VOICE_ENABLED_KEY, val ? "true" : "false");
}

export function getSavedVoiceName(): string | null {
  return localStorage.getItem(VOICE_NAME_KEY);
}

export function saveVoiceName(name: string): void {
  localStorage.setItem(VOICE_NAME_KEY, name);
}

// Scores a voice — higher = better preference
function scoreVoice(v: SpeechSynthesisVoice): number {
  let score = 0;
  const lang = v.lang.toLowerCase();
  const name = v.name.toLowerCase();

  // Prefer English voices
  if (lang.startsWith("en")) score += 10;

  // Strongly prefer Indian English
  if (lang === "en-in" || lang.startsWith("en-in")) score += 50;

  // Prefer female-sounding voices
  const femaleIndicators = ["female", "woman", "girl", "zira", "hazel", "susan", "karen",
    "samantha", "victoria", "moira", "fiona", "tessa", "veena", "priya", "aditi", "heera"];
  if (femaleIndicators.some((f) => name.includes(f))) score += 30;

  // Slight preference for local voices
  if (v.localService) score += 5;

  return score;
}

// Loads voices — handles the async nature of getVoices() across browsers
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) { resolve([]); return; }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }

    // Chrome fires voiceschanged event when voices are ready
    const onChanged = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onChanged);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", onChanged);

    // Fallback timeout in case the event never fires
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onChanged);
      resolve(window.speechSynthesis.getVoices());
    }, 2000);
  });
}

// Pick the best voice according to priority, or the saved preference
function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const savedName = getSavedVoiceName();
  if (savedName) {
    const saved = voices.find((v) => v.name === savedName);
    if (saved) return saved;
  }

  // Sort by score descending, pick top
  const sorted = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return sorted[0] ?? null;
}

// Main speak function — async-safe
export async function speak(text: string): Promise<void> {
  if (!isVoiceEnabled()) return;
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const voices = await loadVoices();
  const voice = pickBestVoice(voices);

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.92;
  utter.pitch = 1.05;
  utter.volume = 1;
  if (voice) utter.voice = voice;

  window.speechSynthesis.speak(utter);
}

// Announce the current task in a warm, friendly message
export function announceCurrentTask(childName: string, activity: string): void {
  const messages = [
    `Hey ${childName}! Time to ${activity}. You've got this!`,
    `${childName}, it's time for ${activity}. Let's do it!`,
    `Hi ${childName}! Your next task is ${activity}. Ready?`,
    `Hey ${childName}, it's ${activity} time! Let's go!`,
  ];
  const msg = messages[Math.floor(Math.random() * messages.length)];
  speak(msg);
}

// Get all English voices sorted by preference score (for the selector UI)
export async function getEnglishVoices(): Promise<SpeechSynthesisVoice[]> {
  const voices = await loadVoices();
  return voices
    .filter((v) => v.lang.toLowerCase().startsWith("en"))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
}
