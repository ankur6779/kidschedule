import AsyncStorage from "@react-native-async-storage/async-storage";

export const TUTORIAL_SEEN_KEY = "amynest.tutorial_seen.v1";

type Status = "checking" | "needed" | "done";

let status: Status = "checking";
const listeners = new Set<(s: Status) => void>();

function emit() {
  for (const l of listeners) l(status);
}

export function getTutorialStatus(): Status {
  return status;
}

export function subscribeTutorialStatus(fn: (s: Status) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export async function loadTutorialStatus(): Promise<Status> {
  try {
    const v = await AsyncStorage.getItem(TUTORIAL_SEEN_KEY);
    status = v === "1" ? "done" : "needed";
  } catch {
    // Fail open — never block the app on storage errors.
    status = "done";
  }
  emit();
  return status;
}

export async function markTutorialSeen(): Promise<void> {
  status = "done";
  emit();
  try {
    await AsyncStorage.setItem(TUTORIAL_SEEN_KEY, "1");
  } catch (err) {
    console.error("[tutorial] failed to persist seen flag", err);
  }
}
