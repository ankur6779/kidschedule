import React, { useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, FlatList, Platform, ActivityIndicator,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuthFetch } from "@/hooks/useAuthFetch";

type Colors = ReturnType<typeof useColors>;

type DashboardSummary = {
  totalChildren: number;
  totalRoutines: number;
  positiveBehaviorsToday: number;
  negativeBehaviorsToday: number;
  routinesGeneratedThisWeek: number;
};

type RoutineItem = { status?: string };

type RecentRoutine = {
  id: number;
  title: string;
  date: string;
  childId: number;
  childName: string;
  items: RoutineItem[];
  createdAt: string;
};

type Child = { id: number; name: string; age: number; ageMonths?: number };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function pct(done: number, total: number): number {
  return total > 0 ? Math.round(done / total * 100) : 0;
}

export default function HomeScreen() {
  const { user } = useUser();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authFetch = useAuthFetch();

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: () => authFetch("/api/dashboard/summary").then(r => r.json()) as Promise<DashboardSummary>,
  });

  const {
    data: recentRoutines = [],
    isLoading: routinesLoading,
    refetch: refetchRoutines,
  } = useQuery<RecentRoutine[]>({
    queryKey: ["dashboard-recent-routines"],
    queryFn: () => authFetch("/api/dashboard/recent-routines").then(r => r.json()) as Promise<RecentRoutine[]>,
  });

  const {
    data: children = [],
    isLoading: childrenLoading,
    refetch: refetchChildren,
  } = useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: () => authFetch("/api/children").then(r => r.json()) as Promise<Child[]>,
  });

  const isLoading = summaryLoading || routinesLoading || childrenLoading;

  const onRefresh = useCallback(() => {
    refetchSummary();
    refetchRoutines();
    refetchChildren();
  }, [refetchSummary, refetchRoutines, refetchChildren]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const firstName = user?.firstName ?? "there";
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRoutines = recentRoutines.filter(r => r.date?.slice(0, 10) === todayStr);
  const allTodayItems = todayRoutines.flatMap(r => r.items ?? []);
  const completedToday = allTodayItems.filter(i => i.status === "completed").length;
  const totalToday = allTodayItems.length;
  const donePct = pct(completedToday, totalToday);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad + 100, paddingHorizontal: 20 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()},</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{firstName}</Text>
        </View>
        <TouchableOpacity
          style={[styles.coachBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(tabs)/coach")}
          testID="home-coach-btn"
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard title="Children" value={String(summary?.totalChildren ?? 0)} icon="people" color="#6366F1" bg="#EEF2FF" colors={colors} onPress={() => router.push("/(tabs)/children")} />
            <StatCard title="Routines" value={String(summary?.totalRoutines ?? 0)} icon="calendar" color="#A855F7" bg="#FAF5FF" colors={colors} onPress={() => router.push("/(tabs)/routines")} />
            <StatCard title="Done Today" value={String(completedToday)} icon="checkmark-circle" color="#10B981" bg="#F0FDF4" colors={colors} />
            <StatCard title="This Week" value={String(summary?.routinesGeneratedThisWeek ?? 0)} icon="trending-up" color="#F59E0B" bg="#FFFBEB" colors={colors} />
          </View>

          {totalToday > 0 && (
            <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.progressTop}>
                <Text style={[styles.progressTitle, { color: colors.foreground }]}>Today's Progress</Text>
                <Text style={[styles.progressPct, { color: "#10B981" }]}>{donePct}%</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                <View style={[styles.progressFill, { width: `${donePct}%`, backgroundColor: "#10B981" }]} />
              </View>
              <Text style={[styles.progressSub, { color: colors.mutedForeground }]}>
                {completedToday} of {totalToday} activities completed
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <SectionHeader title="Your Children" onSeeAll={() => router.push("/(tabs)/children")} colors={colors} />
            {children.length === 0 ? (
              <TouchableOpacity
                style={[styles.childAddChip, { backgroundColor: colors.card, borderColor: colors.primary }]}
                onPress={() => router.push("/children/new")}
                testID="add-child-chip"
              >
                <Ionicons name="add-circle" size={22} color={colors.primary} />
                <Text style={[styles.childChipName, { color: colors.primary }]}>Add your first child</Text>
              </TouchableOpacity>
            ) : (
              <FlatList
                horizontal
                data={[...children, { id: -1, name: "Add", age: -1 }]}
                keyExtractor={c => String(c.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
                scrollEnabled
                renderItem={({ item: c }) => {
                  if (c.id === -1) {
                    return (
                      <TouchableOpacity
                        style={[styles.childAddChip, { backgroundColor: colors.card, borderColor: colors.primary }]}
                        onPress={() => router.push("/children/new")}
                        testID="add-child-chip"
                      >
                        <Ionicons name="add-circle" size={22} color={colors.primary} />
                        <Text style={[styles.childChipName, { color: colors.primary }]}>Add</Text>
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.childChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                      onPress={() => router.push(`/children/${c.id}`)}
                      testID={`child-card-${c.id}`}
                    >
                      <Text style={styles.childEmoji}>{c.age < 5 ? "🧒" : "🧑"}</Text>
                      <View>
                        <Text style={[styles.childChipName, { color: colors.foreground }]}>{c.name}</Text>
                        <Text style={[styles.childChipAge, { color: colors.mutedForeground }]}>{c.age} yr{c.age !== 1 ? "s" : ""}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>

          {recentRoutines.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Recent Routines" onSeeAll={() => router.push("/(tabs)/routines")} colors={colors} />
              {recentRoutines.slice(0, 3).map(r => {
                const itemCount = r.items?.length ?? 0;
                const completedCount = r.items?.filter(i => i.status === "completed").length ?? 0;
                const p = pct(completedCount, itemCount);
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.routineCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push(`/routines/${r.id}`)}
                    testID={`recent-routine-${r.id}`}
                  >
                    <View style={styles.routineCardTop}>
                      <Text style={[styles.routineTitle, { color: colors.foreground }]} numberOfLines={2}>{r.title}</Text>
                      <Text style={[styles.routineDate, { color: colors.mutedForeground }]}>{formatDate(r.date)}</Text>
                    </View>
                    <Text style={[styles.routineChild, { color: colors.mutedForeground }]}>{r.childName}</Text>
                    {itemCount > 0 && (
                      <View style={styles.routineProgress}>
                        <View style={[styles.miniBar, { backgroundColor: colors.muted }]}>
                          <View style={[styles.miniFill, { width: `${p}%`, backgroundColor: "#10B981" }]} />
                        </View>
                        <Text style={[styles.miniPct, { color: colors.mutedForeground }]}>{completedCount}/{itemCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {children.length === 0 && !childrenLoading && (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="leaf" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Welcome to AmyNest!</Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Add your first child to get started with personalized routines.</Text>
              <TouchableOpacity style={[styles.emptyAction, { backgroundColor: colors.primary }]} onPress={() => router.push("/children/new")}>
                <Text style={styles.emptyActionText}>Add Child</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

type StatCardProps = { title: string; value: string; icon: React.ComponentProps<typeof Ionicons>["name"]; color: string; bg: string; colors: Colors; onPress?: () => void };
function StatCard({ title, value, icon, color, bg, colors, onPress }: StatCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.75 : 1} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{title}</Text>
    </TouchableOpacity>
  );
}

type SectionHeaderProps = { title: string; onSeeAll?: () => void; colors: Colors };
function SectionHeader({ title, onSeeAll, colors }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {onSeeAll && <TouchableOpacity onPress={onSeeAll}><Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text></TouchableOpacity>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  name: { fontSize: 26, fontFamily: "Inter_700Bold" },
  coachBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  loadingRow: { alignItems: "center", paddingTop: 60 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  statCard: { width: "47%", borderRadius: 18, borderWidth: 1, padding: 14, gap: 6 },
  statIconBox: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  progressCard: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 20, gap: 10 },
  progressTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  progressPct: { fontSize: 15, fontFamily: "Inter_700Bold" },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: { gap: 12, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  childChip: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, padding: 12 },
  childAddChip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", padding: 12 },
  childEmoji: { fontSize: 22 },
  childChipName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  childChipAge: { fontSize: 11, fontFamily: "Inter_400Regular" },
  routineCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 8 },
  routineCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  routineTitle: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold", lineHeight: 21 },
  routineDate: { fontSize: 12, fontFamily: "Inter_500Medium" },
  routineChild: { fontSize: 12, fontFamily: "Inter_400Regular" },
  routineProgress: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniBar: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  miniFill: { height: "100%", borderRadius: 2 },
  miniPct: { fontSize: 11, fontFamily: "Inter_500Medium", width: 36, textAlign: "right" },
  emptyCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", gap: 12, marginTop: 8 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  emptyAction: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  emptyActionText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
});
