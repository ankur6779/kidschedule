import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { brand } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";

type Props = {
  parentName: string;
  childName: string;
  onProfilePress?: () => void;
};

export default function DashboardHeader({ parentName, childName, onProfilePress }: Props) {
  const c = useColors();
  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.greeting, { color: c.textStrong }]}>Hi, {parentName} 👋</Text>
        <Text style={[styles.subtext, { color: c.textSubtle }]}>
          Let's help <Text style={styles.childName}>{childName}</Text> grow better today
        </Text>
      </View>
      <Pressable
        onPress={onProfilePress}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        hitSlop={8}
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
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: 13.5,
    fontWeight: "500",
    marginTop: 4,
  },
  childName: {
    color: brand.violet600,
    fontWeight: "700",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: brand.purple500,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});
