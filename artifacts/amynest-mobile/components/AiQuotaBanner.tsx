import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSubscriptionStore, selectAiRemaining, selectIsPremium } from "@/store/useSubscriptionStore";
import { brand } from "@/constants/colors";
import { useColors } from "@/hooks/useColors";

export default function AiQuotaBanner() {
  const router = useRouter();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const remaining = useSubscriptionStore(selectAiRemaining);
  const c = useColors();
  if (isPremium || remaining === null) return null;

  const exhausted = remaining <= 0;
  const low = !exhausted && remaining <= 2;

  const bannerStyle = exhausted
    ? { backgroundColor: c.statusErrorBg, borderColor: c.statusErrorBorder }
    : low
    ? { backgroundColor: c.statusWarningBg, borderColor: c.statusWarningBorder }
    : { backgroundColor: c.glass, borderColor: c.glassBorder };

  const iconColor = exhausted ? c.statusErrorText : low ? c.statusWarningText : c.textSubtle;
  const textColor = exhausted ? c.statusErrorText : low ? c.statusWarningText : c.textSubtle;

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/paywall", params: { reason: "ai_quota" } })}
      style={[styles.banner, bannerStyle]}
    >
      <Ionicons
        name={exhausted ? "lock-closed" : "sparkles"}
        size={14}
        color={iconColor}
      />
      <Text style={[styles.text, { color: textColor }]}>
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
