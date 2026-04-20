import React from "react";
import {
  Modal, View, Text, StyleSheet, Pressable, ScrollView,
  TouchableOpacity, Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, SlideInDown, SlideOutDown } from "react-native-reanimated";
import SlideToComplete from "./SlideToComplete";

type ItemStatus = "pending" | "completed" | "skipped" | "delayed";
export type RoutineItemLike = {
  time: string;
  activity: string;
  duration: number;
  category: string;
  notes?: string;
  status?: ItemStatus;
  skipReason?: string;
};

const SCREEN_H = Dimensions.get("window").height;

interface Props {
  item: RoutineItemLike | null;
  visible: boolean;
  isInteractive?: boolean;
  onClose: () => void;
  onComplete: () => void;
  onDelay: (mins: number) => void;
  onSkip: () => void;
  onReopen: () => void; // mark as pending again
}

const CATEGORY_ICON: Record<string, { icon: keyof typeof Ionicons.glyphMap; gradient: readonly [string, string] }> = {
  morning:  { icon: "sunny",       gradient: ["#F59E0B", "#FB923C"] as const },
  meal:     { icon: "restaurant",  gradient: ["#F97316", "#F43F5E"] as const },
  tiffin:   { icon: "fast-food",   gradient: ["#FB923C", "#EF4444"] as const },
  snack:    { icon: "ice-cream",   gradient: ["#FACC15", "#F97316"] as const },
  school:   { icon: "school",      gradient: ["#3B82F6", "#6366F1"] as const },
  homework: { icon: "create",      gradient: ["#6366F1", "#8B5CF6"] as const },
  reading:  { icon: "book",        gradient: ["#8B5CF6", "#EC4899"] as const },
  exercise: { icon: "fitness",     gradient: ["#10B981", "#059669"] as const },
  play:     { icon: "happy",       gradient: ["#EC4899", "#A855F7"] as const },
  bonding:  { icon: "heart",       gradient: ["#F472B6", "#EC4899"] as const },
  hygiene:  { icon: "water",       gradient: ["#22D3EE", "#3B82F6"] as const },
  travel:   { icon: "car",         gradient: ["#0EA5E9", "#6366F1"] as const },
  screen:   { icon: "tv",          gradient: ["#64748B", "#475569"] as const },
  sleep:    { icon: "moon",        gradient: ["#6366F1", "#1E1B4B"] as const },
  "wind-down": { icon: "cloud-outline", gradient: ["#7C3AED", "#1E1B4B"] as const },
};

function pickCategory(category = "") {
  const k = Object.keys(CATEGORY_ICON).find((x) => category.toLowerCase().includes(x));
  return k ? CATEGORY_ICON[k] : { icon: "ellipse" as const, gradient: ["#7B3FF2", "#FF4ECD"] as const };
}

function statusBadge(status: ItemStatus) {
  switch (status) {
    case "completed": return { text: "✓ Done",   bg: "rgba(34,197,94,0.85)" };
    case "skipped":   return { text: "Skipped",   bg: "rgba(100,116,139,0.85)" };
    case "delayed":   return { text: "⏱ Delayed", bg: "rgba(245,158,11,0.85)" };
    default:          return null;
  }
}

export default function RoutineItemModal({
  item, visible, isInteractive = true,
  onClose, onComplete, onDelay, onSkip, onReopen,
}: Props) {
  if (!item) return null;
  const status = (item.status ?? "pending") as ItemStatus;
  const isPending = status === "pending";
  const cat = pickCategory(item.category);
  const badge = statusBadge(status);

  const isMealOptions = !!item.notes && item.notes.startsWith("Options:");
  const mealOpts = isMealOptions
    ? item.notes!.replace("Options:", "").split("|").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View entering={FadeIn.duration(180)} style={s.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          entering={SlideInDown.springify().damping(18).stiffness(180)}
          exiting={SlideOutDown.duration(200)}
          style={[s.sheet, { maxHeight: SCREEN_H * 0.92 }]}
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Hero header */}
            <LinearGradient colors={cat.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
              <View style={s.handle} />
              <TouchableOpacity
                onPress={onClose}
                style={s.closeBtn}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>

              <View style={s.heroIconWrap}>
                <Ionicons name={cat.icon} size={42} color="#fff" />
              </View>

              <Text style={s.heroTitle} numberOfLines={3}>{item.activity}</Text>

              <View style={s.heroMeta}>
                <View style={s.metaPill}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text style={s.metaText}>{item.time}</Text>
                </View>
                <View style={s.metaPill}>
                  <Ionicons name="hourglass-outline" size={12} color="#fff" />
                  <Text style={s.metaText}>{item.duration}m</Text>
                </View>
                <View style={s.metaPill}>
                  <Text style={s.metaText}>{item.category}</Text>
                </View>
                {badge && (
                  <View style={[s.metaPill, { backgroundColor: badge.bg }]}>
                    <Text style={[s.metaText, { fontWeight: "800" }]}>{badge.text}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Body */}
            <View style={s.body}>
              {/* Skip reason */}
              {item.skipReason ? (
                <View style={s.skipBox}>
                  <Text style={s.skipEmoji}>⚠️</Text>
                  <Text style={s.skipText}>{item.skipReason}</Text>
                </View>
              ) : null}

              {/* Notes / meal options */}
              {isMealOptions ? (
                <View style={{ gap: 8 }}>
                  <Text style={s.sectionLabel}>🍽️ Meal options</Text>
                  <View style={s.optionsWrap}>
                    {mealOpts.map((opt, oi) => (
                      <View key={oi} style={s.optionPill}>
                        <Text style={s.optionText}>{opt}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : item.notes ? (
                <View style={s.notesBox}>
                  <Text style={s.sectionLabel}>📋 Instructions</Text>
                  <Text style={s.notesText}>{item.notes}</Text>
                </View>
              ) : null}

              {/* Slide to complete (pending only) */}
              {isInteractive && isPending && (
                <View style={{ gap: 10, marginTop: 4 }}>
                  <SlideToComplete onComplete={onComplete} />
                  <View style={s.secondaryRow}>
                    <TouchableOpacity
                      onPress={() => onDelay(15)}
                      activeOpacity={0.85}
                      style={[s.secondaryBtn, { backgroundColor: "rgba(245,158,11,0.18)", borderColor: "rgba(245,158,11,0.5)" }]}
                    >
                      <Ionicons name="time" size={16} color="#fbbf24" />
                      <Text style={[s.secondaryText, { color: "#fbbf24" }]}>Delay +15m</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={onSkip}
                      activeOpacity={0.85}
                      style={[s.secondaryBtn, { backgroundColor: "rgba(148,163,184,0.18)", borderColor: "rgba(148,163,184,0.5)" }]}
                    >
                      <MaterialCommunityIcons name="skip-next" size={16} color="#cbd5e1" />
                      <Text style={[s.secondaryText, { color: "#cbd5e1" }]}>Skip</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Re-open if not pending */}
              {isInteractive && !isPending && (
                <TouchableOpacity onPress={onReopen} activeOpacity={0.85} style={s.reopenBtn}>
                  <Ionicons name="arrow-undo" size={16} color="#fff" />
                  <Text style={s.reopenText}>Mark as pending again</Text>
                </TouchableOpacity>
              )}

              {/* Close */}
              <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={s.closeFooter}>
                <Text style={s.closeFooterText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  hero: {
    paddingTop: 14,
    paddingBottom: 22,
    paddingHorizontal: 20,
    position: "relative",
  },
  handle: {
    alignSelf: "center",
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginBottom: 12,
  },
  closeBtn: {
    position: "absolute", top: 10, right: 10,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  heroMeta: {
    flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10,
  },
  metaPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  metaText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  body: { padding: 20, gap: 14 },

  skipBox: {
    flexDirection: "row", gap: 8,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1, borderColor: "rgba(245,158,11,0.4)",
    borderRadius: 14, padding: 12,
  },
  skipEmoji: { fontSize: 16 },
  skipText: { flex: 1, color: "#fcd34d", fontSize: 13, fontWeight: "600", lineHeight: 18 },

  sectionLabel: { color: "#fff", fontSize: 13, fontWeight: "800" },

  optionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  optionPill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(251,146,60,0.18)",
    borderWidth: 1, borderColor: "rgba(251,146,60,0.45)",
  },
  optionText: { color: "#fdba74", fontSize: 12, fontWeight: "700" },

  notesBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14, padding: 14, gap: 6,
  },
  notesText: { color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 19 },

  secondaryRow: { flexDirection: "row", gap: 8 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryText: { fontSize: 13, fontWeight: "700" },

  reopenBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  reopenText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  closeFooter: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
  },
  closeFooterText: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "700" },
});
