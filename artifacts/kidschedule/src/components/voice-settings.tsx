import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import {
  getVoiceSettings,
  saveVoiceSettings,
  getVoicesForLang,
  setVoiceEnabled,
  type VoiceLang,
  type VoiceGender,
  type LabeledVoice,
} from "@/lib/voice";
import { useToast } from "@/hooks/use-toast";

interface VoiceSettingsPanelProps {
  onToggle?: (enabled: boolean) => void;
}

export function VoiceSettingsPanel({ onToggle }: VoiceSettingsPanelProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState(() => getVoiceSettings());
  const [voices, setVoices] = useState<LabeledVoice[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getVoicesForLang(settings.lang).then(setVoices);
  }, [settings.lang]);

  const update = (patch: Partial<typeof settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveVoiceSettings(patch);
    if (patch.enabled !== undefined) {
      onToggle?.(patch.enabled);
    }
  };

  const handleToggle = () => {
    const next = !settings.enabled;
    update({ enabled: next });
    setVoiceEnabled(next);
    toast({ title: next ? "🔊 Voice reminders on!" : "🔇 Voice reminders off" });
    if (!next) setOpen(false);
  };

  return (
    <div className="relative flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        className={`rounded-full gap-2 ${settings.enabled ? "bg-violet-50 border-violet-300 text-violet-700" : ""}`}
      >
        {settings.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        {settings.enabled ? "Voice On" : "Voice"}
      </Button>

      {settings.enabled && (
        <button
          title="Voice settings"
          onClick={() => setOpen((o) => !o)}
          className="p-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors text-[11px] font-bold"
        >
          🎙
        </button>
      )}

      {open && settings.enabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-9 right-0 z-50 bg-card border border-border rounded-2xl shadow-xl w-72 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground">🎙 Voice Settings</p>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Language toggle */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Language
              </p>
              <div className="flex gap-2">
                {(["en", "hi"] as VoiceLang[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => update({ lang, voiceName: null })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                      settings.lang === lang
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white text-violet-700 border-violet-200 hover:border-violet-400"
                    }`}
                  >
                    {lang === "en" ? "🇬🇧 English" : "🇮🇳 Hindi"}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender toggle */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Voice Gender
              </p>
              <div className="flex gap-2">
                {(["female", "male"] as VoiceGender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => update({ gender: g, voiceName: null })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                      settings.gender === g
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400"
                    }`}
                  >
                    {g === "female" ? "👩 Female" : "👨 Male"}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice list */}
            {voices.length > 0 ? (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Select Voice
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-border p-1">
                  {voices.map(({ voice, label }) => {
                    const isSelected = settings.voiceName === voice.name;
                    return (
                      <button
                        key={voice.name}
                        onClick={() => {
                          update({ voiceName: voice.name });
                          toast({ title: `🎙 Voice: ${label}` });
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${
                          isSelected
                            ? "bg-violet-100 text-violet-800 font-bold border border-violet-300"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold leading-tight">{label}</p>
                            <p className="text-[9px] text-muted-foreground">
                              {voice.lang}{voice.localService ? " · local" : ""}
                            </p>
                          </div>
                          {isSelected && <span className="text-violet-600 text-sm">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-1">
                No {settings.lang === "hi" ? "Hindi" : "English"} voices found on this device.
                <br />Try switching language.
              </p>
            )}

            <p className="text-[10px] text-muted-foreground text-center border-t border-border pt-2">
              Preferences saved automatically 💾
            </p>
          </div>
        </>
      )}
    </div>
  );
}
