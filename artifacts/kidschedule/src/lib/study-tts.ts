// Thin wrapper around the Web Speech API used by Smart Study Zone.
// Falls back silently if the browser doesn't expose speech synthesis
// (e.g. some embedded webviews).

let cachedHindiVoice: SpeechSynthesisVoice | null | undefined;

function pickHindiVoice(): SpeechSynthesisVoice | null {
  if (cachedHindiVoice !== undefined) return cachedHindiVoice;
  if (typeof window === "undefined" || !window.speechSynthesis) {
    cachedHindiVoice = null;
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  const hi = voices.find((v) => v.lang?.toLowerCase().startsWith("hi"));
  cachedHindiVoice = hi ?? null;
  return cachedHindiVoice;
}

export function speak(text: string, opts?: { lang?: string; rate?: number }) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts?.lang ?? "en-IN";
    u.rate = opts?.rate ?? 0.95;
    if (u.lang.startsWith("hi")) {
      const v = pickHindiVoice();
      if (v) u.voice = v;
    }
    window.speechSynthesis.speak(u);
  } catch {
    // best effort, ignore
  }
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
  }
}

export function ttsAvailable(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}
