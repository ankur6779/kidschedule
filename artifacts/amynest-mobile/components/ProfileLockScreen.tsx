import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const PRIMARY = "#7B3FF2";

export function ProfileLockScreen({ sectionName }: { sectionName?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.lockCircle}>
        <LinearGradient
          colors={["#EDE9FE", "#DDD6FE"]}
          style={styles.lockGrad}
        >
          <Ionicons name="lock-closed" size={36} color={PRIMARY} />
        </LinearGradient>
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>
        Complete your profile first
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Add your child and parent details to unlock{sectionName ? ` ${sectionName}` : " this section"}.{"\n"}Amy Coach is always available to guide you!
      </Text>

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/(tabs)/children")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[PRIMARY, "#9B5FF5"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.primaryBtnGrad}
          >
            <Text style={styles.primaryBtnText}>👶  Add Child Profile</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryBtnText, { color: PRIMARY }]}>👤  Add Parent Profile</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => router.replace("/(tabs)/coach")}
        activeOpacity={0.7}
        style={styles.coachLink}
      >
        <Ionicons name="sparkles-outline" size={14} color={PRIMARY} />
        <Text style={[styles.coachLinkText, { color: PRIMARY }]}>  Go to Amy Coach</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  lockCircle: {
    marginBottom: 24,
    borderRadius: 48,
    overflow: "hidden",
    shadowColor: PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  lockGrad: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 32,
  },
  btnRow: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  primaryBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryBtnGrad: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 16,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryBtn: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  coachLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  coachLinkText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
