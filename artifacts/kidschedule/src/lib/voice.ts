const VOICE_KEY = "amynest_voice_enabled";

export function isVoiceEnabled(): boolean {
  return localStorage.getItem(VOICE_KEY) === "true";
}

export function setVoiceEnabled(val: boolean): void {
  localStorage.setItem(VOICE_KEY, val ? "true" : "false");
}

export function speak(text: string): void {
  if (!isVoiceEnabled()) return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  utter.pitch = 1.1;
  utter.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female"))
    || voices.find((v) => v.lang.startsWith("en"))
    || voices[0];
  if (preferred) utter.voice = preferred;
  window.speechSynthesis.speak(utter);
}

export function announceCurrentTask(childName: string, activity: string): void {
  speak(`Hey ${childName}, it's time for ${activity}! Let's go!`);
}
