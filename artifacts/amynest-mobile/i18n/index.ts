import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "./en.json";
import hi from "./hi.json";
import hinglish from "./hinglish.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "hinglish", label: "Hinglish", native: "Hinglish" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

const STORAGE_KEY = "amynest:language";

function detectInitialLanguage(): LanguageCode {
  try {
    const locales = Localization.getLocales();
    const code = locales?.[0]?.languageCode;
    if (code === "hi") return "hi";
  } catch { /* ignore */ }
  return "en";
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      hinglish: { translation: hinglish },
    },
    lng: detectInitialLanguage(),
    fallbackLng: "en",
    supportedLngs: ["en", "hi", "hinglish"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    compatibilityJSON: "v4",
  });

// Hydrate stored language asynchronously
AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
  if (stored && ["en", "hi", "hinglish"].includes(stored) && stored !== i18n.language) {
    i18n.changeLanguage(stored);
  }
}).catch(() => { /* ignore */ });

export async function setLanguage(code: LanguageCode) {
  await i18n.changeLanguage(code);
  try { await AsyncStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
}

export default i18n;
