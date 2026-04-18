import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
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

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      hinglish: { translation: hinglish },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "hi", "hinglish"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEY,
      caches: ["localStorage"],
    },
    react: { useSuspense: false },
  });

export function setLanguage(code: LanguageCode) {
  i18n.changeLanguage(code);
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
}

export default i18n;
