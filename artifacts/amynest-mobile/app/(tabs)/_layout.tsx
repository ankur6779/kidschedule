import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type TabKey = "index" | "children" | "routines" | "coach" | "profile";

const TAB_META: Record<TabKey, { icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap; label: string }> = {
  index:    { icon: "home-outline",            iconActive: "home",            label: "Home" },
  children: { icon: "people-outline",          iconActive: "people",          label: "Kids" },
  routines: { icon: "calendar-outline",        iconActive: "calendar",        label: "Routines" },
  coach:    { icon: "sparkles-outline",        iconActive: "sparkles",        label: "Coach" },
  profile:  { icon: "person-outline",          iconActive: "person",          label: "Profile" },
};

const TAB_ORDER: TabKey[] = ["index", "children", "routines", "coach", "profile"];

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
  const isPrimary = routeKey === "coach";
  const baseScale = isPrimary ? 1.18 : 1;
  const focusedScale = isPrimary ? 1.22 : 1.08;
  const scale = useRef(new Animated.Value(focused ? focusedScale : baseScale)).current;
  const glow = useRef(new Animated.Value(focused || isPrimary ? 1 : 0)).current;
  const lift = useRef(new Animated.Value(isPrimary ? -10 : 0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? focusedScale : baseScale,
        useNativeDriver: true,
        friction: 6,
        tension: 120,
      }),
      Animated.timing(glow, {
        toValue: focused || isPrimary ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scale, glow, focusedScale, baseScale, isPrimary]);

  // Continuous gentle pulse for the primary Coach tab
  useEffect(() => {
    if (!isPrimary) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isPrimary, pulse]);

  const pressDown = () => {
    Animated.spring(scale, {
      toValue: (focused ? focusedScale : baseScale) * 0.92,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };
  const pressUp = () => {
    Animated.spring(scale, {
      toValue: focused ? focusedScale : baseScale,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        onPress();
      }}
      onLongPress={onLongPress}
      onPressIn={pressDown}
      onPressOut={pressUp}
      style={styles.itemHit}
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.itemInner,
          isPrimary && styles.itemInnerPrimary,
          { transform: [{ translateY: lift }, { scale }, { scale: pulse }] },
        ]}
      >
        {/* Active / primary gradient glow halo behind icon */}
        <Animated.View
          pointerEvents="none"
          style={[
            isPrimary ? styles.glowWrapPrimary : styles.glowWrap,
            { opacity: glow },
          ]}
        >
          <LinearGradient
            colors={["#7B3FF2", "#FF4ECD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={isPrimary ? styles.glowGradientPrimary : styles.glowGradient}
          />
        </Animated.View>

        <Ionicons
          name={focused || isPrimary ? meta.iconActive : meta.icon}
          size={isPrimary ? 26 : focused ? 24 : 22}
          color={focused || isPrimary ? "#FFFFFF" : "rgba(255,255,255,0.5)"}
        />

        {/* Active dot indicator (hidden for primary which uses ring) */}
        {!isPrimary && (
          <Animated.View
            style={[
              styles.activeDot,
              {
                opacity: glow,
                transform: [
                  {
                    scale: glow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        )}
      </Animated.View>
    </Pressable>
  );
}

function FloatingTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + 8;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.barWrap, { bottom: bottomOffset }]}
    >
      <View style={styles.barShadow}>
        <BlurView
          intensity={Platform.OS === "android" ? 60 : 40}
          tint="dark"
          style={styles.barBlur}
        >
          <View style={styles.barInner}>
            {state.routes.map((route: any, index: number) => {
              const focused = state.index === index;
              const onPress = () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };
              const onLongPress = () => {
                navigation.emit({ type: "tabLongPress", target: route.key });
              };
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
          </View>
        </BlurView>
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
      <Tabs.Screen name="children" options={{ title: "Kids" }} />
      <Tabs.Screen name="routines" options={{ title: "Routines" }} />
      <Tabs.Screen name="coach"    options={{ title: "Coach" }} />
      <Tabs.Screen name="profile"  options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
  },
  barShadow: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 32,
    shadowColor: "#7B3FF2",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    backgroundColor: "rgba(11,11,26,0.6)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: "rgba(20,20,43,0.55)",
  },
  itemHit: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
  },
  itemInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInnerPrimary: {
    shadowColor: "#FF4ECD",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  glowWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: "hidden",
  },
  glowGradient: {
    flex: 1,
    borderRadius: 24,
    opacity: 0.85,
  },
  glowWrapPrimary: {
    position: "absolute",
    top: -6,
    bottom: -6,
    left: -6,
    right: -6,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.18)",
  },
  glowGradientPrimary: {
    flex: 1,
    borderRadius: 30,
    opacity: 1,
  },
  activeDot: {
    position: "absolute",
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FF4ECD",
    shadowColor: "#FF4ECD",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});
