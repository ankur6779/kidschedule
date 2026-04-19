import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

import { useProgress } from "@/contexts/ProgressContext";
import { useAppStore } from "@/store/useAppStore";
import { useAppDataRefresh } from "@/hooks/useAppDataRefresh";
import AppDataStatusBanner from "@/components/AppDataStatusBanner";
import DashboardHeader from "@/components/DashboardHeader";
import ChildCard from "@/components/ChildCard";
import RoutineCarousel from "@/components/RoutineCarousel";
import CoachProgressCard from "@/components/CoachProgressCard";
import HubSection from "@/components/HubSection";
import InsightCard from "@/components/InsightCard";

const RECO_ACCENTS: readonly (readonly [string, string])[] = [
  ["#7C3AED", "#A855F7"],
  ["#6D28D9", "#8B5CF6"],
  ["#5B21B6", "#7C3AED"],
];

const QUICK_ACTIONS = [
  { id: "coach", label: "Amy Coach", icon: "sparkles" as const, route: "/coach/premium", gradient: ["#7C3AED", "#A855F7"] as const },
  { id: "routine", label: "Routine", icon: "calendar" as const, route: "/routines/premium", gradient: ["#6D28D9", "#8B5CF6"] as const },
  { id: "hub", label: "Parent Hub", icon: "grid" as const, route: "/hub/premium", gradient: ["#5B21B6", "#7C3AED"] as const },
];

export default function PremiumDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    parentName,
    child,
    routine,
    routineCompleted,
    coach,
    coachProgress,
    totalProgress,
    recommendations,
    streakDays,
    dailyGoal,
    toggleTask,
  } = useProgress();

  const goTo = useCallback(
    (route: string) => {
      if (Platform.OS !== "web") Haptics.selectionAsync();
      router.push(route as never);
    },
    [router],
  );

  const liveData = useAppStore((s) => s.data);
  const liveDashboard = liveData?.dashboard;
  const liveRecs = liveData?.recommendations ?? [];
  const liveCoach = liveData?.coach;
  const liveRoutine = liveData?.routine;
  const { refreshing, onRefresh } = useAppDataRefresh();

  const displayParentName = liveData?.user?.name || parentName;
  const displayChildName = liveData?.children?.[0]?.name || child.name;
  const displayChildAge = liveData?.children?.[0]?.ageGroup || child.ageGroup;
  const liveTotalProgress = liveDashboard?.totalProgress ?? totalProgress;
  const liveStreak = liveDashboard?.streak ?? streakDays;

  const dailyGoalProgress = Math.min(1, liveTotalProgress);
  const dailyGoalPercent = Math.round(dailyGoalProgress * 100);
  const goalReached = dailyGoalPercent >= dailyGoal;

  const motivationalMsg = goalReached
    ? `You've crushed today's ${dailyGoal}% goal — incredible work.`
    : `${dailyGoal - dailyGoalPercent}% more to hit today's goal.`;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.bg}>
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
          }
        >
          {/* Header */}
          <DashboardHeader
            parentName={displayParentName}
            childName={displayChildName}
            onProfilePress={() => router.push("/(tabs)/profile" as never)}
          />

          <AppDataStatusBanner />

          {/* Streak + daily goal strip */}
          <Animated.View entering={FadeInDown.duration(450).delay(40)} style={styles.stripRow}>
            <View style={styles.stripCard}>
              <View style={[styles.stripIcon, { backgroundColor: "#7C3AED18" }]}>
                <Ionicons name="flame" size={18} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stripValue}>{liveStreak}-day streak</Text>
                <Text style={styles.stripLabel}>Keep it alive</Text>
              </View>
            </View>
            <View style={styles.stripCard}>
              <View style={[styles.stripIcon, { backgroundColor: goalReached ? "#6D28D918" : "#7C3AED18" }]}>
                <Ionicons
                  name={goalReached ? "trophy" : "rocket"}
                  size={18}
                  color={goalReached ? "#6D28D9" : "#7C3AED"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stripValue}>{dailyGoalPercent}% / {dailyGoal}%</Text>
                <Text style={styles.stripLabel}>Daily goal</Text>
              </View>
            </View>
          </Animated.View>

          {/* Motivational line */}
          <Animated.Text
            entering={FadeInDown.duration(450).delay(80)}
            style={styles.motivational}
          >
            {motivationalMsg}
          </Animated.Text>

          {/* Hero child card with progress ring */}
          <ChildCard
            childName={displayChildName}
            ageGroup={displayChildAge}
            focusGoal={child.focusGoal}
            progress={liveTotalProgress}
            onContinue={() => goTo("/coach/premium")}
          />

          {/* Today's Routine */}
          <View style={{ marginTop: 26 }}>
            <HubSection
              title="Today's Routine"
              subtitle={
                liveRoutine
                  ? `${liveRoutine.completedCount} of ${liveRoutine.totalCount} done`
                  : `${routineCompleted} of ${routine.length} done`
              }
              actionLabel="Open"
              onAction={() => goTo("/routines/premium")}
              delay={140}
            >
              <RoutineCarousel
                tasks={routine}
                onToggle={toggleTask}
              />
            </HubSection>
          </View>

          {/* Amy Coach Progress */}
          <HubSection title="Amy Coach Progress" delay={200}>
            <CoachProgressCard
              index={liveCoach?.currentStep ?? coach.index}
              total={liveCoach?.totalSteps ?? coach.total}
              title={liveCoach?.currentWin?.title ?? coach.title}
              summary={liveCoach?.currentWin?.summary ?? coach.summary}
              progress={liveCoach?.progress ?? coachProgress}
              onContinue={() => goTo("/coach/premium")}
            />
          </HubSection>

          {/* Insights & Recommendations */}
          <HubSection
            title="Based on your child"
            subtitle="Suggestions tuned to today's focus"
            delay={260}
            actionLabel="More"
            onAction={() => goTo("/hub/premium")}
          >
            <View style={styles.vList}>
              {(liveRecs.length > 0
                ? liveRecs.map((r, i) => ({
                    id: `live-${i}`,
                    title: r.title,
                    description: r.description,
                    tag: r.type,
                  }))
                : recommendations.map((r) => ({
                    id: r.id,
                    title: r.title,
                    description: r.description,
                    tag: r.tag,
                  }))
              ).map((r, i) => (
                <InsightCard
                  key={r.id}
                  title={r.title}
                  description={r.description}
                  category={String(r.tag).toUpperCase()}
                  readMinutes={3 + i}
                  accent={RECO_ACCENTS[i % RECO_ACCENTS.length]}
                  bookmarked={false}
                  onPress={() => goTo("/hub/premium")}
                  onBookmark={() => {}}
                />
              ))}
            </View>
          </HubSection>

          {/* Quick Actions */}
          <HubSection title="Quick Actions" delay={320}>
            <View style={styles.quickRow}>
              {QUICK_ACTIONS.map((q) => (
                <Pressable
                  key={q.id}
                  onPress={() => goTo(q.route)}
                  style={styles.quickBtn}
                  accessibilityRole="button"
                  accessibilityLabel={q.label}
                >
                  <LinearGradient
                    colors={q.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickIcon}
                  >
                    <Ionicons name={q.icon} size={22} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.quickLabel}>{q.label}</Text>
                </Pressable>
              ))}
            </View>
          </HubSection>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#FAF5FF",
  },
  stripRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  stripCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  stripIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  stripValue: {
    color: "#1F2937",
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  stripLabel: {
    color: "#6B7280",
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 1,
  },
  motivational: {
    color: "#7C3AED",
    fontSize: 13,
    fontWeight: "700",
    fontStyle: "italic",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  vList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  quickRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    color: "#1F2937",
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
});
