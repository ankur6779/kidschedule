import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
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
  progress: number;
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
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={styles.agePill}>
              <Ionicons name="happy" size={11} color="#7C3AED" />
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
            trackColor="rgba(124,58,237,0.12)"
            gradientFrom="#C4B5FD"
            gradientTo="#7C3AED"
            labelColor="#5B21B6"
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
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginHorizontal: 20,
    borderRadius: 26,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  card: {
    padding: 22,
    borderRadius: 26,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#EDE9FE",
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
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  ageText: {
    color: "#7C3AED",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  childName: {
    color: "#1F2937",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  focusLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  focusGoal: {
    color: "#374151",
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
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 16,
  },
  ctaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
});
