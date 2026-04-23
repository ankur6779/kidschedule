import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useColors } from "@/hooks/useColors";

const FEATURE_KEY = "kids_control_center";

type FeedbackKind = "interested" | "not_interested";

const HIGHLIGHTS = [
  { icon: "🛡️", text: "Safe child-friendly UI" },
  { icon: "🔄", text: "Sync with parent routines" },
  { icon: "🎁", text: "Reward-based engagement" },
  { icon: "🚫", text: "No distractions" },
];

const FEATURES = [
  { icon: "⏱", title: "Screen Time Guidance", desc: "Healthy limits, gentle nudges" },
  { icon: "📋", title: "Routine Control", desc: "Daily flow, on autopilot" },
  { icon: "🎯", title: "Focus Mode", desc: "Quiet time for study & sleep" },
  { icon: "📊", title: "Activity Tracking", desc: "See what your child enjoys" },
  { icon: "🔒", title: "Parent Lock", desc: "PIN-protected controls" },
];

export default function KidsControlCenterScreen() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const c = useColors();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<FeedbackKind | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<FeedbackKind | null>(null);
  const [comment, setComment] = useState("");
  const [savedComment, setSavedComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [thanks, setThanks] = useState<FeedbackKind | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await authFetch(`/api/feature-feedback?feature=${FEATURE_KEY}`);
        if (!alive) return;
        if (res.ok) {
          const data = await res.json() as { feedback: FeedbackKind | null; comment: string | null };
          if (data.feedback) setSavedFeedback(data.feedback);
          if (data.comment) {
            setComment(data.comment);
            setSavedComment(data.comment);
          }
        }
      } catch { /* non-fatal */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [authFetch]);

  const submitFeedback = useCallback(async (kind: FeedbackKind) => {
    if (submitting) return;
    setSubmitting(kind);
    try {
      const res = await authFetch("/api/feature-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: FEATURE_KEY, feedback: kind, comment: comment.trim() || undefined }),
      });
      if (res.ok) {
        setSavedFeedback(kind);
        setSavedComment(comment.trim());
        setThanks(kind);
        setTimeout(() => setThanks(null), 2400);
      }
    } catch { /* ignore */ }
    finally { setSubmitting(null); }
  }, [authFetch, comment, submitting]);

  const saveComment = useCallback(async () => {
    if (!savedFeedback || savingComment) return;
    if (comment.trim() === savedComment.trim()) return;
    setSavingComment(true);
    try {
      const res = await authFetch("/api/feature-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: FEATURE_KEY, feedback: savedFeedback, comment: comment.trim() || undefined }),
      });
      if (res.ok) {
        setSavedComment(comment.trim());
        setThanks(savedFeedback);
        setTimeout(() => setThanks(null), 2000);
      }
    } finally { setSavingComment(false); }
  }, [authFetch, comment, savedComment, savedFeedback, savingComment]);

  const accent = c.primary;
  const accentSoft = c.glass;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Ambient glow */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[c.background, c.surfaceElevated, c.background]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <Pressable
            onPress={() => router.back()}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, alignSelf: "flex-start" }}
            testID="link-back"
          >
            <Ionicons name="chevron-back" size={18} color={c.textMuted} />
            <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: "600" }}>Back to Hub</Text>
          </Pressable>

          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 18 }}>
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
              backgroundColor: c.primary + "20",
              borderWidth: 1, borderColor: c.primary + "40", marginBottom: 10,
            }}>
              <Ionicons name="sparkles" size={11} color={accent} />
              <Text style={{ color: accent, fontSize: 11, fontWeight: "800" }}>Coming Soon 🚀</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: "800", color: c.foreground, textAlign: "center" }}>
              👶 Kids Control Center
            </Text>
          </View>

          {/* Hero */}
          <GlassCard c={c}>
            <Text style={{ fontSize: 19, fontWeight: "800", color: c.foreground, lineHeight: 26 }}>
              Smart Control for Parents, Safe Experience for Kids
            </Text>
            <Text style={{ fontSize: 14, color: c.textMuted, marginTop: 8, lineHeight: 20 }}>
              Guide your child's routine, learning, and screen time with ease.
            </Text>
          </GlassCard>

          {/* AmyNest Kids */}
          <View style={{ marginTop: 14 }}>
            <LinearGradient
              colors={[accent + "22", accentSoft, c.accent + "22"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 22, padding: 18,
                borderWidth: 1, borderColor: accent + "33",
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: "800", color: c.foreground, marginBottom: 4 }}>
                👶 AmyNest Kids <Text style={{ fontSize: 12, fontWeight: "600", color: c.textMuted }}>(Child Experience)</Text>
              </Text>
              <Text style={{ fontSize: 13.5, color: c.textBody, lineHeight: 20, marginBottom: 12 }}>
                AmyNest Kids is a safe and guided environment for children that syncs with the parent app.
                Kids see only their routines, activities, and rewards, while parents manage everything in the background.
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {HIGHLIGHTS.map((h) => (
                  <View
                    key={h.text}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 6,
                      paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12,
                      backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
                      flexBasis: "47%", flexGrow: 1,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{h.icon}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: c.foreground, flex: 1 }} numberOfLines={2}>
                      {h.text}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Feature Preview */}
          <View style={{ marginTop: 18 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: c.textMuted, letterSpacing: 1, marginBottom: 10, paddingHorizontal: 4 }}>
              FEATURE PREVIEW
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {FEATURES.map((f) => (
                <View
                  key={f.title}
                  style={{
                    flexBasis: "48%", flexGrow: 1,
                    padding: 14, borderRadius: 18,
                    backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
                  }}
                  testID={`feature-${f.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Text style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</Text>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: c.foreground, lineHeight: 18 }}>
                    {f.title}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: c.textMuted, marginTop: 3, lineHeight: 15 }}>
                    {f.desc}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={{
            marginTop: 14, padding: 16, borderRadius: 22,
            backgroundColor: c.statusWarningBg + "55",
            borderWidth: 1, borderColor: c.border,
          }}>
            <Text style={{ fontSize: 13.5, color: c.textBody, textAlign: "center", lineHeight: 20 }}>
              Kids Control Center helps parents guide children in a balanced way by focusing on{" "}
              <Text style={{ fontWeight: "800", color: accent }}>habits, routines, and learning</Text>
              {" "}instead of strict restrictions.
            </Text>
          </View>

          {/* Feedback */}
          <GlassCard c={c} style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: c.foreground, textAlign: "center" }}>
              Would you like this feature?
            </Text>
            <Text style={{ fontSize: 12, color: c.textMuted, textAlign: "center", marginTop: 4, marginBottom: 16 }}>
              Your feedback helps us decide what to build next.
            </Text>

            {loading ? (
              <View style={{ alignItems: "center", paddingVertical: 12 }}>
                <ActivityIndicator size="small" color={accent} />
              </View>
            ) : (
              <>
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
                  <FeedbackButton
                    c={c}
                    kind="interested"
                    label="👍 Interested"
                    selected={savedFeedback === "interested"}
                    submitting={submitting === "interested"}
                    onPress={() => submitFeedback("interested")}
                  />
                  <FeedbackButton
                    c={c}
                    kind="not_interested"
                    label="👎 Not Interested"
                    selected={savedFeedback === "not_interested"}
                    submitting={submitting === "not_interested"}
                    onPress={() => submitFeedback("not_interested")}
                  />
                </View>

                <Text style={{ fontSize: 11, fontWeight: "700", color: c.textMuted, marginBottom: 6, paddingHorizontal: 4 }}>
                  Tell us what you want in this feature (optional)
                </Text>
                <TextInput
                  value={comment}
                  onChangeText={(t) => setComment(t.slice(0, 1000))}
                  placeholder="e.g. I'd love a daily reading streak…"
                  placeholderTextColor={c.textFaint}
                  multiline
                  numberOfLines={3}
                  style={{
                    minHeight: 80, padding: 12, borderRadius: 16,
                    backgroundColor: c.surfaceElevated,
                    borderWidth: 1, borderColor: c.border,
                    color: c.foreground, fontSize: 13.5, textAlignVertical: "top",
                  }}
                  testID="input-feedback-comment"
                />
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <Text style={{ fontSize: 10, color: c.textFaint }}>{comment.length}/1000</Text>
                  {savedFeedback && comment.trim() !== savedComment.trim() && (
                    <Pressable onPress={saveComment} disabled={savingComment} testID="button-save-comment">
                      <Text style={{ fontSize: 12, fontWeight: "800", color: accent }}>
                        {savingComment ? "Saving…" : "Save note"}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {thanks && (
                  <Text
                    style={{
                      marginTop: 14, textAlign: "center", fontSize: 13,
                      fontWeight: "700", color: accent,
                    }}
                    testID="text-feedback-thanks"
                  >
                    {thanks === "interested"
                      ? "🎉 Thanks! We'll keep you posted."
                      : "💛 Got it — we appreciate the honesty."}
                  </Text>
                )}
              </>
            )}
          </GlassCard>

          <Text style={{ textAlign: "center", fontSize: 11, color: c.textFaint, marginTop: 18 }}>
            Built with care by the AmyNest team · Coming soon
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function GlassCard({
  c, children, style,
}: {
  c: ReturnType<typeof useColors>;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          padding: 18, borderRadius: 22,
          backgroundColor: c.glass,
          borderWidth: 1, borderColor: c.glassBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function FeedbackButton({
  c, kind, label, selected, submitting, onPress,
}: {
  c: ReturnType<typeof useColors>;
  kind: FeedbackKind;
  label: string;
  selected: boolean;
  submitting: boolean;
  onPress: () => void;
}) {
  const isInterested = kind === "interested";
  const gradient: [string, string] = isInterested
    ? [c.primary, c.accent]
    : [c.textFaint, c.textMuted as string];

  return (
    <Pressable
      onPress={onPress}
      disabled={submitting}
      style={{ flex: 1, borderRadius: 16, overflow: "hidden", opacity: submitting ? 0.7 : 1 }}
      testID={`button-feedback-${kind}`}
    >
      {selected ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingVertical: 14, alignItems: "center", justifyContent: "center" }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>{label}</Text>
          )}
        </LinearGradient>
      ) : (
        <View style={{
          paddingVertical: 14, alignItems: "center", justifyContent: "center",
          backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 16,
        }}>
          {submitting ? (
            <ActivityIndicator size="small" color={c.primary} />
          ) : (
            <Text style={{ color: c.foreground, fontWeight: "800", fontSize: 14 }}>{label}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
