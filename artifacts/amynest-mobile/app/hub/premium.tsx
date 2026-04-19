import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Platform,
  RefreshControl,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import HubSection from "@/components/HubSection";
import ActionCard from "@/components/ActionCard";
import ActivityCard from "@/components/ActivityCard";
import InsightCard from "@/components/InsightCard";
import AppDataStatusBanner from "@/components/AppDataStatusBanner";
import { useAppStore } from "@/store/useAppStore";
import { useAppDataRefresh } from "@/hooks/useAppDataRefresh";
import colors, { brand, brandAlpha } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";

type Filter = "all" | "behavior" | "sleep" | "focus";

const QUICK_ACTIONS = [
  {
    id: "coach",
    title: "Start Amy Coach",
    description: "Guided wins for today's challenges",
    icon: "sparkles" as const,
    gradient: [brand.purple500, "#EC4899"] as const,
    route: "/coach/premium",
  },
  {
    id: "routines",
    title: "View Routines",
    description: "Today's daily rhythm",
    icon: "calendar" as const,
    gradient: ["#06B6D4", "#3B82F6"] as const,
    route: "/routines/premium",
  },
  {
    id: "progress",
    title: "Track Progress",
    description: "See your child's wins",
    icon: "trending-up" as const,
    gradient: ["#10B981", "#06B6D4"] as const,
    route: "/progress",
  },
];

const ACTIVITIES = [
  {
    id: "brain",
    title: "Brain Activities",
    count: "12 activities",
    icon: "bulb" as const,
    gradient: [brand.purple500, "#EC4899"] as const,
    tag: "focus" as Filter,
  },
  {
    id: "art",
    title: "Art & Craft",
    count: "8 activities",
    icon: "color-palette" as const,
    gradient: ["#F97316", "#EC4899"] as const,
    tag: "all" as Filter,
  },
  {
    id: "games",
    title: "Learning Games",
    count: "15 games",
    icon: "game-controller" as const,
    gradient: ["#06B6D4", brand.indigo500] as const,
    tag: "focus" as Filter,
  },
  {
    id: "focus",
    title: "Focus Builders",
    count: "10 sessions",
    icon: "compass" as const,
    gradient: ["#10B981", "#06B6D4"] as const,
    tag: "focus" as Filter,
  },
];

const INSIGHTS = [
  {
    id: "i1",
    title: "Why kids resist instructions (and what to do instead)",
    description:
      "Resistance is rarely defiance — it's overwhelm or disconnection. Three tiny shifts that make instructions land instantly.",
    category: "BEHAVIOR",
    readMinutes: 4,
    accent: [brand.purple500, "#EC4899"] as const,
    tag: "behavior" as Filter,
  },
  {
    id: "i2",
    title: "How to reduce screen dependency without a battle",
    description:
      "Cold-turkey backfires. A gentle 7-day taper rebuilds your child's tolerance for boredom — the engine of imagination.",
    category: "FOCUS",
    readMinutes: 6,
    accent: ["#06B6D4", "#3B82F6"] as const,
    tag: "focus" as Filter,
  },
  {
    id: "i3",
    title: "Building sleep habits that actually stick",
    description:
      "Consistent wind-down beats strict bedtime. The 4-step pre-sleep ritual that resets even the most resistant sleeper.",
    category: "SLEEP",
    readMinutes: 5,
    accent: [brand.indigo500, brand.violet500] as const,
    tag: "sleep" as Filter,
  },
  {
    id: "i4",
    title: "The 'connection cup' theory of behaviour",
    description:
      "When a child's connection cup is empty, behaviour falls apart. How to refill it in 10 minutes a day.",
    category: "BEHAVIOR",
    readMinutes: 3,
    accent: ["#F97316", "#EF4444"] as const,
    tag: "behavior" as Filter,
  },
];

const RECOMMENDATIONS = [
  {
    id: "r1",
    title: "Improve focus plan",
    description: "A 14-day plan to grow your child's attention span — gently.",
    icon: "rocket" as const,
    gradient: [brand.purple500, "#EC4899"] as const,
    tag: "focus" as Filter,
  },
  {
    id: "r2",
    title: "Reduce tantrum strategy",
    description: "Spot the triggers before the storm — a parent's playbook.",
    icon: "shield-checkmark" as const,
    gradient: ["#06B6D4", "#3B82F6"] as const,
    tag: "behavior" as Filter,
  },
];

const FILTER_CHIPS: { id: Filter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "all", label: "All", icon: "apps" },
  { id: "behavior", label: "Behavior", icon: "happy" },
  { id: "sleep", label: "Sleep", icon: "moon" },
  { id: "focus", label: "Focus", icon: "compass" },
];

export default function PremiumHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});

  const matches = useCallback(
    (text: string) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return text.toLowerCase().includes(q);
    },
    [search],
  );

  const filteredActivities = useMemo(
    () =>
      ACTIVITIES.filter(
        (a) => (filter === "all" || a.tag === filter || a.tag === "all") && matches(a.title),
      ),
    [filter, matches],
  );
  // Live overlays from /api/app-data
  const liveInsightsRaw = useAppStore((s) => s.data?.insights ?? []);
  const liveRecsRaw = useAppStore((s) => s.data?.recommendations ?? []);

  const mergedInsights = useMemo(() => {
    const liveMapped = liveInsightsRaw.map((i, idx) => ({
      id: `live-i-${idx}`,
      title: i.title,
      description: i.description,
      category: "INSIGHT",
      readMinutes: 3,
      accent: [brand.purple500, "#EC4899"] as const,
      tag: "behavior" as Filter,
    }));
    return [...liveMapped, ...INSIGHTS];
  }, [liveInsightsRaw]);

  const mergedRecs = useMemo(() => {
    const liveMapped = liveRecsRaw.map((r, idx) => ({
      id: `live-r-${idx}`,
      title: r.title,
      description: r.description,
      tag: (r.type === "coach" ? "behavior" : r.type === "routine" ? "sleep" : "focus") as Filter,
      icon: (r.type === "coach" ? "sparkles" : r.type === "routine" ? "calendar" : "leaf") as keyof typeof Ionicons.glyphMap,
      gradient: [brand.purple500, "#EC4899"] as readonly [string, string],
    }));
    return [...liveMapped, ...RECOMMENDATIONS];
  }, [liveRecsRaw]);

  const filteredInsights = useMemo(
    () =>
      mergedInsights.filter(
        (i) => (filter === "all" || i.tag === filter) && (matches(i.title) || matches(i.description)),
      ),
    [filter, matches, mergedInsights],
  );
  const filteredRecs = useMemo(
    () =>
      mergedRecs.filter(
        (r) => (filter === "all" || r.tag === filter) && (matches(r.title) || matches(r.description)),
      ),
    [filter, matches, mergedRecs],
  );

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleFilter = useCallback((id: Filter) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setFilter(id);
  }, []);

  const goTo = useCallback(
    (route: string) => {
      router.push(route as never);
    },
    [router],
  );

  const { refreshing, onRefresh } = useAppDataRefresh();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[brand.violet50, "#EFF6FF", "#FFFBEB"]}
        locations={[0, 0.5, 1]}
        style={styles.bg}
      >
        {/* Decorative blobs */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.blob, { top: -40, left: -50, backgroundColor: brandAlpha.purple500_16 }]} />
          <View style={[styles.blob, { top: 280, right: -70, backgroundColor: "rgba(236,72,153,0.12)", width: 280, height: 280 }]} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.violet600} />
          }
        >
          {/* HEADER */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>EXPLORE</Text>
              <Text style={[styles.title, { color: c.textStrong }]}>Parent Hub</Text>
              <Text style={[styles.subtitle, { color: c.textSubtle }]}>Tools, activities & insights for you</Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.avatarBtn}
            >
              <LinearGradient
                colors={[brand.purple500, "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Ionicons name="person" size={20} color="#fff" />
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <AppDataStatusBanner />

          {/* SEARCH */}
          <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.searchWrap}>
            <Ionicons name="search" size={17} color={c.textFaint} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search activities, insights…"
              placeholderTextColor={c.textFaint}
              style={[styles.searchInput, { color: c.textStrong }]}
              accessibilityLabel="Search the Parent Hub"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} hitSlop={10} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={c.textFaint} />
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* FILTER CHIPS */}
          <Animated.View entering={FadeInDown.duration(500).delay(120)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {FILTER_CHIPS.map((c) => {
                const active = filter === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => handleFilter(c.id)}
                    activeOpacity={0.85}
                    style={[styles.chip, active && styles.chipActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${c.label}`}
                    accessibilityState={{ selected: active }}
                  >
                    <Ionicons name={c.icon} size={13} color={active ? "#fff" : brand.violet600} />
                    <Text style={[styles.chipText, active && { color: "#fff" }]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* QUICK ACTIONS */}
          <HubSection title="Quick Actions" subtitle="Jump back in" delay={160}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hCarousel}
            >
              {QUICK_ACTIONS.map((a) => (
                <ActionCard
                  key={a.id}
                  title={a.title}
                  description={a.description}
                  icon={a.icon}
                  gradient={a.gradient}
                  onPress={() => goTo(a.route)}
                  testID={`hub-action-${a.id}`}
                />
              ))}
            </ScrollView>
          </HubSection>

          {/* DAILY ACTIVITIES (2-col grid) */}
          <HubSection
            title="Daily Activities"
            subtitle="Hand-picked for today"
            delay={220}
            actionLabel="See all"
            onAction={() => {}}
          >
            <View style={styles.gridWrap}>
              {filteredActivities.length === 0 ? (
                <Text style={[styles.emptyText, { color: c.textFaint }]}>No activities match this filter.</Text>
              ) : (
                <View style={styles.grid}>
                  {filteredActivities.map((a) => (
                    <ActivityCard
                      key={a.id}
                      title={a.title}
                      count={a.count}
                      icon={a.icon}
                      gradient={a.gradient}
                      onPress={() => {}}
                      testID={`hub-activity-${a.id}`}
                    />
                  ))}
                </View>
              )}
            </View>
          </HubSection>

          {/* INSIGHTS */}
          <HubSection
            title="Parenting Insights"
            subtitle="Short reads, deep ideas"
            delay={280}
            actionLabel="Library"
            onAction={() => {}}
          >
            <View style={styles.vList}>
              {filteredInsights.length === 0 ? (
                <Text style={[styles.emptyText, { color: c.textFaint }]}>No insights match this filter.</Text>
              ) : (
                filteredInsights.map((i) => (
                  <InsightCard
                    key={i.id}
                    title={i.title}
                    description={i.description}
                    category={i.category}
                    readMinutes={i.readMinutes}
                    accent={i.accent}
                    bookmarked={!!bookmarks[i.id]}
                    onPress={() => {}}
                    onBookmark={() => toggleBookmark(i.id)}
                    testID={`hub-insight-${i.id}`}
                  />
                ))
              )}
            </View>
          </HubSection>

          {/* RECOMMENDATIONS */}
          <HubSection
            title="Recommended for your child"
            subtitle="Based on your recent goals"
            delay={340}
          >
            <View style={styles.vList}>
              {filteredRecs.length === 0 ? (
                <Text style={[styles.emptyText, { color: c.textFaint }]}>No suggestions match this filter.</Text>
              ) : (
                filteredRecs.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => goTo("/coach/premium")}
                    style={[styles.recCard, { backgroundColor: c.card, borderColor: c.border }]}
                    accessibilityRole="button"
                    accessibilityLabel={`${r.title}: ${r.description}`}
                  >
                    <LinearGradient
                      colors={r.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.recIcon}
                    >
                      <Ionicons name={r.icon} size={22} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recTitle, { color: c.textStrong }]}>{r.title}</Text>
                      <Text style={[styles.recDesc, { color: c.textSubtle }]} numberOfLines={2}>{r.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
                  </Pressable>
                ))
              )}
            </View>
          </HubSection>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  blob: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 9999,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  eyebrow: {
    color: brand.violet600,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: "500",
    marginTop: 4,
  },
  avatarBtn: {
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: brand.purple500,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 6,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "500",
    paddingVertical: Platform.OS === "ios" ? 0 : 8,
  },
  chipsRow: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: brandAlpha.violet600_25,
  },
  chipActive: {
    backgroundColor: colors.light.primary,
    borderColor: colors.light.primary,
  },
  chipText: {
    color: brand.violet600,
    fontSize: 13,
    fontWeight: "700",
  },
  hCarousel: {
    paddingHorizontal: 20,
    gap: 12,
  },
  gridWrap: {
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  vList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 18,
  },
  recCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  recIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  recTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  recDesc: {
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 3,
  },
});
