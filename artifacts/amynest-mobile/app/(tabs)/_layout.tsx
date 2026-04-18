import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type TabKey = "index" | "routines" | "coach" | "hub";

const TAB_META: Record<TabKey, { icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap; label: string }> = {
  index:    { icon: "home-outline",     iconActive: "home",     label: "Home" },
  routines: { icon: "calendar-outline", iconActive: "calendar", label: "Routines" },
  coach:    { icon: "sparkles-outline", iconActive: "sparkles", label: "Coach" },
  hub:      { icon: "book-outline",     iconActive: "book",     label: "Hub" },
};

const VISIBLE_TABS: string[] = ["index", "routines", "coach", "hub"];

const BRAIN_SIZE = 64;
const BRAIN_LIFT = 22;

// ─── Regular Tab Item ──────────────────────────────────────────────────────
function TabItem({
  routeKey,
  focused,
  onPress,
  onLongPress,
}: {
  routeKey: TabKey;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const meta = TAB_META[routeKey];
  const scale = useRef(new Animated.Value(focused ? 1.08 : 1)).current;
  const glow = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: focused ? 1.08 : 1, useNativeDriver: true, friction: 6, tension: 120 }),
      Animated.timing(glow, { toValue: focused ? 1 : 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [focused]);

  const pressDown = () => Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, friction: 5 }).start();
  const pressUp = () => Animated.spring(scale, { toValue: focused ? 1.08 : 1, useNativeDriver: true, friction: 5 }).start();

  return (
    <Pressable
      onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); onPress(); }}
      onLongPress={onLongPress}
      onPressIn={pressDown}
      onPressOut={pressUp}
      style={styles.itemHit}
      hitSlop={8}
    >
      <Animated.View style={[styles.itemInner, { transform: [{ scale }] }]}>
        <Animated.View pointerEvents="none" style={[styles.glowWrap, { opacity: glow }]}>
          <LinearGradient colors={["#7B3FF2", "#FF4ECD"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.glowGradient} />
        </Animated.View>
        <Ionicons
          name={focused ? meta.iconActive : meta.icon}
          size={focused ? 24 : 22}
          color={focused ? "#FFFFFF" : "rgba(255,255,255,0.48)"}
        />
        <Animated.View
          style={[
            styles.activeDot,
            {
              opacity: glow,
              transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

// ─── Brain Coach Button ────────────────────────────────────────────────────
function CoachBrainButton({
  focused,
  onPress,
  onLongPress,
}: {
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const bounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const pressDown = () =>
    Animated.spring(bounce, { toValue: 0.88, useNativeDriver: true, friction: 4 }).start();
  const pressUp = () =>
    Animated.spring(bounce, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

  return (
    <Pressable
      onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
      onLongPress={onLongPress}
      onPressIn={pressDown}
      onPressOut={pressUp}
      style={styles.coachHit}
      hitSlop={6}
    >
      <Animated.View style={[styles.coachGlowRing, { transform: [{ scale: pulse }] }]} />
      <Animated.View style={{ transform: [{ scale: bounce }] }}>
        <LinearGradient
          colors={["#9B5FF5", "#7B3FF2", "#FF4ECD"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.coachDisc,
            focused && styles.coachDiscFocused,
          ]}
        >
          <MaterialCommunityIcons name="brain" size={30} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ─── Floating Tab Bar ──────────────────────────────────────────────────────
function FloatingTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + 8;

  const allRoutes = state.routes as Array<{ key: string; name: string }>;
  // Only render the 4 visible tabs in the pill — others are hidden.
  const routes = allRoutes.filter(r => VISIBLE_TABS.includes(r.name));

  const makeHandlers = (route: { key: string; name: string }, focused: boolean) => ({
    onPress: () => {
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
    },
    onLongPress: () => navigation.emit({ type: "tabLongPress", target: route.key }),
  });

  const coachIdxAll = allRoutes.findIndex(r => r.name === "coach");
  const coachRoute = allRoutes[coachIdxAll];
  const coachFocused = state.index === coachIdxAll;
  const coachHandlers = coachRoute ? makeHandlers(coachRoute, coachFocused) : { onPress: () => {}, onLongPress: () => {} };

  // Non-coach visible routes for the pill
  const nonCoach = routes.filter(r => r.name !== "coach");
  // We expect 3 non-coach: split as left=[0], right=[1,2] → place coach center after first
  const left = nonCoach.slice(0, 1);   // index/Home
  const right = nonCoach.slice(1);     // routines, hub

  return (
    <View
      pointerEvents="box-none"
      style={[styles.barWrap, { bottom: bottomOffset }]}
    >
      <View style={styles.barShadow}>
        <BlurView
          intensity={Platform.OS === "android" ? 70 : 50}
          tint="dark"
          style={styles.barBlur}
        >
          <View style={styles.barInner}>
            {left.map(route => {
              const focused = state.index === allRoutes.indexOf(route);
              const { onPress, onLongPress } = makeHandlers(route, focused);
              return (
                <TabItem
                  key={route.key}
                  routeKey={route.name as TabKey}
                  focused={focused}
                  onPress={onPress}
                  onLongPress={onLongPress}
                />
              );
            })}

            {/* second left slot — keep balance: render routines in left position too */}
            {right.slice(0, 1).map(route => {
              const focused = state.index === allRoutes.indexOf(route);
              const { onPress, onLongPress } = makeHandlers(route, focused);
              return (
                <TabItem
                  key={route.key}
                  routeKey={route.name as TabKey}
                  focused={focused}
                  onPress={onPress}
                  onLongPress={onLongPress}
                />
              );
            })}

            <View style={styles.coachSpacer} />

            {right.slice(1).map(route => {
              const focused = state.index === allRoutes.indexOf(route);
              const { onPress, onLongPress } = makeHandlers(route, focused);
              return (
                <TabItem
                  key={route.key}
                  routeKey={route.name as TabKey}
                  focused={focused}
                  onPress={onPress}
                  onLongPress={onLongPress}
                />
              );
            })}

            {/* fourth (visual right) slot empty filler if needed - actually we only have 4 tabs (3 non-coach), so we add a placeholder for symmetry */}
            <View style={styles.itemHit} pointerEvents="none" />
          </View>
        </BlurView>
      </View>

      <View style={styles.coachAbsoluteWrap} pointerEvents="box-none">
        <CoachBrainButton
          focused={coachFocused}
          onPress={coachHandlers.onPress}
          onLongPress={coachHandlers.onLongPress}
        />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: "Home" }} />
      <Tabs.Screen name="routines" options={{ title: "Routines" }} />
      <Tabs.Screen name="coach"    options={{ title: "Coach" }} />
      <Tabs.Screen name="hub"      options={{ title: "Hub" }} />
      {/* Hidden from tab bar — accessible via drawer */}
      <Tabs.Screen name="children" options={{ title: "Kids", href: null }} />
      <Tabs.Screen name="profile"  options={{ title: "Profile", href: null }} />
    </Tabs>
  );
}

const PILL_PADDING_V = 10;
const PILL_ITEM_H = 48;
const PILL_H = PILL_ITEM_H + PILL_PADDING_V * 2;

const styles = StyleSheet.create({
  barWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    overflow: "visible",
  },
  barShadow: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 32,
    shadowColor: "#7B3FF2",
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    backgroundColor: "rgba(11,11,26,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    overflow: "hidden",
  },
  barBlur: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 32,
  },
  barInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 4,
    paddingVertical: PILL_PADDING_V,
    backgroundColor: "rgba(20,20,43,0.5)",
  },
  coachSpacer: {
    width: BRAIN_SIZE + 8,
    height: PILL_ITEM_H,
  },
  coachAbsoluteWrap: {
    position: "absolute",
    top: -(BRAIN_SIZE / 2 - PILL_H / 2 + BRAIN_LIFT),
    alignSelf: "center",
    zIndex: 20,
    elevation: 30,
  },
  coachHit: {
    width: BRAIN_SIZE + 20,
    height: BRAIN_SIZE + 20,
    alignItems: "center",
    justifyContent: "center",
  },
  coachGlowRing: {
    position: "absolute",
    width: BRAIN_SIZE + 24,
    height: BRAIN_SIZE + 24,
    borderRadius: (BRAIN_SIZE + 24) / 2,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(255,78,205,0.45)",
    shadowColor: "#FF4ECD",
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  coachDisc: {
    width: BRAIN_SIZE,
    height: BRAIN_SIZE,
    borderRadius: BRAIN_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(11,11,26,0.9)",
    shadowColor: "#7B3FF2",
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 20,
  },
  coachDiscFocused: {
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#FF4ECD",
    shadowOpacity: 0.95,
    shadowRadius: 28,
  },
  itemHit: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: PILL_ITEM_H,
  },
  itemInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  glowWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: "hidden",
  },
  glowGradient: {
    flex: 1,
    borderRadius: 24,
    opacity: 0.82,
  },
  activeDot: {
    position: "absolute",
    bottom: -5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FF4ECD",
    shadowColor: "#FF4ECD",
    shadowOpacity: 0.9,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});
