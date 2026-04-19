import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import type { Plan } from "@/services/subscriptionApi";

const REASON_COPY: Record<string, { title: string; subtitle: string }> = {
  ai_quota: {
    title: "Unlock unlimited Amy AI",
    subtitle: "You've used today's free queries. Go premium for unlimited support.",
  },
  personalized_coaching: {
    title: "Unlock Personalized Coaching",
    subtitle: "Amy adapts to your child and gives you smart, tailored next steps.",
  },
  premium_insight: {
    title: "Unlock Premium Insights",
    subtitle: "Behavior analysis and trend insights — only on premium.",
  },
  child_limit: {
    title: "Add unlimited children",
    subtitle: "Free includes 1 child profile. Upgrade for unlimited.",
  },
  feature: {
    title: "Unlock Full Parenting Power",
    subtitle: "Get unlimited AI, smart coaching, and premium insights.",
  },
};

export default function PaywallScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const copy = REASON_COPY[reason ?? "feature"] ?? REASON_COPY.feature;

  const plans = useSubscriptionStore((s) => s.plans);
  const ent = useSubscriptionStore((s) => s.entitlements);
  const loading = useSubscriptionStore((s) => s.loading);
  const load = useSubscriptionStore((s) => s.load);
  const upgrade = useSubscriptionStore((s) => s.upgrade);
  const upgradeRazorpay = useSubscriptionStore((s) => s.upgradeRazorpay);
  const beginTrial = useSubscriptionStore((s) => s.beginTrial);

  const [selected, setSelected] = useState<Exclude<Plan, "free">>("six_month");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const showRazorpay = Platform.OS === "android";

  useEffect(() => {
    if (plans.length === 0 && !loading) void load();
  }, [plans.length, loading, load]);

  const onUpgrade = async () => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    setNotice(null);
    const res = await upgrade(selected);
    setSubmitting(false);
    if (res.ok) {
      router.back();
    } else if (res.userCancelled) {
      // user dismissed the native sheet — no error message
    } else {
      setNotice(
        res.reason ?? "Checkout is not yet available. Try again soon or contact support.",
      );
    }
  };

  const onUpgradeRazorpay = async () => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    setNotice(null);
    const res = await upgradeRazorpay(selected);
    setSubmitting(false);
    if (res.ok) {
      router.back();
    } else if (!res.userCancelled) {
      setNotice(res.reason ?? "UPI / card checkout failed.");
    }
  };

  const onTrial = async () => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubmitting(true);
    await beginTrial();
    setSubmitting(false);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["#0B0B1A", "#1A0B2E", "#0B0B1A"]}
        locations={[0, 0.5, 1]}
        style={styles.bg}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient
              colors={["#7B3FF2", "#FF4ECD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroIcon}
            >
              <Ionicons name="sparkles" size={26} color="#fff" />
            </LinearGradient>
            <Text style={styles.heroTitle}>{copy.title}</Text>
            <Text style={styles.heroSub}>{copy.subtitle}</Text>
          </View>

          {/* Plan cards */}
          {loading && plans.length === 0 ? (
            <ActivityIndicator color="#fff" style={{ marginTop: 24 }} />
          ) : (
            <View style={styles.cards}>
              {plans.map((p) => {
                const isSelected = p.id === selected;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      if (Platform.OS !== "web")
                        void Haptics.selectionAsync();
                      setSelected(p.id);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${p.title} plan`}
                  >
                    <View
                      style={[
                        styles.card,
                        isSelected && styles.cardSelected,
                      ]}
                    >
                      {p.badge && (
                        <View style={styles.badgeWrap}>
                          <LinearGradient
                            colors={["#7B3FF2", "#FF4ECD"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.badge}
                          >
                            <Text style={styles.badgeText}>{p.badge}</Text>
                          </LinearGradient>
                        </View>
                      )}
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{p.title}</Text>
                        <View style={styles.priceRow}>
                          <Text style={styles.price}>₹{p.price}</Text>
                          <Text style={styles.period}>/ {p.period}</Text>
                        </View>
                        {typeof p.savingsPercent === "number" && p.savingsPercent > 0 && (
                          <Text style={styles.savings}>Save {p.savingsPercent}%</Text>
                        )}
                      </View>
                      <View style={styles.featureList}>
                        {p.features.map((f, i) => (
                          <View key={i} style={styles.featureRow}>
                            <Ionicons
                              name="checkmark-circle"
                              size={14}
                              color={isSelected ? "#FF4ECD" : "rgba(255,255,255,0.6)"}
                            />
                            <Text style={styles.featureText}>{f}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {notice && (
            <View style={styles.noticeBox}>
              <Ionicons name="information-circle" size={16} color="#FCD34D" />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          )}

          {/* Primary CTA — Google Play (RevenueCat) on Android+iOS */}
          <Pressable
            disabled={submitting || plans.length === 0}
            onPress={onUpgrade}
            style={({ pressed }) => [
              styles.primaryWrap,
              pressed && { opacity: 0.85 },
              (submitting || plans.length === 0) && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              Platform.OS === "android" ? "Pay with Google Play" : "Upgrade Now"
            }
          >
            <LinearGradient
              colors={["#7B3FF2", "#FF4ECD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primary}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="rocket" size={16} color="#fff" />
                  <Text style={styles.primaryText}>
                    {Platform.OS === "android" ? "Pay with Google Play" : "Upgrade Now"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* Secondary CTA — Razorpay (UPI / Card / Netbanking) on Android only */}
          {showRazorpay && (
            <Pressable
              disabled={submitting || plans.length === 0}
              onPress={onUpgradeRazorpay}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && { opacity: 0.85 },
                (submitting || plans.length === 0) && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Pay with UPI or Card via Razorpay"
            >
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.secondaryText}>Pay with UPI / Card</Text>
            </Pressable>
          )}

          {/* Trial offer (only if free + never trialed) */}
          {ent && ent.status === "free" && (
            <Pressable
              onPress={onTrial}
              disabled={submitting}
              style={styles.trialBtn}
              accessibilityRole="button"
              accessibilityLabel="Start 3-day free trial"
            >
              <Text style={styles.trialText}>Start 3-day free trial</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={styles.maybeBtn}
            accessibilityRole="button"
            accessibilityLabel="Maybe Later"
          >
            <Text style={styles.maybeText}>Maybe Later</Text>
          </Pressable>

          <Text style={styles.footer}>
            Cancel anytime. Renews automatically until canceled.
          </Text>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  hero: {
    alignItems: "center",
    marginBottom: 24,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#FF4ECD",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  heroTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  cards: { gap: 14, marginBottom: 18 },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardSelected: {
    backgroundColor: "rgba(123,63,242,0.18)",
    borderColor: "#FF4ECD",
    shadowColor: "#FF4ECD",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  badgeWrap: {
    position: "absolute",
    top: -10,
    right: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  cardHeader: { marginBottom: 12 },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  price: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
  },
  period: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "600",
  },
  savings: {
    color: "#FF4ECD",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  featureList: { gap: 6 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(252,211,77,0.12)",
    borderColor: "rgba(252,211,77,0.4)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  noticeText: {
    color: "#FCD34D",
    fontSize: 12.5,
    fontWeight: "700",
    flex: 1,
  },
  primaryWrap: {
    borderRadius: 999,
    shadowColor: "#FF4ECD",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  primary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 999,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  secondaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  trialBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  trialText: {
    color: "#FF4ECD",
    fontSize: 13,
    fontWeight: "800",
  },
  maybeBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 2,
  },
  maybeText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "600",
  },
  footer: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
  },
});
