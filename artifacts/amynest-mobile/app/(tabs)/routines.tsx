import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, ViewStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuthFetch } from "@/hooks/useAuthFetch";

type RoutineItem = {
  time: string; activity: string; duration: number;
  category: string; status?: string;
};
type Routine = {
  id: number; childId: number; childName: string;
  date: string; title: string; items: RoutineItem[];
  createdAt: string;
};
type Child = { id: number; name: string };

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function completionPct(items: RoutineItem[]): number {
  if (!items.length) return 0;
  return Math.round(items.filter(i => i.status === "completed").length / items.length * 100);
}

export default function RoutinesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const [selectedChild, setSelectedChild] = useState<number | null>(null);

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: () => authFetch("/api/children").then(r => r.json()) as Promise<Child[]>,
  });

  const { data: routines = [], isLoading, isError, refetch } = useQuery<Routine[]>({
    queryKey: ["routines", selectedChild],
    queryFn: () => {
      const q = selectedChild ? `?childId=${selectedChild}` : "";
      return authFetch(`/api/routines${q}`).then(r => r.json()) as Promise<Routine[]>;
    },
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  type FilterItem = { id: number | null; name: string };
  const filterData: FilterItem[] = [{ id: null, name: "All" }, ...children.map(c => ({ id: c.id, name: c.name }))];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Routines</Text>
      </View>

      {children.length > 0 && (
        <FlatList
          horizontal
          data={filterData}
          keyExtractor={c => String(c.id ?? "all")}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}
          renderItem={({ item: c }) => {
            const active = c.id === null ? selectedChild === null : selectedChild === c.id;
            return (
              <TouchableOpacity
                style={[styles.filterChip, {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                }]}
                onPress={() => setSelectedChild(c.id ?? null)}
              >
                <Text style={[styles.filterChipText, { color: active ? "#fff" : colors.foreground }]}>{c.name}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Failed to load routines</Text>
          <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { borderColor: colors.primary }]}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : routines.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No routines yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Generate your first routine from the Home screen</Text>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={r => String(r.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: botPad + 90 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
          scrollEnabled={routines.length > 0}
          renderItem={({ item: r }) => {
            const pct = completionPct(r.items);
            const isToday = r.date.slice(0, 10) === new Date().toISOString().slice(0, 10);
            const progressFill: ViewStyle = {
              height: "100%",
              borderRadius: 2,
              width: `${pct}%`,
              backgroundColor: "#10B981",
            };
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/routines/${r.id}`)}
                testID={`routine-card-${r.id}`}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.dateBadge, { backgroundColor: isToday ? colors.primary : colors.secondary }]}>
                    <Text style={[styles.dateBadgeText, { color: isToday ? "#fff" : colors.primary }]}>
                      {formatDate(r.date)}
                    </Text>
                  </View>
                  <Text style={[styles.childTag, { color: colors.mutedForeground }]}>{r.childName}</Text>
                </View>
                <Text style={[styles.routineTitle, { color: colors.foreground }]} numberOfLines={2}>{r.title}</Text>
                <View style={styles.cardBottom}>
                  <View style={styles.metaRow}>
                    <Ionicons name="list-outline" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{r.items.length} activities</Text>
                  </View>
                  {pct > 0 && (
                    <View style={styles.progressRow}>
                      <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                        <View style={progressFill} />
                      </View>
                      <Text style={[styles.pctText, { color: "#10B981" }]}>{pct}%</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  retryText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  filterChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dateBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  childTag: { fontSize: 12, fontFamily: "Inter_500Medium" },
  routineTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", lineHeight: 22 },
  cardBottom: { gap: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  pctText: { fontSize: 12, fontFamily: "Inter_700Bold", width: 32 },
});
