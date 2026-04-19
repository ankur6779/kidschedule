import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSubscriptionStore, selectAiRemaining, selectIsPremium } from "@/store/useSubscriptionStore";
import { brand } from "@/constants/colors";

export default function AiQuotaBanner() {
  const router = useRouter();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const remaining = useSubscriptionStore(selectAiRemaining);
  if (isPremium || remaining === null) return null;

  const exhausted = remaining <= 0;
  const low = !exhausted && remaining <= 2;

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/paywall", params: { reason: "ai_quota" } })}
      style={[styles.banner, exhausted ? styles.exhausted : low ? styles.low : styles.muted]}
    >
      <Ionicons
        name={exhausted ? "lock-closed" : "sparkles"}
        size={14}
        color={exhausted ? "#B91C1C" : low ? "#92400E" : "#6B7280"}
      />
      <Text
        style={[
          styles.text,
          exhausted ? { color: "#B91C1C" } : low ? { color: "#92400E" } : { color: "#6B7280" },
        ]}
      >
        {exhausted
          ? "Daily Amy AI limit reached"
          : `${remaining} Amy AI ${remaining === 1 ? "query" : "queries"} left today`}
      </Text>
      {(exhausted || low) && <Text style={styles.cta}>Upgrade →</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  muted: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderColor: "rgba(0,0,0,0.05)",
  },
  low: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },
  exhausted: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  cta: {
    color: brand.violet600,
    fontSize: 12,
    fontWeight: "800",
  },
});
