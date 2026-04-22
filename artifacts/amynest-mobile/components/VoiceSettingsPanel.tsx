import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { brand } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";

export const VOICE_KEY = "amynest.voice_settings.v1";

export type VoiceLang = "en-IN" | "hi-IN";
export type VoiceGender = "female" | "male";

export interface VoiceSettings {
  enabled: boolean;
  lang: VoiceLang;
  gender: VoiceGender;
  voiceName: string | null;
}

const DEFAULTS: VoiceSettings = {
  enabled: false,
  lang: "en-IN",
  gender: "female",
  voiceName: null,
};

export async function loadVoiceSettings(): Promise<VoiceSettings> {
  try {
    const raw = await AsyncStorage.getItem(VOICE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULTS.enabled,
      lang: parsed.lang === "hi-IN" || parsed.lang === "en-IN" ? parsed.lang : DEFAULTS.lang,
      gender: parsed.gender === "male" ? "male" : "female",
      voiceName: typeof parsed.voiceName === "string" ? parsed.voiceName : null,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveVoiceSettings(s: VoiceSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(VOICE_KEY, JSON.stringify(s));
  } catch {/* ignore */}
}

// Heuristic: classify a voice as female/male/unknown based on identifier name.
const FEMALE_HINTS = ["female", "samantha", "karen", "victoria", "moira", "tessa", "fiona", "ava", "allison", "susan", "zira", "hazel", "swara", "lekha", "veena", "kalpana", "aditi", "neeraj-female"];
const MALE_HINTS = ["male", "daniel", "alex", "fred", "tom", "oliver", "thomas", "david", "mark", "ravi", "rishi", "neeraj", "sundar"];
function classifyGender(name: string, identifier?: string): VoiceGender | null {
  const blob = `${name} ${identifier ?? ""}`.toLowerCase();
  if (FEMALE_HINTS.some((h) => blob.includes(h))) return "female";
  if (MALE_HINTS.some((h) => blob.includes(h))) return "male";
  return null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onChange: (s: VoiceSettings) => void;
}

export default function VoiceSettingsPanel({ visible, onClose, settings, onChange }: Props) {
  const c = useColors();
  const [voices, setVoices] = useState<Speech.Voice[]>([]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    Speech.getAvailableVoicesAsync()
      .then((vs) => { if (!cancelled) setVoices(vs ?? []); })
      .catch(() => { if (!cancelled) setVoices([]); });
    return () => { cancelled = true; };
  }, [visible]);

  // Show all voices that match the chosen language. Gender is a soft hint —
  // voices whose names match the preferred gender are sorted to the top, but
  // nothing is hidden, so users always see every available voice.
  const filtered = useMemo(() => {
    const langPrefix = settings.lang.split("-")[0]; // "en" or "hi"
    const matching = voices.filter((v) => (v.language || "").toLowerCase().startsWith(langPrefix));
    const score = (v: Speech.Voice) => {
      const g = classifyGender(v.name ?? "", v.identifier);
      if (g === settings.gender) return 0;
      if (g === null) return 1;
      return 2;
    };
    return [...matching].sort((a, b) => score(a) - score(b));
  }, [voices, settings.lang, settings.gender]);

  const update = (patch: Partial<VoiceSettings>) => {
    const next = { ...settings, ...patch };
    onChange(next);
    void saveVoiceSettings(next);
    Haptics.selectionAsync().catch(() => {});
  };

  const previewVoice = (voiceName: string) => {
    try {
      Speech.stop();
      const msg = settings.lang === "hi-IN"
        ? "नमस्ते! मैं आपकी आवाज़ हूँ।"
        : "Hi! This is your voice preview.";
      Speech.speak(msg, { language: settings.lang, voice: voiceName, pitch: 1.0, rate: 0.9 });
    } catch {/* ignore */}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: c.card, borderColor: c.border }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.foreground }]}>🎙 Voice Settings</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={c.foreground} />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ paddingBottom: 8 }}>
            {/* Enable toggle */}
            <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>READ-ALOUD</Text>
            <Pressable
              onPress={() => update({ enabled: !settings.enabled })}
              style={[styles.toggleRow, { backgroundColor: c.muted, borderColor: c.border }]}
            >
              <Ionicons
                name={settings.enabled ? "volume-high" : "volume-mute"}
                size={20}
                color={settings.enabled ? brand.violet500 : c.mutedForeground}
              />
              <Text style={[styles.toggleLabel, { color: c.foreground }]}>
                {settings.enabled ? "On — Amy will speak the current task" : "Off"}
              </Text>
              <View style={[styles.switch, { backgroundColor: settings.enabled ? brand.violet500 : c.border }]}>
                <View style={[styles.switchThumb, { transform: [{ translateX: settings.enabled ? 18 : 0 }] }]} />
              </View>
            </Pressable>

            {settings.enabled && (
              <>
                {/* Language */}
                <Text style={[styles.sectionLabel, { color: c.mutedForeground, marginTop: 16 }]}>LANGUAGE</Text>
                <View style={styles.rowGap}>
                  {(["en-IN", "hi-IN"] as VoiceLang[]).map((lang) => {
                    const active = settings.lang === lang;
                    return (
                      <Pressable
                        key={lang}
                        onPress={() => update({ lang, voiceName: null })}
                        style={[styles.chip, { borderColor: active ? brand.violet500 : c.border, backgroundColor: active ? brand.violet500 : "transparent" }]}
                      >
                        <Text style={[styles.chipText, { color: active ? "#fff" : c.foreground }]}>
                          {lang === "en-IN" ? "🇬🇧 English" : "🇮🇳 Hindi"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Gender */}
                <Text style={[styles.sectionLabel, { color: c.mutedForeground, marginTop: 16 }]}>VOICE GENDER</Text>
                <View style={styles.rowGap}>
                  {(["female", "male"] as VoiceGender[]).map((g) => {
                    const active = settings.gender === g;
                    return (
                      <Pressable
                        key={g}
                        onPress={() => update({ gender: g, voiceName: null })}
                        style={[styles.chip, { borderColor: active ? brand.violet500 : c.border, backgroundColor: active ? brand.violet500 : "transparent" }]}
                      >
                        <Text style={[styles.chipText, { color: active ? "#fff" : c.foreground }]}>
                          {g === "female" ? "👩 Female" : "👨 Male"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Voice picker */}
                <Text style={[styles.sectionLabel, { color: c.mutedForeground, marginTop: 16 }]}>SELECT VOICE</Text>
                {filtered.length === 0 ? (
                  <Text style={[styles.emptyVoices, { color: c.mutedForeground }]}>
                    No matching voices on this device. Try switching language or use the system default.
                  </Text>
                ) : (
                  <View style={[styles.voiceList, { borderColor: c.border }]}>
                    <Pressable
                      onPress={() => update({ voiceName: null })}
                      style={[styles.voiceRow, settings.voiceName === null && { backgroundColor: c.muted }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.voiceName, { color: c.foreground }]}>System default</Text>
                        <Text style={[styles.voiceMeta, { color: c.mutedForeground }]}>Uses {settings.lang}</Text>
                      </View>
                      {settings.voiceName === null && <Ionicons name="checkmark" size={18} color={brand.violet500} />}
                    </Pressable>
                    {filtered.map((v) => {
                      const selected = settings.voiceName === v.identifier;
                      return (
                        <View key={v.identifier} style={[styles.voiceRow, selected && { backgroundColor: c.muted }]}>
                          <Pressable style={{ flex: 1 }} onPress={() => update({ voiceName: v.identifier })}>
                            <Text style={[styles.voiceName, { color: c.foreground }]} numberOfLines={1}>
                              {v.name || v.identifier}
                            </Text>
                            <Text style={[styles.voiceMeta, { color: c.mutedForeground }]}>
                              {v.language}{v.quality ? ` · ${v.quality}` : ""}
                            </Text>
                          </Pressable>
                          <Pressable onPress={() => previewVoice(v.identifier)} hitSlop={8} style={styles.playBtn}>
                            <Ionicons name="play-circle" size={22} color={brand.violet500} />
                          </Pressable>
                          {selected && <Ionicons name="checkmark" size={18} color={brand.violet500} style={{ marginLeft: 6 }} />}
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <Text style={[styles.footer, { color: c.mutedForeground }]}>Saved automatically 💾</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 20 },
  sheet: { borderRadius: 24, borderWidth: 1, padding: 18, maxWidth: 440, width: "100%", alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  title: { fontSize: 16, fontWeight: "800" },
  sectionLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginTop: 8, marginBottom: 8 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  toggleLabel: { flex: 1, fontSize: 13, fontWeight: "600" },
  switch: { width: 38, height: 22, borderRadius: 11, padding: 2, justifyContent: "center" },
  switchThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff" },
  rowGap: { flexDirection: "row", gap: 8 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: 14, borderWidth: 2, alignItems: "center" },
  chipText: { fontSize: 13, fontWeight: "700" },
  voiceList: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  voiceRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, gap: 8 },
  voiceName: { fontSize: 13, fontWeight: "600" },
  voiceMeta: { fontSize: 10, marginTop: 2 },
  playBtn: { padding: 4 },
  emptyVoices: { fontSize: 12, textAlign: "center", paddingVertical: 12 },
  footer: { fontSize: 10, textAlign: "center", marginTop: 10 },
});
