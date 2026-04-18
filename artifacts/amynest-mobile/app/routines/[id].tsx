import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Platform, ViewStyle,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import * as Haptics from "expo-haptics";

type RoutineItemStatus = "pending" | "completed" | "skipped" | "delayed";

type RoutineItem = {
  time: string; activity: string; duration: number;
  category: string; notes?: string;
  status?: RoutineItemStatus;
};
type Routine = {
  id: number; childId: number; childName: string;
  date: string; title: string; items: RoutineItem[];
};

const CATEGORY_COLORS: Record<string, string> = {
  morning_routine: "#F59E0B",
  meal: "#10B981",
  school: "#6366F1",
  study: "#8B5CF6",
  play: "#F97316",
  family: "#EC4899",
  creative: "#14B8A6",
  outdoor: "#84CC16",
  self_care: "#06B6D4",
  rest: "#6B7280",
  sleep: "#1E1B4B",
  default: "#9CA3AF",
};

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  morning_routine: "sunny-outline",
  meal: "restaurant-outline",
  school: "school-outline",
  study: "book-outline",
  play: "football-outline",
  family: "heart-outline",
  creative: "color-palette-outline",
  outdoor: "leaf-outline",
  self_care: "sparkles-outline",
  rest: "pause-circle-outline",
  sleep: "moon-outline",
  default: "ellipse-outline",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function completionStats(items: RoutineItem[]): { total: number; done: number; pct: number } {
  const total = items.length;
  const done = items.filter(i => i.status === "completed").length;
  return { total, done, pct: total > 0 ? Math.round(done / total * 100) : 0 };
}

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const authFetch = useAuthFetch();
  const qc = useQueryClient();

  const { data: routine, isLoading } = useQuery<Routine>({
    queryKey: ["routine", id],
    queryFn: () => authFetch(`/api/routines/${id}`).then(r => r.json()) as Promise<Routine>,
    enabled: !!id,
  });

  const [items, setItems] = useState<RoutineItem[]>([]);
  React.useEffect(() => {
    if (routine?.items) setItems(routine.items);
  }, [routine]);

  const mutation = useMutation({
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

  const toggleStatus = (idx: number) => {
    Haptics.selectionAsync();
    const updated = items.map((item, i) => {
      if (i !== idx) return item;
      const next: RoutineItemStatus = item.status === "completed" ? "pending" : "completed";
      return { ...item, status: next };
    });
    setItems(updated);
    mutation.mutate(updated);
  };

  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const stats = completionStats(items);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const progressBarFill: ViewStyle = {
    height: "100%",
    borderRadius: 3,
    width: `${stats.pct}%`,
    backgroundColor: "#10B981",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(_, idx) => String(idx)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: botPad + 32 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={items.length > 0}
        ListHeaderComponent={
          <View>
            <Text style={[styles.routineDate, { color: colors.mutedForeground }]}>{formatDate(routine?.date ?? "")}</Text>
            <Text style={[styles.routineTitle, { color: colors.foreground }]} numberOfLines={2}>{routine?.title}</Text>
            <Text style={[styles.childName, { color: colors.mutedForeground }]}>{routine?.childName}</Text>

            <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: colors.primary }]}>{stats.done}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Done</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: colors.foreground }]}>{stats.total - stats.done}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Remaining</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: "#10B981" }]}>{stats.pct}%</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Complete</Text>
                </View>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                <View style={progressBarFill} />
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Activities</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const catColor = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.default;
          const catIcon = CATEGORY_ICONS[item.category] ?? CATEGORY_ICONS.default;
          const isDone = item.status === "completed";
          return (
            <TouchableOpacity
              style={[styles.itemCard, { backgroundColor: colors.card, borderColor: isDone ? "#10B981" : colors.border }]}
              onPress={() => toggleStatus(index)}
              testID={`routine-item-${index}`}
            >
              <View style={[styles.timeCol, { borderRightColor: colors.border }]}>
                <Text style={[styles.timeText, { color: isDone ? colors.mutedForeground : colors.primary }]}>{item.time}</Text>
                <Text style={[styles.durationText, { color: colors.mutedForeground }]}>{item.duration}m</Text>
              </View>
              <View style={[styles.catIcon, { backgroundColor: `${catColor}20` }]}>
                <Ionicons name={catIcon} size={18} color={catColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.activityText,
                    { color: isDone ? colors.mutedForeground : colors.foreground },
                    isDone && styles.strikethrough,
                  ]}
                  numberOfLines={2}
                >
                  {item.activity}
                </Text>
                {item.notes && !isDone && (
                  <Text style={[styles.notesText, { color: colors.mutedForeground }]} numberOfLines={1}>{item.notes}</Text>
                )}
              </View>
              <View style={[styles.checkBox, { backgroundColor: isDone ? "#10B981" : "transparent", borderColor: isDone ? "#10B981" : colors.border }]}>
                {isDone && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  routineDate: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 8, marginBottom: 4 },
  routineTitle: { fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 28, marginBottom: 4 },
  childName: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 16 },
  statsCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 20, gap: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 2 },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  itemCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1.5, marginBottom: 10,
  },
  timeCol: { width: 54, borderRightWidth: 1, paddingRight: 12, gap: 2 },
  timeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  durationText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  catIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  activityText: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  strikethrough: { textDecorationLine: "line-through" },
  notesText: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  checkBox: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
});
