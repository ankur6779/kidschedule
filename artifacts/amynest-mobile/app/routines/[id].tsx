import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Platform, Modal, Pressable, Alert,
  TextInput, KeyboardAvoidingView, ScrollView, Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useTheme } from "@/contexts/ThemeContext";
import { paletteFor } from "@/lib/theme";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import SwipeableCard from "@/components/SwipeableCard";
import colors, { brand, brandAlpha } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";

type ItemStatus = "pending" | "completed" | "skipped" | "delayed";

type RoutineItem = {
  time: string; activity: string; duration: number;
  category: string; notes?: string;
  status?: ItemStatus; skipReason?: string;
};
type Routine = {
  id: number; childId: number; childName: string;
  date: string; title: string; items: RoutineItem[];
};

// ─── Time helpers ──────────────────────────────────────────────────────────
function parse12hToMinutes(timeStr: string): number {
  const m = timeStr?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return -1;
  let h = parseInt(m[1]);
  const mn = parseInt(m[2]);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + mn;
}
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = ((mins % 60) + 60) % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const dh = h % 12 === 0 ? 12 : h % 12;
  return `${dh}:${m.toString().padStart(2, "0")} ${ap}`;
}

// ─── Priority + smart cascade (ported from web) ─────────────────────────────
const CATEGORY_PRIORITY: Record<string, "high" | "medium" | "low"> = {
  sleep: "high", "wind-down": "high", hygiene: "high",
  meal: "high", tiffin: "high", school: "high",
  morning: "medium", homework: "medium", exercise: "medium",
  bonding: "medium", travel: "medium", reading: "medium", snack: "medium",
  play: "low", screen: "low",
};
function getPriority(category: string, activity = ""): "high" | "medium" | "low" {
  const k = Object.keys(CATEGORY_PRIORITY).find(x => category?.toLowerCase().includes(x));
  if (k) return CATEGORY_PRIORITY[k];
  if (/sleep|bedtime|bath|brush|toilet|shower/i.test(activity)) return "high";
  if (/breakfast|lunch|dinner|meal|eat|tiffin/i.test(activity)) return "high";
  return "medium";
}
function smartCascade(items: RoutineItem[], fromIndex: number, delayMinutes: number) {
  const updated = [...items];
  let autoSkipped = 0;

  let sleepAnchorMins = -1;
  for (let i = fromIndex; i < items.length; i++) {
    const cat = items[i].category?.toLowerCase() ?? "";
    if (cat === "sleep" || /sleep|bedtime|good night/i.test(items[i].activity)) {
      sleepAnchorMins = parse12hToMinutes(items[i].time);
      break;
    }
  }

  for (let i = fromIndex; i < updated.length; i++) {
    const item = updated[i];
    if (item.status === "completed") continue;

    const cur = parse12hToMinutes(item.time);
    if (cur < 0) continue;
    const newStart = cur + delayMinutes;
    const dur = item.duration ?? 30;
    const prio = getPriority(item.category, item.activity);
    const isSleep = item.category === "sleep" || /sleep|bedtime|good night/i.test(item.activity);

    if (!isSleep && sleepAnchorMins > 0 && newStart + dur > sleepAnchorMins) {
      if (prio === "low" || prio === "medium") {
        updated[i] = { ...item, status: "skipped", skipReason: "Skipped — not enough time" };
        autoSkipped++;
        continue;
      }
    }

    const wasAuto = item.skipReason === "Skipped — not enough time";
    const fits = isSleep || sleepAnchorMins < 0 || newStart + dur <= sleepAnchorMins;
    if (wasAuto && fits && item.status === "skipped") {
      updated[i] = { ...item, status: "pending", time: minutesToTime(newStart), skipReason: undefined };
      continue;
    }

    updated[i] = { ...item, time: minutesToTime(newStart), skipReason: undefined };
  }

  return { items: updated, autoSkipped };
}

// ─── Category styles ───────────────────────────────────────────────────────
// audit-block-ignore-start: semantic activity-category color map — no theme tokens for these types
const CATEGORY_COLORS: Record<string, string> = {
  morning: "#F59E0B", morning_routine: "#F59E0B",
  meal: "#10B981", tiffin: "#F59E0B",
  school: brand.indigo500, travel: "#818CF8",
  homework: brand.violet500, study: brand.violet500,
  play: "#F97316", exercise: "#84CC16",
  family: "#EC4899", bonding: "#F472B6",
  creative: "#14B8A6", outdoor: "#84CC16",
  self_care: "#06B6D4", hygiene: "#EC4899",
  rest: "", "wind-down": brand.violet400,
  sleep: "#4338CA", screen: "#06B6D4",
  default: "",
};
// audit-block-ignore-end
const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  morning: "sunny-outline", morning_routine: "sunny-outline",
  meal: "restaurant-outline", tiffin: "fast-food-outline",
  school: "school-outline", travel: "car-outline",
  homework: "book-outline", study: "book-outline",
  play: "football-outline", exercise: "fitness-outline",
  family: "heart-outline", bonding: "people-outline",
  creative: "color-palette-outline", outdoor: "leaf-outline",
  self_care: "sparkles-outline", hygiene: "water-outline",
  rest: "pause-circle-outline", "wind-down": "moon-outline",
  sleep: "moon-outline", screen: "tv-outline",
  default: "ellipse-outline",
};

function hexToRgba(color: string, alpha: number): string {
  if (color.startsWith("rgba(") || color.startsWith("rgb(")) {
    const m = color.match(/[\d.]+/g);
    if (m && m.length >= 3) return `rgba(${m[0]},${m[1]},${m[2]},${alpha})`;
    return color;
  }
  const hex = color.replace(/^#/, "");
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function completionStats(items: RoutineItem[]) {
  const total = items.length;
  const done = items.filter(i => i.status === "completed").length;
  const skipped = items.filter(i => i.status === "skipped").length;
  return { total, done, skipped, remaining: total - done - skipped, pct: total > 0 ? Math.round(done / total * 100) : 0 };
}

function hapticTap() { if (Platform.OS !== "web") Haptics.selectionAsync(); }
function hapticImpact() { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
function hapticSuccess() { if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authFetch = useAuthFetch();
  const c = useColors();
  const { mode } = useTheme();
  const theme = paletteFor(mode);
  const qc = useQueryClient();

  const [actionItem, setActionItem] = useState<number | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ activity: "", time: "", duration: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", duration: "30" });
  const [addLoading, setAddLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [moreMenu, setMoreMenu] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone?: "info" | "success" | "warn" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [undoSnap, setUndoSnap] = useState<RoutineItem[] | null>(null);
  const [undoLabel, setUndoLabel] = useState("");
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, tone: "info" | "success" | "warn" = "info") => {
    setToast({ msg, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };
  const showUndo = (snap: RoutineItem[], label: string) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoSnap(snap);
    setUndoLabel(label);
    undoTimer.current = setTimeout(() => { setUndoSnap(null); setUndoLabel(""); }, 6000);
  };
  const clearUndo = () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoSnap(null); setUndoLabel("");
  };

  const { data: routine, isLoading } = useQuery<Routine>({
    queryKey: ["routine", id],
    queryFn: () => authFetch(`/api/routines/${id}`).then(r => r.json()) as Promise<Routine>,
    enabled: !!id,
  });

  const [items, setItems] = useState<RoutineItem[]>([]);
  React.useEffect(() => { if (routine?.items) setItems(routine.items); }, [routine]);

  const saveMut = useMutation({
    mutationFn: (next: RoutineItem[]) =>
      authFetch(`/api/routines/${id}/items`, { method: "PATCH", body: JSON.stringify({ items: next }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routine", id] });
      qc.invalidateQueries({ queryKey: ["routines"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => authFetch(`/api/routines/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routines"] });
      hapticSuccess();
      router.back();
    },
  });

  // ── Item actions ──────────────────────────────────────────────────────────
  const persist = (next: RoutineItem[]) => {
    setItems(next);
    saveMut.mutate(next);
  };

  const setItemStatus = (idx: number, status: ItemStatus) => {
    hapticTap();
    showUndo([...items], status === "completed" ? "Marked complete" : status === "skipped" ? "Skipped" : "Reset");
    const next = items.map((it, i) =>
      i === idx ? { ...it, status, skipReason: status === "skipped" ? "Manually skipped" : undefined } : it
    );
    persist(next);
    if (status === "completed" && items[idx]?.status !== "completed") {
      const earned = (items[idx] as any)?.rewardPoints ?? 10;
      showToast(`+${earned} points earned 🎉`, "success");
    }
    setActionItem(null);
  };

  const delayItem = (idx: number, mins: number) => {
    hapticImpact();
    showUndo([...items], `Delayed +${mins}m`);
    const baseUpdated = items.map((it, i) => i === idx ? { ...it, status: "delayed" as ItemStatus } : it);
    const { items: cascaded, autoSkipped } = smartCascade(baseUpdated, idx + 1, mins);
    persist(cascaded);
    if (autoSkipped > 0) showToast(`Delayed · ${autoSkipped} task${autoSkipped > 1 ? "s" : ""} auto-skipped`, "warn");
    else showToast(`Schedule shifted +${mins} min`, "info");
    setActionItem(null);
  };

  const deleteItem = (idx: number) => {
    hapticImpact();
    showUndo([...items], "Activity removed");
    const next = items.filter((_, i) => i !== idx);
    persist(next);
    showToast("Activity removed", "info");
    setActionItem(null);
  };

  const handleTap = (idx: number) => {
    const cur = items[idx]?.status;
    setItemStatus(idx, cur === "completed" ? "pending" : "completed");
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (idx: number) => {
    const it = items[idx]; if (!it) return;
    setEditForm({ activity: it.activity, time: it.time, duration: String(it.duration) });
    setEditIndex(idx);
    setActionItem(null);
  };
  const saveEdit = () => {
    if (editIndex === null) return;
    const orig = items[editIndex];
    const newTime = editForm.time.trim() || orig.time;
    const newDur = parseInt(editForm.duration) || orig.duration;
    const newAct = editForm.activity.trim() || orig.activity;

    showUndo([...items], "Edited activity");
    const base = items.map((it, i) =>
      i === editIndex ? { ...it, activity: newAct, time: newTime, duration: newDur } : it
    );

    const origMins = parse12hToMinutes(orig.time);
    const newMins = parse12hToMinutes(newTime);
    const timeDiff = newMins >= 0 ? newMins - origMins : 0;
    const durDiff = newDur - (orig.duration ?? 30);
    const totalDelay = timeDiff + durDiff;

    if (totalDelay === 0) {
      persist(base);
    } else {
      const { items: cascaded, autoSkipped } = smartCascade(base, editIndex + 1, totalDelay);
      persist(cascaded);
      if (autoSkipped > 0) showToast(`${autoSkipped} task${autoSkipped > 1 ? "s" : ""} auto-skipped`, "warn");
      else showToast(`Shifted ${totalDelay > 0 ? "+" : ""}${totalDelay} min`, "info");
    }
    setEditIndex(null);
  };

  // ── Add activity ──────────────────────────────────────────────────────────
  const addActivity = async () => {
    if (!addForm.name.trim()) return;
    setAddLoading(true);
    try {
      const res = await authFetch(`/api/routines/${id}/partial-regenerate`, {
        method: "POST",
        body: JSON.stringify({ newActivity: { name: addForm.name, duration: parseInt(addForm.duration) || 30 } }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        qc.invalidateQueries({ queryKey: ["routine", id] });
        hapticSuccess();
        showToast(`"${addForm.name}" added`, "success");
      }
    } catch {
      showToast("Could not add activity", "warn");
    } finally {
      setAddLoading(false);
      setAddOpen(false);
      setAddForm({ name: "", duration: "30" });
    }
  };

  // ── Partial regenerate ────────────────────────────────────────────────────
  const partialRegen = async () => {
    setMoreMenu(false);
    setRegenLoading(true);
    try {
      const res = await authFetch(`/api/routines/${id}/partial-regenerate`, { method: "POST", body: "{}" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        qc.invalidateQueries({ queryKey: ["routine", id] });
        hapticSuccess();
        showToast("Day regenerated by AI", "success");
      }
    } catch {
      showToast("Could not regenerate", "warn");
    } finally { setRegenLoading(false); }
  };

  // ── Share ─────────────────────────────────────────────────────────────────
  const shareRoutine = async () => {
    setMoreMenu(false);
    if (!routine) return;
    const lines = [
      `📅 ${routine.title}`,
      `👧 Child: ${routine.childName}`,
      `📆 ${formatDate(routine.date)}`,
      "",
      "📋 ROUTINE:",
      ...items.map(i => `• ${i.time} — ${i.activity} (${i.duration} min)${i.notes ? `\n  💡 ${i.notes}` : ""}`),
      "",
      "— Sent via AmyNest",
    ];
    const msg = lines.join("\n");
    try {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(msg);
          showToast("Copied to clipboard", "success");
        } else {
          showToast("Copy not supported", "warn");
        }
      } else {
        await Share.share({ message: msg, title: routine.title });
      }
    } catch {}
  };

  // ── Delete routine ────────────────────────────────────────────────────────
  const confirmDelete = () => {
    setMoreMenu(false);
    if (Platform.OS === "web") setShowDelete(true);
    else Alert.alert("Delete routine?", "This will permanently remove this routine.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate() },
    ]);
  };

  // ── Undo ──────────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (!undoSnap) return;
    setItems(undoSnap);
    saveMut.mutate(undoSnap);
    clearUndo();
    showToast("Action undone", "info");
  }, [undoSnap]);

  // ──────────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => completionStats(items), [items]);
  const topPad = insets.top + (Platform.OS === "web" ? 12 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 24 : 0) + 110;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={c.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: c.foreground }]} numberOfLines={1}>Routine</Text>
        </View>
        <TouchableOpacity onPress={shareRoutine} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={20} color={c.foreground} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMoreMenu(true)} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={20} color={c.foreground} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      ) : !routine ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color="rgba(255,255,255,0.4)" />
          <Text style={styles.emptyText}>Routine not found</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(_, idx) => String(idx)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: botPad, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.dateLabel}>{formatDate(routine.date)}</Text>
              <Text style={[styles.routineTitle, { color: c.foreground }]} numberOfLines={3}>{routine.title}</Text>
              <View style={styles.childRow}>
                <View style={styles.childChip}>
                  <Ionicons name="person" size={11} color={c.accent} />
                  <Text style={styles.childChipText}>{routine.childName}</Text>
                </View>
                <View style={styles.childChip}>
                  <Ionicons name="list" size={11} color={brand.primary} />
                  <Text style={styles.childChipText}>{stats.total} tasks</Text>
                </View>
              </View>

              <View style={styles.statsCardWrap}>
                <BlurView intensity={Platform.OS === "android" ? 70 : 40} tint="dark" style={styles.statsCard}>
                  <View style={styles.statsRow}>
                    {/* audit-ok: semantic success-green "Done" count */}
                    <Stat num={stats.done} label="Done" color="#10B981" />
                    <Divider />
                    <Stat num={stats.remaining} label="Remaining" color="#FFFFFF" />
                    <Divider />
                    <Stat num={stats.skipped} label="Skipped" color="rgba(255,255,255,0.5)" />
                  </View>
                  <View style={styles.progressOuter}>
                    <LinearGradient colors={[brand.primary, "#FF4ECD" /* audit-ok: accent pink gradient end-stop */]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${stats.pct}%` }]} />
                  </View>
                  <Text style={styles.progressLabel}>{stats.pct}% complete</Text>
                </BlurView>
              </View>

              <AmyAISuggests stats={stats} title={routine.title} />

              <View style={styles.activitiesHeaderRow}>
                <Text style={styles.sectionTitle}>ACTIVITIES</Text>
                <TouchableOpacity onPress={() => setAddOpen(true)} style={styles.addBtn} activeOpacity={0.85}>
                  <LinearGradient colors={[brand.primary, "#FF4ECD" /* audit-ok: accent pink gradient end-stop */]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addBtnGrad}>
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                    <Text style={styles.addBtnText}>Add</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <Text style={styles.swipeHint}>← Swipe to skip   •   Swipe to complete →</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No activities in this routine</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={Platform.OS !== "web" ? FadeIn.delay(index * 35).duration(280) : undefined}
              style={styles.timelineRow}
            >
              <View style={styles.railCol}>
                <View style={[styles.railLine, index === 0 && { top: 16 }, index === items.length - 1 && { bottom: "50%" }]} />
                <View style={[
                  styles.railDot,
                  { backgroundColor: c.railDotBg },
                  item.status === "completed" && { backgroundColor: "#22C55E" /* audit-ok: status-complete green */, borderColor: "#22C55E" /* audit-ok */ },
                  item.status === "skipped" && { backgroundColor: c.statusSkipped, borderColor: c.statusSkipped },
                  item.status === "delayed" && { backgroundColor: "#F59E0B" /* audit-ok: status-delayed amber */, borderColor: "#F59E0B" /* audit-ok */ },
                ]} />
              </View>
              <View style={styles.timelineCard}>
                <SwipeableCard
                  onTap={() => handleTap(index)}
                  onLongPress={() => setActionItem(index)}
                  onSwipeRight={() => setItemStatus(index, item.status === "completed" ? "pending" : "completed")}
                  onSwipeLeft={() => setItemStatus(index, item.status === "skipped" ? "pending" : "skipped")}
                  leftActionMode="skip"
                  borderRadius={18}
                  glowColor={item.status === "completed" ? "#22C55E" /* audit-ok: status-complete green glow */ : brand.violet500}
                >
                  <ItemCard item={item} />
                </SwipeableCard>
              </View>
            </Animated.View>
          )}
          ItemSeparatorComponent={null}
        />
      )}

      {/* Floating Toast */}
      {toast && (
        <View style={[styles.toast, { bottom: insets.bottom + 120 }]} pointerEvents="box-none">
          <BlurView intensity={Platform.OS === "android" ? 80 : 50} tint="dark" style={styles.toastInner}>
            <Ionicons
              name={toast.tone === "success" ? "checkmark-circle" : toast.tone === "warn" ? "alert-circle" : "information-circle"}
              size={18}
              color={toast.tone === "success" ? "#10B981" /* audit-ok: semantic success-green */ : toast.tone === "warn" ? "#F59E0B" /* audit-ok: semantic warn-amber */ : brand.primary}
            />
            <Text style={styles.toastText}>{toast.msg}</Text>
          </BlurView>
        </View>
      )}

      {/* Undo Bar */}
      {undoSnap && (
        <View style={[styles.undoBar, { bottom: insets.bottom + 80 }]} pointerEvents="box-none">
          <BlurView intensity={Platform.OS === "android" ? 80 : 60} tint="dark" style={styles.undoInner}>
            <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.undoText} numberOfLines={1}>{undoLabel}</Text>
            <TouchableOpacity onPress={handleUndo} style={styles.undoBtn} activeOpacity={0.8}>
              <Text style={styles.undoBtnText}>UNDO</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      )}

      {/* Item action sheet */}
      <Modal visible={actionItem !== null} transparent animationType="fade" onRequestClose={() => setActionItem(null)}>
        <Pressable style={styles.modalScrim} onPress={() => setActionItem(null)}>
          <Pressable style={[styles.actionSheet, { backgroundColor: c.card }]} onPress={e => e.stopPropagation()}>
            <View style={styles.actionHandle} />
            <Text style={[styles.actionTitle, { color: c.foreground }]} numberOfLines={2}>
              {actionItem !== null ? items[actionItem]?.activity : ""}
            </Text>
            {actionItem !== null && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* audit-ok: semantic success-green "Mark complete" action */}
                <ActionRow icon="checkmark-circle" iconColor="#10B981" label="Mark complete"
                  onPress={() => setItemStatus(actionItem, "completed")}
                  active={items[actionItem]?.status === "completed"} />

                <Text style={styles.subHeader}>DELAY (smart cascade)</Text>
                <View style={styles.delayRow}>
                  {[15, 30, 60].map(m => (
                    <TouchableOpacity key={m} style={styles.delayBtn} onPress={() => delayItem(actionItem, m)} activeOpacity={0.8}>
                      {/* audit-ok: semantic delay-amber time icon */}
                      <Ionicons name="time" size={16} color="#F59E0B" />
                      <Text style={styles.delayText}>+{m}m</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <ActionRow icon="play-skip-forward" iconColor={c.textFaint} label="Skip"
                  onPress={() => setItemStatus(actionItem, "skipped")}
                  active={items[actionItem]?.status === "skipped"} />
                <ActionRow icon="refresh" iconColor={brand.primary} label="Reset to pending"
                  onPress={() => setItemStatus(actionItem, "pending")}
                  active={!items[actionItem]?.status || items[actionItem]?.status === "pending"} />
                {/* audit-ok: semantic blue "Edit" action icon */}
                <ActionRow icon="create-outline" iconColor="#60A5FA" label="Edit time / activity"
                  onPress={() => openEdit(actionItem)} />
                {/* audit-ok: accent pink "Remove" destructive action icon */}
                <ActionRow icon="trash-outline" iconColor="#FF4ECD" label="Remove from routine"
                  onPress={() => deleteItem(actionItem)} />

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setActionItem(null)} activeOpacity={0.7}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit modal */}
      <Modal visible={editIndex !== null} transparent animationType="fade" onRequestClose={() => setEditIndex(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={styles.modalScrim} onPress={() => setEditIndex(null)}>
            <Pressable style={[styles.editCard, { backgroundColor: c.card }]} onPress={e => e.stopPropagation()}>
              <Text style={[styles.editTitle, { color: c.foreground }]}>Edit activity</Text>
              <Text style={styles.editLabel}>Activity</Text>
              <TextInput style={[styles.input, { color: c.foreground }]} value={editForm.activity}
                onChangeText={v => setEditForm({ ...editForm, activity: v })}
                placeholder="Activity name" placeholderTextColor={c.textFaint} />
              <Text style={styles.editLabel}>Time (e.g. 7:30 AM)</Text>
              <TextInput style={[styles.input, { color: c.foreground }]} value={editForm.time}
                onChangeText={v => setEditForm({ ...editForm, time: v })}
                placeholder="7:30 AM" placeholderTextColor={c.textFaint} />
              <Text style={styles.editLabel}>Duration (minutes)</Text>
              <TextInput style={[styles.input, { color: c.foreground }]} value={editForm.duration}
                onChangeText={v => setEditForm({ ...editForm, duration: v.replace(/[^0-9]/g, "") })}
                keyboardType="number-pad" placeholder="30" placeholderTextColor={c.textFaint} />
              <Text style={styles.helper}>Changes to time or duration will smart-shift later activities and protect bedtime.</Text>
              <View style={styles.confirmBtns}>
                <TouchableOpacity style={[styles.confirmBtn, styles.confirmCancel]} onPress={() => setEditIndex(null)} activeOpacity={0.8}>
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmBtn, styles.confirmPrimary]} onPress={saveEdit} activeOpacity={0.8}>
                  <Text style={styles.confirmPrimaryText}>Save</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add activity modal */}
      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={styles.modalScrim} onPress={() => setAddOpen(false)}>
            <Pressable style={[styles.editCard, { backgroundColor: c.card }]} onPress={e => e.stopPropagation()}>
              <View style={styles.addIconCircle}>
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.editTitle, { color: c.foreground }]}>Add activity</Text>
              <Text style={styles.helper}>AI will fit it into the schedule and adjust the rest of the day.</Text>
              <Text style={styles.editLabel}>Activity name</Text>
              <TextInput style={[styles.input, { color: c.foreground }]} value={addForm.name}
                onChangeText={v => setAddForm({ ...addForm, name: v })}
                placeholder="e.g. Piano practice" placeholderTextColor={c.textFaint} />
              <Text style={styles.editLabel}>Duration (minutes)</Text>
              <TextInput style={[styles.input, { color: c.foreground }]} value={addForm.duration}
                onChangeText={v => setAddForm({ ...addForm, duration: v.replace(/[^0-9]/g, "") })}
                keyboardType="number-pad" placeholder="30" placeholderTextColor={c.textFaint} />
              <View style={styles.confirmBtns}>
                <TouchableOpacity style={[styles.confirmBtn, styles.confirmCancel]} onPress={() => setAddOpen(false)} activeOpacity={0.8} disabled={addLoading}>
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmBtn, styles.confirmPrimary]} onPress={addActivity} activeOpacity={0.8} disabled={addLoading || !addForm.name.trim()}>
                  {addLoading
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Text style={styles.confirmPrimaryText}>Add</Text>}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* More menu */}
      <Modal visible={moreMenu} transparent animationType="fade" onRequestClose={() => setMoreMenu(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setMoreMenu(false)}>
          <Pressable style={[styles.actionSheet, { backgroundColor: c.card }]} onPress={e => e.stopPropagation()}>
            <View style={styles.actionHandle} />
            <Text style={[styles.actionTitle, { color: c.foreground }]}>Routine actions</Text>
            <ActionRow icon="sparkles" iconColor={brand.primary} label={regenLoading ? "Regenerating…" : "Regenerate day with AI"}
              onPress={partialRegen} />
            {/* audit-ok: semantic success-green "Share" action icon */}
            <ActionRow icon="share-outline" iconColor="#10B981" label="Share routine" onPress={shareRoutine} />
            <ActionRow icon="trash-outline" iconColor={c.accent} label="Delete routine" onPress={confirmDelete} />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setMoreMenu(false)} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Web delete confirm */}
      <Modal visible={showDelete} transparent animationType="fade" onRequestClose={() => setShowDelete(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setShowDelete(false)}>
          <Pressable style={[styles.confirmCard, { backgroundColor: c.card }]} onPress={e => e.stopPropagation()}>
            <MaterialCommunityIcons name="trash-can-outline" size={36} color={c.accent} />
            <Text style={[styles.confirmTitle, { color: c.foreground }]}>Delete routine?</Text>
            <Text style={styles.confirmBody}>This will permanently remove this routine and all its tasks.</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={[styles.confirmBtn, styles.confirmCancel]} onPress={() => setShowDelete(false)} activeOpacity={0.8}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: c.accent }]}
                onPress={() => { setShowDelete(false); deleteMut.mutate(); }} activeOpacity={0.8}>
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Regen overlay */}
      {regenLoading && (
        <View style={styles.fullOverlay} pointerEvents="auto">
          <BlurView intensity={Platform.OS === "android" ? 80 : 50} tint="dark" style={styles.fullOverlayInner}>
            <ActivityIndicator size="large" color={c.accent} />
            <Text style={styles.regenText}>Regenerating with AI…</Text>
          </BlurView>
        </View>
      )}
    </View>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────
function Stat({ num, label, color }: { num: number; label: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statNum, { color }]}>{num}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function Divider() { return <View style={styles.statDivider} />; }

function AmyAISuggests({ stats, title }: { stats: { done: number; total: number; remaining: number; skipped: number; pct: number }; title: string }) {
  const tip = useMemo(() => {
    if (stats.total === 0) return "Add a few activities and I'll help you optimize the day.";
    if (stats.pct === 100) return `Incredible work — every activity in "${title}" is done. Time to celebrate with your little one!`;
    if (stats.pct >= 75) return `You're crushing it — ${stats.remaining} more to wrap up the day. Keep the momentum.`;
    if (stats.skipped >= 3) return `Several activities were skipped. Tap any to reschedule, or I can regenerate the rest of the day.`;
    if (stats.pct >= 40) return `Nice rhythm so far. Long-press any activity to delay it without breaking the schedule.`;
    return `Swipe right to mark complete, swipe left to skip. I'll auto-shift later activities for you.`;
  }, [stats.pct, stats.remaining, stats.skipped, stats.total, title]);

  return (
    <View style={styles.aiCard}>
      <View style={styles.aiBadge}>
        <Ionicons name="sparkles" size={18} color={brand.violet400} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.aiLabel}>AMY AI SUGGESTS</Text>
        <Text style={styles.aiText}>{tip}</Text>
      </View>
    </View>
  );
}

function ItemCard({ item }: { item: RoutineItem }) {
  const c = useColors();
  const catKey = item.category?.toLowerCase() ?? "default";
  const rawColor = CATEGORY_COLORS[catKey] ?? CATEGORY_COLORS.default;
  const catColor = catKey === "rest" ? c.textSubtle : (rawColor || c.textFaint);
  const catIcon = CATEGORY_ICONS[catKey] ?? CATEGORY_ICONS.default;
  const status = item.status ?? "pending";
  const isDone = status === "completed";
  const isSkipped = status === "skipped";
  const isDelayed = status === "delayed";

  const borderColor = isDone ? "rgba(16,185,129,0.55)"
    : isDelayed ? "rgba(245,158,11,0.55)"
    : "rgba(255,255,255,0.10)";

  return (
    <View
      style={[
        styles.itemCard,
        {
          borderColor,
          backgroundColor: isDone ? "rgba(16,185,129,0.12)"
            : isDelayed ? "rgba(245,158,11,0.12)"
            : c.surfaceCardDark,
          opacity: isSkipped ? 0.5 : 1,
        },
      ]}
    >
      <View style={[styles.timeCol, { borderRightColor: c.border }]}>
        <Text style={[styles.timeText, { color: isDone ? c.textDim : c.foreground }]}>{item.time}</Text>
        <View style={styles.durationRow}>
          <Ionicons name="time-outline" size={9} color={c.textDim} />
          <Text style={[styles.durationText, { color: c.textDim }]}>{item.duration}m</Text>
        </View>
      </View>
      <View style={[styles.catIcon, { backgroundColor: hexToRgba(catColor, 0.22), borderColor: hexToRgba(catColor, 0.5) }]}>
        <Ionicons name={catIcon} size={20} color={catColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[
          styles.activityText,
          { color: c.foreground },
          isDone && { color: c.textSubtle, textDecorationLine: "line-through" },
          isSkipped && { color: c.textDim },
        ]} numberOfLines={2}>{item.activity}</Text>
        {item.notes && !isDone && <Text style={[styles.notesText, { color: c.textSubtle }]} numberOfLines={1}>{item.notes}</Text>}
        {isSkipped && item.skipReason && <Text style={[styles.skipReason, { color: c.textDim }]} numberOfLines={1}>⏭ {item.skipReason}</Text>}
        {isDelayed && <Text style={styles.delayedTag}>⏱ Delayed</Text>}
      </View>
      <View style={[
        styles.checkBox,
        isDone && { backgroundColor: "#10B981" /* audit-ok: status-complete green */, borderColor: "#10B981" /* audit-ok */ },
        isSkipped && { borderColor: "rgba(255,255,255,0.25)", borderStyle: "dashed" },
        isDelayed && { borderColor: "#F59E0B" /* audit-ok: status-delayed amber */ },
      ]}>
        {isDone && <Ionicons name="checkmark" size={14} color="#fff" />}
        {isSkipped && <Ionicons name="play-skip-forward" size={11} color="rgba(255,255,255,0.5)" />}
        {/* audit-ok: semantic delay-amber time icon in checkBox */}
        {isDelayed && <Ionicons name="time" size={12} color="#F59E0B" />}
      </View>
    </View>
  );
}

function ActionRow({ icon, iconColor, label, onPress, active }: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string; label: string; onPress: () => void; active?: boolean;
}) {
  const c = useColors();
  return (
    <TouchableOpacity
      style={[styles.actionRow, active && { backgroundColor: "rgba(123,63,242,0.15)" }]}
      onPress={onPress} activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={[styles.actionRowText, { color: c.foreground }]}>{label}</Text>
      {active && <Ionicons name="checkmark" size={18} color={brand.primary} />}
    </TouchableOpacity>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B1A" /* audit-ok: always-dark root container */ },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 60 },
  emptyText: { color: "rgba(255,255,255,0.55)", fontSize: 14, textAlign: "center" },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 12, gap: 6 },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  dateLabel: { color: "#FF4ECD" /* audit-ok: accent pink date label on always-dark header */, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  routineTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "800", lineHeight: 30, marginTop: 6 },
  childRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  childChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  childChipText: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "600" },

  statsCardWrap: {
    marginTop: 18, borderRadius: 22, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    shadowColor: brand.primary, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
  },
  statsCard: { padding: 18, gap: 14, backgroundColor: "rgba(20,20,43,0.55)" },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 2, flex: 1 },
  statDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.10)" },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  progressOuter: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressLabel: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "600", textAlign: "center" },

  activitiesHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 10 },
  sectionTitle: { color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  addBtn: { borderRadius: 14, overflow: "hidden", shadowColor: brand.primary, shadowOpacity: 0.5, shadowRadius: 8 },
  addBtnGrad: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  addBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  itemCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, minHeight: 76 },
  timelineRow: { flexDirection: "row", alignItems: "stretch" },
  railCol: { width: 22, alignItems: "center", paddingTop: 0, position: "relative" },
  railLine: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: brandAlpha.violet500_22, borderRadius: 1 },
  railDot: {
    width: 11, height: 11, borderRadius: 6,
    borderWidth: 2, borderColor: brand.violet500,
    marginTop: 30,
    shadowColor: brand.violet500, shadowOpacity: 0.7, shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
  },
  timelineCard: { flex: 1, marginLeft: 10, marginBottom: 10 },
  swipeHint: { color: "rgba(148,163,184,0.6)", fontSize: 10.5, fontWeight: "500", textAlign: "center", marginTop: 2, marginBottom: 8, letterSpacing: 0.4 },
  aiCard: {
    marginTop: 16, borderRadius: 18, padding: 14, flexDirection: "row", gap: 12,
    backgroundColor: brandAlpha.violet500_10, borderWidth: 1, borderColor: brandAlpha.violet500_35,
  },
  aiBadge: {
    width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: brandAlpha.violet500_25, borderWidth: 1, borderColor: brandAlpha.violet500_50,
  },
  aiLabel: { color: brand.violet400, fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 2 },
  aiText: { color: "#FFFFFF", fontSize: 13, lineHeight: 18, fontWeight: "500" },
  timeCol: { width: 56, borderRightWidth: 1, paddingRight: 10, gap: 3 },
  timeText: { fontSize: 12, fontWeight: "800" },
  durationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  durationText: { fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: "500" },
  catIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  activityText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", lineHeight: 20 },
  notesText: { fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 3 },
  skipReason: { fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 3, fontStyle: "italic" },
  delayedTag: { fontSize: 10, color: "#F59E0B" /* audit-ok: semantic delay-amber tag */, marginTop: 3, fontWeight: "700" },
  checkBox: {
    width: 26, height: 26, borderRadius: 8, borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center",
  },

  modalScrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  actionSheet: {
    backgroundColor: "#14142B" /* audit-ok: always-dark action sheet */,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 18, paddingBottom: 32, gap: 6,
    borderTopWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    maxHeight: "85%",
  },
  actionHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.20)", alignSelf: "center", marginBottom: 8 },
  actionTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", textAlign: "center", marginBottom: 8, paddingHorizontal: 8 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14 },
  actionRowText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600", flex: 1 },
  subHeader: { color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginTop: 14, marginBottom: 6, paddingHorizontal: 16 },
  delayRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  delayBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.10)", borderWidth: 1, borderColor: "rgba(245,158,11,0.35)",
  },
  delayText: { color: "#F59E0B" /* audit-ok: semantic delay-amber delay time text */, fontSize: 13, fontWeight: "700" },

  cancelBtn: {
    paddingVertical: 14, borderRadius: 14, marginTop: 10, marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
  },
  cancelBtnText: { color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: "600" },

  /* Edit / Add modal */
  editCard: {
    margin: 24, padding: 22, borderRadius: 24,
    backgroundColor: "#14142B" /* audit-ok: always-dark edit modal card */,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    gap: 8, alignSelf: "center", width: 340, marginTop: "auto", marginBottom: "auto",
  },
  addIconCircle: {
    width: 44, height: 44, borderRadius: 22, alignSelf: "center",
    alignItems: "center", justifyContent: "center",
    backgroundColor: brand.primary, marginBottom: 4,
    shadowColor: "#FF4ECD" /* audit-ok: accent pink glow on add icon */, shadowOpacity: 0.5, shadowRadius: 10,
  },
  editTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", textAlign: "center" },
  editLabel: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginTop: 8, textTransform: "uppercase" },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    color: "#FFFFFF", fontSize: 14,
  },
  helper: { color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 17, marginTop: 4, textAlign: "center" },

  confirmBtns: { flexDirection: "row", gap: 10, marginTop: 16, alignSelf: "stretch" },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  confirmCancel: { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  confirmCancelText: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "600" },
  confirmPrimary: { backgroundColor: brand.primary },
  confirmPrimaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  confirmCard: {
    margin: 24, padding: 24, borderRadius: 24, backgroundColor: "#14142B" /* audit-ok: always-dark confirm modal card */,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center", gap: 10, alignSelf: "center", width: 320,
    marginTop: "auto", marginBottom: "auto",
  },
  confirmTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  confirmBody: { color: "rgba(255,255,255,0.65)", fontSize: 13, textAlign: "center", lineHeight: 19 },
  confirmDelete: { backgroundColor: "#FF4ECD" /* audit-ok: accent pink destructive confirm button */ },
  confirmDeleteText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  /* Toast */
  toast: { position: "absolute", left: 20, right: 20, alignItems: "center" },
  toastInner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16,
    backgroundColor: "rgba(20,20,43,0.85)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 14,
  },
  toastText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600", flexShrink: 1 },

  /* Undo bar */
  undoBar: { position: "absolute", left: 20, right: 20 },
  undoInner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingLeft: 16, paddingRight: 8, paddingVertical: 8, borderRadius: 16,
    backgroundColor: "rgba(20,20,43,0.85)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  undoText: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600", flex: 1 },
  undoBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: brand.primary },
  undoBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", letterSpacing: 0.6 },

  /* Full-screen overlay */
  fullOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  fullOverlayInner: { padding: 28, borderRadius: 24, alignItems: "center", gap: 12, backgroundColor: "rgba(20,20,43,0.85)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  regenText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
