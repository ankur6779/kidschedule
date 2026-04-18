import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import ProgressRing from "./ProgressRing";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  childName: string;
  ageGroup: string;
  focusGoal: string;
  progress: number; // 0..1
  onContinue: () => void;
};

export default function ChildCard({
  childName,
  ageGroup,
  focusGoal,
  progress,
  onContinue,
}: Props) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInDown.duration(550).delay(80)}
      style={styles.cardWrap}
    >
      <LinearGradient
        colors={["#7C3AED", "#A855F7", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Decorative blobs */}
        <View pointerEvents="none" style={[styles.blob, { top: -30, right: -30 }]} />
        <View pointerEvents="none" style={[styles.blob, { bottom: -50, left: -20, opacity: 0.4 }]} />

        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={styles.agePill}>
              <Ionicons name="happy" size={11} color="#fff" />
              <Text style={styles.ageText}>{ageGroup}</Text>
            </View>
            <Text style={styles.childName}>{childName}</Text>
            <Text style={styles.focusLabel}>Current focus</Text>
            <Text style={styles.focusGoal} numberOfLines={2}>{focusGoal}</Text>
          </View>

          <ProgressRing
            size={120}
            stroke={11}
            progress={progress}
            gradientFrom="#FFD27A"
            gradientTo="#FF4ECD"
          />
        </View>

        <AnimatedPressable
          onPressIn={() => {
            scale.value = withSpring(0.96, { damping: 15, stiffness: 220 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 12, stiffness: 200 });
          }}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onContinue();
          }}
          style={[styles.cta, style]}
          accessibilityRole="button"
          accessibilityLabel={`Continue plan for ${childName}`}
        >
          <Text style={styles.ctaText}>Continue Plan</Text>
          <Ionicons name="arrow-forward" size={16} color="#7C3AED" />
        </AnimatedPressable>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginHorizontal: 20,
    borderRadius: 26,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 12,
  },
  card: {
    padding: 22,
    borderRadius: 26,
  },
  blob: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  agePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  ageText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  childName: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  focusLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  focusGoal: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 16,
  },
  ctaText: {
    color: "#7C3AED",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
});
