import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, FlatList, Platform, ActivityIndicator,
  Modal, Pressable, Animated, Dimensions, Easing,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
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

type RoutineItem = {
  time: string;
  activity: string;
  duration: number;
  category: string;
  notes?: string;
  status?: string;
};

type Routine = {
  id: number;
  title: string;
  date: string;
  childId: number;
  childName: string;
  items: RoutineItem[];
};

type Child = { id: number; name: string; age: number; ageMonths?: number };

type BehaviorStat = {
  childId: number;
  childName: string;
  positive: number;
  negative: number;
  neutral: number;
};

type ParentProfile = { name?: string };

// ─── Helpers ──────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good Morning";
  if (h >= 12 && h < 17) return "Good Afternoon";
  return "Good Evening";
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

function formatAge(age: number, ageMonths?: number): string {
  if (age === 0 && ageMonths) return `${ageMonths} month${ageMonths !== 1 ? "s" : ""}`;
  return `${age} year${age !== 1 ? "s" : ""}${ageMonths ? ` ${ageMonths}m` : ""}`;
}

function getAgeGroupInfo(age: number): { emoji: string; bg: string; color: string } {
  if (age <= 1) return { emoji: "👶", bg: "#FFF1F2", color: "#BE185D" };
  if (age <= 3) return { emoji: "🧒", bg: "#FEF3C7", color: "#B45309" };
  if (age <= 6) return { emoji: "🧒", bg: "#DCFCE7", color: "#15803D" };
  if (age <= 10) return { emoji: "🧑", bg: "#DBEAFE", color: "#1D4ED8" };
  return { emoji: "🧑‍🎓", bg: "#EDE9FE", color: "#6D28D9" };
}

function pct(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function parseTimeToMinutes(t: string): number {
  const [timePart, period] = (t ?? "").split(" ");
  const [hours, minutes] = timePart.split(":").map(Number);
  let h = hours;
  if (period === "PM" && hours !== 12) h += 12;
  if (period === "AM" && hours === 12) h = 0;
  return h * 60 + (minutes || 0);
}

function computeStreak(routines: Routine[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateSet = new Set(routines.map((r) => r.date.slice(0, 10)));
  let streak = 0;
  while (true) {
    const d = new Date(today);
    d.setDate(d.getDate() - streak);
    const key = d.toISOString().slice(0, 10);
    if (dateSet.has(key)) streak++;
    else break;
  }
  return streak;
}

// ─── Hero Greeting ────────────────────────────────────────────────────────
function HeroGreeting({
  displayName, hasChildren, onMenu,
}: { displayName: string; hasChildren: boolean; onMenu: () => void }) {
  return (
    <LinearGradient
      colors={["rgba(123,63,242,0.30)", "rgba(255,78,205,0.22)", "rgba(20,20,43,0.0)"] as const}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroGreeting}
    >
      <View style={styles.heroTopRow}>
        <View style={styles.heroBrandRow}>
          <AmyAvatar size={28} />
          <Text style={styles.heroBrand}>AmyNest <Text style={{ color: "#FF9FE0" }}>AI</Text></Text>
        </View>
        <TouchableOpacity onPress={onMenu} hitSlop={10} style={styles.menuBtn} activeOpacity={0.8}>
          <Ionicons name="menu" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.heroEyebrow}>{getGreeting().toUpperCase()}</Text>
      <Text style={styles.heroTitle}>
        👋 Hi{displayName ? `, ${displayName}` : ""}, let's make today easier
      </Text>
      <Text style={styles.heroSub}>
        {hasChildren
          ? "We've planned your child's day for you ❤️"
          : "Let's set up your child's first routine 🌟"}
      </Text>
    </LinearGradient>
  );
}

// ─── Children Strip ───────────────────────────────────────────────────────
function ChildrenStrip({ children, onPressChild, onAdd }: {
  children: Child[];
  onPressChild: (id: number) => void;
  onAdd: () => void;
}) {
  if (children.length === 0) return null;
  return (
    <View style={{ marginBottom: 18 }}>
      <View style={styles.stripHeader}>
        <Text style={styles.stripEyebrow}>YOUR LITTLE ONES</Text>
      </View>
      <FlatList
        horizontal
        data={[...children, { id: -1, name: "Add", age: -1 } as Child]}
        keyExtractor={(c) => String(c.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
        renderItem={({ item: c }) => {
          if (c.id === -1) {
            return (
              <TouchableOpacity style={styles.childAddCard} onPress={onAdd} testID="add-child-chip">
                <Text style={styles.childAddPlus}>➕</Text>
                <Text style={styles.childAddText}>Add child</Text>
              </TouchableOpacity>
            );
          }
          const info = getAgeGroupInfo(c.age);
          return (
            <TouchableOpacity
              style={[styles.childCard, { backgroundColor: info.bg }]}
              onPress={() => onPressChild(c.id)}
              testID={`child-card-${c.id}`}
              activeOpacity={0.85}
            >
              <View style={styles.childCardRow}>
                <View style={styles.childEmojiBubble}>
                  <Text style={styles.childEmojiText}>{info.emoji}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.childName, { color: info.color }]} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.childAge}>{formatAge(c.age, c.ageMonths)}</Text>
                </View>
              </View>
              <Text style={styles.childTagline} numberOfLines={1}>Personalised for {c.name}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

// ─── Now / Next Timeline ──────────────────────────────────────────────────
function NowNextTimeline({ routines, onGenerate, onOpen, onSeeAll }: {
  routines: Routine[];
  onGenerate: () => void;
  onOpen: (id: number) => void;
  onSeeAll: () => void;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRoutines = routines.filter((r) => r.date.slice(0, 10) === todayStr);

  if (todayRoutines.length === 0) {
    return (
      <LinearGradient colors={["rgba(79,195,247,0.18)", "rgba(123,63,242,0.18)"] as const} style={styles.timelineEmpty}>
        <Text style={{ fontSize: 32 }}>🗓️</Text>
        <Text style={styles.timelineEmptyTitle}>No plan for today yet</Text>
        <Text style={styles.timelineEmptySub}>Tap below to create today's routine in one tap.</Text>
        <TouchableOpacity onPress={onGenerate} activeOpacity={0.9}>
          <LinearGradient
            colors={["#A855F7", "#EC4899"] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.timelineEmptyBtn}
          >
            <Ionicons name="sparkles" size={16} color="#fff" />
            <Text style={styles.timelineEmptyBtnText}>Plan My Child's Day</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const allItems = todayRoutines.flatMap((r) =>
    r.items.map((item) => ({ ...item, childName: r.childName, routineId: r.id }))
  ).sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

  let currentIdx = -1;
  for (let i = 0; i < allItems.length; i++) {
    const itemMinutes = parseTimeToMinutes(allItems[i].time);
    const nextMinutes = i + 1 < allItems.length ? parseTimeToMinutes(allItems[i + 1].time) : 24 * 60;
    if (itemMinutes <= nowMinutes && nowMinutes < nextMinutes) { currentIdx = i; break; }
  }

  const displayItems = currentIdx >= 0
    ? allItems.slice(currentIdx, currentIdx + 3)
    : allItems.filter((item) => parseTimeToMinutes(item.time) > nowMinutes).slice(0, 3);

  if (displayItems.length === 0) {
    return (
      <LinearGradient colors={["rgba(16,185,129,0.18)", "rgba(79,195,247,0.14)"] as const} style={styles.timelineDone}>
        <Text style={{ fontSize: 28 }}>🌙</Text>
        <Text style={styles.timelineDoneTitle}>Day complete!</Text>
        <Text style={styles.timelineDoneSub}>Time to relax and recharge</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.timelineCard}>
      <LinearGradient
        colors={["rgba(123,63,242,0.22)", "rgba(255,78,205,0.18)"] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.timelineHeader}
      >
        <View style={styles.timelineHeaderLeft}>
          <Ionicons name="time-outline" size={16} color="#7C3AED" />
          <Text style={styles.timelineHeaderTitle}>Today's Timeline</Text>
        </View>
        <TouchableOpacity onPress={onSeeAll} style={styles.timelineHeaderRight}>
          <Text style={styles.timelineHeaderLink}>View all</Text>
          <Ionicons name="arrow-forward" size={12} color="#7C3AED" />
        </TouchableOpacity>
      </LinearGradient>
      <View style={{ padding: 10, gap: 8 }}>
        {displayItems.map((item, idx) => {
          const isCurrent = currentIdx >= 0 && idx === 0;
          const isNext = idx === (currentIdx >= 0 ? 1 : 0);
          const completed = item.status === "completed";
          const Wrapper: any = isCurrent ? LinearGradient : View;
          const wrapperProps = isCurrent
            ? { colors: ["#A855F7", "#EC4899"] as const, start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, style: [styles.timelineRow, styles.timelineRowCurrent] }
            : { style: styles.timelineRow };
          return (
            <TouchableOpacity
              key={`${item.routineId}-${idx}`}
              activeOpacity={0.85}
              onPress={() => onOpen(item.routineId)}
            >
              <Wrapper {...wrapperProps}>
                <View style={styles.timelineTime}>
                  <Text style={[styles.timelineTimeText, isCurrent && { color: "#fff" }]}>{item.time}</Text>
                  {isCurrent && (
                    <View style={styles.timelineNowBadge}>
                      <Text style={styles.timelineNowText}>NOW</Text>
                    </View>
                  )}
                  {!isCurrent && isNext && (
                    <View style={styles.timelineNextBadge}>
                      <Text style={styles.timelineNextText}>NEXT</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[
                      styles.timelineActivity,
                      isCurrent && { color: "#fff" },
                      completed && { textDecorationLine: "line-through", opacity: 0.6 },
                    ]}
                    numberOfLines={2}
                  >
                    {item.activity}
                  </Text>
                  <Text style={[styles.timelineMeta, isCurrent && { color: "rgba(255,255,255,0.85)" }]}>
                    {item.childName} · {item.duration}m
                  </Text>
                </View>
                {completed && !isCurrent && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </Wrapper>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Streak Card ──────────────────────────────────────────────────────────
function StreakCard({ streak, onPress }: { streak: number; onPress: () => void }) {
  const isHot = streak >= 3;
  const isWarm = streak > 0 && streak < 3;
  const grad = isHot
    ? ["rgba(251,113,133,0.35)", "rgba(251,146,60,0.28)"] as const
    : isWarm
    ? ["rgba(251,146,60,0.22)", "rgba(245,158,11,0.16)"] as const
    : ["rgba(123,63,242,0.18)", "rgba(255,78,205,0.10)"] as const;
  const numColor = isHot ? "#FFFFFF" : isWarm ? "#FED7AA" : "rgba(255,255,255,0.92)";
  const labelColor = "rgba(255,255,255,0.85)";
  const subColor = "rgba(255,255,255,0.6)";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ flex: 1 }}>
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.streakCard}>
        <Text style={[styles.streakEmoji, streak === 0 && { opacity: 0.5 }]}>🔥</Text>
        <Text style={[styles.streakNum, { color: numColor }]}>{streak}</Text>
        <Text style={[styles.streakLabel, { color: labelColor }]}>Day Streak</Text>
        <Text style={[styles.streakSub, { color: subColor }]}>
          {streak === 0 ? "Start today!" : "Tap for progress"}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Amy AI Avatar (cute animated face) ──────────────────────────────────
function AmyAvatar({ size = 28, animated = false }: { size?: number; animated?: boolean }) {
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -6, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    );
    const rotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rot, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rot, { toValue: -1, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    floatLoop.start();
    pulseLoop.start();
    rotLoop.start();
    return () => {
      floatLoop.stop();
      pulseLoop.stop();
      rotLoop.stop();
    };
  }, [animated, float, pulse, rot]);

  const ringPad = Math.max(2, Math.round(size * 0.08));
  const inner = size - ringPad * 2;
  const rotate = rot.interpolate({ inputRange: [-1, 1], outputRange: ["-4deg", "4deg"] });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [{ translateY: float }, { scale: pulse }, { rotate }],
      }}
    >
      <LinearGradient
        colors={["#7B3FF2", "#FF4ECD", "#4FC3F7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#FF4ECD",
          shadowOpacity: 0.6,
          shadowRadius: size * 0.4,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        }}
      >
        <View
          style={{
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: "#FFE4F1",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <Text style={{ fontSize: inner * 0.62, lineHeight: inner }}>🐣</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Side Drawer (right slide-in nav) ─────────────────────────────────────
const DRAWER_ITEMS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { key: "dashboard", label: "Dashboard",     icon: "home-outline",          route: "/(tabs)/" },
  { key: "hub",       label: "Parenting Hub", icon: "library-outline",       route: "/(tabs)/coach" },
  { key: "coach",     label: "Amy Coach",     icon: "sparkles-outline",      route: "/(tabs)/coach" },
  { key: "children",  label: "Children",      icon: "people-outline",        route: "/(tabs)/children" },
  { key: "routines",  label: "Routines",      icon: "calendar-outline",      route: "/(tabs)/routines" },
  { key: "progress",  label: "Progress",      icon: "trending-up-outline",   route: "/(tabs)/routines" },
  { key: "behavior",  label: "Behavior",      icon: "happy-outline",         route: "/(tabs)/" },
  { key: "amy",       label: "Amy AI",        icon: "chatbubbles-outline",   route: "/(tabs)/coach" },
  { key: "babysitters", label: "Babysitters", icon: "heart-outline",         route: "/(tabs)/profile" },
];

function SideDrawer({
  open, onClose, activeKey, onNavigate,
}: { open: boolean; onClose: () => void; activeKey: string; onNavigate: (route: string) => void }) {
  const screenW = Dimensions.get("window").width;
  const drawerW = Math.min(300, screenW * 0.82);
  const tx = useRef(new Animated.Value(drawerW)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(tx, { toValue: open ? 0 : drawerW, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fade, { toValue: open ? 1 : 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [open, tx, fade, drawerW]);

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.drawerScrim, { opacity: fade }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          styles.drawerPanel,
          { width: drawerW, transform: [{ translateX: tx }] },
        ]}
      >
        <LinearGradient
          colors={["#0B0B1A", "#14142B", "#1B1B3A"]}
          style={{ flex: 1, paddingTop: 56, paddingHorizontal: 16, paddingBottom: 20 }}
        >
          <View style={styles.drawerHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <AmyAvatar size={34} />
              <View>
                <Text style={styles.drawerBrand}>AmyNest</Text>
                <Text style={styles.drawerBrandSub}>AI Parenting Coach</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
            {DRAWER_ITEMS.map((item) => {
              const active = item.key === activeKey;
              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.85}
                  onPress={() => { onClose(); setTimeout(() => onNavigate(item.route), 220); }}
                  style={{ marginBottom: 6 }}
                >
                  {active ? (
                    <LinearGradient
                      colors={["#7B3FF2", "#FF4ECD"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.drawerItem, styles.drawerItemActive]}
                    >
                      <Ionicons name={item.icon} size={18} color="#FFFFFF" />
                      <Text style={[styles.drawerItemLabel, { color: "#FFFFFF" }]}>{item.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.drawerItem}>
                      <Ionicons name={item.icon} size={18} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.drawerItemLabel}>{item.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

// ─── Floating Amy AI button ───────────────────────────────────────────────
function AmyFAB({ onPress, bottomOffset }: { onPress: () => void; bottomOffset: number }) {
  return (
    <View pointerEvents="box-none" style={[styles.fabWrap, { bottom: bottomOffset }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.fabHit}>
        <View style={styles.fabRing}>
          <AmyAvatar size={56} animated />
        </View>
        <View style={styles.fabTooltip}>
          <Text style={styles.fabTooltipText}>Talk to Amy AI</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Stat Card (pastel) ───────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, gradient, accent, onPress }: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  gradient: readonly [string, string];
  accent: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.85 : 1} onPress={onPress} style={styles.statCardWrap}>
      <LinearGradient colors={gradient} style={styles.statCard}>
        <View style={styles.statTopRow}>
          <Text style={[styles.statLabel, { color: accent }]}>{label}</Text>
          <Ionicons name={icon} size={14} color={accent} />
        </View>
        <View style={styles.statBottom}>
          <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
          <Text style={[styles.statSub, { color: accent + "BB" }]}>{sub}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Amy AI Suggests ──────────────────────────────────────────────────────
function AmySuggestsCard({ routines, streak }: { routines: Routine[]; streak: number }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRoutines = routines.filter((r) => r.date.slice(0, 10) === todayStr);
  const allItems = todayRoutines.flatMap((r) => r.items);
  const total = allItems.length;
  const completed = allItems.filter((i) => i.status === "completed").length;
  const p = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hour = new Date().getHours();

  const suggestions: { emoji: string; text: string; bg: string; border: string; color: string }[] = [];

  if (total === 0) {
    suggestions.push({ emoji: "📅", text: "No routine for today yet. Generate one to get started!", bg: "rgba(99,102,241,0.16)", border: "rgba(99,102,241,0.35)", color: "#C7D2FE" });
  } else if (p < 30 && hour >= 14) {
    suggestions.push({ emoji: "⚡", text: "Your child seems behind today — try shorter, easier tasks to build momentum.", bg: "rgba(245,158,11,0.16)", border: "rgba(245,158,11,0.35)", color: "#FDE68A" });
  } else if (p >= 80) {
    suggestions.push({ emoji: "🌟", text: "Amazing progress today! Consider a small reward to celebrate.", bg: "rgba(34,197,94,0.16)", border: "rgba(34,197,94,0.35)", color: "#BBF7D0" });
  }
  if (hour >= 15 && hour <= 17) {
    suggestions.push({ emoji: "❤️", text: "Good time for a 15-min bonding activity — a quick walk or board game goes a long way.", bg: "rgba(244,63,94,0.16)", border: "rgba(244,63,94,0.35)", color: "#FECDD3" });
  }
  if (streak >= 3) {
    suggestions.push({ emoji: "🔥", text: `You're on a ${streak}-day streak! Keep the momentum going — consistency builds habits.`, bg: "rgba(249,115,22,0.16)", border: "rgba(249,115,22,0.35)", color: "#FED7AA" });
  } else if (streak === 0 && hour < 10) {
    suggestions.push({ emoji: "☀️", text: "Fresh start today! Generate a routine to set a positive tone for the day.", bg: "rgba(79,195,247,0.16)", border: "rgba(79,195,247,0.35)", color: "#BAE6FD" });
  }
  if (hour >= 19) {
    suggestions.push({ emoji: "🌙", text: "Wind-down time! Make sure screen time ends 30 min before sleep for better rest.", bg: "rgba(123,63,242,0.16)", border: "rgba(123,63,242,0.35)", color: "#C7D2FE" });
  }

  const display = suggestions.slice(0, 3);

  return (
    <View style={styles.amyCard}>
      <LinearGradient
        colors={["rgba(123,63,242,0.22)", "rgba(255,78,205,0.18)"] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.amyHeader}
      >
        <View style={styles.amyHeaderLeft}>
          <View style={styles.amyAvatar}>
            <Ionicons name="heart" size={14} color="#fff" />
          </View>
          <View>
            <Text style={styles.amyTitle}>Amy AI Suggests</Text>
            <Text style={styles.amySub}>Caring nudges from Amy 💜</Text>
          </View>
        </View>
      </LinearGradient>
      <View style={{ padding: 12, gap: 8 }}>
        {display.length === 0 ? (
          <View style={[styles.amyTip, { backgroundColor: "#1B1B3A", borderColor: "rgba(255,255,255,0.08)" }]}>
            <Text style={{ fontSize: 16 }}>💜</Text>
            <Text style={[styles.amyTipText, { color: "rgba(255,255,255,0.85)" }]}>Looking good — keep it going!</Text>
          </View>
        ) : (
          display.map((s, i) => (
            <View key={i} style={[styles.amyTip, { backgroundColor: s.bg, borderColor: s.border }]}>
              <Text style={{ fontSize: 16 }}>{s.emoji}</Text>
              <Text style={[styles.amyTipText, { color: s.color }]}>{s.text}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

// ─── Parent Score Card ────────────────────────────────────────────────────
function ParentScoreCard({ routines, streak }: { routines: Routine[]; streak: number }) {
  const last7 = routines.slice(0, 7);
  const items = last7.flatMap((r) => r.items);
  const total = items.length;
  const done = items.filter((i) => i.status === "completed").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
  const daysActive = last7.length;
  const streakBonus = Math.min(streak * 5, 30);
  const score = Math.min(Math.round(completionRate * 0.5 + daysActive * 5 + streakBonus), 100);
  const percentile = score >= 80 ? 90 : score >= 60 ? 70 : score >= 40 ? 50 : score >= 20 ? 30 : 15;
  const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";
  const ringColor = score >= 80 ? "#22C55E" : score >= 60 ? "#3B82F6" : score >= 40 ? "#F59E0B" : "#EF4444";

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <View style={styles.scoreCard}>
      <LinearGradient
        colors={["rgba(16,185,129,0.18)", "rgba(79,195,247,0.14)"] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.scoreHeader}
      >
        <Ionicons name="sparkles" size={14} color="#16A34A" />
        <View style={{ flex: 1 }}>
          <Text style={styles.scoreTitle}>Your Parent Score</Text>
          <Text style={styles.scoreSub}>Based on last 7 days</Text>
        </View>
      </LinearGradient>
      <View style={styles.scoreBody}>
        <View style={styles.scoreRingWrap}>
          <Svg width={70} height={70} viewBox="0 0 70 70">
            <Circle cx={35} cy={35} r={radius} stroke="#E5E7EB" strokeWidth={5} fill="none" />
            <Circle
              cx={35}
              cy={35}
              r={radius}
              stroke={ringColor}
              strokeWidth={5}
              fill="none"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeLinecap="round"
              transform="rotate(-90 35 35)"
            />
          </Svg>
          <View style={styles.scoreRingCenter}>
            <Text style={[styles.scoreGrade, { color: ringColor }]}>{grade}</Text>
            <Text style={styles.scoreOf}>{score}/100</Text>
          </View>
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={styles.scoreBetter}>
            Better than <Text style={{ color: "#A855F7", fontFamily: "Inter_700Bold" }}>{percentile}%</Text> of parents!
          </Text>
          <View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreRowLabel}>Task completion</Text>
              <Text style={styles.scoreRowValue}>{completionRate}%</Text>
            </View>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${completionRate}%`, backgroundColor: "#A855F7" }]} />
            </View>
          </View>
          <View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreRowLabel}>Days active</Text>
              <Text style={styles.scoreRowValue}>{daysActive}/7</Text>
            </View>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${(daysActive / 7) * 100}%`, backgroundColor: "#EC4899" }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Onboarding Screen ────────────────────────────────────────────────────
function OnboardingScreen({ displayName, onAddChild, onCoach }: {
  displayName: string;
  onAddChild: () => void;
  onCoach: () => void;
}) {
  const features = [
    { emoji: "🧠", label: "Amy AI Routine Generator", desc: "Smart daily schedules tailored to your child's age and needs.", bg: "rgba(99,102,241,0.14)", border: "rgba(99,102,241,0.35)", grad: ["#3B82F6", "#6366F1"] as const },
    { emoji: "📊", label: "Progress Tracking", desc: "Monitor growth, streaks, and milestones in one beautiful view.", bg: "rgba(16,185,129,0.14)", border: "rgba(16,185,129,0.35)", grad: ["#10B981", "#14B8A6"] as const },
    { emoji: "🎯", label: "Daily Activities", desc: "Age-based activities that build skills while keeping kids engaged.", bg: "rgba(249,115,22,0.14)", border: "rgba(249,115,22,0.35)", grad: ["#F97316", "#F59E0B"] as const },
    { emoji: "🧩", label: "Learning & Puzzles", desc: "Adaptive daily puzzles that grow harder as your child levels up.", bg: "rgba(168,85,247,0.16)", border: "rgba(168,85,247,0.4)", grad: ["#A855F7", "#9333EA"] as const },
    { emoji: "❤️", label: "Parenting Tips", desc: "Expert-curated tips, sleep guides, and milestone insights.", bg: "rgba(244,63,94,0.14)", border: "rgba(244,63,94,0.35)", grad: ["#F43F5E", "#EC4899"] as const },
  ];

  return (
    <View style={{ paddingHorizontal: 4 }}>
      <LinearGradient
        colors={["#2563EB", "#6366F1", "#7C3AED"] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.onbHero}
      >
        <View style={styles.onbHeroEmoji}>
          <Text style={{ fontSize: 64 }}>👨‍👧✨</Text>
        </View>
        <Text style={styles.onbHeroEyebrow}>MEET AMY AI</Text>
        <Text style={styles.onbHeroTitle}>
          👋 Hi{displayName ? `, ${displayName}` : ""} 😊
        </Text>
        <Text style={styles.onbHeroSub}>I'm Amy — your smart parenting partner ❤️</Text>
        <Text style={styles.onbHeroBody}>
          Create personalised routines, track progress, and make parenting easier — one day at a time.
        </Text>
      </LinearGradient>

      <View style={styles.onbDivider}>
        <View style={styles.onbDividerLine} />
        <Text style={styles.onbDividerText}>Start your child's smart routine today 🚀</Text>
        <View style={styles.onbDividerLine} />
      </View>

      <View style={{ gap: 10, marginBottom: 20 }}>
        {features.map((f) => (
          <View key={f.label} style={[styles.onbFeature, { backgroundColor: f.bg, borderColor: f.border }]}>
            <LinearGradient colors={f.grad} style={styles.onbFeatureIcon}>
              <Text style={{ fontSize: 18 }}>{f.emoji}</Text>
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.onbFeatureLabel}>{f.emoji} {f.label}</Text>
              <Text style={styles.onbFeatureDesc}>{f.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={onCoach} activeOpacity={0.9}>
        <LinearGradient
          colors={["#6366F1", "#A855F7"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.onbPrimary}
        >
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text style={styles.onbPrimaryText}>✨ Experience Now</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={onAddChild} activeOpacity={0.85} style={styles.onbSecondary}>
        <Ionicons name="person-add-outline" size={16} color="#374151" />
        <Text style={styles.onbSecondaryText}>Add your first child</Text>
      </TouchableOpacity>

      <Text style={styles.onbFooter}>Works for ages 0–15 years · Science-backed parenting plans</Text>
    </View>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useUser();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    authFetch("/api/parent-profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ParentProfile | null) => { if (d?.name) setProfileName(d.name); })
      .catch(() => {});
  }, [authFetch]);

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: () => authFetch("/api/dashboard/summary").then((r) => r.json()),
  });

  const { data: recentRoutines = [], refetch: refetchRecent } = useQuery<Routine[]>({
    queryKey: ["dashboard-recent-routines"],
    queryFn: () => authFetch("/api/dashboard/recent-routines").then((r) => r.json()),
  });

  const { data: allRoutines = [], refetch: refetchAll } = useQuery<Routine[]>({
    queryKey: ["routines-all"],
    queryFn: () => authFetch("/api/routines").then((r) => r.json()),
  });

  const { data: childrenList = [], refetch: refetchChildren } = useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: () => authFetch("/api/children").then((r) => r.json()),
  });

  const { data: behaviorStats = [], refetch: refetchStats } = useQuery<BehaviorStat[]>({
    queryKey: ["behavior-stats"],
    queryFn: () => authFetch("/api/dashboard/behavior-stats").then((r) => r.json()),
  });

  const onRefresh = useCallback(() => {
    refetchSummary(); refetchRecent(); refetchAll(); refetchChildren(); refetchStats();
  }, [refetchSummary, refetchRecent, refetchAll, refetchChildren, refetchStats]);

  const displayName = useMemo(
    () => profileName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "",
    [profileName, user]
  );

  const streak = useMemo(() => computeStreak(allRoutines), [allRoutines]);
  const noChildren = !summaryLoading && (summary?.totalChildren ?? 0) === 0;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  if (summaryLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: botPad + 110, paddingHorizontal: 16 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {noChildren ? (
        <OnboardingScreen
          displayName={displayName}
          onAddChild={() => router.push("/children/new")}
          onCoach={() => router.push("/(tabs)/coach")}
        />
      ) : (
        <>
          <HeroGreeting
            displayName={displayName}
            hasChildren={(childrenList.length ?? 0) > 0}
            onMenu={() => setDrawerOpen(true)}
          />

          <View style={{ height: 16 }} />
          <ChildrenStrip
            children={childrenList}
            onPressChild={(id) => router.push(`/children/${id}`)}
            onAdd={() => router.push("/children/new")}
          />

          {/* Timeline + Streak */}
          <View style={styles.timelineRowWrap}>
            <View style={{ flex: 1 }}>
              <NowNextTimeline
                routines={allRoutines}
                onGenerate={() => router.push("/routines/generate")}
                onOpen={(id) => router.push(`/routines/${id}`)}
                onSeeAll={() => router.push("/(tabs)/routines")}
              />
            </View>
            <View style={{ width: 120 }}>
              <StreakCard streak={streak} onPress={() => router.push("/(tabs)/routines")} />
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Routines"
              value={summary?.routinesGeneratedThisWeek ?? 0}
              sub="this week"
              icon="calendar-outline"
              gradient={["rgba(123,63,242,0.22)", "rgba(123,63,242,0.08)"]}
              accent="#C4A8FF"
              onPress={() => router.push("/(tabs)/routines")}
            />
            <StatCard
              label="Great Job"
              value={summary?.positiveBehaviorsToday ?? 0}
              sub="today"
              icon="trending-up-outline"
              gradient={["rgba(52,211,153,0.22)", "rgba(52,211,153,0.06)"]}
              accent="#6EE7B7"
            />
            <StatCard
              label="Challenging"
              value={summary?.negativeBehaviorsToday ?? 0}
              sub="today"
              icon="trending-down-outline"
              gradient={["rgba(255,78,205,0.22)", "rgba(255,78,205,0.06)"]}
              accent="#FF9FE0"
            />
            <StatCard
              label="Children"
              value={summary?.totalChildren ?? 0}
              sub="total"
              icon="people-outline"
              gradient={["rgba(79,195,247,0.22)", "rgba(79,195,247,0.06)"]}
              accent="#7DD3FC"
              onPress={() => router.push("/(tabs)/children")}
            />
          </View>

          {/* Amy Suggests */}
          <AmySuggestsCard routines={allRoutines} streak={streak} />

          {/* Parent Score */}
          <ParentScoreCard routines={allRoutines} streak={streak} />

          {/* Recent Routines */}
          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <View style={styles.listHeaderLeft}>
                <Ionicons name="calendar" size={16} color="#A855F7" />
                <View>
                  <Text style={styles.listTitle}>Recent Routines</Text>
                  <Text style={styles.listSub}>Latest generated schedules</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => router.push("/(tabs)/routines")} style={styles.listLink}>
                <Text style={styles.listLinkText}>View all</Text>
                <Ionicons name="arrow-forward" size={12} color="#A855F7" />
              </TouchableOpacity>
            </View>
            {recentRoutines.length === 0 ? (
              <View style={styles.listEmpty}>
                <Ionicons name="calendar-outline" size={36} color="#D4D4D8" />
                <Text style={styles.listEmptyText}>No routines created yet.</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/coach")}>
                  <Text style={styles.listEmptyLink}>Create your first routine</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {recentRoutines.slice(0, 4).map((r) => {
                  const items = r.items ?? [];
                  const done = items.filter((i) => i.status === "completed").length;
                  const p = pct(done, items.length);
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={styles.listRow}
                      onPress={() => router.push(`/routines/${r.id}`)}
                      activeOpacity={0.85}
                      testID={`recent-routine-${r.id}`}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.listRowTitle} numberOfLines={1}>{r.title}</Text>
                        <View style={styles.listRowMeta}>
                          <View style={styles.listChildPill}>
                            <Text style={styles.listChildPillText}>{r.childName}</Text>
                          </View>
                          <Text style={styles.listRowDate}>{formatDate(r.date)}</Text>
                        </View>
                      </View>
                      {items.length > 0 && (
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={styles.listRowPct}>{p}%</Text>
                          <Text style={styles.listRowDone}>{done}/{items.length}</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={16} color="#A1A1AA" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Behavior Highlights */}
          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <View style={styles.listHeaderLeft}>
                <Ionicons name="pulse" size={16} color="#EC4899" />
                <View>
                  <Text style={styles.listTitle}>Behavior Highlights</Text>
                  <Text style={styles.listSub}>Overall stats by child</Text>
                </View>
              </View>
            </View>
            {behaviorStats.length === 0 ? (
              <View style={styles.listEmpty}>
                <Ionicons name="star-outline" size={36} color="#D4D4D8" />
                <Text style={styles.listEmptyText}>No behavior logged yet.</Text>
              </View>
            ) : (
              <View>
                {behaviorStats.map((stat) => (
                  <View key={stat.childId} style={styles.behaviorRow}>
                    <Text style={styles.behaviorChild}>{stat.childName}</Text>
                    <View style={styles.behaviorStats}>
                      <View style={[styles.behaviorChip, { backgroundColor: "#ECFDF5" }]}>
                        <Ionicons name="trending-up" size={12} color="#10B981" />
                        <Text style={[styles.behaviorChipText, { color: "#047857" }]}>{stat.positive}</Text>
                      </View>
                      <View style={[styles.behaviorChip, { backgroundColor: "#FEF2F2" }]}>
                        <Ionicons name="trending-down" size={12} color="#EF4444" />
                        <Text style={[styles.behaviorChipText, { color: "#B91C1C" }]}>{stat.negative}</Text>
                      </View>
                      <View style={[styles.behaviorChip, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
                        <Ionicons name="remove" size={12} color="#71717A" />
                        <Text style={[styles.behaviorChipText, { color: "#52525B" }]}>{stat.neutral}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Big primary CTA */}
          <TouchableOpacity onPress={() => router.push("/(tabs)/coach")} activeOpacity={0.9} style={{ marginTop: 4 }}>
            <LinearGradient
              colors={["#A855F7", "#EC4899", "#F43F5E"] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bigCta}
            >
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={styles.bigCtaText}>✨ Plan My Child's Day</Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>

    {!noChildren && (
      <AmyFAB
        onPress={() => router.push("/(tabs)/coach")}
        bottomOffset={botPad + 96}
      />
    )}

    <SideDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      activeKey="dashboard"
      onNavigate={(route) => router.push(route as any)}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* HERO */
  heroGreeting: {
    borderRadius: 24,
    padding: 22,
  },
  heroEyebrow: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.4,
    color: "rgba(146,64,14,0.85)",
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.78)",
  },

  /* CHILDREN STRIP */
  stripHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4, marginBottom: 8 },
  stripEyebrow: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2, color: "rgba(255,255,255,0.6)" },
  childCard: {
    minWidth: 180,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.04)",
  },
  childCardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  childEmojiBubble: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: "#14142B",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  childEmojiText: { fontSize: 22 },
  childName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  childAge: { fontSize: 11, color: "rgba(31,41,55,0.6)", fontFamily: "Inter_400Regular", marginTop: 2 },
  childTagline: { fontSize: 11, color: "rgba(31,41,55,0.6)", fontFamily: "Inter_400Regular", fontStyle: "italic", marginTop: 8 },
  childAddCard: {
    minWidth: 130, borderRadius: 22, padding: 14, borderWidth: 1.5, borderStyle: "dashed",
    borderColor: "#D4D4D8", backgroundColor: "rgba(244,244,245,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  childAddPlus: { fontSize: 22, marginBottom: 4 },
  childAddText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "rgba(31,41,55,0.7)" },

  /* TIMELINE */
  timelineRowWrap: { flexDirection: "row", gap: 10, marginBottom: 16, alignItems: "stretch" },
  timelineCard: {
    backgroundColor: "#14142B", borderRadius: 22, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  timelineHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, paddingHorizontal: 14 },
  timelineHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  timelineHeaderTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  timelineHeaderRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  timelineHeaderLink: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#7C3AED" },
  timelineRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(244,244,245,0.5)", borderRadius: 16, padding: 10,
  },
  timelineRowCurrent: { backgroundColor: "transparent", shadowColor: "#A855F7", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  timelineTime: { width: 56, alignItems: "center", gap: 4 },
  timelineTimeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "rgba(31,41,55,0.7)" },
  timelineNowBadge: { backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  timelineNowText: { fontSize: 8, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.5 },
  timelineNextBadge: { backgroundColor: "#EDE9FE", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  timelineNextText: { fontSize: 8, fontFamily: "Inter_700Bold", color: "#6D28D9", letterSpacing: 0.5 },
  timelineActivity: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  timelineMeta: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(113,113,122,0.9)", marginTop: 2 },
  timelineEmpty: {
    borderRadius: 22, padding: 20, alignItems: "center", gap: 8,
    borderWidth: 1.5, borderStyle: "dashed", borderColor: "#BFDBFE",
  },
  timelineEmptyTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  timelineEmptySub: { fontSize: 11, color: "rgba(255,255,255,0.6)", textAlign: "center", fontFamily: "Inter_400Regular" },
  timelineEmptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, marginTop: 6 },
  timelineEmptyBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
  timelineDone: { borderRadius: 22, padding: 18, alignItems: "center", gap: 4 },
  timelineDoneTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#065F46" },
  timelineDoneSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(6,95,70,0.7)" },

  /* STREAK */
  streakCard: {
    flex: 1,
    borderRadius: 22,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#7B3FF2",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  streakEmoji: { fontSize: 26, marginBottom: 2 },
  streakNum: { fontSize: 26, fontFamily: "Inter_700Bold", lineHeight: 30 },
  streakLabel: { fontSize: 11, fontFamily: "Inter_700Bold", marginTop: 2 },
  streakSub: { fontSize: 9, fontFamily: "Inter_500Medium", marginTop: 4, textAlign: "center" },

  /* STATS */
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCardWrap: { width: "47.8%", flexGrow: 1 },
  statCard: { borderRadius: 22, padding: 14, minHeight: 92, justifyContent: "space-between" },
  statTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statLabel: { fontSize: 11, fontFamily: "Inter_700Bold" },
  statBottom: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 6 },
  statValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
  statSub: { fontSize: 10, fontFamily: "Inter_500Medium" },

  /* AMY CARD */
  amyCard: {
    backgroundColor: "#14142B", borderRadius: 18, overflow: "hidden", marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  amyHeader: { flexDirection: "row", padding: 12, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  amyHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  amyAvatar: { width: 28, height: 28, borderRadius: 10, backgroundColor: "#A855F7", alignItems: "center", justifyContent: "center" },
  amyTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  amySub: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", marginTop: 1 },
  amyTip: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  amyTipText: { flex: 1, fontSize: 12, lineHeight: 17, fontFamily: "Inter_500Medium" },

  /* SCORE */
  scoreCard: { backgroundColor: "#14142B", borderRadius: 18, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  scoreHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  scoreTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  scoreSub: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", marginTop: 1 },
  scoreBody: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  scoreRingWrap: { width: 70, height: 70, alignItems: "center", justifyContent: "center" },
  scoreRingCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },
  scoreGrade: { fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 22 },
  scoreOf: { fontSize: 9, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_500Medium" },
  scoreBetter: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#FFFFFF" },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  scoreRowLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" },
  scoreRowValue: { fontSize: 11, color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  scoreBar: { height: 5, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  scoreBarFill: { height: "100%", borderRadius: 3 },

  /* LIST CARDS */
  listCard: { backgroundColor: "#14142B", borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, backgroundColor: "rgba(244,244,245,0.4)", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  listHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  listTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  listSub: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", marginTop: 1 },
  listLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  listLinkText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#A855F7" },
  listEmpty: { alignItems: "center", padding: 24, gap: 8 },
  listEmptyText: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_500Medium" },
  listEmptyLink: { fontSize: 13, color: "#A855F7", fontFamily: "Inter_700Bold", marginTop: 4 },
  listRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.04)" },
  listRowTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  listRowMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  listChildPill: { backgroundColor: "rgba(168,85,247,0.10)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  listChildPillText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#7C3AED" },
  listRowDate: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" },
  listRowPct: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  listRowDone: { fontSize: 9, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" },

  /* BEHAVIOR */
  behaviorRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.04)" },
  behaviorChild: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginBottom: 8 },
  behaviorStats: { flexDirection: "row", gap: 8 },
  behaviorChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: 10 },
  behaviorChipText: { fontSize: 13, fontFamily: "Inter_700Bold" },

  /* BIG CTA */
  bigCta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 16, borderRadius: 22,
    shadowColor: "#EC4899", shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  bigCtaText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },

  /* ONBOARDING */
  onbHero: {
    borderRadius: 26, padding: 26, alignItems: "center", marginBottom: 22,
    shadowColor: "#6366F1", shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  onbHeroEmoji: { marginBottom: 12 },
  onbHeroEyebrow: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2, color: "#BFDBFE", marginBottom: 6 },
  onbHeroTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center", marginBottom: 8 },
  onbHeroSub: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#DBEAFE", textAlign: "center", marginBottom: 8 },
  onbHeroBody: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular", color: "rgba(219,234,254,0.85)", textAlign: "center" },
  onbDivider: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  onbDividerLine: { flex: 1, height: 1, backgroundColor: "#E4E4E7" },
  onbDividerText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.6)" },
  onbFeature: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1 },
  onbFeatureIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  onbFeatureLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  onbFeatureDesc: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
  onbPrimary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 16, borderRadius: 18, marginBottom: 10,
    shadowColor: "#A855F7", shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  onbPrimaryText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  onbSecondary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 18, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#14142B", marginBottom: 14,
  },
  onbSecondaryText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.85)" },
  onbFooter: { fontSize: 11, color: "rgba(255,255,255,0.6)", textAlign: "center", fontFamily: "Inter_400Regular", marginBottom: 8 },

  /* HERO TOP ROW (brand + menu) */
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  heroBrandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroBrand: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  menuBtn: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },

  /* DRAWER */
  drawerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  drawerPanel: {
    position: "absolute",
    top: 0, bottom: 0, right: 0,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: -8, height: 0 },
    elevation: 24,
  },
  drawerHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  drawerBrand: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  drawerBrandSub: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.6)" },
  drawerItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  drawerItemActive: {
    shadowColor: "#FF4ECD", shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  drawerItemLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.85)" },

  /* AMY FAB */
  fabWrap: {
    position: "absolute",
    right: 18,
    alignItems: "flex-end",
  },
  fabHit: {
    alignItems: "center",
  },
  fabRing: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(11,11,26,0.6)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#FF4ECD", shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 0 }, elevation: 14,
  },
  fabTooltip: {
    marginTop: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(11,11,26,0.85)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  fabTooltipText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.85)" },
});
