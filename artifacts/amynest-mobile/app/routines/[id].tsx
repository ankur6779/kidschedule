import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Platform, Modal, Pressable, Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import * as Haptics from "expo-haptics";

type RoutineItemStatus = "pending" | "completed" | "skipped" | "delayed";

type RoutineItem = {
  time: string; activity: string; duration: number;
  category: string; notes?: string;
  status?: RoutineItemStatus;
  skipReason?: string;
};
type Routine = {
  id: number; childId: number; childName: string;
  date: string; title: string; items: RoutineItem[];
};

const CATEGORY_COLORS: Record<string, string> = {
  morning: "#F59E0B", morning_routine: "#F59E0B",
  meal: "#10B981", tiffin: "#F59E0B",
  school: "#6366F1", travel: "#818CF8",
  homework: "#8B5CF6", study: "#8B5CF6",
  play: "#F97316", exercise: "#84CC16",
  family: "#EC4899", bonding: "#F472B6",
  creative: "#14B8A6", outdoor: "#84CC16",
  self_care: "#06B6D4", hygiene: "#EC4899",
  rest: "#6B7280", "wind-down": "#A78BFA",
  sleep: "#4338CA", screen: "#06B6D4",
  default: "#9CA3AF",
};

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function completionStats(items: RoutineItem[]) {
  const total = items.length;
  const done = items.filter(i => i.status === "completed").length;
  const skipped = items.filter(i => i.status === "skipped").length;
  return {
    total, done, skipped,
    remaining: total - done - skipped,
    pct: total > 0 ? Math.round(done / total * 100) : 0,
  };
}

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authFetch = useAuthFetch();
  const qc = useQueryClient();

  const [actionItem, setActionItem] = useState<number | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const { data: routine, isLoading } = useQuery<Routine>({
    queryKey: ["routine", id],
    queryFn: () => authFetch(`/api/routines/${id}`).then(r => r.json()) as Promise<Routine>,
    enabled: !!id,
  });

  const [items, setItems] = useState<RoutineItem[]>([]);
  React.useEffect(() => {
    if (routine?.items) setItems(routine.items);
  }, [routine]);

  const updateItemsMut = useMutation({
    mutationFn: (updatedItems: RoutineItem[]) =>
      authFetch(`/api/routines/${id}/items`, {
        method: "PATCH",
        body: JSON.stringify({ items: updatedItems }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routine", id] });
      qc.invalidateQueries({ queryKey: ["routines"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => authFetch(`/api/routines/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routines"] });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
  });

  const setItemStatus = (idx: number, status: RoutineItemStatus) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    const updated = items.map((item, i) =>
      i === idx ? { ...item, status, skipReason: status === "skipped" ? "Manually skipped" : undefined } : item
    );
    setItems(updated);
    updateItemsMut.mutate(updated);
    setActionItem(null);
  };

  const handleTap = (idx: number) => {
    const cur = items[idx]?.status;
    setItemStatus(idx, cur === "completed" ? "pending" : "completed");
  };

  const stats = useMemo(() => completionStats(items), [items]);
  const topPad = insets.top + (Platform.OS === "web" ? 12 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 24 : 0) + 110;

  const confirmDelete = () => {
    if (Platform.OS === "web") {
      setShowDelete(true);
    } else {
      Alert.alert(
        "Delete routine?",
        "This will permanently remove this routine and all its tasks.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate() },
        ],
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0B0B1A", "#14142B", "#1B1B3A"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Routine</Text>
        </View>
        <TouchableOpacity onPress={confirmDelete} style={styles.headerBtn} activeOpacity={0.7} disabled={deleteMut.isPending}>
          {deleteMut.isPending
            ? <ActivityIndicator size="small" color="#FF4ECD" />
            : <Ionicons name="trash-outline" size={20} color="#FF4ECD" />}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7B3FF2" />
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
              <Text style={styles.routineTitle} numberOfLines={3}>{routine.title}</Text>
              <View style={styles.childRow}>
                <View style={styles.childChip}>
                  <Ionicons name="person" size={11} color="#FF4ECD" />
                  <Text style={styles.childChipText}>{routine.childName}</Text>
                </View>
                <View style={styles.childChip}>
                  <Ionicons name="list" size={11} color="#7B3FF2" />
                  <Text style={styles.childChipText}>{stats.total} tasks</Text>
                </View>
              </View>

              {/* Glass stats card */}
              <View style={styles.statsCardWrap}>
                <BlurView intensity={Platform.OS === "android" ? 70 : 40} tint="dark" style={styles.statsCard}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNum, { color: "#10B981" }]}>{stats.done}</Text>
                      <Text style={styles.statLabel}>Done</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statNum, { color: "#FFFFFF" }]}>{stats.remaining}</Text>
                      <Text style={styles.statLabel}>Remaining</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statNum, { color: "rgba(255,255,255,0.5)" }]}>{stats.skipped}</Text>
                      <Text style={styles.statLabel}>Skipped</Text>
                    </View>
                  </View>

                  <View style={styles.progressOuter}>
                    <LinearGradient
                      colors={["#7B3FF2", "#FF4ECD"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${stats.pct}%` }]}
                    />
                  </View>
                  <Text style={styles.progressLabel}>{stats.pct}% complete</Text>
                </BlurView>
              </View>

              <Text style={styles.sectionTitle}>ACTIVITIES</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No activities in this routine</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const catKey = item.category?.toLowerCase() ?? "default";
            const catColor = CATEGORY_COLORS[catKey] ?? CATEGORY_COLORS.default;
            const catIcon = CATEGORY_ICONS[catKey] ?? CATEGORY_ICONS.default;
            const isDone = item.status === "completed";
            const isSkipped = item.status === "skipped";

            const borderColor = isDone
              ? "rgba(16,185,129,0.55)"
              : isSkipped
              ? "rgba(255,255,255,0.10)"
              : "rgba(255,255,255,0.10)";

            return (
              <Pressable
                onPress={() => handleTap(index)}
                onLongPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setActionItem(index);
                }}
                style={({ pressed }) => [
                  styles.itemCard,
                  {
                    borderColor,
                    backgroundColor: isDone
                      ? "rgba(16,185,129,0.10)"
                      : "rgba(255,255,255,0.04)",
                    opacity: isSkipped ? 0.5 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <View style={[styles.timeCol, { borderRightColor: "rgba(255,255,255,0.08)" }]}>
                  <Text style={[styles.timeText, { color: isDone ? "rgba(255,255,255,0.45)" : "#FFFFFF" }]}>
                    {item.time}
                  </Text>
                  <View style={styles.durationRow}>
                    <Ionicons name="time-outline" size={9} color="rgba(255,255,255,0.45)" />
                    <Text style={styles.durationText}>{item.duration}m</Text>
                  </View>
                </View>

                <View style={[styles.catIcon, { backgroundColor: `${catColor}25`, borderColor: `${catColor}50` }]}>
                  <Ionicons name={catIcon} size={18} color={catColor} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.activityText,
                      isDone && { color: "rgba(255,255,255,0.5)", textDecorationLine: "line-through" },
                      isSkipped && { color: "rgba(255,255,255,0.45)" },
                    ]}
                    numberOfLines={2}
                  >
                    {item.activity}
                  </Text>
                  {item.notes && !isDone && (
                    <Text style={styles.notesText} numberOfLines={1}>{item.notes}</Text>
                  )}
                  {isSkipped && item.skipReason && (
                    <Text style={styles.skipReason} numberOfLines={1}>⏭ {item.skipReason}</Text>
                  )}
                </View>

                <View
                  style={[
                    styles.checkBox,
                    isDone && { backgroundColor: "#10B981", borderColor: "#10B981" },
                    isSkipped && { borderColor: "rgba(255,255,255,0.25)", borderStyle: "dashed" },
                  ]}
                >
                  {isDone && <Ionicons name="checkmark" size={14} color="#fff" />}
                  {isSkipped && <Ionicons name="play-skip-forward" size={11} color="rgba(255,255,255,0.5)" />}
                </View>
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* Action sheet for long-press */}
      <Modal
        visible={actionItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActionItem(null)}
      >
        <Pressable style={styles.modalScrim} onPress={() => setActionItem(null)}>
          <Pressable style={styles.actionSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.actionHandle} />
            <Text style={styles.actionTitle} numberOfLines={2}>
              {actionItem !== null ? items[actionItem]?.activity : ""}
            </Text>

            {actionItem !== null && (
              <>
                <ActionRow
                  icon="checkmark-circle"
                  iconColor="#10B981"
                  label="Mark complete"
                  onPress={() => setItemStatus(actionItem, "completed")}
                  active={items[actionItem]?.status === "completed"}
                />
                <ActionRow
                  icon="play-skip-forward"
                  iconColor="#9CA3AF"
                  label="Skip"
                  onPress={() => setItemStatus(actionItem, "skipped")}
                  active={items[actionItem]?.status === "skipped"}
                />
                <ActionRow
                  icon="refresh"
                  iconColor="#7B3FF2"
                  label="Reset to pending"
                  onPress={() => setItemStatus(actionItem, "pending")}
                  active={!items[actionItem]?.status || items[actionItem]?.status === "pending"}
                />
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setActionItem(null)} activeOpacity={0.7}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Web delete confirm */}
      <Modal visible={showDelete} transparent animationType="fade" onRequestClose={() => setShowDelete(false)}>
        <Pressable style={styles.modalScrim} onPress={() => setShowDelete(false)}>
          <Pressable style={styles.confirmCard} onPress={(e) => e.stopPropagation()}>
            <MaterialCommunityIcons name="trash-can-outline" size={36} color="#FF4ECD" />
            <Text style={styles.confirmTitle}>Delete routine?</Text>
            <Text style={styles.confirmBody}>This will permanently remove this routine and all its tasks.</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={[styles.confirmBtn, styles.confirmCancel]} onPress={() => setShowDelete(false)} activeOpacity={0.8}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmDelete]}
                onPress={() => { setShowDelete(false); deleteMut.mutate(); }}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function ActionRow({
  icon, iconColor, label, onPress, active,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string; label: string; onPress: () => void; active?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionRow, active && { backgroundColor: "rgba(123,63,242,0.15)" }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={styles.actionRowText}>{label}</Text>
      {active && <Ionicons name="checkmark" size={18} color="#7B3FF2" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B1A" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 60 },
  emptyText: { color: "rgba(255,255,255,0.55)", fontSize: 14, textAlign: "center" },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingBottom: 12, gap: 8,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  dateLabel: {
    color: "#FF4ECD", fontSize: 12, fontWeight: "700",
    letterSpacing: 1, textTransform: "uppercase",
  },
  routineTitle: {
    color: "#FFFFFF", fontSize: 24, fontWeight: "800",
    lineHeight: 30, marginTop: 6,
  },
  childRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  childChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  childChipText: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "600" },

  statsCardWrap: {
    marginTop: 18, borderRadius: 22, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#7B3FF2", shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
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

  sectionTitle: {
    color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700",
    letterSpacing: 1, marginTop: 22, marginBottom: 10,
  },

  itemCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 18, borderWidth: 1,
  },
  timeCol: { width: 56, borderRightWidth: 1, paddingRight: 10, gap: 3 },
  timeText: { fontSize: 12, fontWeight: "800" },
  durationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  durationText: { fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: "500" },
  catIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  activityText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", lineHeight: 20 },
  notesText: { fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 3 },
  skipReason: { fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 3, fontStyle: "italic" },
  checkBox: {
    width: 26, height: 26, borderRadius: 8, borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },

  /* Action sheet */
  modalScrim: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    backgroundColor: "#14142B",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 18, paddingBottom: 32, gap: 8,
    borderTopWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  actionHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignSelf: "center", marginBottom: 8,
  },
  actionTitle: {
    color: "#FFFFFF", fontSize: 15, fontWeight: "700",
    textAlign: "center", marginBottom: 8, paddingHorizontal: 8,
  },
  actionRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14,
  },
  actionRowText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600", flex: 1 },
  cancelBtn: {
    paddingVertical: 14, borderRadius: 14, marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
  },
  cancelBtnText: { color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: "600" },

  /* Confirm modal (web) */
  confirmCard: {
    margin: 24, padding: 24, borderRadius: 24,
    backgroundColor: "#14142B",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center", gap: 10, alignSelf: "center", width: 320,
    marginTop: "auto", marginBottom: "auto",
  },
  confirmTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  confirmBody: {
    color: "rgba(255,255,255,0.65)", fontSize: 13,
    textAlign: "center", lineHeight: 19,
  },
  confirmBtns: { flexDirection: "row", gap: 10, marginTop: 14, alignSelf: "stretch" },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  confirmCancel: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  confirmCancelText: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "600" },
  confirmDelete: { backgroundColor: "#FF4ECD" },
  confirmDeleteText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
