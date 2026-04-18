import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, LayoutChangeEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  index: number;
  total: number;
  title: string;
  summary: string;
  progress: number; // 0..1
  onContinue: () => void;
  delay?: number;
};

export default function CoachProgressCard({
  index,
  total,
  title,
  summary,
  progress,
  onContinue,
  delay = 0,
}: Props) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const [trackWidth, setTrackWidth] = useState(0);
  const barW = useSharedValue(0);
  React.useEffect(() => {
    barW.value = withTiming(Math.min(1, Math.max(0, progress)) * trackWidth, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, trackWidth, barW]);

  const animatedBar = useAnimatedStyle(() => ({
    width: barW.value,
  }));

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(delay)} style={styles.cardWrap}>
      <LinearGradient
        colors={["#FFFFFF", "#FAFAFF"]}
        style={styles.card}
      >
        <View style={styles.headerRow}>
          <LinearGradient
            colors={["#A855F7", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Ionicons name="sparkles" size={18} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>AMY COACH</Text>
            <Text style={styles.step}>Step {index} of {total}</Text>
          </View>
          <View style={styles.percentPill}>
            <Text style={styles.percentText}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.summary} numberOfLines={3}>{summary}</Text>

        {/* Animated progress bar */}
        <View style={styles.barTrack} onLayout={onTrackLayout}>
          <Animated.View style={[styles.barFillWrap, animatedBar]}>
            <LinearGradient
              colors={["#A855F7", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.barFill}
            />
          </Animated.View>
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
          accessibilityRole="button"
          accessibilityLabel="Continue Amy coaching"
          style={[styles.cta, style]}
        >
          <LinearGradient
            colors={["#A855F7", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGrad}
          >
            <Text style={styles.ctaText}>Continue Coaching</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </LinearGradient>
        </AnimatedPressable>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginHorizontal: 20,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  card: {
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.12)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#A855F7",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  step: {
    color: "#1F2937",
    fontSize: 14.5,
    fontWeight: "800",
    marginTop: 1,
  },
  percentPill: {
    backgroundColor: "rgba(168,85,247,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  percentText: {
    color: "#7C3AED",
    fontSize: 12.5,
    fontWeight: "800",
  },
  title: {
    color: "#1F2937",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  summary: {
    color: "#6B7280",
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 16,
  },
  barTrack: {
    backgroundColor: "rgba(168,85,247,0.12)",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  barFillWrap: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    flex: 1,
    borderRadius: 4,
  },
  cta: {
    borderRadius: 14,
    overflow: "hidden",
  },
  ctaGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
  },
  ctaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
});
