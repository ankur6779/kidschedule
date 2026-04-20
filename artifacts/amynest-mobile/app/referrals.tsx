import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useReferrals } from "@/hooks/useReferrals";

const SHARE_BASE = "https://amynest.ai";

function buildLink(code: string): string {
  return `${SHARE_BASE}/?ref=${encodeURIComponent(code)}`;
}

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export default function ReferralsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { payload, isLoading } = useReferrals();
  const [copiedKind, setCopiedKind] = useState<"code" | "link" | null>(null);

  const stats = payload?.stats;
  const referrals = payload?.referrals ?? [];
  const link = useMemo(() => (stats ? buildLink(stats.code) : ""), [stats]);

  const onCopy = async (kind: "code" | "link", value: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    await Clipboard.setStringAsync(value);
    setCopiedKind(kind);
    setTimeout(() => setCopiedKind(null), 1800);
  };

  const onShare = async () => {
    if (!stats) return;
    const message = `I'm using Amy AI for parenting — try it with my code ${stats.code} and we both get premium! ${link}`;
    try {
      await Share.share({ message, url: link, title: "Try Amy AI" });
    } catch {
      // ignore
    }
  };

  const onWhatsApp = async () => {
    if (!stats) return;
    const text = `Try Amy AI with my code ${stats.code} — we both get premium! ${link}`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (can) Linking.openURL(url);
      else onShare();
    } catch {
      onShare();
    }
  };

  const isReady = !isLoading && stats;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: "Invite & Earn",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 16,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {!isReady ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>
              Loading your referrals…
            </Text>
          </View>
        ) : (
          <>
            <HeroCard stats={stats!} />

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Your referral code</Text>
              <View
                style={[
                  styles.codeBox,
                  { backgroundColor: colors.primary + "15", borderColor: colors.primary + "55" },
                ]}
              >
                <Text style={[styles.codeText, { color: colors.primary }]}>{stats!.code}</Text>
                <TouchableOpacity
                  onPress={() => onCopy("code", stats!.code)}
                  style={[styles.smallBtn, { borderColor: colors.border }]}
                >
                  <Ionicons
                    name={copiedKind === "code" ? "checkmark-circle" : "copy-outline"}
                    size={16}
                    color={copiedKind === "code" ? "#22C55E" : colors.text}
                  />
                  <Text style={[styles.smallBtnText, { color: colors.text }]}>
                    {copiedKind === "code" ? "Copied" : "Copy"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={onShare} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="share-social" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Share invite</Text>
              </TouchableOpacity>

              <View style={styles.shareRow}>
                <TouchableOpacity
                  onPress={onWhatsApp}
                  style={[styles.shareBtn, { backgroundColor: "#22C55E15", borderColor: "#22C55E55" }]}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#16A34A" />
                  <Text style={[styles.shareBtnText, { color: "#16A34A" }]}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onCopy("link", link)}
                  style={[styles.shareBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                >
                  <Ionicons name="link" size={18} color={colors.text} />
                  <Text style={[styles.shareBtnText, { color: colors.text }]}>
                    {copiedKind === "link" ? "Copied!" : "Copy link"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ProgressCard stats={stats!} />

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Your referrals</Text>
              {referrals.length === 0 ? (
                <View style={[styles.empty, { borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, marginTop: 6, textAlign: "center" }}>
                    No referrals yet. Share your code to get started!
                  </Text>
                </View>
              ) : (
                referrals.map((r) => (
                  <View
                    key={r.id}
                    style={[styles.referralRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  >
                    <View style={styles.referralRowLeft}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              r.status === "paid"
                                ? "#22C55E"
                                : r.status === "valid"
                                ? "#A855F7"
                                : "#F59E0B",
                          },
                        ]}
                      />
                      <Text style={[styles.referralName, { color: colors.text }]}>Friend #{r.id}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor:
                            r.status === "paid"
                              ? "#22C55E"
                              : r.status === "valid"
                              ? "#A855F7"
                              : colors.surface,
                          borderColor:
                            r.status === "paid"
                              ? "#22C55E"
                              : r.status === "valid"
                              ? "#A855F7"
                              : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color:
                              r.status === "paid" || r.status === "valid"
                                ? "#fff"
                                : colors.textMuted,
                          },
                        ]}
                      >
                        {r.status === "paid" ? "PAID" : r.status === "valid" ? "ACTIVE" : "PENDING"}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={{ paddingHorizontal: 4, gap: 6 }}>
              <Text style={[styles.fineprint, { color: colors.textMuted }]}>
                <Text style={{ fontWeight: "700" }}>How it works:</Text> Earn{" "}
                {stats!.rewardDays} days of free premium when {stats!.validThreshold} friends sign
                up using your code AND at least {stats!.paidThreshold} of them buys any paid plan.
              </Text>
              <Text style={[styles.fineprint, { color: colors.textMuted }]}>
                Bonus time stacks on your existing premium and is capped at{" "}
                {stats!.rewardCap * stats!.rewardDays} days lifetime.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function HeroCard({ stats }: { stats: NonNullable<ReturnType<typeof useReferrals>["payload"]>["stats"] }) {
  const validShort = Math.max(0, stats.validThreshold - stats.validReferrals);
  const paidShort = Math.max(0, stats.paidThreshold - stats.paidReferrals);
  const capReached = stats.rewardsGranted >= stats.rewardCap;
  const bonusDays = daysLeft(stats.bonusExpiresAt);

  const message = capReached
    ? "Maxed out — you've earned the lifetime referral cap. Thank you for spreading Amy! 🎉"
    : stats.rewardsAvailable > 0
    ? `🎉 You unlocked ${stats.rewardsAvailable * stats.rewardDays} days of premium via referrals!`
    : validShort === 0 && paidShort === 0
    ? "Almost there — your reward is being processed."
    : `Invite ${validShort > 0 ? `${validShort} more friend${validShort > 1 ? "s" : ""}` : ""}${
        validShort > 0 && paidShort > 0 ? " + " : ""
      }${paidShort > 0 ? `${paidShort} paid user` : ""} to unlock ${stats.rewardDays} days free.`;

  return (
    <LinearGradient
      colors={["#7C3AED", "#C026D3", "#F59E0B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.heroBadge}>
        <Ionicons name="gift" size={12} color="#fff" />
        <Text style={styles.heroBadgeText}>INVITE & EARN PREMIUM</Text>
      </View>
      <Text style={styles.heroTitle}>
        Get {stats.rewardDays} days free for every {stats.validThreshold} friends 🎁
      </Text>
      <Text style={styles.heroSubtitle}>{message}</Text>
      {bonusDays !== null && bonusDays > 0 && (
        <View style={styles.bonusPill}>
          <Ionicons name="calendar" size={12} color="#fff" />
          <Text style={styles.bonusPillText}>
            {bonusDays} bonus day{bonusDays === 1 ? "" : "s"} active
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

function ProgressCard({ stats }: { stats: NonNullable<ReturnType<typeof useReferrals>["payload"]>["stats"] }) {
  const colors = useColors();
  const validPct = Math.min(100, (stats.validReferrals / stats.validThreshold) * 100);
  const paidPct = Math.min(100, (stats.paidReferrals / stats.paidThreshold) * 100);
  const rewardsLeft = Math.max(0, stats.rewardCap - stats.rewardsGranted);
  const capReached = stats.rewardsGranted >= stats.rewardCap;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="trophy" size={18} color="#F59E0B" />
          <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>Progress</Text>
        </View>
        <View style={[styles.countPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.countPillText, { color: colors.text }]}>
            {stats.rewardsGranted} / {stats.rewardCap} rewards
          </Text>
        </View>
      </View>

      <ProgressBar
        label="Friends invited"
        sub="Friends who signed up & used Amy AI"
        value={`${stats.validReferrals} / ${stats.validThreshold}`}
        pct={validPct}
        color="#7C3AED"
      />
      <View style={{ height: 14 }} />
      <ProgressBar
        label="Paid sign-ups"
        sub="At least 1 must purchase a paid plan"
        value={`${stats.paidReferrals} / ${stats.paidThreshold}`}
        pct={paidPct}
        color="#22C55E"
      />

      <View style={{ height: 14 }} />
      {capReached ? (
        <View style={[styles.notice, { backgroundColor: "#F59E0B15", borderColor: "#F59E0B55" }]}>
          <Ionicons name="sparkles" size={16} color="#B45309" />
          <Text style={{ color: "#B45309", fontSize: 13, flex: 1 }}>
            You've earned the maximum {stats.rewardCap * stats.rewardDays} days of bonus premium. Thank you!
          </Text>
        </View>
      ) : (
        <View style={[styles.notice, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontSize: 13 }}>
            <Text style={{ fontWeight: "700" }}>{rewardsLeft}</Text> more reward
            {rewardsLeft === 1 ? "" : "s"} available — up to{" "}
            <Text style={{ fontWeight: "700" }}>{rewardsLeft * stats.rewardDays} days</Text> of free premium.
          </Text>
        </View>
      )}
    </View>
  );
}

function ProgressBar({ label, sub, value, pct, color }: { label: string; sub: string; value: string; pct: number; color: string }) {
  const colors = useColors();
  return (
    <View>
      <View style={styles.progressLabelRow}>
        <Text style={[styles.progressLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.progressValue, { color: colors.textMuted }]}>{value}</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceElevated }]}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.progressSub, { color: colors.textMuted }]}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 64, alignItems: "center" },
  hero: {
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  heroBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800", lineHeight: 28, marginBottom: 6 },
  heroSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: 14, lineHeight: 20 },
  bonusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 10,
  },
  bonusPillText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12 },

  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 12,
  },
  codeText: { fontSize: 24, fontWeight: "900", letterSpacing: 4, fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) },

  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  smallBtnText: { fontSize: 13, fontWeight: "600" },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  shareRow: { flexDirection: "row", gap: 8 },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  shareBtnText: { fontSize: 13, fontWeight: "700" },

  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  countPillText: { fontSize: 11, fontWeight: "800" },

  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: 13, fontWeight: "700" },
  progressValue: { fontSize: 13, fontWeight: "600" },
  progressTrack: { height: 8, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  progressSub: { fontSize: 11, marginTop: 6 },

  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },

  empty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
  },
  referralRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  referralRowLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 999 },
  referralName: { fontSize: 14, fontWeight: "600" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  statusPillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  fineprint: { fontSize: 11, lineHeight: 16 },
});
